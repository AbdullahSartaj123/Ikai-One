import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, Mail, Phone, ReceiptText, Store } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
const businessTypes = ['E-commerce / Online store','Retail & wholesale','Marketplace seller','Manufacturer / Brand','Courier / Logistics','Other']
export default function Signup() {
  const [form,setForm]=useState({companyName:'',email:'',phone:'',gstNumber:'',businessType:businessTypes[0]})
  const [error,setError]=useState('')
  const {beginSignup}=useAuth(),navigate=useNavigate()
  function update(field,value){setForm(current=>({...current,[field]:value}));setError('')}
  function submit(event){
    event.preventDefault()
    if(!/^\S+@\S+\.\S+$/.test(form.email)){setError('Enter a valid email address.');return}
    if(form.phone.replace(/\D/g,'').length<10){setError('Enter a valid phone number with at least 10 digits.');return}
    beginSignup({...form,email:form.email.trim().toLowerCase(),contactName:form.companyName.trim()})
    navigate('/verify-otp')
  }
  return <div className="auth-simple-page">
    <header className="auth-simple-header"><Link to="/"><Logo/></Link><span>Already have an account? <Link to="/login">Sign in</Link></span></header>
    <main className="auth-card signup-card"><div className="auth-card-icon"><Store size={22}/></div><span className="auth-form-eyebrow">GET STARTED WITH IKAI ONE</span><h1>Create your shipper account</h1><p className="auth-subtitle">Tell us about your business. You can complete the setup in a few steps.</p>
      <form className="auth-form signup-form" onSubmit={submit}>
        <label htmlFor="company-name">COMPANY / STORE NAME</label><div className="auth-input"><Building2 size={17}/><input id="company-name" required maxLength={100} value={form.companyName} onChange={e=>update('companyName',e.target.value)} placeholder="e.g. Northstar Commerce"/></div>
        <div className="auth-field-grid"><div><label htmlFor="signup-email">BUSINESS EMAIL</label><div className="auth-input"><Mail size={17}/><input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={e=>update('email',e.target.value)} placeholder="you@company.com"/></div></div><div><label htmlFor="signup-phone">PHONE NUMBER</label><div className="auth-input"><Phone size={17}/><input id="signup-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="+92 300 1234567"/></div></div></div>
        <label htmlFor="gst-number">GST / TAX REGISTRATION NUMBER <span className="optional-label">OPTIONAL</span></label><div className="auth-input"><ReceiptText size={17}/><input id="gst-number" value={form.gstNumber} onChange={e=>update('gstNumber',e.target.value)} placeholder="Enter tax registration number"/></div>
        <label htmlFor="business-type">BUSINESS TYPE</label><div className="auth-input auth-select-wrap"><Store size={17}/><select id="business-type" value={form.businessType} onChange={e=>update('businessType',e.target.value)}>{businessTypes.map(type=><option key={type}>{type}</option>)}</select></div>
        {error&&<p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" type="submit">Continue to verification <ArrowRight size={17}/></button><p className="auth-terms">By continuing, you agree to the demo terms and privacy notice.</p>
      </form><div className="auth-demo-note"><CheckCircle2 size={16}/><span>This prototype stores demo details in your browser only. No real account is created.</span></div>
    </main>
  </div>
}
