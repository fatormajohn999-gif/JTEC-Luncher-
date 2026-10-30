import type { LauncherSettings } from '../types/launcher';

const SETTINGS_KEY = 'jtec_launcher_settings_v1';

export const DEFAULT_SETTINGS: LauncherSettings = {
  clockFormat: '24h',
  showSeconds: false,
  showDate: true,
  clockStyle: 'classic',
  theme: 'oled-black',
  iconShape: 'squircle',
  showLabels: true,
  favorites: [
    'com.google.android.dialer',
    'com.google.android.apps.messaging',
    'com.android.camera',
    'com.android.chrome',
    'com.android.settings',
  ],
  hapticsEnabled: true,
  searchInstantFocus: true,
  wallpaperDim: 0,
};

export const loadLauncherSettings = (): LauncherSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      favorites:
        Array.isArray(parsed.favorites) && parsed.favorites.length === 5
          ? parsed.favorites
          : DEFAULT_SETTINGS.favorites,
    };
  } catch (e) {
    console.warn('Failed to parse launcher settings from localStorage:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveLauncherSettings = (settings: LauncherSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save launcher settings to localStorage:', e);
  }
};
