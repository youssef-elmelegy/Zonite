import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameEvents, GameMode, GameStatus, RoomEvents, TeamColor } from '@zonite/shared';
import type { CurrentUser, LobbyPlayer, RoomState } from '@zonite/shared';
import type { InternalPlayer } from '@/modules/game/types/internal-game-state.type';
import { GameStateService } from '@/modules/game/services/game-state.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { ProfileService } from '@/modules/profile/services/profile.service';
import { env } from '@/env';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsExceptionsFilter } from './filters/ws-exceptions.filter';
import { JoinRoomDto } from './dto/join-room.dto';
import { ClaimBlockDto } from './dto/claim-block.dto';
import { StartGameDto } from './dto/start-game.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ResetGameDto } from './dto/reset-game.dto';

/** Backend-only lobby player — extends the wire LobbyPlayer with socketId. */
interface InternalLobbyPlayer extends LobbyPlayer {
  socketId: string;
}

/** Per-socket context stored for disconnect cleanup. */
interface SocketContext {
  roomCode: string;
  roomId: string;
  playerId: string;
}

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: env.CORS_ORIGINS, credentials: true },
})
@UseFilters(WsExceptionsFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer() readonly server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  /** roomCode → Map<playerId, InternalLobbyPlayer> */
  private readonly lobby = new Map<string, Map<string, InternalLobbyPlayer>>();

  /** socketId → SocketContext */
  private readonly socketIndex = new Map<string, SocketContext>();

  /** playerId → disconnect grace timer */
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly gameStateService: GameStateService,
    private readonly roomsService: RoomsService,
    private readonly profileService: ProfileService,
  ) {}

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  handleDisconnect(client: Socket): void {
    const ctx = this.socketIndex.get(client.id);
    if (!ctx) return;

    const { roomCode, roomId, playerId } = ctx;
    this.socketIndex.delete(client.id);

    const lobbyRoom = this.lobby.get(roomCode);
    if (lobbyRoom) {
      lobbyRoom.delete(playerId);
      if (lobbyRoom.size === 0) this.lobby.delete(roomCode);
    }

    if (this.gameStateService.hasGame(roomId)) {
      // Nullify socketId so reconnect can restore it
      this.gameStateService.updateSocketId(roomId, playerId, null);

      // Grant 15-second grace window before removing the player from the game
      const timer = setTimeout(() => {
        this.gameStateService.removePlayer(roomId, playerId);
        this.server.to(roomCode).emit(RoomEvents.PLAYER_LEFT, playerId);
        this.disconnectTimers.delete(playerId);
        this.logger.log(`Grace period expired for player ${playerId} in room ${roomCode}`);
      }, 15_000);
      this.disconnectTimers.set(playerId, timer);
    } else {
      // Not in an active game — remove from lobby immediately
      this.server.to(roomCode).emit(RoomEvents.PLAYER_LEFT, playerId);
    }

    this.logger.log(`Player ${playerId} disconnected from room ${roomCode}`);
  }

  // ---------------------------------------------------------------------------
  // join_room
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(RoomEvents.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const user = client.data.user as CurrentUser;

    // Cancel any pending grace timer for this player
    clearTimeout(this.disconnectTimers.get(user.id));
    this.disconnectTimers.delete(user.id);

    const room = await this.roomsService.getRoomRow(dto.roomCode.toUpperCase());

    // ── Tournament roster gate ──
    if (room.tournamentRoster) {
      const inRoster = room.tournamentRoster.some((t) =>
        t.players.some((p) => p.userId === user.id),
      );
      if (!inRoster) {
        throw new WsException({
          code: 'NOT_IN_TOURNAMENT_ROSTER',
          message: 'You are not registered for this match',
        });
      }
    }

    // ── Reconnect to an active game ──
    if (room.status === 'PLAYING' && this.gameStateService.hasGame(room.id)) {
      await client.join(room.code);
      this.socketIndex.set(client.id, {
        roomCode: room.code,
        roomId: room.id,
        playerId: user.id,
      });
      this.gameStateService.updateSocketId(room.id, user.id, client.id);
      const state = this.gameStateService.getState(room.id);
      if (state) client.emit(GameEvents.GAME_STARTED, state);
      return;
    }

    // ── Lobby join ──
    const lobbyPlayers = this.lobby.get(room.code) ?? new Map<string, InternalLobbyPlayer>();

    if (!lobbyPlayers.has(user.id) && lobbyPlayers.size >= room.maxPlayers) {
      throw new WsException('Room is full');
    }

    const isNew = !lobbyPlayers.has(user.id);
    await client.join(room.code);
    this.socketIndex.set(client.id, {
      roomCode: room.code,
      roomId: room.id,
      playerId: user.id,
    });

    const fullName = user.fullName || user.email.split('@')[0]!;
    const isHost = room.hostUserId === user.id;
    const existing = lobbyPlayers.get(user.id);
    // Preserve the player's existing solo color across rejoins; only assign a new
    // one for genuinely new entries. Otherwise repeated JOIN_ROOMs reshuffle colors.
    const color =
      existing?.color && existing.color !== ''
        ? existing.color
        : room.gameMode === GameMode.SOLO
          ? GameStateService.soloColorAt(lobbyPlayers.size)
          : '';

    const rosterColor = this.rosterTeamColor(room, user.id);
    const teamColor =
      rosterColor ?? this.assignTeamColor(room.gameMode as GameMode, lobbyPlayers, user.id);

    const lobbyPlayer: InternalLobbyPlayer = {
      id: user.id,
      fullName,
      teamColor,
      color,
      isReady: isHost ? true : (existing?.isReady ?? false),
      isHost,
      socketId: client.id,
    } as InternalLobbyPlayer;

    lobbyPlayers.set(user.id, lobbyPlayer);
    this.lobby.set(room.code, lobbyPlayers);

    // Send full snapshot to the joiner
    client.emit(RoomEvents.ROOM_STATE, this.buildRoomState(room, lobbyPlayers));

    // Notify others only for new joins (not page refreshes)
    if (isNew) {
      client.to(room.code).emit(RoomEvents.PLAYER_JOINED, this.toWire(lobbyPlayer));
    }
  }

  // ---------------------------------------------------------------------------
  // leave_room
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(RoomEvents.LEAVE_ROOM)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const user = client.data.user as CurrentUser;
    const roomCode = dto.roomCode.toUpperCase();

    this.lobby.get(roomCode)?.delete(user.id);
    this.socketIndex.delete(client.id);
    await client.leave(roomCode);
    this.server.to(roomCode).emit(RoomEvents.PLAYER_LEFT, user.id);
  }

  // ---------------------------------------------------------------------------
  // update_room  (host only, LOBBY status only)
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(RoomEvents.UPDATE_ROOM)
  async handleUpdateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateRoomDto,
  ): Promise<void> {
    const user = client.data.user as CurrentUser;
    const roomCode = dto.roomCode.toUpperCase();
    const room = await this.roomsService.getRoomRow(roomCode);

    if (room.hostUserId !== user.id) throw new WsException('Only the host can update room config');
    if (room.status !== GameStatus.LOBBY)
      throw new WsException('Room config can only be changed in LOBBY status');

    const lobbyPlayers = this.lobby.get(roomCode) ?? new Map<string, InternalLobbyPlayer>();
    if (dto.maxPlayers !== undefined && dto.maxPlayers < lobbyPlayers.size) {
      throw new WsException(
        `maxPlayers cannot be less than current player count (${lobbyPlayers.size})`,
      );
    }

    const updated = await this.roomsService.update(roomCode, user.id, dto);

    // Re-balance team / solo colors if mode changed
    if (dto.gameMode !== undefined) {
      if (dto.gameMode === GameMode.SOLO) {
        let i = 0;
        for (const p of lobbyPlayers.values()) {
          p.teamColor = TeamColor.NONE;
          if (!p.color) p.color = GameStateService.soloColorAt(i);
          i++;
        }
      } else if (dto.gameMode === GameMode.TEAM) {
        let i = 0;
        for (const p of lobbyPlayers.values()) {
          p.teamColor = i % 2 === 0 ? TeamColor.RED : TeamColor.BLUE;
          p.color = '';
          i++;
        }
      }
    }

    const roomConfig = updated.data;
    this.server.to(roomCode).emit(RoomEvents.ROOM_UPDATED, {
      gameMode: roomConfig.gameMode,
      gridSize: roomConfig.gridSize,
      durationSeconds: roomConfig.durationSeconds,
      maxPlayers: roomConfig.maxPlayers,
    });

    // Broadcast updated player list so team badges refresh
    if (dto.gameMode !== undefined) {
      this.server
        .to(roomCode)
        .emit(RoomEvents.ROOM_STATE, this.buildRoomState(updated.data, lobbyPlayers));
    }
  }

  // ---------------------------------------------------------------------------
  // player_ready  (toggles ready state)
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(RoomEvents.PLAYER_READY)
  handlePlayerReady(@ConnectedSocket() client: Socket): void {
    const user = client.data.user as CurrentUser;
    const ctx = this.socketIndex.get(client.id);
    if (!ctx) throw new WsException('Not in a room');

    const lobbyPlayers = this.lobby.get(ctx.roomCode);
    const player = lobbyPlayers?.get(user.id);
    if (!player) throw new WsException('Not in lobby');

    player.isReady = !player.isReady;

    // Broadcast updated player entry so all clients can update their ready indicators
    this.server.to(ctx.roomCode).emit(RoomEvents.PLAYER_JOINED, this.toWire(player));
  }

  // ---------------------------------------------------------------------------
  // start_game  (host only)
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(GameEvents.START_GAME)
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartGameDto,
  ): Promise<void> {
    const user = client.data.user as CurrentUser;
    const room = await this.roomsService.getRoomRow(dto.roomCode.toUpperCase());

    if (room.hostUserId !== user.id) throw new WsException('Only the host can start the game');
    if (room.status !== GameStatus.LOBBY) throw new WsException('Room is not in LOBBY status');

    const lobbyPlayers = this.lobby.get(room.code) ?? new Map<string, InternalLobbyPlayer>();
    if (lobbyPlayers.size < 2) throw new WsException('Need at least 2 players to start');

    // Build InternalPlayer map; assign team colors for TEAM mode
    const playerMap: Record<string, InternalPlayer> = {};
    let i = 0;
    for (const lp of lobbyPlayers.values()) {
      const rosterColor = this.rosterTeamColor(room, lp.id);
      const teamColor =
        rosterColor ??
        (room.gameMode === 'TEAM'
          ? i % 2 === 0
            ? TeamColor.RED
            : TeamColor.BLUE
          : TeamColor.NONE);

      playerMap[lp.id] = {
        id: lp.id,
        fullName: lp.fullName,
        teamColor,
        color: lp.color,
        score: 0,
        socketId: lp.socketId,
      };
      i++;
    }

    // Mark room as PLAYING in DB
    await this.roomsService.transitionToPlaying(room.code);

    // Start the in-memory game engine
    const initialState = this.gameStateService.startGame(room, playerMap, {
      onTick: (state) => {
        this.server.to(room.code).emit(GameEvents.GAME_TICK, { remaining: state.remainingSeconds });
      },
      onGameOver: async (results) => {
        try {
          await this.roomsService.transitionToFinished(room.code);
          await this.profileService.recordMatchResults(results, room.id);
        } catch (err) {
          // Persistence failed — log, but still finish the game on the wire so
          // clients aren't stuck on the "Reconnecting…" overlay.
          this.logger.error(
            `Failed to persist match results for room ${room.code}: ${(err as Error).message}`,
            (err as Error).stack,
          );
        }
        // Clear any pending grace timers for all players
        for (const playerId of Object.keys(playerMap)) {
          clearTimeout(this.disconnectTimers.get(playerId));
          this.disconnectTimers.delete(playerId);
        }
        this.server.to(room.code).emit(GameEvents.GAME_OVER, results);
        this.lobby.delete(room.code);
        this.logger.log(`Game over for room ${room.code}`);
      },
    });

    // Lobby is dissolved — game is running
    this.lobby.delete(room.code);

    this.server.to(room.code).emit(GameEvents.GAME_STARTED, initialState);
    this.logger.log(`Game started in room ${room.code}`);
  }

  // ---------------------------------------------------------------------------
  // Tournament — start match (called by HTTP yalgamers endpoint)
  // ---------------------------------------------------------------------------

  async startTournamentMatch(room: {
    id: string;
    code: string;
    status: string;
    gameMode: 'SOLO' | 'TEAM';
    gridSize: number;
    durationSeconds: number;
    maxPlayers: number;
    hostUserId: string;
    tournamentRoster: Array<{
      teamId: string;
      teamName: string;
      color: 'RED' | 'BLUE' | null;
      players: Array<{
        userId: string;
        userName: string;
        displayName: string;
        avatarUrl: string | null;
      }>;
    }>;
    createdAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
    tournamentId: string | null;
    roundNumber: number | null;
  }): Promise<void> {
    if (room.status !== GameStatus.LOBBY) {
      throw new Error(`Match is not pending (current status: ${room.status})`);
    }

    const lobbyPlayers = this.lobby.get(room.code) ?? new Map<string, InternalLobbyPlayer>();
    const rosterUserIds = room.tournamentRoster.flatMap((t) => t.players.map((p) => p.userId));
    const missing = rosterUserIds.filter((id) => !lobbyPlayers.has(id));
    if (missing.length > 0) {
      throw new Error(
        `Cannot start match — ${missing.length} of ${rosterUserIds.length} roster players are not connected`,
      );
    }

    // Build playerMap from connected lobby + roster colors
    const playerMap: Record<string, InternalPlayer> = {};
    let soloIdx = 0;
    for (const userId of rosterUserIds) {
      const lp = lobbyPlayers.get(userId)!;
      const rosterColor = this.rosterTeamColor(room, userId) ?? TeamColor.NONE;
      const color = room.gameMode === GameMode.SOLO ? GameStateService.soloColorAt(soloIdx) : '';
      playerMap[userId] = {
        id: lp.id,
        fullName: lp.fullName,
        teamColor: rosterColor,
        color,
        score: 0,
        socketId: lp.socketId,
      };
      soloIdx++;
    }

    await this.roomsService.transitionToPlaying(room.code);

    const initialState = this.gameStateService.startGame(
      { ...room, status: 'PLAYING' } as never,
      playerMap,
      {
        onTick: (state) => {
          this.server
            .to(room.code)
            .emit(GameEvents.GAME_TICK, { remaining: state.remainingSeconds });
        },
        onGameOver: async (results) => {
          try {
            await this.roomsService.transitionToFinished(room.code);
            await this.profileService.recordMatchResults(results, room.id);
          } catch (err) {
            this.logger.error(
              `Failed to persist match results for tournament room ${room.code}: ${(err as Error).message}`,
              (err as Error).stack,
            );
          }
          for (const playerId of Object.keys(playerMap)) {
            clearTimeout(this.disconnectTimers.get(playerId));
            this.disconnectTimers.delete(playerId);
          }
          this.server.to(room.code).emit(GameEvents.GAME_OVER, results);
          this.lobby.delete(room.code);
          this.logger.log(`Tournament game over for room ${room.code}`);
        },
      },
    );

    this.lobby.delete(room.code);
    this.server.to(room.code).emit(GameEvents.GAME_STARTED, initialState);
    this.logger.log(`Tournament match started for room ${room.code}`);
  }

  // ---------------------------------------------------------------------------
  // claim_block
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(GameEvents.CLAIM_BLOCK)
  handleClaimBlock(@ConnectedSocket() client: Socket, @MessageBody() dto: ClaimBlockDto): void {
    const user = client.data.user as CurrentUser;
    const ctx = this.socketIndex.get(client.id);
    if (!ctx) throw new WsException('Not in a room');

    try {
      const updatedBlock = this.gameStateService.claimBlock(ctx.roomId, user.id, dto.x, dto.y);
      this.server.to(ctx.roomCode).emit(GameEvents.BLOCK_CLAIMED, updatedBlock);
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ---------------------------------------------------------------------------
  // request_state  (reconnect / full resync)
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(GameEvents.REQUEST_STATE)
  async handleRequestState(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartGameDto,
  ): Promise<void> {
    const roomCode = dto.roomCode.toUpperCase();
    const room = await this.roomsService.getRoomRow(roomCode);

    if (room.status === 'PLAYING' && this.gameStateService.hasGame(room.id)) {
      const state = this.gameStateService.getState(room.id);
      if (state) client.emit(GameEvents.GAME_STARTED, state);
      return;
    }

    const lobbyPlayers = this.lobby.get(room.code) ?? new Map<string, InternalLobbyPlayer>();
    client.emit(RoomEvents.ROOM_STATE, this.buildRoomState(room, lobbyPlayers));
  }

  // ---------------------------------------------------------------------------
  // reset_game  (host only — returns room to LOBBY state)
  // ---------------------------------------------------------------------------

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(GameEvents.RESET_GAME)
  async handleResetGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ResetGameDto,
  ): Promise<void> {
    const user = client.data.user as CurrentUser;
    const roomCode = dto.roomCode.toUpperCase();
    const room = await this.roomsService.getRoomRow(roomCode);

    if (room.hostUserId !== user.id) throw new WsException('Only the host can reset the game');

    await this.roomsService.resetToLobby(roomCode, user.id);

    // Tear down any existing game state
    if (this.gameStateService.hasGame(room.id)) {
      this.gameStateService.destroyGame(room.id);
    }

    // Re-populate lobby from currently connected sockets
    const socketIds = this.server.sockets.adapter.rooms.get(roomCode);
    const freshLobby = new Map<string, InternalLobbyPlayer>();

    if (socketIds) {
      let i = 0;
      for (const socketId of socketIds) {
        const ctx = this.socketIndex.get(socketId);
        if (!ctx) continue;

        const connectedSocket = this.server.sockets.sockets.get(socketId);
        const socketUser = connectedSocket?.data.user as CurrentUser | undefined;
        if (!socketUser) continue;

        const isHost = room.hostUserId === socketUser.id;
        const rosterColor = this.rosterTeamColor(room, socketUser.id);
        const teamColor =
          rosterColor ??
          (room.gameMode === 'TEAM'
            ? i % 2 === 0
              ? TeamColor.RED
              : TeamColor.BLUE
            : TeamColor.NONE);
        const color = room.gameMode === GameMode.SOLO ? GameStateService.soloColorAt(i) : '';

        freshLobby.set(socketUser.id, {
          id: socketUser.id,
          fullName: socketUser.fullName || socketUser.email.split('@')[0]!,
          teamColor,
          color,
          isReady: isHost,
          isHost,
          socketId,
        } as InternalLobbyPlayer);
        i++;
      }
    }

    this.lobby.set(roomCode, freshLobby);

    const updatedRoom = await this.roomsService.getRoomRow(roomCode);
    this.server
      .to(roomCode)
      .emit(RoomEvents.ROOM_STATE, this.buildRoomState(updatedRoom, freshLobby));
    this.logger.log(`Room ${roomCode} reset to LOBBY by host`);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildRoomState(
    room: {
      code: string;
      status: string;
      gameMode: string;
      gridSize: number;
      durationSeconds: number;
      maxPlayers: number;
      tournamentRoster?: unknown;
    },
    lobbyPlayers: Map<string, InternalLobbyPlayer>,
  ): RoomState {
    return {
      roomCode: room.code,
      status: room.status as GameStatus,
      gameMode: room.gameMode as GameMode,
      gridSize: room.gridSize,
      durationSeconds: room.durationSeconds,
      maxPlayers: room.maxPlayers,
      isTournament: Boolean(room.tournamentRoster),
      players: Array.from(lobbyPlayers.values()).map(this.toWire),
    };
  }

  private toWire(p: InternalLobbyPlayer): LobbyPlayer {
    return {
      id: p.id,
      fullName: p.fullName,
      teamColor: p.teamColor,
      color: p.color,
      isReady: p.isReady,
      isHost: p.isHost,
    };
  }

  private rosterTeamColor(
    room: {
      tournamentRoster: Array<{
        color: 'RED' | 'BLUE' | null;
        players: Array<{ userId: string }>;
      }> | null;
    },
    userId: string,
  ): TeamColor | null {
    if (!room.tournamentRoster) return null;
    for (const team of room.tournamentRoster) {
      if (team.players.some((p) => p.userId === userId)) {
        if (team.color === 'RED') return TeamColor.RED;
        if (team.color === 'BLUE') return TeamColor.BLUE;
        return TeamColor.NONE;
      }
    }
    return null;
  }

  private assignTeamColor(
    gameMode: GameMode,
    lobbyPlayers: Map<string, InternalLobbyPlayer>,
    excludePlayerId?: string,
  ): TeamColor {
    if (gameMode !== GameMode.TEAM) return TeamColor.NONE;
    let redCount = 0;
    let blueCount = 0;
    for (const [id, p] of lobbyPlayers) {
      if (id === excludePlayerId) continue;
      if (p.teamColor === TeamColor.RED) redCount++;
      else if (p.teamColor === TeamColor.BLUE) blueCount++;
    }
    return redCount <= blueCount ? TeamColor.RED : TeamColor.BLUE;
  }
}
