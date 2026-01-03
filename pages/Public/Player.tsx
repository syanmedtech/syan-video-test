
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ViolationType, GlobalPlayerSettings, Violation } from '../../types';

export default function PublicPlayer() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });
  const [showSecurityWatermark, setShowSecurityWatermark] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(100);

  // Enforcement tracking
  const lastAllowedTimeRef = useRef(0);
  const [globalSettings, setGlobalSettings] = useState<GlobalPlayerSettings | null>(null);

  // Session and User data
  const session = JSON.parse(localStorage.getItem(`session_${shareId}`) || '{}');
  const userData = session; 
  const MAX_VIOLATIONS = 4;

  // Simulate Cloud Function: getPublicPlayerConfig()
  const fetchGlobalPlayerConfig = useCallback(async () => {
    const saved = localStorage.getItem('global_player_settings');
    if (saved) {
      const config = JSON.parse(saved);
      // Simulate signed URLs for assets
      return {
        ...config,
        watermarkUrl: config.watermarkAssetPath ? 'https://via.placeholder.com/600x600?text=Watermark' : null,
        logoUrl: config.logoAssetPath ? 'https://via.placeholder.com/100x100?text=Logo' : null,
      } as GlobalPlayerSettings;
    }
    return null;
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await fetchGlobalPlayerConfig();
      if (config) {
        setGlobalSettings(config);
      }
    };

    loadConfig();
    const refreshTimer = setInterval(loadConfig, 60000); // Cache refresh every 60s
    
    return () => clearInterval(refreshTimer);
  }, [fetchGlobalPlayerConfig]);

  const logViolation = useCallback(async (type: ViolationType) => {
    console.warn(`Violation detected: ${type}`);
    
    const violation: Violation = {
      id: 'v_' + Math.random().toString(36).substr(2, 9),
      emailLower: session.emailLower || 'unknown',
      userId: session.userId || 'anonymous',
      sessionId: session.id || 'local',
      videoId: session.videoId || 'unknown',
      videoTitle: 'SECURE CONTENT FEED', 
      violationType: type,
      timestamp: Date.now(),
      severity: (type === ViolationType.DEVTOOLS_DETECTED || type === ViolationType.SCREENSHOT_ATTEMPT) ? 'high' : 'medium',
      resolved: false,
      metadata: {
        userAgent: navigator.userAgent,
        ipHash: 'mock_ip_hash',
        page: window.location.pathname,
        extra: { shareId }
      }
    };

    const allViolations = JSON.parse(localStorage.getItem('violations_history') || '[]');
    allViolations.push(violation);
    localStorage.setItem('violations_history', JSON.stringify(allViolations));

    setViolations(v => {
      const next = v + 1;
      const updatedSession = { ...session, violationsCount: next };
      localStorage.setItem(`session_${shareId}`, JSON.stringify(updatedSession));

      if (next >= MAX_VIOLATIONS) {
        alert("Access revoked due to security policy violations.");
        navigate(`/watch/${shareId}`);
      }
      return next;
    });
  }, [navigate, shareId, session]);

  // Enforcement: Block Speed
  useEffect(() => {
    if (globalSettings?.blockSpeed && videoRef.current) {
      if (videoRef.current.playbackRate !== 1.0) {
        videoRef.current.playbackRate = 1.0;
        setPlaybackSpeed(1.0);
        logViolation(ViolationType.SPEED_ATTEMPT);
      }
    }
  }, [globalSettings, playbackSpeed, logViolation]);

  // Enforcement: Block Pause (Immediate Resume)
  const handlePauseEvent = () => {
    if (globalSettings?.blockPause && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPaused(false);
      logViolation(ViolationType.PAUSE_ATTEMPT);
    } else {
      setIsPaused(true);
    }
  };

  // Enforcement: Block Forward 10
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (globalSettings?.blockForward10) {
        // If jump detected beyond natural playback delta
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

  // Fullscreen requirement
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        logViolation(ViolationType.EXIT_FULLSCREEN);
        videoRef.current?.pause();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [logViolation]);

  // Anti-Screenshot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
        logViolation(ViolationType.SCREENSHOT_ATTEMPT);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logViolation]);

  // Security Blinking Logic
  useEffect(() => {
    if (!globalSettings?.securityWatermarkEnabled) return;
    const interval = setInterval(() => {
      setShowSecurityWatermark(true);
      setWatermarkPos({
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 70 + 10 + '%'
      });
      setTimeout(() => setShowSecurityWatermark(false), globalSettings.blinkDurationMs);
    }, globalSettings.blinkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [globalSettings]);

  const togglePlay = () => {
    if (videoRef.current) {
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
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!globalSettings) return null;

  return (
    <div 
      ref={playerContainerRef}
      className="fixed inset-0 bg-black flex flex-col no-select overflow-hidden cursor-none hover:cursor-default"
      style={{ filter: `brightness(${brightness}%)` }}
      onContextMenu={(e) => { e.preventDefault(); logViolation(ViolationType.RIGHT_CLICK); }}
    >
      {/* Header Info Overlay */}
      <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-[100] bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(`/watch/${shareId}/instructions`)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">SECURE CONTENT STREAM</h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Syan Encryption Active</p>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
          violations > 0 ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse' : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          Compliance Status: {violations} / {MAX_VIOLATIONS}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="flex-1 relative flex items-center justify-center group">
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePauseEvent}
          onPlay={() => setIsPaused(false)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          className="w-full h-full object-contain"
          playsInline
          src="https://www.w3schools.com/html/mov_bbb.mp4" 
        />

        {/* Universal Watermark Overlay */}
        {globalSettings.watermarkUrl && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 select-none no-select"
            style={{ opacity: globalSettings.watermarkOpacity }}
          >
             <img src={globalSettings.watermarkUrl} className="w-1/2 object-contain grayscale" alt="" />
          </div>
        )}

        {/* Global Logo Overlay */}
        {globalSettings.logoUrl && (
          <div 
            className="absolute top-28 right-12 z-40 pointer-events-none select-none no-select"
            style={{ opacity: globalSettings.logoOpacity }}
          >
             <img src={globalSettings.logoUrl} className="w-24 object-contain" alt="" />
          </div>
        )}

        {/* Security Blinking Watermark (Viewer Personal Details) */}
        {showSecurityWatermark && (
          <div 
            className="absolute z-50 text-white/50 pointer-events-none transition-all duration-300 font-bold text-xs tracking-[0.2em] backdrop-blur-[2px] px-4 py-2 bg-black/20 rounded-xl border border-white/5"
            style={{ 
              top: watermarkPos.top, 
              left: watermarkPos.left,
              transform: 'rotate(-15deg)',
              textShadow: '2px 2px 10px rgba(0,0,0,0.9)'
            }}
          >
            {userData.name?.toUpperCase()} | {userData.cnic}
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-[100]">
          <div className={`relative w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden ${globalSettings.blockForward10 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              {!globalSettings.blockPause && (
                <button onClick={togglePlay} className="text-white hover:text-sky-400 transition-all transform active:scale-90">
                  {isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 14 9-14 9V3z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                  )}
                </button>
              )}
              
              <div className="flex items-center gap-3 text-white font-mono text-sm font-bold tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-6">
                <button onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10; }} className="text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-tighter transition-colors">Rewind 10s</button>
                {!globalSettings.blockForward10 && (
                  <button onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10; }} className="text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-tighter transition-colors">Forward 10s</button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-10">
              {!globalSettings.blockSpeed && (
                <div className="flex items-center gap-4">
                  <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Playback</span>
                  <div className="flex gap-1">
                    {[1, 1.25, 1.5, 2].map(s => (
                      <button 
                        key={s}
                        onClick={() => { setPlaybackSpeed(s); if(videoRef.current) videoRef.current.playbackRate = s; }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
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
                onClick={() => document.fullscreenElement ? document.exitFullscreen() : playerContainerRef.current?.requestFullscreen()}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
