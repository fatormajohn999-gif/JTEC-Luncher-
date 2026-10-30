import { Capacitor, registerPlugin } from '@capacitor/core';
import type { InstalledApp, NativeBridgeStatus } from '../types/launcher';

// Custom event to broadcast launch notifications in web preview mode
export interface LauncherBridgeEvent {
  type: 'launch' | 'app_info' | 'uninstall' | 'home_settings' | 'haptic';
  packageName?: string;
  appName?: string;
  message: string;
}

type BridgeEventListener = (event: LauncherBridgeEvent) => void;
const listeners: Set<BridgeEventListener> = new Set();

export const subscribeToBridgeEvents = (listener: BridgeEventListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyBridgeEvent = (event: LauncherBridgeEvent) => {
  listeners.forEach((listener) => listener(event));
};

// Interface for the native Kotlin plugin registered in MainActivity.kt
interface JTECLauncherNativePlugin {
  getInstalledApps(): Promise<{ apps: InstalledApp[]; count: number }>;
  launchApp(options: { packageName: string }): Promise<{ success: boolean }>;
  openAppInfo(options: { packageName: string }): Promise<{ success: boolean }>;
  uninstallApp(options: { packageName: string }): Promise<{ success: boolean }>;
  openHomeSettings(): Promise<{ success: boolean }>;
  getAppIcon(options: { packageName: string }): Promise<{ iconBase64: string }>;
  triggerHaptic(): Promise<{ success: boolean }>;
}

// Register the Capacitor plugin
const JTECLauncher = registerPlugin<JTECLauncherNativePlugin>('JTECLauncher');

// Baseline fallback applications for web preview / development mode
const FALLBACK_INSTALLED_APPS: InstalledApp[] = [
  {
    packageName: 'com.google.android.dialer',
    name: 'Phone',
    category: 'communication',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.apps.messaging',
    name: 'Messages',
    category: 'communication',
    isSystemApp: true,
  },
  {
    packageName: 'com.android.camera',
    name: 'Camera',
    category: 'media',
    isSystemApp: true,
  },
  {
    packageName: 'com.android.chrome',
    name: 'Chrome',
    category: 'productivity',
    isSystemApp: false,
  },
  {
    packageName: 'com.google.android.gm',
    name: 'Gmail',
    category: 'communication',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.apps.maps',
    name: 'Maps',
    category: 'utilities',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.youtube',
    name: 'YouTube',
    category: 'media',
    isSystemApp: false,
  },
  {
    packageName: 'com.spotify.music',
    name: 'Spotify',
    category: 'media',
    isSystemApp: false,
  },
  {
    packageName: 'com.whatsapp',
    name: 'WhatsApp',
    category: 'communication',
    isSystemApp: false,
  },
  {
    packageName: 'com.android.settings',
    name: 'Settings',
    category: 'system',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.deskclock',
    name: 'Clock',
    category: 'utilities',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.calculator',
    name: 'Calculator',
    category: 'utilities',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.apps.photos',
    name: 'Photos',
    category: 'media',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.apps.nbu.files',
    name: 'Files',
    category: 'utilities',
    isSystemApp: true,
  },
  {
    packageName: 'com.android.vending',
    name: 'Play Store',
    category: 'system',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.keep',
    name: 'Notes',
    category: 'productivity',
    isSystemApp: false,
  },
  {
    packageName: 'com.google.android.calendar',
    name: 'Calendar',
    category: 'productivity',
    isSystemApp: true,
  },
  {
    packageName: 'com.google.android.contacts',
    name: 'Contacts',
    category: 'communication',
    isSystemApp: true,
  },
];

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const getBridgeStatus = (): NativeBridgeStatus => {
  const native = isNativeAndroid();
  return {
    isNative: native,
    platform: (Capacitor.getPlatform() as 'android' | 'web' | 'ios') || 'web',
    packageName: 'com.jteclauncher.app',
    bridgeReady: true,
  };
};

/**
 * Native discovery of installed applications via Android PackageManager.
 */
export const getInstalledApps = async (): Promise<InstalledApp[]> => {
  if (isNativeAndroid()) {
    try {
      const result = await JTECLauncher.getInstalledApps();
      if (result && Array.isArray(result.apps) && result.apps.length > 0) {
        return result.apps;
      }
    } catch (err) {
      console.warn('Native PackageManager query failed, falling back:', err);
    }
  }

  // Fallback for Web preview / development mode
  return [...FALLBACK_INSTALLED_APPS].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Launch an installed application by package name.
 */
export const launchApp = async (app: InstalledApp): Promise<boolean> => {
  triggerHaptic();

  if (isNativeAndroid()) {
    try {
      const result = await JTECLauncher.launchApp({ packageName: app.packageName });
      return result.success;
    } catch (err) {
      console.error('Failed to launch native app:', err);
      notifyBridgeEvent({
        type: 'launch',
        packageName: app.packageName,
        appName: app.name,
        message: `Native launch failed: ${err instanceof Error ? err.message : String(err)}`,
      });
      return false;
    }
  }

  // Web environment simulation notice
  notifyBridgeEvent({
    type: 'launch',
    packageName: app.packageName,
    appName: app.name,
    message: `Launched: ${app.name} (${app.packageName})`,
  });

  return true;
};

/**
 * Navigate to Android App Details Settings for a package.
 */
export const openAppInfo = async (app: InstalledApp): Promise<boolean> => {
  triggerHaptic();

  if (isNativeAndroid()) {
    try {
      const result = await JTECLauncher.openAppInfo({ packageName: app.packageName });
      return result.success;
    } catch (err) {
      console.error('Failed to open app info:', err);
      return false;
    }
  }

  notifyBridgeEvent({
    type: 'app_info',
    packageName: app.packageName,
    appName: app.name,
    message: `Android App Info: ${app.name} (${app.packageName})`,
  });

  return true;
};

/**
 * Request application uninstall intent.
 */
export const uninstallApp = async (app: InstalledApp): Promise<boolean> => {
  triggerHaptic();

  if (isNativeAndroid()) {
    try {
      const result = await JTECLauncher.uninstallApp({ packageName: app.packageName });
      return result.success;
    } catch (err) {
      console.error('Failed to uninstall app:', err);
      return false;
    }
  }

  notifyBridgeEvent({
    type: 'uninstall',
    packageName: app.packageName,
    appName: app.name,
    message: `Uninstall Intent: ${app.name} (${app.packageName})`,
  });

  return true;
};

/**
 * Open Android system settings to set JTEC Launcher as default Home app.
 */
export const openHomeSettings = async (): Promise<boolean> => {
  triggerHaptic();

  if (isNativeAndroid()) {
    try {
      const result = await JTECLauncher.openHomeSettings();
      return result.success;
    } catch (err) {
      console.error('Failed to open home settings:', err);
      return false;
    }
  }

  notifyBridgeEvent({
    type: 'home_settings',
    message: 'Triggered Intent: Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS',
  });

  return true;
};

/**
 * Trigger subtle tactile feedback on touch/press.
 */
export const triggerHaptic = async (): Promise<void> => {
  if (isNativeAndroid()) {
    try {
      await JTECLauncher.triggerHaptic();
      return;
    } catch {
      // Ignore
    }
  }

  // Web vibration fallback if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore
    }
  }
};
