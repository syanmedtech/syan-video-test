
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS, PREPARING_FOR_OPTIONS, STATUS_OPTIONS } from '../../constants';
import { PublicUser } from '../../types';

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBanned, setFilterBanned] = useState<'all' | 'banned' | 'active'>('all');
  const [filterPreparing, setFilterPreparing] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock users for the dashboard
  const [users, setUsers] = useState<PublicUser[]>([
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
      totalViolations: 0
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
      totalViolations: 4
    },
    {
      id: 'u_125',
      name: 'Omar Ali',
      email: 'omar@hospital.pk',
      emailLower: 'omar@hospital.pk',
      university: 'DMC',
      whatsapp: '03459876543',
      cnic: '35201-9876543-3',
      preparingFor: 'USMLE',
      status: 'PG',
      classEnrolled: 'Step 2 Prep',
      banned: false,
      createdAt: Date.now() - 86400000 * 10,
      lastActiveAt: Date.now() - 7200000,
      totalViolations: 1
    }
  ]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.cnic.includes(searchTerm) ||
                         u.whatsapp.includes(searchTerm);
    
    const matchesBanned = filterBanned === 'all' || 
                          (filterBanned === 'banned' && u.banned) || 
                          (filterBanned === 'active' && !u.banned);
    
    const matchesPreparing = filterPreparing === 'all' || u.preparingFor === filterPreparing;

    return matchesSearch && matchesBanned && matchesPreparing;
  });

  const handleBanToggle = (userId: string, currentStatus: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'Unban' : 'Ban'} this user?`)) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
    }
  };

  const handleExport = () => {
    alert("Exporting viewers data to CSV...");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Viewers Management</h1>
          <p className="text-slate-500">Monitor users who have accessed your secure links.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            Export CSV
          </button>
          <button 
            onClick={() => setFilterBanned('banned')}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
          >
            View Ban List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-bold text-slate-500 uppercase">Search Viewers</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, Email, CNIC or WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>
        <div className="space-y-2 w-full md:w-48">
          <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
          <select 
            value={filterBanned}
            onChange={(e) => setFilterBanned(e.target.value as any)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
        <div className="space-y-2 w-full md:w-48">
          <label className="text-xs font-bold text-slate-500 uppercase">Preparing For</label>
          <select 
            value={filterPreparing}
            onChange={(e) => setFilterPreparing(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Exams</option>
            {PREPARING_FOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Viewers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewer</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Education / Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Security</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-semibold text-slate-700">{user.university}</div>
                    <div className="text-xs text-slate-400">{user.status}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-medium text-slate-600 font-mono tracking-tight">{user.whatsapp}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{user.cnic}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        (user.totalViolations || 0) === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {user.totalViolations || 0} Violations
                      </span>
                      {user.banned && (
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button 
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="text-sky-600 font-bold text-sm hover:underline"
                      >
                        View History
                      </button>
                      <button 
                        onClick={() => handleBanToggle(user.id, user.banned)}
                        className={`${user.banned ? 'text-green-600' : 'text-red-600'} font-bold text-sm hover:underline`}
                      >
                        {user.banned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center p-6 bg-slate-100 rounded-3xl mb-4 text-slate-300">
              <ICONS.Users className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No matching viewers found</h3>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
