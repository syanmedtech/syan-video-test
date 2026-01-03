
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS, COLORS } from '../../constants';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('syanmedtechadmen@gmail.com');
  const [password, setPassword] = useState('Admin@1234');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // In a real app, use Firebase Auth: signInWithEmailAndPassword(auth, email, password)
      if (email === 'syanmedtechadmen@gmail.com' && password === 'Admin@1234') {
        localStorage.setItem('admin_auth', JSON.stringify({ email, role: 'super_admin' }));
        navigate('/admin/videos');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password reset link sent to ' + email);
    setShowReset(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-slate-900 text-white">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500 rounded-2xl mb-4 shadow-lg shadow-sky-500/30">
            <ICONS.Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-slate-400 mt-2">Syan Secure Video Library</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="admin@syan.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="w-full text-sky-600 text-sm font-semibold hover:text-sky-700 mt-4"
              >
                Forgot your password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email for Recovery</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="your-email@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-lg"
              >
                Send Recovery Email
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-slate-600 text-sm font-semibold hover:text-slate-700 mt-4"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
