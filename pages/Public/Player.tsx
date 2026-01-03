
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ViolationType, GlobalPlayerSettings, Violation, Video, AccessSession } from '../../types';
import { db, storage, isFirebaseConfigured } from '../../firebase';

export default function PublicPlayer() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // States
  const [videoData, setVideoData] = useState<Video | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalPlayerSettings | null>(null);
  const [sessionDoc, setSessionDoc] = useState<AccessSession | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevoked, setIsRevoked] = useState(false);

  // UI States
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });
  const [showSecurityWatermark, setShowSecurityWatermark] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [brightness, setBrightness] = useState(100);

  // Enforcement tracking
  const lastAllowedTimeRef = useRef(0);
  const sessionDataRef = useRef<any>(null);

  const localReg = JSON.parse(localStorage.getItem(`session_${shareId}`) || '{}');

  // Prevent page scrolling during player view
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Load Data
  useEffect(() => {
    const init = async () => {
      if (!isFirebaseConfigured()) {
        setError("Firebase not configured.");
        setIsLoading(false);
        return;
      }

      if (!localReg.email) {
        navigate(`/watch/${shareId}`);
        return;
      }

      try {
        // 1. Fetch Global Settings
        const globalRef = doc(db, 'appConfig', 'player');
        const globalSnap = await getDoc(globalRef);
        if (globalSnap.exists()) {
          setGlobalSettings(globalSnap.data() as GlobalPlayerSettings);
        }

        // 2. Fetch Video by token
        const q = query(collection(db, 'videos'), where('publicLink.token', '==', shareId));
        const videoSnap = await getDocs(q);
        if (videoSnap.empty) {
          setError("Video not found or link expired.");
          setIsLoading(false);
          return;
        }
        
        const vidDoc = videoSnap.docs[0];
        const vidData = vidDoc.data() as Video;
        setVideoData({ ...vidData, id: vidDoc.id });

        if (vidData.publicLink?.revoked) {
          setIsRevoked(true);
          setIsLoading(false);
          return;
        }

        // 3. Setup/Resume Session
        const sessionId = `sess_${localReg.userId}_${vidDoc.id}`;
        const sessionRef = doc(db, 'accessSessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        let currentSess: any;
        if (!sessionSnap.exists()) {
          currentSess = {
            id: sessionId,
            videoId: vidDoc.id,
            userId: localReg.userId,
            emailLower: localReg.email.toLowerCase(),
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000, // Default 24h
            violationsCount: 0,
            status: 'active',
            deviceInfo: navigator.userAgent,
            userAgent: navigator.userAgent,
            lastSeenAt: Date.now()
          };
          await setDoc(sessionRef, currentSess);
        } else {
          currentSess = sessionSnap.data();
          if (currentSess.status === 'revoked') {
            setIsRevoked(true);
            setIsLoading(false);
            return;
          }
        }
        setSessionDoc(currentSess);
        setViolations(currentSess.violationsCount || 0);
        sessionDataRef.current = currentSess;

        // 4. Get Storage URL
        if (vidData.storagePath) {
          const sRef = ref(storage, vidData.storagePath);
          const url = await getDownloadURL(sRef);
          setVideoUrl(url);
        } else {
          setError("Video file path missing.");
        }

      } catch (err: any) {
        setError(err.message || "Initialization failed.");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [shareId]);

  const logViolation = useCallback(async (type: ViolationType) => {
    if (!videoData || !sessionDoc || isRevoked) return;
    
    console.warn(`Violation: ${type}`);
    const nextViolations = violations + 1;
    const limit = videoData.securitySettings?.violationLimit || 4;
    
    setViolations(nextViolations);
    
    try {
      // 1. Log individual violation record
      const violRef = doc(collection(db, 'violations'));
      await setDoc(violRef, {
        id: violRef.id,
        userId: sessionDoc.userId,
        emailLower: sessionDoc.emailLower,
        videoId: videoData.id,
        videoTitle: videoData.title,
        sessionId: sessionDoc.id,
        violationType: type,
        timestamp: Date.now(),
        severity: 'medium',
        resolved: false,
        metadata: {
          userAgent: navigator.userAgent,
          page: window.location.pathname,
          browser: navigator.vendor
        }
      });

      // 2. Update Session
      const sessionRef = doc(db, 'accessSessions', sessionDoc.id);
      const updates: any = { 
        violationsCount: nextViolations, 
        lastSeenAt: Date.now() 
      };

      if (nextViolations >= limit) {
        updates.status = 'revoked';
        setIsRevoked(true);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        videoRef.current?.pause();
      }

      await updateDoc(sessionRef, updates);
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
  }, [videoData, sessionDoc, violations, isRevoked]);

  // Enforcement Listeners
  useEffect(() => {
    if (!videoData || isRevoked || isLoading) return;

    // 1. Fullscreen monitoring
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && !isRevoked) {
        logViolation(ViolationType.EXIT_FULLSCREEN);
        videoRef.current?.pause();
      }
    };

    // 2. Focus/Visibility monitoring
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && videoData.securitySettings?.focusMode) {
        logViolation(ViolationType.FOCUS_LOST);
        videoRef.current?.pause();
      }
    };

    // 3. Right Click
    const onContextMenu = (e: MouseEvent) => {
      if (videoData.securitySettings?.blockRightClick) {
        e.preventDefault();
        logViolation(ViolationType.RIGHT_CLICK);
      }
    };

    // 4. Keyboard Shortcuts (DevTools, Screen Recording shortcuts)
    const onKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        if (videoData.securitySettings?.blockDevTools) {
          e.preventDefault();
          logViolation(ViolationType.DEVTOOLS_DETECTED);
        }
      }
      // PrintScreen
      if (e.key === 'PrintScreen') {
        if (videoData.securitySettings?.blockScreenshot) {
          logViolation(ViolationType.SCREENSHOT_ATTEMPT);
        }
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [videoData, isRevoked, isLoading, logViolation]);

  // Security Blinking Logic
  useEffect(() => {
    if (!globalSettings?.securityWatermarkEnabled || isRevoked) return;
    const interval = setInterval(() => {
      setShowSecurityWatermark(true);
      setWatermarkPos({
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 70 + 10 + '%'
      });
      setTimeout(() => setShowSecurityWatermark(false), globalSettings.blinkDurationMs);
    }, globalSettings.blinkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [globalSettings, isRevoked]);

  // Video Control Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (globalSettings?.blockForward10) {
        if (time - lastAllowedTimeRef.current > 2.0) {
          videoRef.current.currentTime = lastAllowedTimeRef.current;
          logViolation(ViolationType.FORWARD10_ATTEMPT);
          return;
        }
      }
      setCurrentTime(time);
      lastAllowedTimeRef.current = time;
    }
  };

  const handlePauseEvent = () => {
    if (globalSettings?.blockPause && videoRef.current && !isRevoked) {
      videoRef.current.play().catch(() => {});
      setIsPaused(false);
      logViolation(ViolationType.PAUSE_ATTEMPT);
    } else {
      setIsPaused(true);
    }
  };

  const togglePlay = () => {
    if (isRevoked || !videoRef.current) return;
    if (isPaused) {
      if (!document.fullscreenElement) {
        playerContainerRef.current?.requestFullscreen();
      }
      videoRef.current.play();
    } else {
      if (globalSettings?.blockPause) {
        logViolation(ViolationType.PAUSE_ATTEMPT);
        return;
      }
      videoRef.current.pause();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading Secure Stream...</p>
    </div>
  );

  if (isRevoked) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] max-w-lg space-y-6">
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1 className="text-3xl font-bold">Access Revoked</h1>
        <p className="text-slate-400 leading-relaxed">
          Your access to this video has been terminated due to security policy violations or link expiration. 
          <br /><br />
          Violations Count: <span className="text-red-500 font-bold">{violations}</span>
        </p>
        <button 
          onClick={() => navigate(`/watch/${shareId}`)}
          className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-red-400">Error Loading Player</h1>
        <p className="text-slate-400 max-w-sm">{error}</p>
        <button 
          onClick={() => navigate(`/watch/${shareId}`)}
          className="px-6 py-2 bg-slate-800 rounded-xl font-bold"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div 
      ref={playerContainerRef}
      className="fixed inset-0 w-full h-[100vh] h-[100dvh] bg-black flex flex-col no-select overflow-hidden cursor-none hover:cursor-default"
      style={{ filter: `brightness(${brightness}%)` }}
      onContextMenu={(e) => { e.preventDefault(); logViolation(ViolationType.RIGHT_CLICK); }}
    >
      {/* Dynamic Header Overlay - flex: none ensures it doesn't shrink and pushes content down correctly */}
      <header className="flex-none p-4 md:p-10 flex justify-between items-start z-[100] bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              navigate(`/watch/${shareId}/instructions`);
            }}
            className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-sm md:text-lg tracking-tight truncate max-w-[150px] md:max-w-md">{videoData?.title}</h1>
            <p className="text-white/40 text-[8px] md:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase mt-0.5 md:mt-1">Syan Secured Stream</p>
          </div>
        </div>
        <div className={`px-3 py-1 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest border transition-all ${
          violations > 0 ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse' : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          Compliance: {violations} / {videoData?.securitySettings?.violationLimit || 4}
        </div>
      </header>

      {/* Main Video Viewport - flex-1 with min-h-0 makes it fill the remaining space correctly */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center group bg-black">
        {videoUrl && (
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePauseEvent}
            onPlay={() => setIsPaused(false)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            className="w-full h-full max-w-full max-h-full object-contain pointer-events-auto"
            playsInline
            src={videoUrl} 
          />
        )}

        {/* Branding Overlays */}
        {globalSettings?.watermarkAssetPath && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 select-none no-select overflow-hidden"
            style={{ opacity: globalSettings.watermarkOpacity }}
          >
             <div className="w-3/4 md:w-1/2 opacity-30 pointer-events-none text-white font-bold text-4xl md:text-6xl text-center rotate-45 border-4 border-white p-8 md:p-12 select-none">SYAN SECURE</div>
          </div>
        )}

        {/* Security Personalization Blinking Watermark */}
        {showSecurityWatermark && (
          <div 
            className="absolute z-50 text-white/40 pointer-events-none transition-all duration-300 font-bold text-[8px] md:text-xs tracking-[0.2em] backdrop-blur-[2px] px-2 py-1 md:px-4 md:py-2 bg-black/40 rounded-lg md:rounded-xl border border-white/10"
            style={{ 
              top: watermarkPos.top, 
              left: watermarkPos.left,
              transform: 'rotate(-15deg)',
              textShadow: '2px 2px 10px rgba(0,0,0,0.9)'
            }}
          >
            {localReg.name?.toUpperCase()} | {localReg.cnic}
          </div>
        )}

        {/* Control Bar Overlay - remains absolute but stays within the player container */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-[100]">
          <div className={`relative w-full h-1 md:h-1.5 bg-white/10 rounded-full mb-4 md:mb-8 overflow-hidden ${globalSettings?.blockForward10 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)]"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-10">
              <button onClick={togglePlay} className="text-white hover:text-sky-400 transition-all transform active:scale-90">
                {isPaused ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="md:w-[38px] md:h-[38px]"><path d="m7 3 14 9-14 9V3z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="md:w-[38px] md:h-[38px]"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                )}
              </button>
              
              <div className="flex items-center gap-2 md:gap-3 text-white font-mono text-[10px] md:text-sm font-bold tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-10">
              {!globalSettings?.blockSpeed && (
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-white/20 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Speed</span>
                  <div className="flex gap-1">
                    {[1, 1.25, 1.5, 2].map(s => (
                      <button 
                        key={s}
                        onClick={() => { setPlaybackSpeed(s); if(videoRef.current) videoRef.current.playbackRate = s; }}
                        className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold transition-all border ${
                          playbackSpeed === s ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : playerContainerRef.current?.requestFullscreen()}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[24px] md:h-[24px]"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
