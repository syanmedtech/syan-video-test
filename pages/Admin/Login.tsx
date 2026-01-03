
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants';
import { authService, isFirebaseConfigured } from '../../firebase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await authService.login(email, password);
        localStorage.setItem('admin_auth', JSON.stringify({ uid: user.uid, email: user.email }));
        // Navigating to /admin which is the base dashboard path
        navigate('/admin');
      } else {
        await authService.signup(email, password);
        setError('Account created. Please sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-slate-900 text-white">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500 rounded-2xl mb-4 shadow-lg shadow-sky-500/30">
            <ICONS.Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">{isLogin ? 'Admin Portal' : 'Create Account'}</h1>
          <p className="text-slate-400 mt-2">Syan Secure Video Library</p>
        </div>

        <div className="p-8">
          {error && (
            <div className={`mb-6 p-4 text-sm rounded-lg border flex items-center gap-2 ${error.includes('created') ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              <span className={`w-2 h-2 rounded-full ${error.includes('created') ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              {error}
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
              
              <div className="flex flex-col gap-2 mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sky-600 text-sm font-semibold hover:text-sky-700"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-slate-400 text-sm font-semibold hover:text-slate-600"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center">Contact super admin for password recovery or use Firebase Console reset flow.</p>
              <button
                onClick={() => setShowReset(false)}
                className="w-full text-slate-600 text-sm font-semibold hover:text-slate-700"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
