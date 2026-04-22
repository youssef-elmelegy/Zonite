// Game Over — winner banner + score breakdown + board replay thumbnail.
function Results({ result, onPlayAgain, onBackToLobby }) {
  const { board, room, forfeit } = result;
  const total = room.width * room.height;
  const scores = computeScores(board, room);

  let winnerKind, winnerColor, winnerName, winnerSub;
  if (room.mode === 'team') {
    const r = scores.teams.red, b = scores.teams.blue;
    if (r === b) {
      winnerKind = 'draw'; winnerColor = 'var(--accent-yellow)';
      winnerName = 'Stalemate'; winnerSub = `${r} – ${b}`;
    } else {
      const win = r > b ? 'red' : 'blue';
      winnerKind = win;
      winnerColor = win==='red' ? 'var(--team-red)' : 'var(--team-blue)';
      winnerName = win==='red' ? 'Red Team Wins' : 'Blue Team Wins';
      winnerSub = `${Math.max(r,b)} – ${Math.min(r,b)}`;
    }
  } else {
    const top = scores.sorted[0];
    winnerKind = 'solo';
    winnerColor = top.color;
    winnerName = `${top.name} Wins`;
    winnerSub = `${scores.players[top.id]||0} blocks · ${Math.round(((scores.players[top.id]||0)/total)*100)}% of the board`;
  }

  const sorted = scores.sorted;

  return (
    <div data-screen-label="05 Results" style={{position:'relative',minHeight:'calc(100vh - 70px)',overflow:'hidden'}}>
      {/* Winner color flood */}
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 0%, ${winnerColor}, transparent 60%)`,opacity:0.28,pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'absolute',inset:0,background:`linear-gradient(180deg, ${winnerColor}22 0%, transparent 40%)`,pointerEvents:'none',zIndex:0}}/>

      <div style={{position:'relative',zIndex:1,maxWidth:1060,margin:'0 auto',padding:'40px 24px 80px'}}>
        {/* Winner Banner */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <Eyebrow color={winnerColor} style={{marginBottom:18}}>{forfeit ? 'Match Ended' : 'Final Result'}</Eyebrow>
          <div style={{display:'inline-flex',alignItems:'center',gap:16,marginBottom:12}}>
            <IconTrophy size={56} stroke={winnerColor} sw={1.2}/>
          </div>
          <h1 style={{
            margin:'0 0 12px',
            fontFamily:'var(--font-display)',
            fontSize:'clamp(42px,7vw,78px)',
            fontWeight:800,
            letterSpacing:'-0.02em',
            color:'#fff',
            textShadow:`0 0 40px ${winnerColor}`
          }}>
            {winnerName.toUpperCase()}
          </h1>
          <div style={{fontSize:16,color:'var(--fg-tertiary)',fontFamily:'var(--font-display)',letterSpacing:'0.06em'}}>{winnerSub}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:24,alignItems:'start'}}>
          {/* Score breakdown */}
          <Panel style={{padding:24}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <IconUsers size={14} stroke="var(--accent-yellow)"/>
                <h3 style={{margin:0,fontSize:13,fontWeight:700,color:'#fff',letterSpacing:'0.1em',textTransform:'uppercase'}}>Score Breakdown</h3>
              </div>
              <span style={{fontSize:11,color:'var(--fg-tertiary)',fontFamily:'var(--font-mono)'}}>{total} cells · {room.width}×{room.height}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {sorted.map((p,i) => {
                const s = scores.players[p.id]||0;
                const pct = Math.round((s/total)*100);
                const color = room.mode==='team' ? (p.team==='red'?'var(--team-red)':'var(--team-blue)') : p.color;
                const isWinner = i===0 && s>0;
                return (
                  <div key={p.id} style={{
                    display:'grid',gridTemplateColumns:'32px 44px 1fr auto auto',alignItems:'center',gap:14,
                    padding:'14px 16px',
                    background: isWinner ? `linear-gradient(90deg, ${color}22, transparent)` : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${isWinner?color:'var(--border-subtle)'}`,
                    borderRadius:12,
                    boxShadow: isWinner ? `0 0 20px ${color}40` : 'none'
                  }}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:isWinner?color:'var(--fg-muted)',textAlign:'center',lineHeight:1}}>{i+1}</div>
                    <div style={{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg, ${color}, rgba(0,0,0,0.4))`,border:`2px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff'}}>
                      {p.name[0]}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:8}}>
                        {p.name}
                        {p.isYou && <span style={{fontSize:9,color:'var(--accent-yellow)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.15em'}}>YOU</span>}
                        {isWinner && <IconCrown size={12} stroke="var(--accent-yellow)" sw={2}/>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                        <div style={{flex:1,height:4,background:'rgba(255,255,255,0.06)',borderRadius:100,overflow:'hidden',maxWidth:260}}>
                          <div style={{width:`${pct}%`,height:'100%',background:color,boxShadow:`0 0 8px ${color}`}}/>
                        </div>
                        <span style={{fontSize:10,color:'var(--fg-tertiary)',fontFamily:'var(--font-mono)',minWidth:32}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:800,color:'#fff',lineHeight:1}}>{s}</div>
                      <div style={{fontSize:9,color:'var(--fg-tertiary)',textTransform:'uppercase',letterSpacing:'0.15em',marginTop:3}}>blocks</div>
                    </div>
                    <div style={{width:10,height:40,borderRadius:4,background:color,boxShadow:`0 0 10px ${color}`}}/>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Replay thumbnail */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <Panel style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <IconGrid size={14} stroke="var(--accent-yellow)"/>
                <h3 style={{margin:0,fontSize:13,fontWeight:700,color:'#fff',letterSpacing:'0.1em',textTransform:'uppercase'}}>Final Board</h3>
              </div>
              <BoardThumb board={board} room={room}/>
              <div style={{marginTop:14,display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--fg-tertiary)'}}>
                <span>Filled</span>
                <span style={{fontFamily:'var(--font-mono)',color:'#fff'}}>{board.filter(x=>x!==null).length} / {total}</span>
              </div>
            </Panel>

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <Btn variant="primary" block size="lg" icon={<IconRefresh size={16}/>} onClick={onPlayAgain}>Play Again</Btn>
              <Btn variant="secondary" block size="lg" icon={<IconArrowLeft size={16}/>} onClick={onBackToLobby}>Back to Lobby</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardThumb({ board, room }) {
  const total = room.width * room.height;
  const size = Math.max(3, Math.min(14, Math.floor(260 / Math.max(room.width, room.height))));
  return (
    <div style={{padding:8,background:'rgba(23,14,27,0.6)',border:'1px solid var(--border-subtle)',borderRadius:8,display:'flex',justifyContent:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${room.width}, ${size}px)`,gap:1}}>
        {board.map((ownerId, i) => {
          const owner = ownerId ? room.players.find(p=>p.id===ownerId) : null;
          const color = owner ? (room.mode==='team' ? (owner.team==='red'?'var(--team-red)':'var(--team-blue)') : owner.color) : 'rgba(255,255,255,0.04)';
          return <div key={i} style={{width:size,height:size,background:color,borderRadius:1,boxShadow:owner?`0 0 2px ${color}`:'none'}}/>;
        })}
      </div>
    </div>
  );
}

window.Results = Results;
