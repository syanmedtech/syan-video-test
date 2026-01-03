
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, uploadBytesResumable, getMetadata } from 'firebase/storage';
import { doc, collection, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ICONS, BROWSER_OPTIONS } from '../../constants';
import { VideoSourceType } from '../../types';
import { isFirebaseConfigured, db, storage, auth } from '../../firebase';

type Tab = 'info' | 'security' | 'availability';

export default function UploadWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video Document ID (Generated on load or first upload)
  const [videoId] = useState(() => id || doc(collection(db, 'videos')).id);

  // Upload State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadBytes, setUploadBytes] = useState({ transferred: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);

  // Wizard Content State
  const [sourceType, setSourceType] = useState<VideoSourceType>('direct_upload');
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [publicLink, setPublicLink] = useState<{ token: string; createdAt: number; revoked: boolean } | null>(null);

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

  // Load existing video data if editing
  useEffect(() => {
    if (id && isFirebaseConfigured()) {
      const fetchVideo = async () => {
        const docSnap = await getDoc(doc(db, 'videos', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            description: data.description || '',
            authorName: data.authorName || '',
            tags: data.tags?.join(', ') || '',
            status: data.status || 'draft',
            security: data.securitySettings || formData.security,
            availability: data.availabilitySettings || formData.availability
          });
          if (data.publicLink) setPublicLink(data.publicLink);
          if (data.storagePath) setStoragePath(data.storagePath);
        }
      };
      fetchVideo();
    }
  }, [id]);

  const startUpload = (file: File) => {
    if (!isFirebaseConfigured()) return;
    
    setIsUploading(true);
    setUploadError(null);
    const path = `videos/${videoId}/source/${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        setUploadBytes({ transferred: snapshot.bytesTransferred, total: snapshot.totalBytes });
      },
      (error) => {
        setIsUploading(false);
        setUploadError(error.message);
        console.error("Upload failed:", error);
      },
      async () => {
        setStoragePath(path);
        setIsUploading(false);
        setUploadProgress(100);
        // Sync metadata check
        try {
          await getMetadata(storageRef);
        } catch (e) {
          console.warn("Metadata check failed, but upload succeeded.");
        }
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLocalFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.split('.').slice(0, -1).join('.') }));
      }
      startUpload(file);
    }
  };

  const handleCreateLink = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setPublicLink({
      token,
      createdAt: Date.now(),
      revoked: false
    });
  };

  const handleRevokeLink = () => {
    if (publicLink) {
      setPublicLink({ ...publicLink, revoked: true });
    }
  };

  const handleCopyLink = () => {
    if (publicLink) {
      const url = `${window.location.origin}/#/watch/${publicLink.token}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const toggleSecurity = (key: keyof typeof formData.security) => {
    setFormData(prev => ({
      ...prev,
      security: { ...prev.security, [key]: !prev.security[key] }
    }));
  };

  const handleSave = async () => {
    if (!isFirebaseConfigured()) {
      alert("Demo Mode: Cannot save to cloud.");
      return;
    }

    if (!formData.title) return alert("Title is required.");
    if (!storagePath && !id) return alert("Please upload a video file first.");

    try {
      const videoRef = doc(db, 'videos', videoId);
      const videoData = {
        id: videoId,
        title: formData.title,
        description: formData.description,
        authorName: formData.authorName,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'active',
        storagePath: storagePath,
        updatedAt: serverTimestamp(),
        createdAt: id ? undefined : serverTimestamp(),
        securitySettings: formData.security,
        availabilitySettings: formData.availability,
        publicLink: publicLink,
        sourceMeta: selectedLocalFile ? {
          originalName: selectedLocalFile.name,
          sizeBytes: selectedLocalFile.size,
          mimeType: selectedLocalFile.type,
          uploadedAt: Date.now()
        } : undefined
      };

      // Clean undefined for Firestore
      Object.keys(videoData).forEach(key => (videoData as any)[key] === undefined && delete (videoData as any)[key]);

      await setDoc(videoRef, videoData, { merge: true });
      navigate('/admin/videos');
    } catch (err) {
      alert("Error saving video: " + (err as Error).message);
    }
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
          <button onClick={() => navigate('/admin/videos')} className="px-6 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={isUploading || (!storagePath && !id)}
            className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-all ${
              !isUploading && (storagePath || id) ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20' : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {id ? 'Update Changes' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          <TabButton id="info" label="1. Info" />
          <TabButton id="security" label="2. Security" />
          <TabButton id="availability" label="3. Availability" />
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit mb-6">
                <button onClick={() => setSourceType('direct_upload')} className={`px-4 py-2 rounded-lg text-sm font-bold ${sourceType === 'direct_upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Direct Upload</button>
                <button onClick={() => setSourceType('google_drive')} className={`px-4 py-2 rounded-lg text-sm font-bold ${sourceType === 'google_drive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Import from Drive</button>
              </div>

              {sourceType === 'direct_upload' && (
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all ${isUploading ? 'border-sky-300 bg-sky-50/20 cursor-wait' : 'border-slate-200 hover:border-sky-500 cursor-pointer'}`}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-50 text-sky-600 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  
                  {isUploading ? (
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="flex justify-between text-xs font-bold text-sky-600 uppercase tracking-widest">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress || 0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">{(uploadBytes.transferred / 1024 / 1024).toFixed(1)}MB of {(uploadBytes.total / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                  ) : storagePath ? (
                    <div className="space-y-2">
                       <h3 className="font-bold text-green-600 flex items-center justify-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                         File Uploaded Successfully
                       </h3>
                       <p className="text-xs text-slate-500">Click to change video file</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-slate-900">Choose Video File</h3>
                      <p className="text-sm text-slate-500 mt-1">MP4, MOV, MKV or WebM (Max 2GB)</p>
                      {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="video/*,.mp4,.mov,.mkv,.webm" onChange={handleFileChange} />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Video Title *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. USMLE Step 1 Cardiology Masterclass" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide context for the viewers..." className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Author Name</label>
                  <input type="text" value={formData.authorName} onChange={e => setFormData({...formData, authorName: e.target.value})} placeholder="Dr. John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tags / Category</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="pathology, usmle, medical" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
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
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.security[item.key as keyof typeof formData.security] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-8">
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Public Link Management</h3>
                      <p className="text-sm text-slate-500">Generate a secure shareable link for this video.</p>
                    </div>
                    {!publicLink || publicLink.revoked ? (
                      <button 
                        onClick={handleCreateLink}
                        className="px-6 py-2 bg-sky-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 hover:bg-sky-700 transition-all"
                      >
                        Create Link
                      </button>
                    ) : (
                      <button 
                        onClick={handleRevokeLink}
                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                      >
                        Revoke Access
                      </button>
                    )}
                 </div>

                 {publicLink && !publicLink.revoked && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                         <div className="flex-1 font-mono text-xs text-slate-600 truncate">
                            {`${window.location.origin}/#/watch/${publicLink.token}`}
                         </div>
                         <button 
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                         >
                           Copy Link
                         </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-[0.2em]">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active & Secure
                      </div>
                    </div>
                 )}

                 {publicLink?.revoked && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
                     This link was revoked. Click "Create Link" to generate a new unique access token.
                   </div>
                 )}
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Availability Window</label>
                  <select
                    value={formData.availability.availableDurationType}
                    onChange={e => setFormData({ ...formData, availability: { ...formData.availability, availableDurationType: e.target.value as any }})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="12h">12 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="2d">2 Days</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Activation Trigger</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormData({...formData, availability: {...formData.availability, linkMode: 'from_first_access'}})}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        formData.availability.linkMode === 'from_first_access' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      On First Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
