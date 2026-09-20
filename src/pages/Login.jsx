import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate();
  const [email,setEmail]=useState('admin@kukufarm.co.tz'); const [password,setPassword]=useState('password'); const [error,setError]=useState('');
  const submit=e=>{e.preventDefault(); const r=login(email,password); if(r.success) navigate('/'); else setError(r.message);};
  return <div className="login-page">
    <div className="login-visual"><div className="login-brand"><div className="brand-icon"><i className="bi bi-egg-fried"/></div><strong>KukuFarm</strong></div>
      <div className="login-hero"><span>SMART POULTRY FARMING</span><h1>Manage your farm.<br/><em>Grow your business.</em></h1><p>Track chickens, eggs, feed, health, sales and expenses from one simple platform.</p>
      <div className="login-features"><span><i className="bi bi-check-circle-fill"/> Real-time farm insights</span><span><i className="bi bi-check-circle-fill"/> Simple record keeping</span></div></div></div>
    <div className="login-form-wrap"><div className="login-form">
      <div className="mobile-login-logo"><div className="brand-icon"><i className="bi bi-egg-fried"/></div></div>
      <h2>Welcome back 👋</h2><p>Sign in to your KukuFarm account</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}><label>Email Address</label><div className="input-icon"><i className="bi bi-envelope"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
      <label>Password</label><div className="input-icon"><i className="bi bi-lock"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
      <div className="remember"><label><input type="checkbox"/> Remember me</label><a href="#forgot">Forgot password?</a></div>
      <button className="btn btn-success w-100 login-btn">Sign In <i className="bi bi-arrow-right"/></button></form>
      <small className="login-demo">Demo: any valid email + any password</small>
    </div></div>
  </div>;
}