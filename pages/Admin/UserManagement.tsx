
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ICONS, PREPARING_FOR_OPTIONS } from '../../constants';
import { db, isFirebaseConfigured } from '../../firebase';
import { PublicUser } from '../../types';

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBanned, setFilterBanned] = useState<'all' | 'banned' | 'active'>('all');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicUser)));
      setIsLoading(false);
    });

    return unsub;
  }, []);

  const filteredUsers = users.filter(u => {
    const searchStr = `${u.name} ${u.email} ${u.cnic}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesBanned = filterBanned === 'all' || (filterBanned === 'banned' ? u.banned : !u.banned);
    return matchesSearch && matchesBanned;
  });

  const handleBanToggle = async (userId: string, currentStatus: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'Unban' : 'Ban'} this user?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), { banned: !currentStatus });
      } catch (e) {
        alert("Failed to update status. Check permissions.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Viewers Management</h1>
          <p className="text-slate-500">Monitor users who have registered to your library.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search Name, Email or CNIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <div className="absolute left-3.5 top-3 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        <select 
          value={filterBanned}
          onChange={(e) => setFilterBanned(e.target.value as any)}
          className="px-4 py-2.5 border border-slate-300 rounded-xl"
        >
          <option value="all">All Viewers</option>
          <option value="active">Active Only</option>
          <option value="banned">Banned Only</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewer</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Security</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={3} className="p-24 text-center text-slate-400">Loading viewers...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {user.banned && <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Banned</span>}
                    {!user.banned && <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => navigate(`/admin/users/${user.id}`)} className="text-sky-600 font-bold text-sm hover:underline">Profile</button>
                      <button onClick={() => handleBanToggle(user.id, !!user.banned)} className={`${user.banned ? 'text-green-600' : 'text-red-600'} font-bold text-sm hover:underline`}>
                        {user.banned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
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
