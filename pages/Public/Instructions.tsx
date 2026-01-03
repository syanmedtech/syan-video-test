
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ICONS } from '../../constants';
import { db, isFirebaseConfigured } from '../../firebase';
import { Video } from '../../types';

export default function PublicInstructions() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [showFsModal, setShowFsModal] = useState(false);
  const [videoData, setVideoData] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!isFirebaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'videos'), where('publicLink.token', '==', shareId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError("Invalid or expired link.");
        } else {
          const doc = querySnapshot.docs[0];
          const data = doc.data() as Video;
          if (data.publicLink?.revoked) {
            setError("This link has been revoked by the administrator.");
          } else {
            setVideoData({ ...data, id: doc.id });
          }
        }
      } catch (err) {
        setError("Failed to verify access.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [shareId]);

  const handleStartRequest = () => {
    const session = localStorage.getItem(`session_${shareId}`);
    if (!session) {
      navigate(`/watch/${shareId}`);
      return;
    }
    setShowFsModal(true);
  };

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      navigate(`/watch/${shareId}/player`);
    } catch (err) {
      alert("Fullscreen is required to view this content. Please enable it in your browser settings.");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <ICONS.Shield className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold">{error}</h1>
        <p className="text-slate-400">Please contact the administrator for support.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400">
              <ICONS.Video className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{videoData?.title}</h1>
              <p className="text-slate-400">By {videoData?.authorName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-sky-400 uppercase tracking-widest">Security Instructions</h2>
            <div className="grid gap-3">
              {[
                "Strict Fullscreen requirement - Exiting will trigger a violation.",
                "No Screenshots or Screen Recording allowed.",
                "Focus Mode active - Do not switch tabs or minimize window.",
                `Violation Limit: ${videoData?.securitySettings?.violationLimit || 4} - permanent revocation on breach.`,
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
              onClick={handleStartRequest}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 14 9-14 9V3z"/></svg>
              Start Video
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              Access is monitored. By clicking "Start Video", you agree to strict security enforcement.
            </p>
          </div>
        </div>
      </div>

      {showFsModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <ICONS.Shield className="w-12 h-12 text-sky-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Enter Full Screen</h2>
              <p className="text-slate-400 text-sm mt-2">To ensure content security, this video must be viewed in fullscreen mode.</p>
            </div>
            <div className="grid gap-3">
              <button 
                onClick={handleEnterFullscreen}
                className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
              >
                Enter Full Screen
              </button>
              <button 
                onClick={() => setShowFsModal(false)}
                className="w-full bg-transparent text-slate-400 py-3 rounded-xl font-bold hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
