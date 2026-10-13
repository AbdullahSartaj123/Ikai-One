import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
const OTP_LENGTH=6, DEMO_OTP='123456'
export default function VerifyOTP(){
  const [digits,setDigits]=useState(Array(OTP_LENGTH).fill('')),[seconds,setSeconds]=useState(30),[resent,setResent]=useState(false),[error,setError]=useState('')
  const inputRefs=useRef([]),[params]=useSearchParams(),navigate=useNavigate(),{pendingSignup,verifyOtp}=useAuth(),isReset=params.get('mode')==='reset'
  useEffect(()=>{inputRefs.current[0]?.focus()},[])
  useEffect(()=>{if(seconds<=0)return;const timer=window.setInterval(()=>setSeconds(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(timer)},[seconds])
  function changeDigit(index,value){const digit=value.replace(/\D/g,'').slice(-1);setDigits(old=>old.map((v,i)=>i===index?digit:v));setError('');if(digit&&index<OTP_LENGTH-1)inputRefs.current[index+1]?.focus()}
  function keyDown(index,event){if(event.key==='Backspace'&&!digits[index]&&index>0)inputRefs.current[index-1]?.focus();if(event.key==='ArrowLeft'&&index>0)inputRefs.current[index-1]?.focus();if(event.key==='ArrowRight'&&index<OTP_LENGTH-1)inputRefs.current[index+1]?.focus()}
  function pasteCode(event){const pasted=event.clipboardData.getData('text').replace(/\D/g,'').slice(0,OTP_LENGTH).split('');if(!pasted.length)return;event.preventDefault();setDigits(Array.from({length:OTP_LENGTH},(_,i)=>pasted[i]||''));inputRefs.current[Math.min(pasted.length,OTP_LENGTH)-1]?.focus()}
  function submit(event){event.preventDefault();const code=digits.join('');if(code.length!==OTP_LENGTH){setError('Enter all six digits to continue.');return}if(isReset){setError('Password reset is a placeholder. Connect an authentication backend to reset passwords.');return}const result=verifyOtp(code);if(!result.ok){setError(result.message);return}navigate('/onboarding',{replace:true})}
  function resend(){if(seconds>0)return;setSeconds(30);setResent(true);setError('');setDigits(Array(OTP_LENGTH).fill(''));inputRefs.current[0]?.focus()}
  if(!isReset&&!pendingSignup)return <div className="auth-simple-page"><header className="auth-simple-header"><Link to="/"><Logo/></Link><Link to="/signup">Create account</Link></header><main className="auth-card"><div className="auth-card-icon"><ShieldCheck size={22}/></div><h1>No verification in progress</h1><p className="auth-subtitle">Create your shipper account first, then verify the demo code.</p><Link className="auth-primary auth-link-button" to="/signup">Go to signup <ArrowRight size={17}/></Link></main></div>
  const destination=pendingSignup?.email||pendingSignup?.phone||'your registered email or phone'
  return <div className="auth-simple-page"><header className="auth-simple-header"><Link to="/"><Logo/></Link><span>Need an account? <Link to="/signup">Sign up</Link></span></header>
    <main className="auth-card otp-card"><Link to={isReset?'/login':'/signup'} className="auth-back"><ArrowLeft size={15}/> Back</Link><div className="auth-card-icon"><Mail size={22}/></div><span className="auth-form-eyebrow">{isReset?'ACCOUNT RECOVERY':'VERIFY YOUR ACCOUNT'}</span><h1>{isReset?'Reset your password':'Check your inbox'}</h1><p className="auth-subtitle">Enter the 6-digit code for <strong>{destination}</strong>. This prototype uses a demo code.</p>
      <div className="demo-code-banner"><ShieldCheck size={16}/><span>Demo verification code</span><strong>{DEMO_OTP}</strong></div>
      <form className="auth-form otp-form" onSubmit={submit}><label>6-DIGIT VERIFICATION CODE</label><div className="otp-inputs" onPaste={pasteCode}>{digits.map((digit,index)=><input key={index} ref={el=>inputRefs.current[index]=el} aria-label={'OTP digit '+(index+1)} inputMode="numeric" autoComplete={index===0?'one-time-code':'off'} maxLength={1} value={digit} onChange={e=>changeDigit(index,e.target.value)} onKeyDown={e=>keyDown(index,e)}/>)}</div>
        {error&&<p className="auth-error" role="alert">{error}</p>}{resent&&<p className="auth-success"><CheckCircle2 size={15}/> Demo code refreshed. Use {DEMO_OTP}.</p>}<button className="auth-primary" type="submit">{isReset?'Continue':'Verify and continue'} <ArrowRight size={17}/></button>
      </form><div className="otp-resend"><span>Didn’t receive the code?</span><button type="button" disabled={seconds>0} onClick={resend}>{seconds>0?'Resend in 00:'+String(seconds).padStart(2,'0'):'Resend code'}</button></div><p className="auth-terms">This OTP flow is simulated locally; no email or SMS is sent.</p>
    </main>
  </div>
}
