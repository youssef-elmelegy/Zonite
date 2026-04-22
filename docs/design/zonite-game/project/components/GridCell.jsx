// Zonite grid cell: empty | hover | own | opp | disabled
function GridCell({ state = 'empty', label, size = 56, onClick, idx }) {
  const [hover, setHover] = React.useState(false);
  const bases = {
    empty: {bg:'var(--cell-empty)',border:'var(--cell-empty-border)',color:'var(--fg-muted)'},
    own: {bg:'var(--team-blue)',border:'transparent',color:'var(--ink-900)'},
    opp: {bg:'var(--team-red)',border:'transparent',color:'#fff'},
    disabled: {bg:'var(--cell-disabled)',border:'var(--cell-empty-border)',color:'var(--fg-muted)'}
  };
  const st = bases[state] || bases.empty;
  const canHover = state === 'empty' && onClick;
  return (
    <div
      onClick={canHover ? onClick : undefined}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        width:size,height:size,
        borderRadius:8,
        background: canHover && hover ? 'var(--cell-hover)' : st.bg,
        border: `1px solid ${canHover && hover ? 'var(--cell-hover-border)' : st.border}`,
        color: canHover && hover ? 'var(--accent-yellow)' : st.color,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:11, fontWeight:700, letterSpacing:'0.03em',
        cursor: canHover ? 'pointer' : (state==='disabled' ? 'not-allowed' : 'default'),
        transition:'all 140ms var(--ease-out)',
        boxShadow: state==='own' ? '0 0 14px var(--team-blue-soft), inset 0 0 0 2px rgba(255,255,255,0.2)' :
                   state==='opp' ? '0 0 14px rgba(247,23,86,0.3), inset 0 0 0 2px rgba(255,255,255,0.18)' :
                   canHover && hover ? '0 0 12px rgba(253,235,86,0.25)' : 'none',
        transform: canHover && hover ? 'scale(1.04)' : 'scale(1)',
        opacity: state==='disabled' ? 0.4 : 1,
        userSelect:'none'
      }}
    >{label ?? (state==='own' ? '●' : state==='opp' ? '●' : idx)}</div>
  );
}
window.GridCell = GridCell;
