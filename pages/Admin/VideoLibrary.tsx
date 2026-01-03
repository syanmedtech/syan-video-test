
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ICONS, COLORS } from '../../constants';

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Simulated data
  const [videos] = useState([
    {
      id: 'v1',
      title: 'FCPS Part 1 Preparation Strategy',
      author: 'Dr. Ahmad Khan',
      date: '2024-05-15',
      status: 'active',
      views: 1240,
      uniqueWatchers: 850,
      violations: 12
    },
    {
      id: 'v2',
      title: 'Advanced Cardiology Masterclass',
      author: 'Dr. Sarah Wilson',
      date: '2024-05-10',
      status: 'active',
      views: 450,
      uniqueWatchers: 320,
      violations: 2
    },
    {
      id: 'v3',
      title: 'USMLE Step 1 - Pathology Tips',
      author: 'Dr. Omar Ali',
      date: '2024-05-01',
      status: 'draft',
      views: 0,
      uniqueWatchers: 0,
      violations: 0
    }
  ]);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Library</h1>
          <p className="text-slate-500">Manage your secure video content and monitor access.</p>
        </div>
        <Link
          to="/admin/videos/new"
          className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95"
        >
          <ICONS.Plus className="w-5 h-5" />
          Upload New Video
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        <select className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500">
          <option>All Status</option>
          <option>Active</option>
          <option>Draft</option>
          <option>Deleted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Video</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Author</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Audience</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Stats</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">
                        <ICONS.Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{video.title}</div>
                        <div className="text-xs text-slate-500">ID: {video.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{video.author}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => navigate(`/admin/videos/${video.id}/users`)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
                    >
                      View Users
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      video.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-bold text-slate-900">{video.views}</span> views
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-bold text-red-600">{video.violations}</span> violations
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/videos/${video.id}/stats`)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        title="Engagement Analytics"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/videos/${video.id}/edit`)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        title="Edit Settings"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredVideos.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No videos found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
