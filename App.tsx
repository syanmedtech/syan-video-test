
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { ICONS } from './constants';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import VideoLibrary from './pages/Admin/VideoLibrary';
import UploadWizard from './pages/Admin/UploadWizard';
import AdminStats from './pages/Admin/Stats';
import UserManagement from './pages/Admin/UserManagement';
import UserDetail from './pages/Admin/UserDetail';
import VideoViewers from './pages/Admin/VideoViewers';
import AdminSettings from './pages/Admin/Settings';
import PlayerSettingsPage from './pages/Admin/PlayerSettings';
import PublicFormGate from './pages/Public/FormGate';
import PublicInstructions from './pages/Public/Instructions';
import PublicPlayer from './pages/Public/Player';

// Simulated Auth Guard
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    setIsAuthenticated(!!auth);
  }, []);

  if (isAuthenticated === null) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  
  return <>{children}</>;
};

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>, path: '/admin' },
    { label: 'Videos', icon: <ICONS.Video className="w-5 h-5" />, path: '/admin/videos' },
    { label: 'Users', icon: <ICONS.Users className="w-5 h-5" />, path: '/admin/users' },
    { label: 'Player Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8Z"/></svg>, path: '/admin/player-settings' },
    { label: 'Settings', icon: <ICONS.Settings className="w-5 h-5" />, path: '/admin/settings' },
  ];

  const isExactAdmin = location.pathname === '/admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ICONS.Shield className="text-sky-400" />
            SYAN SECURE
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Video Library Admin</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === '/admin' 
              ? isExactAdmin 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      
      {/* Videos Section */}
      <Route path="/admin/videos" element={<ProtectedRoute><AdminLayout><VideoLibrary /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/videos/new" element={<ProtectedRoute><AdminLayout><UploadWizard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/videos/:id/edit" element={<ProtectedRoute><AdminLayout><UploadWizard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/videos/:id/stats" element={<ProtectedRoute><AdminLayout><AdminStats /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/videos/:videoId/users" element={<ProtectedRoute><AdminLayout><VideoViewers /></AdminLayout></ProtectedRoute>} />

      {/* Users Section */}
      <Route path="/admin/users" element={<ProtectedRoute><AdminLayout><UserManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users/:userId" element={<ProtectedRoute><AdminLayout><UserDetail /></AdminLayout></ProtectedRoute>} />

      <Route path="/admin/player-settings" element={<ProtectedRoute><AdminLayout><PlayerSettingsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

      {/* Public Routes */}
      <Route path="/watch/:shareId" element={<PublicFormGate />} />
      <Route path="/watch/:shareId/instructions" element={<PublicInstructions />} />
      <Route path="/watch/:shareId/player" element={<PublicPlayer />} />

      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
