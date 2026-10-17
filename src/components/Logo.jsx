import { Link } from 'react-router-dom'

export default function Logo({compact=false,light=false,className='',animated=false}) {
 return <Link to="/" className={['brand','ikai-logo','ikai-logo-link',className,animated?'ikai-logo-animated':''].filter(Boolean).join(' ')} aria-label="Go to IKAI One homepage" title="Home">
  <span className={'brand-symbol ikai-logo-mark'+(light?' logo-light':'')}>
   <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    <g className="ikai-logo-bars">
     <rect className="ikai-logo-bar-left" x="8" y="5.5" width="10" height="4.5" rx="1.1" fill="currentColor"/>
     <rect className="ikai-logo-bar-right" x="22" y="5.5" width="10" height="4.5" rx="1.1" fill="currentColor"/>
     <rect className="ikai-logo-bar-left" x="8" y="13.5" width="10" height="4.5" rx="1.1" fill="currentColor"/>
     <rect className="ikai-logo-bar-right" x="22" y="13.5" width="10" height="4.5" rx="1.1" fill="currentColor"/>
    </g>
    <path className="ikai-logo-arrow" d="M8 26L20 14L32 26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 34H32" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
   </svg>
  </span>
  {!compact&&<span className="brand-word ikai-logo-type">ikai<span>.</span><b>one</b></span>}
 </Link>
}
