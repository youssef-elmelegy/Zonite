import type { Player } from '../shared';

const SOLO_FALLBACK_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

function hashStringToIndex(id: string, modulo: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

// Deterministic per-player color derived from the player's id, so every client
// agrees on the color even if the server payload's `color` is empty.
export function resolveSoloColor(player: Pick<Player, 'id' | 'color'>): string {
  if (player.color) return player.color;
  const idx = hashStringToIndex(player.id, SOLO_FALLBACK_COLORS.length);
  return SOLO_FALLBACK_COLORS[idx]!;
}
