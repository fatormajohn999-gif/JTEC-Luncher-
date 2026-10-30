import React, { useState } from 'react';
import type { LauncherSettings, InstalledApp, IconShape, ClockStyle, ThemeColor } from '../types/launcher';
import { getBridgeStatus, openHomeSettings, triggerHaptic } from '../services/nativeBridge';
import { AppIcon } from '../services/iconSystem';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  Palette,
  Smartphone,
  Star,
  Check,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LauncherSettings;
  onUpdateSettings: (newSettings: LauncherSettings) => void;
  apps: InstalledApp[];
  initialSlotToReassign?: number | null;
  onClearSlotToReassign?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  apps,
  initialSlotToReassign = null,
  onClearSlotToReassign,
}) => {
  const [activeTab, setActiveTab] = useState<'dock' | 'clock' | 'appearance' | 'native'>('dock');
  const [slotPickerIdx, setSlotPickerIdx] = useState<number | null>(initialSlotToReassign);
  const bridgeStatus = getBridgeStatus();

  // If initialSlotToReassign was set from home screen long press, jump straight to dock tab
  React.useEffect(() => {
    if (initialSlotToReassign !== null && initialSlotToReassign !== undefined) {
      setActiveTab('dock');
      setSlotPickerIdx(initialSlotToReassign);
      if (onClearSlotToReassign) onClearSlotToReassign();
    }
  }, [initialSlotToReassign, onClearSlotToReassign]);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof LauncherSettings>(key: K, value: LauncherSettings[K]) => {
    triggerHaptic();
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleReassignSlot = (slotIdx: number, newPackageName: string) => {
    triggerHaptic();
    const newFavorites = [...settings.favorites] as [string, string, string, string, string];
    newFavorites[slotIdx] = newPackageName;
    handleUpdate('favorites', newFavorites);
    setSlotPickerIdx(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 shrink-0">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Launcher Preferences</h3>
            <p className="text-xs text-zinc-500">JTEC Launcher v1.0.0 · Android</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('dock')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'dock'
                ? 'border-white text-white bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Star size={14} />
            <span>Dock</span>
          </button>
          <button
            onClick={() => setActiveTab('clock')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'clock'
                ? 'border-white text-white bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={14} />
            <span>Clock</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-white text-white bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette size={14} />
            <span>Style</span>
          </button>
          <button
            onClick={() => setActiveTab('native')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'native'
                ? 'border-white text-white bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone size={14} />
            <span>Android</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          {/* TAB 1: DOCK FAVORITES */}
          {activeTab === 'dock' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">5 Customizable Dock Positions</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tap any slot below to choose which application appears on the home screen dock.
                </p>
              </div>

              {/* Slot Cards */}
              <div className="space-y-2">
                {settings.favorites.map((pkg, idx) => {
                  const assignedApp = apps.find((a) => a.packageName === pkg) || {
                    packageName: pkg,
                    name: `App ${idx + 1}`,
                  };

                  return (
                    <div
                      key={idx}
                      onClick={() => setSlotPickerIdx(idx)}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-mono text-zinc-500 font-bold">
                          {idx + 1}
                        </span>
                        <AppIcon
                          packageName={assignedApp.packageName}
                          appName={assignedApp.name}
                          iconBase64={assignedApp.iconBase64}
                          shape={settings.iconShape}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{assignedApp.name}</p>
                          <p className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
                            {assignedApp.packageName}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        Change <ChevronRight size={14} />
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Modal App Picker for Selected Slot */}
              <AnimatePresence>
                {slotPickerIdx !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  >
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col max-h-[70vh]">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <h4 className="text-sm font-medium">
                          Assign Slot {slotPickerIdx + 1}
                        </h4>
                        <button
                          onClick={() => setSlotPickerIdx(null)}
                          className="text-zinc-500 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto py-2 space-y-1 no-scrollbar">
                        {apps.map((app) => (
                          <button
                            key={app.packageName}
                            onClick={() => handleReassignSlot(slotPickerIdx, app.packageName)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800 text-left transition-colors"
                          >
                            <AppIcon
                              packageName={app.packageName}
                              appName={app.name}
                              iconBase64={app.iconBase64}
                              shape={settings.iconShape}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-zinc-200 truncate">{app.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500 truncate">
                                {app.packageName}
                              </p>
                            </div>
                            {settings.favorites[slotPickerIdx] === app.packageName && (
                              <Check size={16} className="text-white shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 2: CLOCK & TIME */}
          {activeTab === 'clock' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Time & Date Formatting</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure the large minimalist home screen clock.
                </p>
              </div>

              {/* 12h vs 24h format */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">24-Hour Time Format</p>
                  <p className="text-xs text-zinc-500">Toggle between 12-hour (AM/PM) and 24-hour military</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdate('clockFormat', settings.clockFormat === '24h' ? '12h' : '24h')
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.clockFormat === '24h' ? 'bg-white justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.clockFormat === '24h' ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Show Seconds */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Display Seconds</p>
                  <p className="text-xs text-zinc-500">Show subtle live seconds counter</p>
                </div>
                <button
                  onClick={() => handleUpdate('showSeconds', !settings.showSeconds)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.showSeconds ? 'bg-white justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.showSeconds ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Show Date */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Display Date & Day</p>
                  <p className="text-xs text-zinc-500">Show uppercase date string below clock</p>
                </div>
                <button
                  onClick={() => handleUpdate('showDate', !settings.showDate)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.showDate ? 'bg-white justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.showDate ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Clock Typography Style */}
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-2">
                  Typography Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'classic', label: 'Classic Light' },
                      { id: 'minimal', label: 'Mono Clean' },
                      { id: 'bold', label: 'Bold Modern' },
                    ] as { id: ClockStyle; label: string }[]
                  ).map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleUpdate('clockStyle', style.id)}
                      className={`p-3 rounded-xl border text-xs text-center transition-all ${
                        settings.clockStyle === style.id
                          ? 'border-white bg-zinc-800 text-white font-medium'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE & THEME */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Theme & Icon Geometry</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Monochrome styling and clean OLED aesthetics.
                </p>
              </div>

              {/* Background Canvas Theme */}
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-2">
                  Background Surface
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'oled-black', label: 'Deep OLED', hex: '#000000' },
                      { id: 'charcoal', label: 'Charcoal', hex: '#09090b' },
                      { id: 'graphite', label: 'Graphite', hex: '#121214' },
                    ] as { id: ThemeColor; label: string; hex: string }[]
                  ).map((th) => (
                    <button
                      key={th.id}
                      onClick={() => handleUpdate('theme', th.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                        settings.theme === th.id
                          ? 'border-white bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-zinc-700 mb-1.5"
                        style={{ backgroundColor: th.hex }}
                      />
                      <span className="text-xs">{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Shape */}
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-2">
                  Icon Geometry
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'squircle', label: 'Squircle' },
                      { id: 'circle', label: 'Circle' },
                      { id: 'rounded', label: 'Square' },
                      { id: 'glyph-only', label: 'Glyph' },
                    ] as { id: IconShape; label: string }[]
                  ).map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleUpdate('iconShape', shape.id)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                        settings.iconShape === shape.id
                          ? 'border-white bg-zinc-800 text-white font-medium'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show App Labels */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Show App Labels</p>
                  <p className="text-xs text-zinc-500">Show names below icons on home dock</p>
                </div>
                <button
                  onClick={() => handleUpdate('showLabels', !settings.showLabels)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.showLabels ? 'bg-white justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.showLabels ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Instant Search Focus */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Auto-Focus Search</p>
                  <p className="text-xs text-zinc-500">Open keyboard automatically in app drawer</p>
                </div>
                <button
                  onClick={() => handleUpdate('searchInstantFocus', !settings.searchInstantFocus)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.searchInstantFocus ? 'bg-white justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.searchInstantFocus ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ANDROID NATIVE INTEGRATION & APK */}
          {activeTab === 'native' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Native Android Architecture</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Real Capacitor bridge configuration for Android HOME launcher.
                </p>
              </div>

              {/* Real Bridge Status Card */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Capacitor Runtime</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                      bridgeStatus.isNative
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {bridgeStatus.isNative ? 'Native Android' : 'Web Dev Sandbox'}
                  </span>
                </div>

                <div className="text-xs space-y-1 font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>Package ID:</span>
                    <span className="text-zinc-200">{bridgeStatus.packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform:</span>
                    <span className="text-zinc-200 uppercase">{bridgeStatus.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Home Intent:</span>
                    <span className="text-zinc-200">category.HOME Registered</span>
                  </div>
                </div>

                {/* Set as Default Launcher Trigger */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    openHomeSettings();
                  }}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white text-black font-medium text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all"
                >
                  <Sparkles size={14} />
                  <span>Set JTEC Launcher as Default Home</span>
                </button>
              </div>

              {/* Native Architecture Breakdown */}
              <div className="space-y-2.5 text-xs text-zinc-400">
                <h5 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <Layers size={14} className="text-zinc-400" />
                  <span>Native Implementation Highlights</span>
                </h5>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 font-sans leading-relaxed">
                  <p>
                    <strong className="text-zinc-200">1. Android HOME Intent:</strong> Declared in{' '}
                    <code className="text-[11px] font-mono text-zinc-300">AndroidManifest.xml</code>{' '}
                    with <code className="text-[11px] font-mono text-zinc-300">category.HOME</code> and{' '}
                    <code className="text-[11px] font-mono text-zinc-300">category.DEFAULT</code>.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2. Package Discovery:</strong> Uses{' '}
                    <code className="text-[11px] font-mono text-zinc-300">QUERY_ALL_PACKAGES</code>{' '}
                    with Kotlin's <code className="text-[11px] font-mono text-zinc-300">packageManager.queryIntentActivities</code>.
                  </p>
                  <p>
                    <strong className="text-zinc-200">3. Custom Kotlin Plugin:</strong> Located at{' '}
                    <code className="text-[11px] font-mono text-zinc-300">
                      android/.../JTECLauncherPlugin.kt
                    </code>{' '}
                    registered in <code className="text-[11px] font-mono text-zinc-300">MainActivity.kt</code>.
                  </p>
                  <p>
                    <strong className="text-zinc-200">4. Automated APK Workflow:</strong> Configured in{' '}
                    <code className="text-[11px] font-mono text-zinc-300">
                      .github/workflows/build-apk.yml
                    </code>{' '}
                    for CI/CD compilation using Gradle.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 flex justify-between items-center bg-zinc-950 shrink-0">
          <span className="text-[11px] font-mono text-zinc-600">
            JTEC · Productivity & Minimalism
          </span>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
