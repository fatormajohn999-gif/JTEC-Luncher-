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
  Radio,
  Terminal,
  Shield,
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
    sm: 'w-10 h-10',
    md: 'w-[52px] h-[52px]',
    lg: 'w-16 h-16',
  }[size];

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26,
  }[size];

  const UNIFORM_STROKE = 1.5;

  // Shape geometry
  const shapeClasses = {
    squircle: 'rounded-[16px]',
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    'glyph-only': 'rounded-none bg-transparent border-0',
  }[shape];

  // Background surface style
  const containerStyle =
    shape === 'glyph-only'
      ? 'bg-transparent text-white'
      : 'bg-[#121214] border border-zinc-800/80 text-white';

  // If native Android base64 icon is available and not glyph-only
  if (iconBase64 && shape !== 'glyph-only') {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden select-none ${sizeClasses} ${shapeClasses} ${containerStyle} ${className}`}
      >
        <img
          src={iconBase64}
          alt={appName}
          className="w-full h-full object-cover filter grayscale contrast-125"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    );
  }

  // Render minimal monochrome vector glyph based on package name heuristics
  const renderGlyph = () => {
    const pkg = packageName.toLowerCase();
    const name = appName.toLowerCase();

    if (pkg.includes('dialer') || pkg.includes('phone') || name === 'phone' || name.includes('call')) {
      return <Phone size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('messaging') || pkg.includes('sms') || pkg.includes('mms') || name === 'messages') {
      return <MessageSquare size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('camera') || name === 'camera') {
      return <Camera size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('chrome') || pkg.includes('browser') || pkg.includes('firefox') || name === 'chrome' || name === 'browser') {
      return <Globe size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('gm') || pkg.includes('mail') || pkg.includes('outlook') || name === 'gmail' || name === 'email') {
      return <Mail size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('maps') || pkg.includes('waze') || name === 'maps') {
      return <MapPin size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('youtube') || pkg.includes('netflix') || pkg.includes('video') || name === 'youtube') {
      return <Play size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('spotify') || pkg.includes('music') || pkg.includes('audio') || name === 'spotify') {
      return <Music size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('whatsapp') || pkg.includes('telegram') || pkg.includes('signal') || pkg.includes('discord') || name === 'whatsapp') {
      return <MessageCircle size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('settings') || name === 'settings') {
      return <Settings size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('clock') || pkg.includes('alarm') || name === 'clock') {
      return <Clock size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('calculator') || name === 'calculator') {
      return <Calculator size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('photos') || pkg.includes('gallery') || name === 'photos' || name === 'gallery') {
      return <Image size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('files') || pkg.includes('filemanager') || pkg.includes('documents') || name === 'files') {
      return <Folder size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('vending') || pkg.includes('store') || name.includes('store') || pkg.includes('market')) {
      return <ShoppingBag size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('keep') || pkg.includes('notes') || pkg.includes('memo') || name === 'notes') {
      return <FileText size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('calendar') || name === 'calendar') {
      return <Calendar size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('contacts') || pkg.includes('people') || name === 'contacts') {
      return <Users size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('terminal') || pkg.includes('termux') || pkg.includes('shell')) {
      return <Terminal size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('radio') || pkg.includes('podcast')) {
      return <Radio size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }
    if (pkg.includes('security') || pkg.includes('vpn') || pkg.includes('auth')) {
      return <Shield size={iconSizes} strokeWidth={UNIFORM_STROKE} />;
    }

    // Dynamic clean typographic initial for unknown Android apps
    const initial = (appName.trim().charAt(0) || 'A').toUpperCase();
    return (
      <span className="font-mono font-medium text-sm text-zinc-300 select-none">
        {initial}
      </span>
    );
  };

  return (
    <div
      className={`flex items-center justify-center shrink-0 select-none ${sizeClasses} ${shapeClasses} ${containerStyle} ${className}`}
      title={appName}
    >
      <div className="text-zinc-200 group-hover:text-white transition-colors flex items-center justify-center">
        {renderGlyph()}
      </div>
    </div>
  );
};
