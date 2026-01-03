
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ICONS } from '../../constants';
import { db, auth, isFirebaseConfigured } from '../../firebase';
import { Admin } from '../../types';

export default function AdminSettings() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    // Determine current user role
    const fetchRole = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'admins', auth.currentUser.uid));
        if (snap.exists()) setCurrentUserRole(snap.data().role);
      }
    };
    fetchRole();

    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdmins(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Admin)));
    });

    return unsub;
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== 'super_admin') {
      alert("Only super admins can add new admins.");
      return;
    }
    if (!newAdminEmail || !newAdminUid) return;

    try {
      await setDoc(doc(db, 'admins', newAdminUid), {
        uid: newAdminUid,
        email: newAdminEmail,
        role: 'admin',
        createdAt: Date.now()
      });
      setNewAdminEmail('');
      setNewAdminUid('');
      setIsAdding(false);
      alert('Admin added successfully.');
    } catch (err) {
      alert('Error adding admin: ' + (err as Error).message);
    }
  };

  const handleRevoke = async (uid: string, role: string) => {
    if (role === 'super_admin') {
      alert("Cannot revoke super admin access.");
      return;
    }
    if (window.confirm("Revoke admin access? The user will still be able to sign in as a public user but lose dashboard access.")) {
      await deleteDoc(doc(db, 'admins', uid));
    }
  };

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your administrative team and account security.</p>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <ICONS.Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Team Management</h2>
              <p className="text-sm text-slate-500">Only Super Admins can manage this list.</p>
            </div>
          </div>
          {currentUserRole === 'super_admin' && (
            <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 transition-all">
              <ICONS.Plus className="w-4 h-4" />
              {isAdding ? 'Close' : 'Add Admin'}
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleAddAdmin} className="p-8 bg-slate-50 border-b border-slate-100 grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase">User UID</label>
               <input 
                type="text" value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} 
                placeholder="Paste UID from Firebase/Users" required 
                className="w-full px-4 py-2 border rounded-lg text-sm" 
               />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
               <input 
                type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} 
                placeholder="admin@example.com" required 
                className="w-full px-4 py-2 border rounded-lg text-sm" 
               />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm">Create Admin Document</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="font-bold text-slate-900">{admin.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">UID: {admin.uid}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {admin.role !== 'super_admin' && currentUserRole === 'super_admin' && (
                      <button onClick={() => handleRevoke(admin.uid, admin.role)} className="text-red-600 font-bold text-sm hover:underline">Revoke Access</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
