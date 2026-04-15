import { useState } from 'react';
import { supabase } from '../supabase';
import './Auth.css';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Validate employee code length explicitly since it acts as password
    if (employeeCode.length < 6) {
      setError("Employee Code must be exactly 6 numbers.");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: employeeCode });
      if (error) setError(error.message);
    } else {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password: employeeCode,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            dob: dob,
            employee_code: employeeCode
          }
        }
      });
      
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        // Automatically logged in by Supabase (email confirmation disabled)
        setSuccessMsg('Account created! Logging you in...');
      } else {
        // Reaches here if email confirmation is enabled, or if user already exists
        setSuccessMsg('Account created! Please check your email to verify your account before logging in.');
        setIsLogin(true);
      }
    }

    setLoading(false);
  };

  // const handleGoogleSignIn = async () => {
  //   const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  //   if (error) setError(error.message);
  // };

  return (
    <div className="auth-container">
      <div className="auth-panel glass-panel">
        <h1 className="logo-text text-center mb-6">ShiftLog</h1>
        <h2 className="text-center mb-4">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-error" style={{background: 'rgba(51, 204, 51, 0.1)', color: '#33cc33', borderColor: '#33cc33'}}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="input-group mt-4">
                <label>First Name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="input-group mt-4">
                <label>Last Name</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="input-group mt-4">
                <label>Date of Birth</label>
                <input type="date" required value={dob} onChange={e => setDob(e.target.value)} />
              </div>
            </>
          )}

          <div className="input-group mt-4">
            <label>Email</label>
            <input 
              type="email" 
              required
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group mt-4">
            <label>Employee Code (6 digits)</label>
            <input 
              type="password" 
              required
              placeholder="••••••"
              maxLength={6}
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-6 w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-divider" style={{ textAlign: 'center', margin: '1.5rem 0', position: 'relative' }}>
           <span style={{ background: 'var(--color-surface)', padding: '0 10px', position: 'relative', zIndex: 1, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>OR</span>
           <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--color-outline-variant)' }}></div>
        </div>

        <button 
          className="btn-export w-full" 
          disabled
          style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google (Disabled)
        </button>

        <div className="auth-switch text-center mt-6">
          <span className="text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <br/>
          <button 
            className="btn-text highlight mt-2"
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
