
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ICONS } from '../../constants';

export default function AdminStats() {
  const { id } = useParams();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/videos" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics: FCPS Prep Strategy</h1>
          <p className="text-slate-500">Video ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Engagement Overview</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Avg. Watch Time</span>
                <span className="font-bold text-slate-900">24m 12s</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full">
                <div className="w-[65%] h-full bg-sky-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Completion Rate</span>
                <span className="font-bold text-slate-900">42%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full">
                <div className="w-[42%] h-full bg-green-500 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">UNIQUE VIEWERS</p>
                <p className="text-xl font-bold text-slate-900">850</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">TOTAL REPLAYS</p>
                <p className="text-xl font-bold text-slate-900">390</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Violation Trends (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[3, 8, 12, 5, 2, 1, 4].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className="bg-red-500/20 group-hover:bg-red-500 transition-all rounded-t-lg" 
                  style={{ height: `${(h / 15) * 100}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {h} violations
                </div>
                <div className="mt-4 text-[10px] font-bold text-slate-400 text-center uppercase">
                  Day {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
