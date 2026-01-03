
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ICONS } from '../../constants';

export default function PublicInstructions() {
  const { shareId } = useParams();
  const navigate = useNavigate();

  const handlePlay = () => {
    const confirmed = window.confirm("You must enter Fullscreen mode to watch this video. Proceed?");
    if (confirmed) {
      navigate(`/watch/${shareId}/player`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400">
              <ICONS.Video className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FCPS Part 1 Preparation Strategy</h1>
              <p className="text-slate-400">Duration: 45:20 | Access expires in 23h 55m</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-sky-400 uppercase tracking-widest">Security Instructions</h2>
            <div className="grid gap-3">
              {[
                "Strict Fullscreen requirement - Exiting will trigger a violation.",
                "No Screenshots or Screen Recording allowed.",
                "Focus Mode active - Do not switch tabs or minimize window.",
                "4 Violation Limit - Exceeding will revoke your access permanently.",
                "Dynamic Watermarking (Name + CNIC) will be displayed randomly."
              ].map((text, i) => (
                <div key={i} className="flex gap-3 items-start text-slate-300">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700">
            <button
              onClick={handlePlay}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 14 9-14 9V3z"/></svg>
              Start Video
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              By clicking "Start Video", your browser will request Fullscreen access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
