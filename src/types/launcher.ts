export interface InstalledApp {
  packageName: string;
  name: string;
  activityName?: string;
  isSystemApp?: boolean;
  iconBase64?: string;
  category?: 'communication' | 'productivity' | 'media' | 'system' | 'utilities';
}

export type ClockStyle = 'classic' | 'minimal' | 'bold';
export type ThemeColor = 'oled-black' | 'charcoal' | 'graphite';
export type IconShape = 'squircle' | 'circle' | 'rounded' | 'glyph-only';

export interface LauncherSettings {
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  showDate: boolean;
  clockStyle: ClockStyle;
  theme: ThemeColor;
  iconShape: IconShape;
  showLabels: boolean;
  favorites: [string, string, string, string, string]; // 5 package names
  hapticsEnabled: boolean;
  searchInstantFocus: boolean;
  wallpaperDim: number; // 0 to 100
}

export interface NativeBridgeStatus {
  isNative: boolean;
  platform: 'android' | 'web' | 'ios';
  packageName: string;
  bridgeReady: boolean;
}
