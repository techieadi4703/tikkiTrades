'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification.actions';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function NotificationBell({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications || []);
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark as read', error);
      // Revert if needed, but keeping it simple for now
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications([]);
    try {
      await markAllNotificationsRead(userId);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full h-10 w-10 transition-all"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#141414]"
              >
                <span className="text-[10px] font-bold text-emerald-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-80 p-0 bg-[#0A0A0A] border-[#222222] text-gray-100 shadow-2xl rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#222222] bg-[#0F0F0F]">
          <h4 className="font-semibold text-gray-200">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 px-2 text-xs text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 px-4 flex flex-col items-center justify-center text-center"
              >
                <div className="h-12 w-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                <p className="text-xs text-gray-600 mt-1">Check back later for new alerts.</p>
              </motion.div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="p-4 border-b border-[#222222]/50 hover:bg-[#141414] transition-colors relative group"
                >
                  <div className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                      <Bell className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-300 leading-tight">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
