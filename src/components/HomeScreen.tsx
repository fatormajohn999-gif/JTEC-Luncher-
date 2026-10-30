import React, { useState, useEffect } from 'react';
import type { InstalledApp, LauncherSettings } from '../types/launcher';
import { AppIcon } from '../services/iconSystem';
import { launchApp, triggerHaptic } from '../services/nativeBridge';
import { motion } from 'motion/react';
import { ChevronUp, Settings } from 'lucide-react';

interface HomeScreenProps {
  settings: LauncherSettings;
  apps: InstalledApp[];
  onOpenDrawer: () => void;
  onOpenSettings: () => void;
  onSelectFavoriteSlotToReassign: (slotIndex: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  settings,
  apps,
  onOpenDrawer,
  onOpenSettings,
  onSelectFavoriteSlotToReassign,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format hours and minutes
  const formatTime = () => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    let ampm = '';

    if (settings.clockFormat === '12h') {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }

    const formattedHours = hours.toString().padStart(settings.clockFormat === '24h' ? 2 : 1, '0');

    return {
      hours: formattedHours,
      minutes,
      seconds,
      ampm,
    };
  };

  // Format date and day
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return currentTime.toLocaleDateString(undefined, options).toUpperCase();
  };

  const { hours, minutes, seconds, ampm } = formatTime();

  // Map 5 favorites from settings to InstalledApp records
  const favoriteApps = settings.favorites.map((pkg, index) => {
    const found = apps.find((a) => a.packageName === pkg);
    if (found) return found;
    // Fallback placeholder if app not found
    return {
      packageName: pkg,
      name: `Slot ${index + 1}`,
      category: 'utilities' as const,
    };
  });

  // Touch gesture handlers for swipe-up to open drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY < -60) {
        // Swiped up
        triggerHaptic();
        onOpenDrawer();
      }
      setTouchStartY(null);
    }
  };

  // Double tap on wallpaper to open settings
  const handleWallpaperTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Only if target is wallpaper background, not an app button
    if (e.target !== e.currentTarget) return;
    const now = Date.now();
    if (now - lastTapTime < 350) {
      triggerHaptic();
      onOpenSettings();
      setLastTapTime(0);
    } else {
      setLastTapTime(now);
    }
  };

  // Clock typography variants
  const getClockStyle = () => {
    switch (settings.clockStyle) {
      case 'bold':
        return 'font-sans font-bold tracking-tight text-white';
      case 'minimal':
        return 'font-mono font-light tracking-widest text-zinc-100';
      case 'classic':
      default:
        return 'font-sans font-light tracking-tighter text-white';
    }
  };

  return (
    <div
      className="relative flex flex-col justify-between h-full w-full select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleWallpaperTap}
    >
      {/* Top minimal bar with launcher settings trigger */}
      <div className="flex items-center justify-between px-6 pt-6 z-10">
        <span className="text-[11px] font-mono tracking-widest text-zinc-600 uppercase">
          JTEC · Launcher
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic();
            onOpenSettings();
          }}
          className="p-2 -mr-2 rounded-full text-zinc-500 hover:text-zinc-200 active:text-white transition-colors"
          title="Launcher Settings"
          aria-label="Launcher Settings"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Center Hero: Large Elegant Digital Clock & Date */}
      <div
        className="flex-1 flex flex-col items-center justify-center -mt-10 px-4 text-center cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          // Single tap on clock shows settings/world
          triggerHaptic();
          onOpenSettings();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Digital Clock */}
          <div className="flex items-baseline justify-center">
            <span
              className={`text-7xl sm:text-8xl tabular-nums leading-none select-none ${getClockStyle()}`}
            >
              {hours}:{minutes}
            </span>
            {settings.showSeconds && (
              <span className="text-xl sm:text-2xl font-mono text-zinc-500 ml-2 font-normal tabular-nums">
                {seconds}
              </span>
            )}
            {settings.clockFormat === '12h' && ampm && (
              <span className="text-sm font-sans font-medium text-zinc-500 ml-2 uppercase tracking-wider">
                {ampm}
              </span>
            )}
          </div>

          {/* Date & Day Underneath */}
          {settings.showDate && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-4 text-xs sm:text-sm font-sans font-medium tracking-[0.25em] text-zinc-400/90 uppercase"
            >
              {formatDate()}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Bottom Region: 5 Customizable Favorites Dock + Drawer Indicator */}
      <div className="flex flex-col items-center px-4 pb-6 pb-safe z-10 w-full max-w-md mx-auto">
        {/* 5 Favorites Dock */}
        <div className="grid grid-cols-5 gap-3 sm:gap-4 w-full items-center justify-items-center mb-6 px-2">
          {favoriteApps.map((app, index) => {
            let pressTimer: ReturnType<typeof setTimeout> | null = null;

            const handleMouseDown = () => {
              pressTimer = setTimeout(() => {
                triggerHaptic();
                onSelectFavoriteSlotToReassign(index);
              }, 600);
            };

            const handleMouseUp = () => {
              if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
              }
            };

            return (
              <div
                key={`${app.packageName}-${index}`}
                className="flex flex-col items-center group relative cursor-pointer"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onClick={(e) => {
                  e.stopPropagation();
                  launchApp(app);
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
                {settings.showLabels && (
                  <span className="mt-1.5 text-[10px] font-sans text-zinc-400 group-hover:text-zinc-200 transition-colors text-center truncate max-w-[58px] leading-tight">
                    {app.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Minimal Bottom App Drawer Indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic();
            onOpenDrawer();
          }}
          className="flex flex-col items-center py-2 px-6 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors group cursor-pointer active:scale-95"
          aria-label="Open App Drawer"
        >
          <ChevronUp
            size={16}
            className="text-zinc-500 group-hover:text-zinc-300 group-hover:-translate-y-0.5 transition-all"
            strokeWidth={1.5}
          />
          <span className="text-[10px] tracking-widest font-mono uppercase text-zinc-600 group-hover:text-zinc-400 transition-colors mt-0.5">
            Apps
          </span>
        </button>
      </div>
    </div>
  );
};
