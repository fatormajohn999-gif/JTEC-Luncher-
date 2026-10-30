import React, { useState, useEffect } from 'react';
import type { InstalledApp, LauncherSettings } from './types/launcher';
import { loadLauncherSettings, saveLauncherSettings } from './services/settingsStorage';
import { getInstalledApps } from './services/nativeBridge';
import { HomeScreen } from './components/HomeScreen';
import { AppDrawer } from './components/AppDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<LauncherSettings>(loadLauncherSettings);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [slotToReassign, setSlotToReassign] = useState<number | null>(null);
  const [previewPhoneFrame, setPreviewPhoneFrame] = useState(false);

  // Load installed applications from native bridge (or development fallback)
  useEffect(() => {
    let mounted = true;
    getInstalledApps().then((discoveredApps) => {
      if (mounted) {
        setApps(discoveredApps);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync settings updates to localStorage
  const handleUpdateSettings = (newSettings: LauncherSettings) => {
    setSettings(newSettings);
    saveLauncherSettings(newSettings);
  };

  // Pin application to specific favorites dock slot
  const handlePinToFavorites = (app: InstalledApp, slotIndex: number) => {
    if (slotIndex >= 0 && slotIndex < 5) {
      const updated = [...settings.favorites] as [string, string, string, string, string];
      updated[slotIndex] = app.packageName;
      handleUpdateSettings({
        ...settings,
        favorites: updated,
      });
    }
  };

  // When long-pressing a dock icon from home screen
  const handleSelectSlotToReassign = (slotIndex: number) => {
    setSlotToReassign(slotIndex);
    setIsSettingsOpen(true);
  };

  // Keyboard navigation: Escape closes drawer/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, isSettingsOpen]);

  // Determine background color based on theme preference
  const getBackgroundColor = () => {
    switch (settings.theme) {
      case 'charcoal':
        return 'bg-[#09090b]';
      case 'graphite':
        return 'bg-[#121214]';
      case 'oled-black':
      default:
        return 'bg-[#000000]';
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Toast notifications container for native/bridge feedback */}
      <ToastContainer />

      {/* Desktop Viewport Switcher (Only visible on wide desktop viewports) */}
      <div className="hidden lg:flex fixed top-4 right-4 z-30 items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400">
        <button
          onClick={() => setPreviewPhoneFrame(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            !previewPhoneFrame ? 'bg-zinc-800 text-white font-medium' : 'hover:text-zinc-200'
          }`}
          title="Fullscreen Launcher view"
        >
          <Monitor size={13} />
          <span>Full</span>
        </button>
        <button
          onClick={() => setPreviewPhoneFrame(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            previewPhoneFrame ? 'bg-zinc-800 text-white font-medium' : 'hover:text-zinc-200'
          }`}
          title="Simulated Android phone frame"
        >
          <Smartphone size={13} />
          <span>Device Frame</span>
        </button>
      </div>

      {/* Main Launcher Viewport */}
      <div
        className={`relative w-full h-full transition-all duration-300 flex flex-col ${getBackgroundColor()} ${
          previewPhoneFrame
            ? 'max-w-[410px] max-h-[860px] rounded-[48px] border-[10px] border-zinc-800 shadow-2xl overflow-hidden'
            : 'max-w-none max-h-none'
        }`}
      >
        {/* Top Camera Punch-hole for simulated phone frame */}
        {previewPhoneFrame && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-zinc-800 z-50 pointer-events-none" />
        )}

        {/* Home Screen View */}
        <HomeScreen
          settings={settings}
          apps={apps}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectFavoriteSlotToReassign={handleSelectSlotToReassign}
        />

        {/* Full-screen App Drawer View */}
        <AppDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          apps={apps}
          settings={settings}
          onPinToFavorites={handlePinToFavorites}
        />

        {/* Launcher Customization Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            setSlotToReassign(null);
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          apps={apps}
          initialSlotToReassign={slotToReassign}
          onClearSlotToReassign={() => setSlotToReassign(null)}
        />
      </div>
    </div>
  );
}
