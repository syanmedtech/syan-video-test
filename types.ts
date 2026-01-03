
export type UserRole = 'super_admin' | 'admin';

export interface Admin {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export type VideoSourceType = 'direct_upload' | 'google_drive';

export interface SourceMeta {
  driveFileId?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SecuritySettings {
  blockRecording: boolean;
  blockScreenshot: boolean;
  blockRightClick: boolean;
  blockDevTools: boolean;
  violationLimit: number;
  allowedBrowsers: string[];
  focusMode: boolean;
  blockDownloading: boolean;
  blockScreenCapturing: boolean;
  requireFullscreen: boolean;
}

export interface AvailabilitySettings {
  availableDurationType: '1h' | '2h' | '3h' | '12h' | '24h' | '2d' | 'custom';
  availableDurationSeconds: number;
  shareId: string;
  shareSecretHash: string;
  linkRotatedAt: number;
  linkMode: 'from_first_access' | 'from_generation';
}

export interface PlayerSettings {
  watermarkAssetPath?: string;
  watermarkOpacity: number;
  logoAssetPath?: string;
  logoOpacity: number;
  securityWatermarkEnabled: boolean;
  blinkIntervalSeconds: number;
  blinkDurationMs: number;
}

export interface GlobalPlayerSettings {
  watermarkAssetPath: string | null;
  watermarkOpacity: number;
  logoAssetPath: string | null;
  logoOpacity: number;
  securityWatermarkEnabled: boolean;
  blinkDurationMs: number;
  blinkIntervalSeconds: number;
  blockSpeed: boolean;
  blockPause: boolean;
  blockForward10: boolean;
  updatedAt: number;
  updatedBy: string;
  // Dynamic URLs for the player
  watermarkUrl?: string;
  logoUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  storagePath: string;
  durationSeconds: number;
  status: 'active' | 'deleted' | 'draft';
  tags: string[];
  sourceType: VideoSourceType;
  sourceMeta?: SourceMeta;
  securitySettings: SecuritySettings;
  availabilitySettings: AvailabilitySettings;
  playerSettings: PlayerSettings;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  emailLower: string;
  university: string;
  whatsapp: string;
  cnic: string;
  preparingFor: string;
  preparingForOtherText?: string;
  status: string;
  classEnrolled: string;
  banned: boolean;
  createdAt: number;
  lastActiveAt: number;
  totalViolations?: number; // Aggregated
}

export interface UserVideoActivity {
  videoId: string;
  videoTitle: string;
  totalWatchTimeSec: number;
  sessionsCount: number;
  lastSeenAt: number;
  completionRate: number;
}

export interface Violation {
  id: string;
  userId: string;
  emailLower: string;
  videoId: string;
  videoTitle: string;
  sessionId: string;
  violationType: ViolationType;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  metadata: {
    userAgent: string;
    ipHash: string;
    page: string;
    browser?: string;
    extra?: any;
  };
}

export interface AccessSession {
  id: string;
  videoId: string;
  userId: string;
  emailLower: string;
  createdAt: number;
  expiresAt: number;
  violationsCount: number;
  status: 'active' | 'revoked' | 'expired';
  deviceInfo: string;
  ipHash: string;
  userAgent: string;
  lastTokenIssuedAt: number;
  lastSeenAt: number;
}

export enum ViolationType {
  EXIT_FULLSCREEN = 'exit_fullscreen',
  FOCUS_LOST = 'focus_lost',
  DEVTOOLS_DETECTED = 'devtools_detected',
  RIGHT_CLICK = 'right_click',
  SCREENSHOT_ATTEMPT = 'screenshot_attempt',
  DOWNLOAD_ATTEMPT = 'download_attempt',
  MULTI_SESSION = 'multi_session',
  PAUSE_ATTEMPT = 'pause_attempt',
  SPEED_ATTEMPT = 'speed_attempt',
  SEEK_FORWARD_ATTEMPT = 'seek_forward_attempt',
  FORWARD10_ATTEMPT = 'forward10_attempt'
}
