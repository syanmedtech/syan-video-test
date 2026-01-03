
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { PREPARING_FOR_OPTIONS, STATUS_OPTIONS, ICONS } from '../../constants';
import { db, isFirebaseConfigured } from '../../firebase';
import { Video } from '../../types';

export default function PublicFormGate() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<Video | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    whatsapp: '',
    cnic: '',
    preparingFor: 'MBBS',
    preparingForOtherText: '',
    status: 'Student',
    classEnrolled: ''
  });

  useEffect(() => {
    const fetchVideo = async () => {
      if (!isFirebaseConfigured()) return;
      try {
        const q = query(collection(db, 'videos'), where('publicLink.token', '==', shareId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setVideoData({ id: snap.docs[0].id, ...snap.docs[0].data() } as Video);
        }
      } catch (e) {
        console.error("Error fetching video metadata:", e);
      }
    };
    fetchVideo();
  }, [shareId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isFirebaseConfigured()) {
      // Demo fallback
      setTimeout(() => {
        localStorage.setItem(`session_${shareId}`, JSON.stringify({ 
          userId: 'demo_user',
          videoId: videoData?.id || 'v1',
          createdAt: Date.now(),
          ...formData
        }));
        setIsLoading(false);
        navigate(`/watch/${shareId}/instructions`);
      }, 1000);
      return;
    }

    try {
      const emailLower = formData.email.toLowerCase().trim();
      const cleanCnic = formData.cnic.replace(/[^0-9X-]/gi, '');
      // Deterministic Viewer ID: simple concatenation for uniqueness
      const viewerId = `viewer_${btoa(emailLower + "|" + cleanCnic).replace(/=/g, '')}`;
      
      const viewerRef = doc(db, 'viewers', viewerId);
      const viewerSnap = await getDoc(viewerRef);

      if (viewerSnap.exists() && viewerSnap.data().isBanned) {
        setError("Access Denied: Your account has been banned from this library.");
        setIsLoading(false);
        return;
      }

      // 1. Create/Update Viewer Record
      const viewerPayload = {
        id: viewerId,
        name: formData.name,
        email: emailLower,
        emailLower: emailLower,
        whatsapp: formData.whatsapp,
        cnic: cleanCnic,
        university: formData.university,
        preparingFor: formData.preparingFor,
        preparingForOtherText: formData.preparingForOtherText,
        status: formData.status, // mapped to statusRole logic
        classEnrolled: formData.classEnrolled,
        banned: false,
        isBanned: false,
        createdAt: viewerSnap.exists() ? viewerSnap.data().createdAt : serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        lastActiveAt: Date.now()
      };

      await setDoc(viewerRef, viewerPayload, { merge: true });

      // 2. Create Watch Session
      if (videoData) {
        const sessionId = `sess_${viewerId}_${videoData.id}_${Date.now()}`;
        const sessionRef = doc(db, 'accessSessions', sessionId);
        
        await setDoc(sessionRef, {
          id: sessionId,
          videoId: videoData.id,
          videoTitle: videoData.title,
          userId: viewerId,
          emailLower: emailLower,
          startedAt: serverTimestamp(),
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000, // 24h default
          violationsCount: 0,
          status: 'active',
          deviceInfo: navigator.userAgent,
          userAgent: navigator.userAgent,
          lastSeenAt: Date.now()
        });

        // Store local session info for player routing
        localStorage.setItem(`session_${shareId}`, JSON.stringify({ 
          userId: viewerId,
          videoId: videoData.id,
          sessionId: sessionId,
          email: emailLower,
          name: formData.name,
          cnic: cleanCnic
        }));
      }

      setIsLoading(false);
      navigate(`/watch/${shareId}/instructions`);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError("Failed to register session. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500 text-white rounded-2xl mb-4 shadow-xl">
            <ICONS.Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Syan Secure Access</h1>
          <p className="text-slate-500 mt-2">
            {videoData ? `Viewing: ${videoData.title}` : 'Please complete the registration to watch the video content.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">University</label>
                  <input
                    required
                    type="text"
                    value={formData.university}
                    onChange={e => setFormData({...formData, university: e.target.value})}
                    placeholder="KEMU, AMC, etc."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">WhatsApp Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="03XXXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">CNIC Number</label>
                  <input
                    required
                    type="text"
                    maxLength={15}
                    value={formData.cnic}
                    onChange={e => setFormData({...formData, cnic: e.target.value})}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Preparing For</label>
                  <select
                    value={formData.preparingFor}
                    onChange={e => setFormData({...formData, preparingFor: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {PREPARING_FOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.preparingFor === 'OTHER' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Specify Target Exam</label>
                    <input
                      required
                      type="text"
                      value={formData.preparingForOtherText}
                      onChange={e => setFormData({...formData, preparingForOtherText: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Professional Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Class Enrolled</label>
                  <input
                    required
                    type="text"
                    value={formData.classEnrolled}
                    onChange={e => setFormData({...formData, classEnrolled: e.target.value})}
                    placeholder="e.g. Session 2024"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering Session...
                    </>
                  ) : 'Proceed to Instructions'}
                </button>
                <p className="text-xs text-slate-400 mt-4 text-center">
                  By proceeding, you agree to our anti-piracy policies and tracking terms.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
