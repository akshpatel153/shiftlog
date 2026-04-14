import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import './Auth.css'; // Reuse auth styles

export function Onboarding() {
  const { user } = useAuth();
  
  // They probably signed in with Google, we might have their name already.
  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const nameParts = initialName.split(' ');
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [dob, setDob] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate employee code length
    if (employeeCode.length < 6) {
      setError("Employee Code must be exactly 6 numbers.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        dob: dob,
        employee_code: employeeCode,
        onboarding_complete: true
      }
    });

    if (error) {
      setError(error.message);
    } else {
      // Force a reload to trigger the App router to re-evaluate the session metadata
      window.location.reload();
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-panel glass-panel">
        <h1 className="logo-text text-center mb-2">Welcome!</h1>
        <h2 className="text-center mb-6" style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>Let's complete your profile</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>First Name</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label>Last Name</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          
          <div className="input-group mt-4">
            <label>Date of Birth</label>
            <input type="date" required value={dob} onChange={e => setDob(e.target.value)} />
          </div>

          <div className="input-group mt-4">
            <label>Set Employee Code (6 digits)</label>
            <input 
              type="password" 
              required
              placeholder="••••••"
              maxLength={6}
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
            />
            <small className="text-muted text-xs mt-1 block">This will be used as your password for future logins.</small>
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-6 w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
