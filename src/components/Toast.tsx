import React, { useEffect, useState } from 'react';
import { subscribeToBridgeEvents, type LauncherBridgeEvent } from '../services/nativeBridge';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, Smartphone, Trash2, Settings } from 'lucide-react';

interface ToastItem {
  id: string;
  type: LauncherBridgeEvent['type'];
  message: string;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToBridgeEvents((event) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-2), { id, type: event.type, message: event.message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    });

    return unsubscribe;
  }, []);

  const getIcon = (type: LauncherBridgeEvent['type']) => {
    switch (type) {
      case 'launch':
        return <Smartphone size={14} className="text-zinc-400" />;
      case 'app_info':
        return <Settings size={14} className="text-zinc-400" />;
      case 'uninstall':
        return <Trash2 size={14} className="text-red-400" />;
      case 'home_settings':
        return <Sparkles size={14} className="text-zinc-300" />;
      default:
        return <Terminal size={14} className="text-zinc-400" />;
    }
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 pointer-events-none flex flex-col items-center px-4 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-zinc-900/95 border border-zinc-800 text-zinc-200 text-xs font-mono shadow-xl backdrop-blur-md max-w-sm truncate"
          >
            {getIcon(toast.type)}
            <span className="truncate">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
