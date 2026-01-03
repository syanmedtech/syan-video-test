
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ICONS } from '../../constants';
import { PublicUser } from '../../types';

export default function VideoViewers() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock Video Viewers
  const [viewers, setViewers] = useState<(PublicUser & { watchTime: string, sessions: number, lastWatch: number, videoViolations: number })[]>([]);

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setViewers([
        {
          id: 'u_123',
          name: 'Ali Ahmed',
          email: 'ali@example.com',
          emailLower: 'ali@example.com',
          university: 'KEMU',
          whatsapp: '03001234567',
          cnic: '35201-1234567-1',
          preparingFor: 'MBBS',
          status: 'Student',
          classEnrolled: 'Final Year',
          banned: false,
          createdAt: Date.now() - 86400000 * 30,
          lastActiveAt: Date.now() - 120000,
          watchTime: '45m 20s',
          sessions: 4,
          lastWatch: Date.now() - 120000,
          videoViolations: 2
        },
        {
          id: 'u_124',
          name: 'Sara Khan',
          email: 'sara@med.edu',
          emailLower: 'sara@med.edu',
          university: 'AMC',
          whatsapp: '03217654321',
          cnic: '35201-7654321-2',
          preparingFor: 'FCPS',
          status: 'HO',
          classEnrolled: '2023 Batch',
          banned: true,
          createdAt: Date.now() - 86400000 * 15,
          lastActiveAt: Date.now() - 3600000 * 24 * 3,
          watchTime: '12m 05s',
          sessions: 1,
          lastWatch: Date.now() - 86400000 * 3,
          videoViolations: 4
        }
      ]);
      setIsLoading(false);
    }, 600);
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Loading Audience Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Link 
          to="/admin/videos"
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Video Audience</h1>
          <p className="text-slate-500 mt-1">Audit list of viewers for: <span className="text-sky-600 font-bold">FCPS Part 1 Preparation Strategy</span></p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewer</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNIC (Identity)</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Watch Performance</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Violations</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div 
                      className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer" 
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-mono text-slate-700">{user.cnic}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{user.watchTime}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Total Time</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{user.sessions}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Sessions</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                         user.videoViolations > 2 ? 'bg-red-100 text-red-600' : 
                         user.videoViolations > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                       }`}>
                         {user.videoViolations} violations
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => navigate(`/admin/users/${user.id}?videoId=${videoId}`)}
                      className="text-sky-600 font-bold text-sm hover:underline"
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
