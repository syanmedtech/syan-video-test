
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ICONS, STATUS_OPTIONS, PREPARING_FOR_OPTIONS } from '../../constants';
import { PublicUser, Violation, UserVideoActivity, AccessSession, ViolationType } from '../../types';

type Tab = 'profile' | 'activity' | 'violations';

export default function UserDetail() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile');
  
  // States
  const [user, setUser] = useState<PublicUser | null>(null);
  const [activities, setActivities] = useState<UserVideoActivity[]>([]);
  const [sessions, setSessions] = useState<AccessSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setUser({
        id: userId!,
        name: 'Ali Ahmed',
        email: 'ali@example.com',
        emailLower: 'ali@example.com',
        university: 'King Edward Medical University',
        whatsapp: '03001234567',
        cnic: '35201-1234567-1',
        preparingFor: 'MBBS',
        status: 'Student',
        classEnrolled: 'Final Year Batch 2024',
        banned: false,
        createdAt: Date.now() - 86400000 * 30,
        lastActiveAt: Date.now() - 3600000
      });

      setActivities([
        {
          videoId: 'v1',
          videoTitle: 'FCPS Part 1 Preparation Strategy',
          totalWatchTimeSec: 1200,
          sessionsCount: 3,
          lastSeenAt: Date.now() - 120000,
          completionRate: 85
        },
        {
          videoId: 'v2',
          videoTitle: 'Advanced Cardiology Masterclass',
          totalWatchTimeSec: 450,
          sessionsCount: 1,
          lastSeenAt: Date.now() - 86400000,
          completionRate: 20
        }
      ]);

      setSessions([
        {
          id: 's_999',
          videoId: 'v1',
          userId: userId!,
          emailLower: 'ali@example.com',
          createdAt: Date.now() - 3600000,
          expiresAt: Date.now() + 82800000,
          violationsCount: 2,
          status: 'active',
          deviceInfo: 'Desktop Windows 11',
          ipHash: '8f7a6b...',
          userAgent: 'Mozilla/5.0...',
          lastTokenIssuedAt: Date.now() - 600000,
          lastSeenAt: Date.now() - 60000
        }
      ]);

      setViolations([
        {
          id: 'viol_1',
          userId: userId!,
          emailLower: 'ali@example.com',
          videoId: 'v1',
          videoTitle: 'FCPS Part 1 Preparation Strategy',
          sessionId: 's_999',
          violationType: ViolationType.EXIT_FULLSCREEN,
          timestamp: Date.now() - 1800000,
          severity: 'low',
          resolved: false,
          metadata: {
            userAgent: 'Mozilla/5.0...',
            ipHash: '8f7a6b...',
            page: '/watch/v1/player'
          }
        },
        {
          id: 'viol_2',
          userId: userId!,
          emailLower: 'ali@example.com',
          videoId: 'v1',
          videoTitle: 'FCPS Part 1 Preparation Strategy',
          sessionId: 's_999',
          violationType: ViolationType.FOCUS_LOST,
          timestamp: Date.now() - 1200000,
          severity: 'medium',
          resolved: true,
          metadata: {
            userAgent: 'Mozilla/5.0...',
            ipHash: '8f7a6b...',
            page: '/watch/v1/player'
          }
        }
      ]);

      setIsLoading(false);
    }, 800);
  }, [userId]);

  const handleBanToggle = () => {
    if (!user) return;
    if (window.confirm(`Are you sure you want to ${user.banned ? 'Unban' : 'Ban'} this user?`)) {
      setUser({ ...user, banned: !user.banned });
    }
  };

  const handleResolveViolation = (violationId: string) => {
    setViolations(prev => prev.map(v => v.id === violationId ? { ...v, resolved: true } : v));
  };

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Fetching User Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                user.banned ? 'bg-slate-900 text-white' : 'bg-green-100 text-green-700'
              }`}>
                {user.banned ? 'Banned' : 'Active Account'}
              </span>
            </div>
            <p className="text-slate-500 mt-1">{user.email} • Registered {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleBanToggle}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              user.banned 
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'
            }`}
          >
            {user.banned ? 'Unban User' : 'Ban User Account'}
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Watch Time</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900">
              {Math.floor(activities.reduce((acc, curr) => acc + curr.totalWatchTimeSec, 0) / 60)}m
            </p>
            <p className="text-sm font-medium text-slate-500">Across {activities.length} videos</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security Health</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${violations.length > 3 ? 'text-red-600' : 'text-green-600'}`}>
              {violations.length}
            </p>
            <p className="text-sm font-medium text-slate-500">Total Violations ({violations.filter(v => !v.resolved).length} Unresolved)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Interaction</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{new Date(user.lastActiveAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="flex border-b border-slate-100 px-8">
          {[
            { id: 'profile', label: 'Detailed Profile' },
            { id: 'activity', label: 'Watch Activity' },
            { id: 'violations', label: 'Security Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-8 py-5 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-12">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                  <p className="text-lg font-bold text-slate-900">{user.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-lg font-bold text-slate-900">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University / Institution</p>
                  <p className="text-lg font-bold text-slate-900">{user.university}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Number</p>
                  <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{user.whatsapp}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNIC (Identity)</p>
                  <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{user.cnic}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Exam (Preparing For)</p>
                  <p className="text-lg font-bold text-slate-900">
                    {user.preparingFor} {user.preparingForOtherText && `(${user.preparingForOtherText})`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Status</p>
                  <p className="text-lg font-bold text-slate-900">{user.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrolled Class / Batch</p>
                  <p className="text-lg font-bold text-slate-900">{user.classEnrolled}</p>
                </div>
              </section>

              <div className="pt-12 border-t border-slate-100 grid md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                     Account Metadata
                   </h3>
                   <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Internal ID</span>
                        <span className="text-slate-900 font-mono text-xs">{user.id}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Created At</span>
                        <span className="text-slate-900">{new Date(user.createdAt).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Banned Status</span>
                        <span className={user.banned ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                          {user.banned ? 'Restricted' : 'Active'}
                        </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-12">
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Video Breakdown</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video Title</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Watch Time</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessions</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activities.map(act => (
                        <tr key={act.videoId} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setActiveTab('violations')}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-all">{act.videoTitle}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">ID: {act.videoId}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {Math.floor(act.totalWatchTimeSec / 60)}m {act.totalWatchTimeSec % 60}s
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                              {act.sessionsCount} sessions
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                  className={`h-full transition-all ${act.completionRate > 80 ? 'bg-green-500' : 'bg-sky-500'}`} 
                                  style={{ width: `${act.completionRate}%` }} 
                                 />
                               </div>
                               <span className="text-xs font-bold text-slate-700">{act.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-400">
                            {new Date(act.lastSeenAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Sessions</h3>
                <div className="grid gap-4">
                  {sessions.map(sess => (
                    <div key={sess.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl text-sky-500 shadow-sm border border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 3v4"/><path d="M17 3v4"/></svg>
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">Session {sess.id}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                sess.status === 'active' ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'
                              }`}>
                                {sess.status}
                              </span>
                           </div>
                           <p className="text-xs text-slate-500 mt-1">{sess.deviceInfo} • {sess.userAgent.slice(0, 40)}...</p>
                           <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <span>Started: {new Date(sess.createdAt).toLocaleString()}</span>
                             <span className="text-red-500">{sess.violationsCount} Violations Logged</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-all">Revoke Session</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <h3 className="text-lg font-bold text-slate-900">Security Audit Log</h3>
                 <div className="flex gap-2">
                    <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500">
                       <option>All Videos</option>
                       {activities.map(a => <option key={a.videoId}>{a.videoTitle}</option>)}
                    </select>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all">Clear Logs</button>
                 </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video Context</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Violation Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Severity</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {violations.map(viol => (
                      <tr key={viol.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {new Date(viol.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-900">{viol.videoTitle}</div>
                          <div className="text-[10px] text-slate-400">Session: {viol.sessionId}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase tracking-wider">
                             {viol.violationType.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`w-2 h-2 rounded-full inline-block ${
                             viol.severity === 'high' ? 'bg-red-500' : 
                             viol.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                           }`} title={viol.severity} />
                        </td>
                        <td className="px-6 py-4 text-center">
                           {viol.resolved ? (
                             <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Resolved</span>
                           ) : (
                             <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Pending</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!viol.resolved && (
                            <button 
                              onClick={() => handleResolveViolation(viol.id)}
                              className="text-sky-600 font-bold text-[10px] uppercase hover:underline"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button 
                             onClick={() => alert(JSON.stringify(viol.metadata, null, 2))}
                             className="ml-3 text-slate-400 hover:text-slate-900"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
