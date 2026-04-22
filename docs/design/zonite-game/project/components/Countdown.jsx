// Countdown timer. Can display mm:ss or dd/hh/mm/ss units.
function Countdown({ seconds = 180, compact = false, warning = 30 }) {
  const [t, setT] = React.useState(seconds);
  React.useEffect(()=>{
    if (t <= 0) return;
    const id = setInterval(()=>setT(x=>x>0?x-1:0),1000);
    return ()=>clearInterval(id);
  },[t>0]);
  const mm = String(Math.floor(t/60)).padStart(2,'0');
  const ss = String(t%60).padStart(2,'0');
  const critical = t <= warning;
  if (compact) {
    return (
      <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 14px',background:critical?'rgba(247,23,86,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${critical?'var(--fire-red)':'var(--border-default)'}`,borderRadius:100,fontWeight:700,fontSize:14,color:critical?'var(--fire-red)':'var(--accent-yellow)',fontVariantNumeric:'tabular-nums',fontFamily:'var(--font-display)'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'currentColor',animation:'zpulse 1s infinite'}}/>
        {mm}:{ss}
      </div>
    );
  }
  return (
    <div style={{display:'flex',gap:8}}>
      {[['MIN',mm],['SEC',ss]].map(([l,v])=>(
        <div key={l} style={{background:'var(--ink-850)',border:'1px solid var(--border-subtle)',borderRadius:8,padding:'12px 16px',textAlign:'center',minWidth:62}}>
          <div style={{fontSize:28,fontWeight:700,color:critical?'var(--fire-red)':'var(--accent-yellow)',fontFamily:'var(--font-display)',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{v}</div>
          <div style={{fontSize:9,color:'var(--fg-tertiary)',textTransform:'uppercase',letterSpacing:'0.15em',marginTop:4}}>{l}</div>
        </div>
      ))}
      <style>{`@keyframes zpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
window.Countdown = Countdown;
