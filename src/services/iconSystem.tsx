import React from 'react';
import type { IconShape } from '../types/launcher';
import {
  Phone,
  MessageSquare,
  Camera,
  Globe,
  Mail,
  MapPin,
  Play,
  Music,
  MessageCircle,
  Settings,
  Clock,
  Calculator,
  Image,
  Folder,
  ShoppingBag,
  FileText,
  Calendar,
  Users,
  Grid,
} from 'lucide-react';

interface AppIconProps {
  packageName: string;
  appName: string;
  iconBase64?: string;
  shape?: IconShape;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  packageName,
  appName,
  iconBase64,
  shape = 'squircle',
  size = 'md',
  className = '',
}) => {
  // Dimension configuration
  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-16 h-16 text-2xl',
  }[size];

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 28,
  }[size];

  // Shape geometry
  const shapeClasses = {
    squircle: 'rounded-[18px]',
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    'glyph-only': 'rounded-none bg-transparent border-0',
  }[shape];

  // Background surface style
  const containerStyle =
    shape === 'glyph-only'
      ? 'bg-transparent text-white'
      : 'bg-zinc-900 border border-zinc-800/80 text-white shadow-sm';

  // If native Android base64 icon is available and not glyph-only
  if (iconBase64 && shape !== 'glyph-only') {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden transition-transform active:scale-95 ${sizeClasses} ${shapeClasses} ${containerStyle} ${className}`}
      >
        <img
          src={iconBase64}
          alt={appName}
          className="w-full h-full object-cover filter grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Render minimal monochrome vector glyph based on package name heuristics
  const renderGlyph = () => {
    const pkg = packageName.toLowerCase();
    const name = appName.toLowerCase();

    if (pkg.includes('dialer') || pkg.includes('phone') || name === 'phone') {
      return <Phone size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('messaging') || pkg.includes('sms') || name === 'messages') {
      return <MessageSquare size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('camera') || name === 'camera') {
      return <Camera size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('chrome') || pkg.includes('browser') || name === 'chrome' || name === 'browser') {
      return <Globe size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('gm') || pkg.includes('mail') || name === 'gmail' || name === 'email') {
      return <Mail size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('maps') || name === 'maps') {
      return <MapPin size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('youtube') || name === 'youtube') {
      return <Play size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('spotify') || pkg.includes('music') || name === 'spotify' || name === 'music') {
      return <Music size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('whatsapp') || pkg.includes('chat') || name === 'whatsapp') {
      return <MessageCircle size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('settings') || name === 'settings') {
      return <Settings size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('clock') || name === 'clock') {
      return <Clock size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('calculator') || name === 'calculator') {
      return <Calculator size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('photos') || pkg.includes('gallery') || name === 'photos' || name === 'gallery') {
      return <Image size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('files') || pkg.includes('filemanager') || name === 'files') {
      return <Folder size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('vending') || pkg.includes('store') || name.includes('store')) {
      return <ShoppingBag size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('keep') || pkg.includes('notes') || name === 'notes') {
      return <FileText size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('calendar') || name === 'calendar') {
      return <Calendar size={iconSizes} strokeWidth={1.75} />;
    }
    if (pkg.includes('contacts') || name === 'contacts') {
      return <Users size={iconSizes} strokeWidth={1.75} />;
    }

    // Dynamic clean typographic initial for unknown Android apps
    const initial = (appName.trim().charAt(0) || 'A').toUpperCase();
    return (
      <span className="font-mono font-medium tracking-tight text-zinc-300">
        {initial}
      </span>
    );
  };

  return (
    <div
      className={`flex items-center justify-center transition-all duration-150 active:scale-95 ${sizeClasses} ${shapeClasses} ${containerStyle} ${className}`}
      title={appName}
    >
      <div className="text-zinc-200 group-hover:text-white transition-colors">
        {renderGlyph()}
      </div>
    </div>
  );
};
