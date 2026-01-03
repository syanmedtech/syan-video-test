
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { ICONS } from '../../constants';
import { db, isFirebaseConfigured } from '../../firebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    activeViewers: 0,
    recentViolations: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // Real-time stats listener
    const unsubVideos = onSnapshot(collection(db, 'videos'), (snap) => {
      setStats(prev => ({ ...prev, totalVideos: snap.size }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, activeViewers: snap.size }));
    });

    const unsubViolations = onSnapshot(query(collection(db, 'violations'), orderBy('timestamp', 'desc'), limit(5)), (snap) => {
      setStats(prev => ({ ...prev, recentViolations: snap.size }));
      const logs = snap.docs.map(doc => ({
        id: doc.id,
        user: doc.data().emailLower,
        video: doc.data().videoTitle,
        event: `Violation: ${doc.data().violationType.replace('_', ' ')}`,
        time: new Date(doc.data().timestamp).toLocaleTimeString()
      }));
      setRecentLogs(logs);
      setIsLoading(false);
    });

    return () => {
      unsubVideos();
      unsubUsers();
      unsubViolations();
    };
  }, []);

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading metrics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time overview of your secure video infrastructure.</p>
        </div>
        <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border border-slate-200">
          Environment: {!isFirebaseConfigured() ? 'Demo Mode' : (window.location.hostname === 'localhost' ? 'Local Development' : 'Production')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Videos', value: stats.totalVideos, color: 'bg-blue-500', icon: <ICONS.Video className="w-6 h-6" /> },
          { label: 'Total Views', value: stats.totalViews, color: 'bg-green-500', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> },
          { label: 'Registered Users', value: stats.activeViewers, color: 'bg-purple-500', icon: <ICONS.Users className="w-6 h-6" /> },
          { label: 'Total Violations', value: stats.recentViolations, color: 'bg-red-500', icon: <ICONS.Shield className="w-6 h-6" /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`${item.color} p-3 rounded-xl text-white shadow-lg`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900">{item.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900">Security Audit Logs</h2>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${log.event.includes('Violation') ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.user}</p>
                    <p className="text-xs text-slate-500">{log.event} on <span className="font-medium text-slate-700">{log.video}</span></p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.time}</span>
              </div>
            )) : <div className="p-8 text-center text-slate-400">No recent security events.</div>}
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
               <ICONS.Shield className="text-sky-400 w-5 h-5" />
               Security Matrix
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm text-slate-400">Database Connection</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isFirebaseConfigured() ? 'text-green-400' : 'text-amber-400'}`}>
                  {isFirebaseConfigured() ? 'Active' : 'Demo Link'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm text-slate-400">Stream Protection</span>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Encrypted</span>
              </div>
            </div>
          </div>
          <ICONS.Shield className="absolute -bottom-20 -right-20 w-64 h-64 text-white/5 rotate-12 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
