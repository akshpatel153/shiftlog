import { useState } from 'react';
import { supabase } from '../supabase';
import './Auth.css';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (!isLogin) {
      // In Supabase, if email confirmations are enabled, they have to click a link.
      // If not, they are logged in automatically. Assuming auto-login for MVP simplicity:
      alert('Account created! You are now logged in.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-panel glass-panel">
        <h1 className="logo-text text-center mb-6">ShiftLog</h1>
        <h2 className="text-center mb-4">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
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
            <label>Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
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

        <div className="auth-switch text-center mt-4">
          <span className="text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <br/>
          <button 
            className="btn-text highlight"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
