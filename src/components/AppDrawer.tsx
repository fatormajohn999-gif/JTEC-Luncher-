import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { InstalledApp, LauncherSettings } from '../types/launcher';
import { AppIcon } from '../services/iconSystem';
import { launchApp, openAppInfo, uninstallApp, triggerHaptic } from '../services/nativeBridge';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ChevronDown, Star, Info, Trash2, ArrowUpRight } from 'lucide-react';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledApp[];
  settings: LauncherSettings;
  onPinToFavorites: (app: InstalledApp, slotIndex: number) => void;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  apps,
  settings,
  onPinToFavorites,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [showPinSlotSelector, setShowPinSlotSelector] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Focus search input when drawer opens if configured
  useEffect(() => {
    if (isOpen) {
      if (settings.searchInstantFocus) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 250);
      }
    } else {
      setSearchQuery('');
      setSelectedApp(null);
      setShowPinSlotSelector(false);
    }
  }, [isOpen, settings.searchInstantFocus]);

  // Filter apps by search query
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  // Touch drag down to close drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY > 80) {
        // Swiped down
        triggerHaptic();
        onClose();
      }
      setTouchStartY(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerRef}
          initial={{ y: '100%', opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.9 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed inset-0 z-40 flex flex-col bg-black text-white select-none overflow-hidden pt-safe pb-safe"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top handle and header */}
          <div className="flex flex-col items-center px-4 pt-3 pb-2 border-b border-zinc-900/80 shrink-0">
            {/* Grab handle affordance */}
            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="w-12 h-1 bg-zinc-800 rounded-full mb-3 hover:bg-zinc-700 transition-colors"
              aria-label="Close drawer"
            />

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <div className="relative flex items-center">
                <Search
                  size={16}
                  className="absolute left-3.5 text-zinc-500 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications..."
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                    title="Close Drawer"
                  >
                    <ChevronDown size={18} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* App count and quick indicator */}
            <div className="flex items-center justify-between w-full max-w-md mt-2 px-1 text-[11px] text-zinc-500 font-mono">
              <span>{filteredApps.length} APPS</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* 4-Column Application Grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
            <div className="w-full max-w-md mx-auto">
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
                  <Search size={32} strokeWidth={1} className="mb-3 text-zinc-600" />
                  <p className="text-sm">No applications found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try a different search query</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-y-6 gap-x-2 justify-items-center">
                  {filteredApps.map((app) => {
                    let pressTimer: ReturnType<typeof setTimeout> | null = null;

                    const handlePressStart = () => {
                      pressTimer = setTimeout(() => {
                        triggerHaptic();
                        setSelectedApp(app);
                        setShowPinSlotSelector(false);
                      }, 500);
                    };

                    const handlePressEnd = () => {
                      if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                      }
                    };

                    return (
                      <div
                        key={app.packageName}
                        className="flex flex-col items-center w-full group cursor-pointer"
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onClick={() => {
                          launchApp(app);
                          onClose();
                        }}
                      >
                        <div className="transition-transform group-hover:scale-105 active:scale-90">
                          <AppIcon
                            packageName={app.packageName}
                            appName={app.name}
                            iconBase64={app.iconBase64}
                            shape={settings.iconShape}
                            size="md"
                          />
                        </div>
                        <span className="mt-2 text-xs font-sans text-zinc-300 group-hover:text-white transition-colors text-center truncate w-full px-1 leading-tight">
                          {app.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Context Modal for Long-Pressed App */}
          <AnimatePresence>
            {selectedApp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
                onClick={() => setSelectedApp(null)}
              >
                <motion.div
                  initial={{ y: 50, scale: 0.95 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 50, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white"
                >
                  <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-800">
                    <AppIcon
                      packageName={selectedApp.packageName}
                      appName={selectedApp.name}
                      iconBase64={selectedApp.iconBase64}
                      shape={settings.iconShape}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-medium truncate">{selectedApp.name}</h4>
                      <p className="text-[11px] font-mono text-zinc-500 truncate">
                        {selectedApp.packageName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <button
                      onClick={() => {
                        launchApp(selectedApp);
                        setSelectedApp(null);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                    >
                      <ArrowUpRight size={16} className="text-zinc-400" />
                      <span>Open Application</span>
                    </button>

                    <button
                      onClick={() => setShowPinSlotSelector(!showPinSlotSelector)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Star size={16} className="text-zinc-400" />
                        <span>Pin to Favorites Dock</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">1-5</span>
                    </button>

                    {showPinSlotSelector && (
                      <div className="p-2.5 bg-black/50 border border-zinc-800 rounded-xl grid grid-cols-5 gap-2 my-2">
                        {[0, 1, 2, 3, 4].map((slotIdx) => (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              triggerHaptic();
                              onPinToFavorites(selectedApp, slotIdx);
                              setSelectedApp(null);
                            }}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-mono transition-all"
                          >
                            <span className="text-[10px] text-zinc-500 uppercase">Slot</span>
                            <span className="font-bold text-white">{slotIdx + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        openAppInfo(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                    >
                      <Info size={16} className="text-zinc-400" />
                      <span>Android App Info</span>
                    </button>

                    <button
                      onClick={() => {
                        uninstallApp(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Uninstall</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
