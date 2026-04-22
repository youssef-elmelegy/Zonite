// Home / Landing screen — Hero with CTAs to Create or Join
function Home({ onCreate, onJoin }) {
  const [code, setCode] = React.useState('');
  const [joining, setJoining] = React.useState(false);
  const [err, setErr] = React.useState('');

  const submitJoin = (e) => {
    e && e.preventDefault();
    const c = code.toUpperCase().replace(/[^A-Z0-9]/g,'');
    if (c.length !== 6) { setErr('Room code must be 6 characters'); return; }
    setErr('');
    onJoin(c);
  };

  return (
    <div data-screen-label="01 Home" style={{minHeight:'calc(100vh - 70px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 24px',position:'relative'}}>
      {/* Accent isometric grid echo */}
      <div style={{position:'absolute',right:'8%',top:'50%',transform:'translateY(-50%) rotate(18deg)',width:420,height:420,display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:10,opacity:0.42,pointerEvents:'none',zIndex:0}}>
        {Array.from({length:36}).map((_,i)=>{
          const cols = [0,6,7,12,15,18,19,24,25,30,35];
          const reds = [2,8,9,14,20,21,26,32];
          const blues = [4,5,11,17,22,23,28,29];
          const st = reds.includes(i) ? 'red' : blues.includes(i) ? 'blue' : 'empty';
          return (
            <div key={i} style={{
              aspectRatio:'1',borderRadius:8,
              background: st==='red' ? 'var(--team-red)' : st==='blue' ? 'var(--team-blue)' : 'rgba(255,255,255,0.04)',
              border:'1px solid '+(st==='empty'?'rgba(255,255,255,0.06)':'transparent'),
              boxShadow: st==='red' ? '0 0 14px rgba(247,23,86,0.35)' : st==='blue' ? '0 0 14px rgba(55,234,246,0.35)' : 'none',
              animation: st!=='empty' ? `cellPulse ${3+(i%4)*0.5}s ${i%7*0.3}s infinite` : 'none'
            }}/>
          );
        })}
      </div>

      <div style={{maxWidth:640,position:'relative',zIndex:1}}>
        <Eyebrow style={{marginBottom:24}}>Real-Time Claim Grid</Eyebrow>
        <h1 style={{margin:0,fontFamily:'var(--font-display)',fontSize:'clamp(48px, 7vw, 96px)',lineHeight:0.95,letterSpacing:'-0.02em',color:'#fff'}}>
          CLAIM YOUR<br/>
          <span style={{background:'var(--grad-fire)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>TERRITORY</span>
        </h1>
        <p style={{color:'var(--fg-tertiary)',fontSize:16,lineHeight:1.55,marginTop:20,marginBottom:40,maxWidth:480}}>
          Block-by-block, second-by-second. Assemble your squad, fill the board, and take the round before the clock hits zero.
        </p>

        {!joining ? (
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <Btn variant="primary" size="lg" icon={<IconPlus size={18}/>} onClick={onCreate}>Create Room</Btn>
            <Btn variant="secondary" size="lg" icon={<IconKey size={18}/>} onClick={()=>setJoining(true)}>Join Room</Btn>
          </div>
        ) : (
          <form onSubmit={submitJoin} style={{display:'flex',flexDirection:'column',gap:12,maxWidth:480}}>
            <Eyebrow color="var(--accent-yellow)" style={{marginBottom:4}}>Enter Room Code</Eyebrow>
            <div style={{display:'flex',gap:10,alignItems:'stretch'}}>
              <input autoFocus value={code} onChange={e=>{setCode(e.target.value.toUpperCase().slice(0,6));setErr('')}} placeholder="XXXXXX" maxLength={6}
                style={{flex:1,background:'rgba(23,14,27,0.8)',border:`1px solid ${err?'var(--fire-red)':'var(--border-default)'}`,borderRadius:8,padding:'16px 20px',fontSize:28,fontWeight:800,color:'#fff',fontFamily:'var(--font-display)',letterSpacing:'0.3em',textAlign:'center',outline:'none'}}/>
              <Btn variant="primary" size="lg" type="submit" icon={<IconArrowRight size={18}/>}>Join</Btn>
            </div>
            {err && <div style={{color:'var(--fire-red)',fontSize:12,fontWeight:600}}>{err}</div>}
            <button type="button" onClick={()=>{setJoining(false);setCode('');setErr('')}} style={{background:'none',border:'none',color:'var(--fg-tertiary)',fontSize:12,cursor:'pointer',textAlign:'left',padding:0,marginTop:4,fontFamily:'var(--font-ui)'}}>← Back</button>
          </form>
        )}

        <div style={{marginTop:48,display:'flex',gap:32,flexWrap:'wrap'}}>
          <MiniStat label="Active rounds" value="1,284" color="var(--lime-300)"/>
          <MiniStat label="Online now" value="12.4k" color="var(--sky-300)"/>
          <MiniStat label="Season" value="S3" color="var(--accent-yellow)"/>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{fontSize:10,color:'var(--fg-tertiary)',textTransform:'uppercase',letterSpacing:'0.18em',marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color,fontFamily:'var(--font-display)',lineHeight:1}}>{value}</div>
    </div>
  );
}

window.Home = Home;
