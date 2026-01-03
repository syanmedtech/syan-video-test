
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { GlobalPlayerSettings } from '../../types';
import { isFirebaseConfigured } from '../../firebase';

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
    updatedBy: 'admin_123'
  } as any);

  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    // AUTO-INITIALIZATION: On Admin load, ensure appConfig/player exists.
    const saved = localStorage.getItem('global_player_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    } else {
      // First time initialization with defaults as required
      const defaults: GlobalPlayerSettings = {
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
      };
      setSettings(defaults);
      localStorage.setItem('global_player_settings', JSON.stringify(defaults));
    }
  }, []);

  const handleSave = async () => {
    if (!isFirebaseConfigured()) {
      alert("This action requires Firebase config and works on Vercel deployments.");
      return;
    }
    setIsLoading(true);
    // Simulation: Write to Firestore doc appConfig/player
    setTimeout(() => {
      localStorage.setItem('global_player_settings', JSON.stringify({
        ...settings,
        updatedAt: Date.now()
      }));
      setIsLoading(false);
      alert('Global Player Settings saved successfully.');
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'watermark' | 'logo') => {
    if (!isFirebaseConfigured()) {
      alert("File upload is disabled in Demo Mode.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const uuid = Math.random().toString(36).substr(2, 9);
        const extension = file.name.split('.').pop();
        
        if (type === 'watermark') {
          setWatermarkPreview(result);
          // Store uploaded watermark image path
          setSettings({ 
            ...settings, 
            watermarkAssetPath: `/globalPlayerAssets/watermarks/${uuid}.${extension}` 
          });
        } else {
          setLogoPreview(result);
          // Store uploaded logo image path
          setSettings({ 
            ...settings, 
            logoAssetPath: `/globalPlayerAssets/logos/${uuid}.${extension}` 
          });
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
          disabled={isLoading || !isFirebaseConfigured()}
          className={`px-8 py-3 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 ${
            isFirebaseConfigured() ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-400 text-white cursor-not-allowed'
          }`}
        >
          {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Save Changes
        </button>
      </div>

      {!isFirebaseConfigured() && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           <span className="font-bold">Demo Mode:</span> Configuration changes cannot be persisted to Firestore without environment variables.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Overlays Section */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h2 className="font-bold text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              Branding & Overlays
            </h2>

            {/* Watermark */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Universal Watermark</label>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative">
                  {watermarkPreview || settings.watermarkAssetPath ? (
                    <img src={watermarkPreview || 'https://via.placeholder.com/80'} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <ICONS.Plus className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input type="file" accept="image/*" className="hidden" id="watermark-up" onChange={(e) => handleFileUpload(e, 'watermark')} />
                  <label htmlFor="watermark-up" className={`inline-block px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                    isFirebaseConfigured() ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}>
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

            {/* Logo */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Global Logo</label>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                  {logoPreview || settings.logoAssetPath ? (
                    <img src={logoPreview || 'https://via.placeholder.com/80'} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <ICONS.Plus className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input type="file" accept="image/*" className="hidden" id="logo-up" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <label htmlFor="logo-up" className={`inline-block px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                    isFirebaseConfigured() ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}>
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

          {/* Security Overlay Section */}
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
            
            <p className="text-xs text-slate-500 leading-relaxed italic">Displays viewer's Name + CNIC at random positions to prevent piracy.</p>

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

        {/* Blocking Section */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h2 className="font-bold text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="12" x="3" y="6" rx="2" ry="2"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
              Enforcement & Blocking
            </h2>

            <div className="space-y-3">
              {[
                { key: 'blockSpeed', label: 'Block Video Speed', desc: 'Prevents speed adjustment; forces 1.0x' },
                { key: 'blockPause', label: 'Block Pause Button', desc: 'Automatically resumes if viewer tries to pause' },
                { key: 'blockForward10', label: 'Block 10-sec Forward', desc: 'Disables seeking forward in the timeline' }
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

          {/* Visual State Preview */}
          <section className="bg-slate-100 p-8 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
              <ICONS.Video className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700">Global Player Logic Active</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              These settings will override local video player settings and apply to all {settings.securityWatermarkEnabled ? 'active' : 'inactive'} viewers globally.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
