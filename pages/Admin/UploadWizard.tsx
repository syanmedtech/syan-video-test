
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ICONS, BROWSER_OPTIONS } from '../../constants';
import { VideoSourceType, SourceMeta } from '../../types';
import { isFirebaseConfigured } from '../../firebase';

// Mock/Concept for Firebase usage in UI
const subscribeToImportJob = (jobId: string, callback: (job: any) => void) => {
  const interval = setInterval(() => {
    const job = JSON.parse(localStorage.getItem(`import_job_${jobId}`) || '{}');
    if (job.status === 'done' || job.status === 'error') clearInterval(interval);
    callback(job);
  }, 1000);
  return () => clearInterval(interval);
};

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

type Tab = 'info' | 'security' | 'availability';

export default function UploadWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  
  // Google Drive State
  const [sourceType, setSourceType] = useState<VideoSourceType>('direct_upload');
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authorName: '',
    tags: '',
    status: 'draft',
    security: {
      blockRecording: true,
      blockScreenshot: true,
      blockRightClick: true,
      blockDevTools: true,
      violationLimit: 4,
      allowedBrowsers: ['Chrome', 'Edge', 'Safari'],
      focusMode: true,
      blockDownloading: true,
      blockScreenCapturing: true,
      requireFullscreen: true
    },
    availability: {
      availableDurationType: '24h',
      availableDurationSeconds: 86400,
      linkMode: 'from_first_access'
    }
  });

  // Google Drive Integration
  const handleConnectDrive = () => {
    if (!isFirebaseConfigured()) {
      alert("This action requires Firebase config and works on Vercel deployments.");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: any) => {
        if (response.access_token) {
          setDriveToken(response.access_token);
          openPicker(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  const openPicker = (token: string) => {
    window.gapi.load('picker', () => {
      const view = new window.google.picker.VideoSearchView();
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey((import.meta as any).env?.VITE_GOOGLE_API_KEY || 'YOUR_API_KEY')
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            setSelectedDriveFile(doc);
          }
        })
        .build();
      picker.setVisible(true);
    });
  };

  const startDriveImport = async () => {
    if (!selectedDriveFile || !driveToken) return;
    
    // Simulate Function Call and Job Tracking
    const jobId = 'job_' + Math.random().toString(36).substr(2, 9);
    setImportJobId(jobId);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      const jobData = {
        status: progress >= 100 ? 'done' : 'running',
        progress: Math.min(progress, 100),
        bytesTransferred: (selectedDriveFile.sizeBytes || 0) * (progress / 100),
        totalBytes: selectedDriveFile.sizeBytes || 0,
        updatedAt: Date.now()
      };
      localStorage.setItem(`import_job_${jobId}`, JSON.stringify(jobData));
      if (progress >= 100) clearInterval(interval);
    }, 1000);
  };

  useEffect(() => {
    if (importJobId) {
      const unsub = subscribeToImportJob(importJobId, (job) => {
        setImportProgress(job);
        if (job.status === 'done') {
          setFormData(prev => ({ ...prev, status: 'active' }));
        }
      });
      return unsub;
    }
  }, [importJobId]);

  const toggleSecurity = (key: keyof typeof formData.security) => {
    setFormData(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key]
      }
    }));
  };

  const handleSave = () => {
    if (!isFirebaseConfigured()) {
      alert("Action restricted: This action requires Firebase config and works on Vercel deployments.");
      return;
    }
    console.log('Saving video...', formData);
    alert('Video settings saved successfully!');
    navigate('/admin/videos');
  };

  const TabButton = ({ id, label }: { id: Tab, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
        activeTab === id 
          ? 'border-sky-500 text-sky-600 bg-sky-50/50' 
          : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {id ? 'Edit Video Settings' : 'Upload New Video'}
          </h1>
          <p className="text-slate-500">Configure how your content is delivered and secured.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/admin/videos')}
            className="px-6 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!isFirebaseConfigured()}
            className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-all ${
              isFirebaseConfigured() ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20' : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {id ? 'Update Video' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {!isFirebaseConfigured() && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           <span className="font-bold">Notice:</span> Saving and uploading is disabled in Demo Mode. Connect Firebase to enable full functionality.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-slate-200">
          <TabButton id="info" label="1. Info" />
          <TabButton id="security" label="2. Security" />
          <TabButton id="availability" label="3. Availability" />
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Source Selector */}
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit mb-6">
                <button 
                  onClick={() => setSourceType('direct_upload')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sourceType === 'direct_upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Direct Upload
                </button>
                <button 
                  onClick={() => setSourceType('google_drive')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sourceType === 'google_drive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Import from Drive
                </button>
              </div>

              {!id && sourceType === 'direct_upload' && (
                <div 
                  onClick={() => !isFirebaseConfigured() && alert("File selection is disabled in Demo Mode.")}
                  className={`p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center transition-all group ${isFirebaseConfigured() ? 'hover:border-sky-500 cursor-pointer' : 'cursor-not-allowed bg-slate-50 opacity-60'}`}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-50 text-sky-600 rounded-full group-hover:bg-sky-100 group-hover:scale-110 transition-all mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900">Choose Video File</h3>
                  <p className="text-sm text-slate-500 mt-1">MP4, MOV or MKV (Max 2GB). Will be automatically encrypted.</p>
                  <input type="file" className="hidden" disabled={!isFirebaseConfigured()} />
                </div>
              )}

              {sourceType === 'google_drive' && (
                <div className="space-y-4">
                  {!selectedDriveFile ? (
                    <button
                      onClick={handleConnectDrive}
                      className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-sky-500 transition-all flex flex-col items-center justify-center gap-3 bg-slate-50/50"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2"><path d="M9 12h6m-3-3v6m-9-3c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z"/></svg>
                      </div>
                      <span className="font-bold text-slate-900">Connect & Select from Google Drive</span>
                      <span className="text-xs text-slate-500">Securely copy video content to your library</span>
                    </button>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-sky-600">
                             <ICONS.Video className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="font-bold text-slate-900">{selectedDriveFile.name}</div>
                             <div className="text-xs text-slate-500">{(selectedDriveFile.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {selectedDriveFile.mimeType}</div>
                          </div>
                        </div>
                        <button onClick={() => setSelectedDriveFile(null)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">Change File</button>
                      </div>

                      {!importJobId ? (
                        <button
                          onClick={startDriveImport}
                          className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/20"
                        >
                          Start Server Import
                        </button>
                      ) : (
                        <div className="space-y-3">
                           <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {importProgress?.status === 'done' ? 'Import Complete' : 'Importing Content...'}
                              </span>
                              <span className="text-sm font-bold text-sky-600">{importProgress?.progress || 0}%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-sky-500 transition-all duration-300" 
                                style={{ width: `${importProgress?.progress || 0}%` }}
                              />
                           </div>
                           <div className="text-[10px] text-slate-400 font-mono">
                             {importProgress?.bytesTransferred ? (importProgress.bytesTransferred / (1024*1024)).toFixed(1) : 0} MB / {(importProgress?.totalBytes / (1024*1024)).toFixed(1)} MB
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Video Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. USMLE Step 1 Cardiology Masterclass"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide context for the viewers..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={e => setFormData({...formData, authorName: e.target.value})}
                    placeholder="Dr. John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tags / Category</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="pathology, usmle, medical"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { key: 'blockRecording', label: 'Block Video Recording', desc: 'Prevents screen recording software' },
                  { key: 'blockScreenshot', label: 'Block Screenshots', desc: 'Detects PrintScreen and blurs view' },
                  { key: 'blockRightClick', label: 'Disable Right Click', desc: 'Prevents context menu actions' },
                  { key: 'blockDevTools', label: 'Block DevTools', desc: 'Auto-pause if inspector is opened' },
                  { key: 'focusMode', label: 'Enable Focus Mode', desc: 'Pause if tab switch or minimized' },
                  { key: 'blockDownloading', label: 'Disable Downloads', desc: 'Strict URL masking & stream segments' },
                  { key: 'requireFullscreen', label: 'Require Fullscreen', desc: 'Must be in fullscreen to play' },
                  { key: 'blockScreenCapturing', label: 'Anti-Screen Sharing', desc: 'Detects visibility changes' }
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleSecurity(item.key as any)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        formData.security[item.key as keyof typeof formData.security] ? 'bg-sky-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.security[item.key as keyof typeof formData.security] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Violation Limit</label>
                  <p className="text-xs text-slate-500 mb-2">Max allowed violations before access is revoked.</p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.security.violationLimit}
                    onChange={e => setFormData({
                      ...formData,
                      security: { ...formData.security, violationLimit: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Allowed Browsers</label>
                  <p className="text-xs text-slate-500 mb-2">Multi-select browsers permitted for viewing.</p>
                  <div className="flex flex-wrap gap-2">
                    {BROWSER_OPTIONS.map(browser => (
                      <button
                        key={browser}
                        onClick={() => {
                          const current = formData.security.allowedBrowsers;
                          const next = current.includes(browser) 
                            ? current.filter(b => b !== browser)
                            : [...current, browser];
                          setFormData({
                            ...formData,
                            security: { ...formData.security, allowedBrowsers: next }
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          formData.security.allowedBrowsers.includes(browser)
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {browser}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Availability Window</label>
                  <p className="text-xs text-slate-500 mb-2">How long is the link valid after access?</p>
                  <select
                    value={formData.availability.availableDurationType}
                    onChange={e => setFormData({
                      ...formData,
                      availability: { ...formData.availability, availableDurationType: e.target.value as any }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="12h">12 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="2d">2 Days</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Activation Trigger</label>
                  <p className="text-xs text-slate-500 mb-2">When does the clock start ticking?</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormData({...formData, availability: {...formData.availability, linkMode: 'from_first_access'}})}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        formData.availability.linkMode === 'from_first_access'
                          ? 'bg-sky-50 border-sky-200 text-sky-700'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      On First Access
                    </button>
                    <button
                      onClick={() => setFormData({...formData, availability: {...formData.availability, linkMode: 'from_generation'}})}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        formData.availability.linkMode === 'from_generation'
                          ? 'bg-sky-50 border-sky-200 text-sky-700'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      On Link Creation
                    </button>
                  </div>
                </div>
              </div>

              {id && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900">Active Public Link</div>
                    <button className="text-sky-600 text-sm font-bold hover:underline">Rotate / Reset Link</button>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-3 rounded-xl">
                    <div className="flex-1 truncate text-slate-600 text-sm font-mono">
                      https://syan-secure.app/#/watch/9j2kf-secret-xyz123
                    </div>
                    <button className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Sharing this link allows anyone with the secret to view after registration.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
