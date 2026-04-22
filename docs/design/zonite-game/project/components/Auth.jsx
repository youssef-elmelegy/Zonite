// Auth screens — Onboarding, Login, Signup, Forgot, Reset. Shared split layout.
function AuthLayout({ children, step, title, subtitle, hero }) {
  return (
    <div data-screen-label={`Auth / ${step}`} style={{display:'grid',gridTemplateColumns:'1fr 1.05fr',minHeight:'calc(100vh - 70px)',alignItems:'stretch'}}>
      {/* Left: form */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px'}}>
        <div style={{width:'100%',maxWidth:420}}>
          <Eyebrow style={{marginBottom:16}}>{step}</Eyebrow>
          <h1 style={{margin:'0 0 10px',fontFamily:'var(--font-display)',fontSize:44,letterSpacing:'-0.01em',color:'#fff',lineHeight:1.02}}>{title}</h1>
          {subtitle && <p style={{color:'var(--fg-tertiary)',fontSize:14,marginTop:0,marginBottom:28,lineHeight:1.5}}>{subtitle}</p>}
          {children}
        </div>
      </div>
      {/* Right: hero panel */}
      <div style={{position:'relative',padding:32,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{position:'absolute',inset:20,borderRadius:20,background:'linear-gradient(160deg, rgba(188,90,215,0.24) 0%, rgba(247,23,86,0.18) 55%, rgba(253,235,86,0.10) 100%)',border:'1px solid var(--border-default)',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 30% 30%, rgba(253,235,86,0.15), transparent 50%)'}}/>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'32px 32px',opacity:0.6}}/>
        </div>
        <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:480}}>{hero}</div>
      </div>
    </div>
  );
}

function MiniGridArt({ pattern = 'split' }) {
  const N = 10;
  const cells = Array.from({length:N*N}).map((_,i) => {
    const r = Math.floor(i/N), c = i%N;
    if (pattern === 'split') return c < N/2 ? (Math.random()<0.55?'blue':'empty') : (Math.random()<0.55?'red':'empty');
    if (pattern === 'scatter') return Math.random() < 0.14 ? 'red' : Math.random() < 0.3 ? 'blue' : 'empty';
    if (pattern === 'key') return (i % 11 === 0) ? 'yellow' : (Math.random()<0.18 ? 'blue' : 'empty');
    return 'empty';
  });
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${N}, 1fr)`,gap:4,padding:16,background:'rgba(23,14,27,0.6)',border:'1px solid var(--border-default)',borderRadius:16}}>
      {cells.map((st,i)=>{
        const c = st==='red' ? 'var(--team-red)' : st==='blue' ? 'var(--team-blue)' : st==='yellow' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.05)';
        return <div key={i} style={{aspectRatio:'1',background:c,borderRadius:4,boxShadow:st!=='empty'?`0 0 8px ${c}`:'none'}}/>;
      })}
    </div>
  );
}

// --- OTP field
function OtpField({ value, onChange, length=6 }) {
  const refs = React.useRef([]);
  const chars = Array.from({length},(_,i)=>value[i]||'');
  const setAt = (i, ch) => {
    const next = (value + '').padEnd(length,' ').split('');
    next[i] = ch; onChange(next.join('').replace(/\s/g,'').slice(0,length));
    if (ch && refs.current[i+1]) refs.current[i+1].focus();
  };
  return (
    <div style={{display:'flex',gap:8}}>
      {chars.map((ch,i)=>(
        <input key={i} ref={el=>refs.current[i]=el} value={ch} maxLength={1} inputMode="numeric"
          onChange={e=>setAt(i, e.target.value.replace(/\D/g,'').slice(-1))}
          onKeyDown={e=>{ if (e.key==='Backspace' && !ch && refs.current[i-1]) refs.current[i-1].focus(); }}
          style={{width:48,height:58,textAlign:'center',fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:'var(--accent-yellow)',background:'rgba(23,14,27,0.8)',border:'1px solid var(--border-default)',borderRadius:10,outline:'none'}}/>
      ))}
    </div>
  );
}

// --- Input atom
function Field({ label, type='text', value, onChange, placeholder, error, hint, right, autoComplete }) {
  const [focus, setFocus] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const actualType = type==='password' && showPw ? 'text' : type;
  return (
    <div style={{marginBottom:16}}>
      {label && <div style={{fontSize:10,color:'var(--fg-tertiary)',textTransform:'uppercase',letterSpacing:'0.18em',marginBottom:8,fontWeight:700}}>{label}</div>}
      <div style={{
        position:'relative',display:'flex',alignItems:'center',
        background:'rgba(23,14,27,0.7)',
        border:`1px solid ${error?'var(--fire-red)':focus?'var(--accent-yellow)':'var(--border-default)'}`,
        borderRadius:10, transition:'all 140ms var(--ease-out)',
        boxShadow: focus && !error ? '0 0 0 3px rgba(253,235,86,0.12)' : error ? '0 0 0 3px rgba(247,23,86,0.12)' : 'none'
      }}>
        <input type={actualType} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} autoComplete={autoComplete}
          style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:14,padding:'14px 16px',fontFamily:'var(--font-ui)'}}/>
        {type==='password' && (
          <button type="button" onClick={()=>setShowPw(v=>!v)} style={{background:'none',border:'none',color:'var(--fg-tertiary)',cursor:'pointer',padding:'0 14px',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em'}}>{showPw?'Hide':'Show'}</button>
        )}
        {right}
      </div>
      {error && <div style={{color:'var(--fire-red)',fontSize:11,marginTop:6,fontWeight:600}}>{error}</div>}
      {hint && !error && <div style={{color:'var(--fg-tertiary)',fontSize:11,marginTop:6}}>{hint}</div>}
    </div>
  );
}

function SocialRow({ onSocial }) {
  const btns = [
    { k:'google', label:'Google' },
    { k:'discord', label:'Discord' },
    { k:'steam', label:'Steam' }
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8,marginBottom:16}}>
      {btns.map(b=>(
        <button key={b.k} onClick={()=>onSocial(b.k)} style={{
          background:'rgba(255,255,255,0.03)',border:'1px solid var(--border-default)',color:'#fff',
          borderRadius:8,padding:'11px 0',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-ui)',
          display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6
        }}>
          <SocialGlyph kind={b.k}/> {b.label}
        </button>
      ))}
    </div>
  );
}
function SocialGlyph({ kind }) {
  if (kind==='google') return <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.92h5.45c-.24 1.44-1.74 4.22-5.45 4.22-3.28 0-5.96-2.72-5.96-6.08S8.72 6.2 12 6.2c1.87 0 3.12.8 3.84 1.48l2.62-2.52C16.9 3.62 14.66 2.7 12 2.7 6.88 2.7 2.7 6.88 2.7 12S6.88 21.3 12 21.3c6.88 0 9.44-4.82 9.44-7.3 0-.48-.06-.9-.14-1.34H12z"/></svg>;
  if (kind==='discord') return <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2"><path d="M19.27 5.33C17.94 4.72 16.5 4.26 15 4c-.2.36-.43.85-.59 1.23-1.6-.24-3.19-.24-4.76 0-.17-.38-.4-.87-.6-1.23-1.51.26-2.95.72-4.28 1.33C1.07 9.33.29 13.22.68 17.06c1.8 1.34 3.54 2.15 5.26 2.69.43-.58.81-1.2 1.14-1.85-.63-.24-1.23-.53-1.8-.87.15-.11.3-.23.44-.35 3.46 1.62 7.2 1.62 10.63 0 .15.12.29.24.44.35-.57.34-1.17.63-1.8.87.33.65.71 1.27 1.14 1.85 1.72-.54 3.47-1.35 5.26-2.69.45-4.45-.79-8.3-3.32-11.73zM8.52 14.99c-1.03 0-1.88-.96-1.88-2.13s.83-2.13 1.88-2.13 1.9.96 1.88 2.13c0 1.17-.83 2.13-1.88 2.13zm6.96 0c-1.03 0-1.88-.96-1.88-2.13s.83-2.13 1.88-2.13 1.9.96 1.88 2.13c0 1.17-.83 2.13-1.88 2.13z"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="10" opacity=".2"/><circle cx="12" cy="12" r="4"/></svg>;
}

// --- Onboarding: 3-step intro before first auth
function Onboarding({ onDone }) {
  const [i, setI] = React.useState(0);
  const steps = [
    { title:'Claim Territory', desc:'Tap cells faster than your rivals. The board fills one block at a time — and only the quickest take ground.', art:'scatter', kicker:'How it works' },
    { title:'Play Solo or Squad', desc:'Free-for-all with every player a color, or Red vs Blue team matches where every claim feeds your side.', art:'split', kicker:'Two ways to play' },
    { title:'Invite with a Code', desc:'Every room has a 6-character code. Share it, hit Ready, and let the clock drop.', art:'key', kicker:'Quick to start' }
  ];
  const s = steps[i];
  return (
    <AuthLayout
      step={s.kicker}
      title={s.title}
      subtitle={s.desc}
      hero={<MiniGridArt pattern={s.art}/>}
    >
      <div style={{display:'flex',gap:6,marginBottom:28}}>
        {steps.map((_,idx)=>(
          <div key={idx} style={{flex:1,height:4,borderRadius:100,background:idx<=i?'var(--accent-yellow)':'rgba(255,255,255,0.08)',transition:'all 200ms var(--ease-out)',boxShadow:idx===i?'0 0 10px rgba(253,235,86,0.6)':'none'}}/>
        ))}
      </div>
      <div style={{display:'flex',gap:10}}>
        {i>0 && <Btn variant="ghost" onClick={()=>setI(i-1)} icon={<IconArrowLeft size={14}/>}>Back</Btn>}
        <div style={{flex:1}}/>
        <Btn variant="ghost" onClick={onDone}>Skip</Btn>
        <Btn variant="primary" icon={<IconArrowRight size={14}/>} onClick={()=>i<steps.length-1?setI(i+1):onDone()}>
          {i<steps.length-1?'Next':'Get Started'}
        </Btn>
      </div>
    </AuthLayout>
  );
}

// --- Login
function Login({ onLogin, onSwitch, onForgot }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState({});
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (pw.length < 6) errs.pw = 'Password too short';
    setErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setTimeout(()=>{ setBusy(false); onLogin({ email, name: email.split('@')[0] || 'KairosX', remember }); }, 700);
  };

  return (
    <AuthLayout
      step="Sign In"
      title="Welcome Back"
      subtitle="Pick up your streak right where you left it."
      hero={<MiniGridArt pattern="split"/>}
    >
      <SocialRow onSocial={(k)=>onLogin({ email:`${k}user@zonite.gg`, name:`${k}Player`, social:k })}/>
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'20px 0',fontSize:10,color:'var(--fg-muted)',textTransform:'uppercase',letterSpacing:'0.18em'}}>
        <div style={{flex:1,height:1,background:'var(--border-subtle)'}}/>Or Email<div style={{flex:1,height:1,background:'var(--border-subtle)'}}/>
      </div>
      <form onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@zonite.gg" error={err.email} autoComplete="email"/>
        <Field label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" error={err.pw} autoComplete="current-password"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:'var(--fg-secondary)'}}>
            <div onClick={()=>setRemember(r=>!r)} style={{width:16,height:16,borderRadius:4,background:remember?'var(--accent-yellow)':'transparent',border:`1px solid ${remember?'var(--accent-yellow)':'var(--border-default)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {remember && <IconCheck size={11} stroke="var(--ink-900)" sw={3}/>}
            </div>
            Remember me
          </label>
          <button type="button" onClick={onForgot} style={{background:'none',border:'none',color:'var(--accent-yellow)',fontSize:12,fontWeight:700,cursor:'pointer'}}>Forgot password?</button>
        </div>
        <Btn variant="primary" size="lg" block type="submit" icon={busy?null:<IconArrowRight size={16}/>} disabled={busy}>{busy?'Signing in…':'Sign In'}</Btn>
      </form>
      <div style={{marginTop:22,textAlign:'center',fontSize:13,color:'var(--fg-tertiary)'}}>
        New to Zonite? <button type="button" onClick={onSwitch} style={{background:'none',border:'none',color:'var(--accent-yellow)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Create account</button>
      </div>
    </AuthLayout>
  );
}

// --- Signup
function Signup({ onSignup, onSwitch }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [err, setErr] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  const strength = React.useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }, [pw]);
  const strengthLabel = ['Too weak','Weak','Fair','Strong','Excellent'][strength];
  const strengthColor = ['var(--fire-red)','var(--fire-red)','var(--orange-500)','var(--lime-300)','var(--lime-300)'][strength];

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (name.length < 3) errs.name = 'At least 3 characters';
    if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (pw.length < 8) errs.pw = 'At least 8 characters';
    if (!agree) errs.agree = 'Accept the terms to continue';
    setErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setTimeout(()=>{ setBusy(false); onSignup({ email, name }); }, 700);
  };

  return (
    <AuthLayout
      step="Create Account"
      title="Join the Grid"
      subtitle="Pick a handle, claim your first color, and get in a room in under a minute."
      hero={<MiniGridArt pattern="scatter"/>}
    >
      <SocialRow onSocial={(k)=>onSignup({ email:`${k}user@zonite.gg`, name:`${k}Player`, social:k })}/>
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'20px 0',fontSize:10,color:'var(--fg-muted)',textTransform:'uppercase',letterSpacing:'0.18em'}}>
        <div style={{flex:1,height:1,background:'var(--border-subtle)'}}/>Or Email<div style={{flex:1,height:1,background:'var(--border-subtle)'}}/>
      </div>
      <form onSubmit={submit}>
        <Field label="Display Name" value={name} onChange={setName} placeholder="KairosX" error={err.name} autoComplete="username"/>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@zonite.gg" error={err.email} autoComplete="email"/>
        <Field label="Password" type="password" value={pw} onChange={setPw} placeholder="At least 8 characters" error={err.pw} autoComplete="new-password"/>
        {pw && (
          <div style={{margin:'-6px 0 16px'}}>
            <div style={{display:'flex',gap:4,marginBottom:6}}>
              {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:100,background:i<strength?strengthColor:'rgba(255,255,255,0.08)',transition:'all 120ms'}}/>)}
            </div>
            <div style={{fontSize:11,color:strengthColor,fontWeight:700}}>{strengthLabel}</div>
          </div>
        )}
        <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontSize:12,color:'var(--fg-secondary)',marginBottom:4}}>
          <div onClick={()=>setAgree(a=>!a)} style={{flexShrink:0,width:16,height:16,marginTop:2,borderRadius:4,background:agree?'var(--accent-yellow)':'transparent',border:`1px solid ${agree?'var(--accent-yellow)':err.agree?'var(--fire-red)':'var(--border-default)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {agree && <IconCheck size={11} stroke="var(--ink-900)" sw={3}/>}
          </div>
          <span>I agree to the <a style={{color:'var(--accent-yellow)',textDecoration:'none'}}>Terms</a> and <a style={{color:'var(--accent-yellow)',textDecoration:'none'}}>Privacy Policy</a>.</span>
        </label>
        {err.agree && <div style={{color:'var(--fire-red)',fontSize:11,marginBottom:10,marginLeft:24,fontWeight:600}}>{err.agree}</div>}
        <div style={{height:14}}/>
        <Btn variant="primary" size="lg" block type="submit" disabled={busy} icon={busy?null:<IconArrowRight size={16}/>}>{busy?'Creating…':'Create Account'}</Btn>
      </form>
      <div style={{marginTop:22,textAlign:'center',fontSize:13,color:'var(--fg-tertiary)'}}>
        Already have an account? <button type="button" onClick={onSwitch} style={{background:'none',border:'none',color:'var(--accent-yellow)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Sign in</button>
      </div>
    </AuthLayout>
  );
}

// --- Forgot Password
function Forgot({ onSent, onBack }) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setErr('Enter a valid email'); return; }
    setErr(''); setSent(true);
  };
  if (sent) {
    return (
      <AuthLayout step="Reset Sent" title="Check Your Inbox" subtitle={`We sent a 6-digit code to ${email}. Enter it on the next screen to set a new password.`} hero={<MiniGridArt pattern="key"/>}>
        <div style={{padding:16,background:'rgba(75,255,84,0.08)',border:'1px solid var(--lime-300)',borderRadius:10,display:'flex',gap:10,alignItems:'center',marginBottom:22}}>
          <IconCheckCircle size={18} stroke="var(--lime-300)"/>
          <span style={{fontSize:13,color:'var(--lime-300)',fontWeight:600}}>Email sent. Check spam if you don't see it.</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <Btn variant="secondary" onClick={onBack} icon={<IconArrowLeft size={14}/>}>Back to Sign In</Btn>
          <div style={{flex:1}}/>
          <Btn variant="primary" onClick={()=>onSent(email)} icon={<IconArrowRight size={14}/>}>Enter Code</Btn>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout step="Forgot Password" title="Reset Password" subtitle="Enter the email tied to your Zonite account. We'll send a 6-digit verification code." hero={<MiniGridArt pattern="key"/>}>
      <form onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={v=>{setEmail(v);setErr('')}} placeholder="you@zonite.gg" error={err} autoComplete="email"/>
        <div style={{display:'flex',gap:10,marginTop:10}}>
          <Btn variant="ghost" onClick={onBack} icon={<IconArrowLeft size={14}/>}>Back</Btn>
          <div style={{flex:1}}/>
          <Btn variant="primary" type="submit" icon={<IconArrowRight size={14}/>}>Send Code</Btn>
        </div>
      </form>
    </AuthLayout>
  );
}

// --- Reset Password (OTP + new password)
function Reset({ email, onDone, onBack }) {
  const [otp, setOtp] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [err, setErr] = React.useState({});
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (otp.length !== 6) errs.otp = 'Enter the full 6-digit code';
    if (pw.length < 8) errs.pw = 'At least 8 characters';
    if (pw !== confirm) errs.confirm = 'Passwords do not match';
    setErr(errs);
    if (Object.keys(errs).length) return;
    onDone();
  };
  return (
    <AuthLayout step="Reset Password" title="Set a New Password" subtitle={`Enter the code we sent to ${email || 'your email'} and pick a new password.`} hero={<MiniGridArt pattern="key"/>}>
      <form onSubmit={submit}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:'var(--fg-tertiary)',textTransform:'uppercase',letterSpacing:'0.18em',marginBottom:8,fontWeight:700}}>Verification Code</div>
          <OtpField value={otp} onChange={v=>{setOtp(v); setErr(e=>({...e,otp:null}))}}/>
          {err.otp && <div style={{color:'var(--fire-red)',fontSize:11,marginTop:8,fontWeight:600}}>{err.otp}</div>}
          <div style={{fontSize:11,color:'var(--fg-tertiary)',marginTop:8}}>Didn't get it? <button type="button" style={{background:'none',border:'none',color:'var(--accent-yellow)',fontWeight:700,cursor:'pointer',fontSize:11}}>Resend</button></div>
        </div>
        <Field label="New Password" type="password" value={pw} onChange={setPw} placeholder="At least 8 characters" error={err.pw}/>
        <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" error={err.confirm}/>
        <div style={{display:'flex',gap:10,marginTop:8}}>
          <Btn variant="ghost" onClick={onBack} icon={<IconArrowLeft size={14}/>}>Back</Btn>
          <div style={{flex:1}}/>
          <Btn variant="primary" type="submit" icon={<IconCheck size={14}/>}>Reset & Sign In</Btn>
        </div>
      </form>
    </AuthLayout>
  );
}

Object.assign(window, { AuthLayout, Onboarding, Login, Signup, Forgot, Reset, Field, OtpField, MiniGridArt });
