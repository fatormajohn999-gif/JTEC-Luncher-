import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { InstalledApp, LauncherSettings } from '../types/launcher';
import { AppIcon } from '../services/iconSystem';
import { launchApp, openAppInfo, uninstallApp, triggerHaptic } from '../services/nativeBridge';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  ChevronDown,
  Star,
  Info,
  Trash2,
  ArrowUpRight,
  Copy,
} from 'lucide-react';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledApp[];
  settings: LauncherSettings;
  onPinToFavorites: (app: InstalledApp, slotIndex: number) => void;
}

// Memoized Grid Item to optimize scrolling & prevent unnecessary re-renders
interface AppGridItemProps {
  app: InstalledApp;
  shape: LauncherSettings['iconShape'];
  onLaunch: (app: InstalledApp) => void;
  onLongPress: (app: InstalledApp) => void;
}

const AppGridItem = React.memo<AppGridItemProps>(({ app, shape, onLaunch, onLongPress }) => {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const startPress = useCallback(() => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerHaptic();
      onLongPress(app);
    }, 450);
  }, [app, onLongPress]);

  const clearPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLongPress.current) {
        isLongPress.current = false;
        return;
      }
      onLaunch(app);
    },
    [app, onLaunch]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={startPress}
      onMouseUp={clearPress}
      onMouseLeave={clearPress}
      onTouchStart={startPress}
      onTouchEnd={clearPress}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onLaunch(app);
        }
      }}
      className="flex flex-col items-center justify-start w-full group cursor-pointer focus:outline-none select-none"
    >
      {/* Icon with smooth subtle scale-down and spring-like release */}
      <div className="transition-transform duration-100 ease-out active:scale-[0.91] will-change-transform">
        <AppIcon
          packageName={app.packageName}
          appName={app.name}
          iconBase64={app.iconBase64}
          shape={shape}
          size="md"
        />
      </div>

      {/* App Name Typography */}
      <span className="mt-2 text-[11px] sm:text-xs font-sans font-normal text-zinc-300 group-hover:text-white transition-colors text-center truncate w-full px-0.5 leading-tight tracking-tight select-none">
        {app.name}
      </span>
    </div>
  );
});

AppGridItem.displayName = 'AppGridItem';

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
  const [copiedNotification, setCopiedNotification] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Focus search input when drawer opens if configured
  useEffect(() => {
    if (isOpen) {
      if (settings.searchInstantFocus) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 180);
        return () => clearTimeout(timer);
      }
    } else {
      setSearchQuery('');
      setSelectedApp(null);
      setShowPinSlotSelector(false);
    }
  }, [isOpen, settings.searchInstantFocus]);

  // Instant real-time app filtering
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  // Alphabetical grouping for fast-scroll rail
  const alphabetLetters = useMemo(() => {
    const letters = new Set<string>();
    apps.forEach((app) => {
      const firstChar = app.name.trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add('#');
      }
    });
    return Array.from(letters).sort();
  }, [apps]);

  // Quick jump to letter in app list
  const scrollToLetter = useCallback(
    (letter: string) => {
      triggerHaptic();
      if (!scrollContainerRef.current) return;
      const targetApp = filteredApps.find((app) => {
        const first = app.name.trim().charAt(0).toUpperCase();
        return letter === '#' ? !/[A-Z]/.test(first) : first === letter;
      });

      if (targetApp) {
        const el = document.getElementById(`app-${targetApp.packageName}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [filteredApps]
  );

  // Touch swipe-down gesture to dismiss drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only register drag if we're near the top of the scroll container
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 5) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 75) {
        triggerHaptic();
        onClose();
      }
      touchStartY.current = null;
    }
  };

  // Launch action handler
  const handleLaunch = useCallback(
    (app: InstalledApp) => {
      launchApp(app);
      onClose();
    },
    [onClose]
  );

  // Long press handler
  const handleLongPress = useCallback((app: InstalledApp) => {
    setSelectedApp(app);
    setShowPinSlotSelector(false);
  }, []);

  // Copy package ID
  const handleCopyPackage = (pkg: string) => {
    triggerHaptic();
    navigator.clipboard?.writeText(pkg);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.8 }}
          className="fixed inset-0 z-40 flex flex-col bg-black text-white select-none overflow-hidden pt-safe pb-safe will-change-transform"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header & Slim Search Bar */}
          <div className="flex flex-col items-center px-4 sm:px-6 pt-3 pb-3 border-b border-zinc-900 shrink-0 bg-black z-10">
            {/* Grab handle indicator */}
            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="w-10 h-1 bg-zinc-800 rounded-full mb-3 hover:bg-zinc-700 transition-colors"
              aria-label="Close drawer"
            />

            {/* Redesigned Slim Search Bar */}
            <div className="relative w-full max-w-md">
              <div className="relative flex items-center h-10 rounded-xl bg-[#121214] border border-zinc-800/80 focus-within:border-zinc-600 focus-within:bg-[#161619] transition-all">
                <Search
                  size={15}
                  className="absolute left-3.5 text-zinc-500 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications..."
                  className="w-full h-full pl-9 pr-10 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 p-1 rounded-md text-zinc-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onClose();
                    }}
                    className="absolute right-2.5 p-1 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
                    aria-label="Close drawer"
                  >
                    <ChevronDown size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Unboxed Metadata & Status */}
            <div className="flex items-center justify-between w-full max-w-md mt-2 px-1 text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span>{filteredApps.length} APPS</span>
                {searchQuery && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-400">FILTERED</span>
                  </>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area: 4-Column Grid + Optional Fast Rail */}
          <div className="relative flex-1 flex overflow-hidden">
            {/* Scrollable Applications Grid */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 no-scrollbar overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="w-full max-w-md mx-auto">
                {filteredApps.length === 0 ? (
                  /* Clean Minimalist Empty State */
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
                      <Search size={20} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">No applications found</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">
                      No apps match &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      Clear query
                    </button>
                  </div>
                ) : (
                  /* 4-Column Application Grid with Refined Vertical Spacing */
                  <div className="grid grid-cols-4 gap-y-6 sm:gap-y-7 gap-x-2 sm:gap-x-3 justify-items-center">
                    {filteredApps.map((app) => (
                      <div
                        id={`app-${app.packageName}`}
                        key={app.packageName}
                        className="w-full"
                      >
                        <AppGridItem
                          app={app}
                          shape={settings.iconShape}
                          onLaunch={handleLaunch}
                          onLongPress={handleLongPress}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtle Alphabet Fast-Scroll Rail (Shown when not searching and apps > 8) */}
            {!searchQuery && alphabetLetters.length > 3 && (
              <div className="hidden sm:flex flex-col items-center justify-center py-2 pr-1.5 pl-0.5 select-none z-10">
                <div className="flex flex-col items-center space-y-0.5 py-1 px-1 rounded-full bg-zinc-950/60 border border-zinc-900 text-[9px] font-mono text-zinc-500">
                  {alphabetLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-zinc-800 hover:text-white active:bg-zinc-700 transition-colors"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context Modal for Long-Pressed Application */}
          <AnimatePresence>
            {selectedApp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-3 sm:p-4"
                onClick={() => setSelectedApp(null)}
              >
                <motion.div
                  initial={{ y: 30, scale: 0.98 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 20, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-[#121214] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-white overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3.5 pb-3.5 border-b border-zinc-800/80">
                    <AppIcon
                      packageName={selectedApp.packageName}
                      appName={selectedApp.name}
                      iconBase64={selectedApp.iconBase64}
                      shape={settings.iconShape}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-medium truncate text-zinc-100">
                        {selectedApp.name}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">
                        {selectedApp.packageName}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-2.5 space-y-1 text-xs sm:text-sm">
                    {/* Launch */}
                    <button
                      onClick={() => {
                        handleLaunch(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors"
                    >
                      <ArrowUpRight size={15} className="text-zinc-400" />
                      <span>Open Application</span>
                    </button>

                    {/* Pin to Home Dock */}
                    <button
                      onClick={() => setShowPinSlotSelector(!showPinSlotSelector)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Star size={15} className="text-zinc-400" />
                        <span>Pin to Favorites Dock</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Slots 1-5</span>
                    </button>

                    {/* Slot Picker */}
                    {showPinSlotSelector && (
                      <div className="p-2 bg-black/60 border border-zinc-800/90 rounded-xl grid grid-cols-5 gap-1.5 my-1.5">
                        {[0, 1, 2, 3, 4].map((slotIdx) => (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              triggerHaptic();
                              onPinToFavorites(selectedApp, slotIdx);
                              setSelectedApp(null);
                            }}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 text-xs font-mono transition-all"
                          >
                            <span className="text-[9px] text-zinc-500 uppercase">Slot</span>
                            <span className="font-bold text-white text-xs">{slotIdx + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Android App Info */}
                    <button
                      onClick={() => {
                        openAppInfo(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors"
                    >
                      <Info size={15} className="text-zinc-400" />
                      <span>Android App Info</span>
                    </button>

                    {/* Copy Package Name */}
                    <button
                      onClick={() => handleCopyPackage(selectedApp.packageName)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Copy size={15} className="text-zinc-400" />
                        <span>Copy Package ID</span>
                      </div>
                      {copiedNotification && (
                        <span className="text-[10px] font-mono text-emerald-400">Copied!</span>
                      )}
                    </button>

                    {/* Uninstall */}
                    <button
                      onClick={() => {
                        uninstallApp(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/20 active:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={15} />
                      <span>Uninstall Application</span>
                    </button>
                  </div>

                  {/* Close button */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-end">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
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
