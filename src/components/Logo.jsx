import { Link } from 'react-router-dom'

export default function Logo({compact=false,light=false,className=''}) {
 return <Link to="/" className={['brand','ikai-logo','ikai-logo-link',className].filter(Boolean).join(' ')} aria-label="Go to IKAI One homepage" title="Home">
  <span className={'brand-symbol ikai-logo-mark'+(light?' logo-light':'')}>
   <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    <path d="M8 5.5H32V10H8zM8 13.5H32V18H8z" fill="currentColor"/>
    <path d="M8 34L20 23L32 34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 38H32" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
   </svg>
  </span>
  {!compact&&<span className="brand-word ikai-logo-type">ikai<span>.</span><b>one</b></span>}
 </Link>
}
