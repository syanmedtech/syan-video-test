
import React, { useState } from 'react';
import { ICONS } from '../../constants';

export default function AdminSettings() {
  const [admins] = useState([
    { uid: '1', email: 'syanmedtechadmen@gmail.com', role: 'super_admin', date: '2024-01-01' },
    { uid: '2', email: 'support@syan.com', role: 'admin', date: '2024-03-15' },
  ]);

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your administrative team and account security.</p>
      </div>

      {/* Account Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security Credentials</h2>
              <p className="text-sm text-slate-500">Update your login password regularly.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
          </div>
          <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Update Password</button>
        </div>
      </section>

      {/* Admin Management Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <ICONS.Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Team Management</h2>
              <p className="text-sm text-slate-500">Invite and manage other administrators.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700">
            <ICONS.Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
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
                    <div className="text-[10px] text-slate-400">Added on {admin.date}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {admin.role !== 'super_admin' && (
                      <button className="text-red-600 font-bold text-sm hover:underline">Revoke Access</button>
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
