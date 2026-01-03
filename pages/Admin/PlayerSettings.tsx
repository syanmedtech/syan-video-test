
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ICONS } from '../../constants';
import { GlobalPlayerSettings } from '../../types';
import { isFirebaseConfigured, db, auth } from '../../firebase';

export default function PlayerSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<GlobalPlayerSettings>({
    watermarkAssetPath: null,
    watermarkOpacity: 0.25,
    logoAssetPath: null,
    logoOpacity: 0.6,
    securityWatermarkEnabled: true,
    blinkDurationMs: 2000,
    blinkIntervalSeconds: 5,
    blockSpeed: false,
    blockPause: false,
    blockForward10: false,
    updatedAt: Date.now(),
    updatedBy: 'system'
  });

  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [showBlink, setShowBlink] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });

  // Fetch from Firestore or fallback
  useEffect(() => {
    const fetchSettings = async () => {
      if (isFirebaseConfigured()) {
        try {
          const docRef = doc(db, 'globalPlayerSettings', 'active');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSettings(docSnap.data() as GlobalPlayerSettings);
            return;
          }
        } catch (e) {
          console.error("Error fetching settings:", e);
        }
      }
      // Fallback to local storage
      const saved = localStorage.getItem('global_player_settings');
      if (saved) setSettings(JSON.parse(saved));
    };

    fetchSettings();
  }, []);

  // Blink logic for preview
  useEffect(() => {
    if (!settings.securityWatermarkEnabled) {
      setShowBlink(false);
      return;
    }
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.random() * 70 + 10 + '%',
        left: Math.random() * 60 + 10 + '%'
      });
      setShowBlink(true);
      setTimeout(() => setShowBlink(false), settings.blinkDurationMs);
    }, settings.blinkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [settings.securityWatermarkEnabled, settings.blinkDurationMs, settings.blinkIntervalSeconds]);

  // Preview Player Logic - Block events live
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    const handleSpeed = () => {
      if (settings.blockSpeed && video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    };
    
    const handlePause = (e: Event) => {
      if (settings.blockPause) {
        video.play().catch(() => {});
      }
    };

    const handleSeek = (e: any) => {
      if (settings.blockForward10) {
        const delta = video.currentTime - (video as any).lastTime;
        if (delta > 1) { // Simple check for jumps
           video.currentTime = (video as any).lastTime;
        }
      }
      (video as any).lastTime = video.currentTime;
    };

    video.addEventListener('ratechange', handleSpeed);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleSeek);

    return () => {
      video.removeEventListener('ratechange', handleSpeed);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleSeek);
    };
  }, [settings.blockSpeed, settings.blockPause, settings.blockForward10]);

  const handleSave = async () => {
    setIsLoading(true);
    const updated = {
      ...settings,
      updatedAt: Date.now(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'globalPlayerSettings', 'active'), updated, { merge: true });
      } catch (e) {
        alert("Firestore error, saving locally instead.");
      }
    }
    
    localStorage.setItem('global_player_settings', JSON.stringify(updated));
    setIsLoading(false);
    alert('Settings saved successfully.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'watermark' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'watermark') {
          setWatermarkPreview(result);
          setSettings(s => ({ ...s, watermarkAssetPath: result })); // Simplified for preview
        } else {
          setLogoPreview(result);
          setSettings(s => ({ ...s, logoAssetPath: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Global Player Settings</h1>
          <p className="text-slate-500">Universal configuration applied to all videos in the library.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-8 py-3 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 active:scale-95 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50`}
        >
          {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Save Changes
        </button>
      </div>

      {!isFirebaseConfigured() && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           <span className="font-bold">Demo Mode:</span> Changes saved locally only.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h2 className="font-bold text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              Branding & Overlays
            </h2>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Universal Watermark</label>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative">
                  {(watermarkPreview || settings.watermarkAssetPath) ? (
                    <img src={watermarkPreview || settings.watermarkAssetPath || ''} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <ICONS.Plus className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input type="file" accept="image/*" className="hidden" id="watermark-up" onChange={(e) => handleFileUpload(e, 'watermark')} />
                  <label htmlFor="watermark-up" className="inline-block px-4 py-2 border rounded-xl text-xs font-bold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer transition-all">
                    Choose Image
                  </label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Opacity</span>
                      <span>{Math.round(settings.watermarkOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={settings.watermarkOpacity} 
                      onChange={(e) => setSettings({ ...settings, watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Global Logo</label>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                  {(logoPreview || settings.logoAssetPath) ? (
                    <img src={logoPreview || settings.logoAssetPath || ''} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <ICONS.Plus className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input type="file" accept="image/*" className="hidden" id="logo-up" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <label htmlFor="logo-up" className="inline-block px-4 py-2 border rounded-xl text-xs font-bold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer transition-all">
                    Choose Logo
                  </label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Opacity</span>
                      <span>{Math.round(settings.logoOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={settings.logoOpacity} 
                      onChange={(e) => setSettings({ ...settings, logoOpacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-3">
                <ICONS.Shield className="w-5 h-5 text-sky-500" />
                Security Watermark
              </h2>
              <button
                onClick={() => setSettings({ ...settings, securityWatermarkEnabled: !settings.securityWatermarkEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.securityWatermarkEnabled ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.securityWatermarkEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blink Duration (ms)</label>
                <input 
                  type="number" 
                  value={settings.blinkDurationMs} 
                  onChange={(e) => setSettings({ ...settings, blinkDurationMs: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blink Interval (sec)</label>
                <input 
                  type="number" 
                  value={settings.blinkIntervalSeconds} 
                  onChange={(e) => setSettings({ ...settings, blinkIntervalSeconds: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900" 
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h2 className="font-bold text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="12" x="3" y="6" rx="2" ry="2"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
              Enforcement & Blocking
            </h2>

            <div className="space-y-3">
              {[
                { key: 'blockSpeed', label: 'Block Video Speed', desc: 'Forces 1.0x playback speed' },
                { key: 'blockPause', label: 'Block Pause Button', desc: 'Resumes automatically if paused' },
                { key: 'blockForward10', label: 'Block 10-sec Forward', desc: 'Disables jumping forward' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all group">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-slate-950">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof GlobalPlayerSettings] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      settings[item.key as keyof GlobalPlayerSettings] ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key as keyof GlobalPlayerSettings] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="text-white font-bold text-sm flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 Live Compliance Preview
               </h3>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Enforcement</span>
            </div>
            
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden group">
               <video 
                ref={previewVideoRef}
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                className="w-full h-full object-cover opacity-60"
                muted
                autoPlay
                loop
               />
               
               {/* Global Logo Overlay */}
               {settings.logoAssetPath && (
                  <img 
                    src={settings.logoAssetPath} 
                    className="absolute top-4 right-4 w-12 h-auto pointer-events-none transition-opacity"
                    style={{ opacity: settings.logoOpacity }}
                  />
               )}

               {/* Watermark Overlay */}
               {settings.watermarkAssetPath && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                     <img 
                      src={settings.watermarkAssetPath} 
                      className="w-1/2 h-auto rotate-12 transition-opacity"
                      style={{ opacity: settings.watermarkOpacity }}
                     />
                  </div>
               )}

               {/* Blink Watermark */}
               {showBlink && (
                  <div 
                    className="absolute z-50 bg-black/40 backdrop-blur-sm border border-white/10 text-white/40 font-bold text-[8px] px-2 py-1 rounded transition-all duration-300"
                    style={{ top: watermarkPos.top, left: watermarkPos.left }}
                  >
                    ADMIN_PREVIEW | 00000-0000000-0
                  </div>
               )}

               <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest">Test controls here</p>
               </div>
            </div>
            
            <div className="mt-4 flex gap-2">
               <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Speed Lock</p>
                  <p className={`text-xs font-bold mt-1 ${settings.blockSpeed ? 'text-green-500' : 'text-slate-400'}`}>
                    {settings.blockSpeed ? 'LOCKED 1X' : 'UNLOCKED'}
                  </p>
               </div>
               <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Pause Lock</p>
                  <p className={`text-xs font-bold mt-1 ${settings.blockPause ? 'text-green-500' : 'text-slate-400'}`}>
                    {settings.blockPause ? 'ALWAYS PLAY' : 'NORMAL'}
                  </p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
