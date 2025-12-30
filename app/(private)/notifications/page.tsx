'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/format';
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Trash2, 
  MoreVertical,
  CheckCircle,
  XCircle,
  UserPlus,
  UtensilsCrossed,
  Shield,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const notifs = data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
        
        loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleNotificationTap = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const type = notification.type || '';
    const relatedId = notification.related_entity_id;

    if (!relatedId) return;

    switch (type) {
      case 'new_follower':
        router.push(`/profile/${relatedId}`);
        break;
      case 'new_recipe_from_following':
      case 'recipe_approved':
      case 'recipe_rejected':
        router.push(`/recipe/${relatedId}`);
        break;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'recipe_approved': return 'text-green-500 bg-green-50 border-green-200';
      case 'recipe_rejected': return 'text-red-500 bg-red-50 border-red-200';
      case 'new_follower': return 'text-teal-500 bg-teal-50 border-teal-200';
      case 'new_recipe_from_following': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'admin': return 'text-pink-500 bg-pink-50 border-pink-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'recipe_approved': return <CheckCircle className="w-7 h-7" />;
      case 'recipe_rejected': return <XCircle className="w-7 h-7" />;
      case 'new_follower': return <UserPlus className="w-7 h-7" />;
      case 'new_recipe_from_following': return <UtensilsCrossed className="w-7 h-7" />;
      case 'admin': return <Shield className="w-7 h-7" />;
      default: return <Bell className="w-7 h-7" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="w-6 h-6 text-white" />
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                >
                  <MoreVertical className="w-6 h-6 text-white" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        deleteAllNotifications();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus Semua
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/25 backdrop-blur-sm rounded-2xl border-2 border-white/50">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Notifikasi</h1>
              {unreadCount > 0 && (
                <span className="inline-block mt-1 px-3 py-1 bg-white rounded-full text-xs font-bold text-orange-500">
                  {unreadCount} baru
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-lg mb-6">
              <BellOff className="w-20 h-20 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Tidak ada notifikasi
            </h2>
            <p className="text-gray-500">
              Notifikasi akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const isRead = notification.is_read;
              const colorClasses = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    onClick={() => handleNotificationTap(notification)}
                    className={`
                      bg-white rounded-2xl p-4 cursor-pointer
                      transition-all duration-200 hover:shadow-lg
                      ${isRead ? 'border border-gray-200' : 'border-2 shadow-md'}
                      ${!isRead && colorClasses.split(' ')[2]}
                    `}
                  >
                    {!isRead && (
                      <div className={`absolute inset-0 ${colorClasses.split(' ')[1]} opacity-30 rounded-2xl pointer-events-none`} />
                    )}
                    
                    <div className="relative flex items-start gap-4">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses.split(' ').slice(0, 2).join(' ')} border-2`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-gray-900 ${!isRead && 'font-bold'}`}>
                            {notification.title}
                          </h3>
                          {!isRead && (
                            <div className={`w-3 h-3 rounded-full ${colorClasses.split(' ')[0].replace('text', 'bg')} flex-shrink-0 mt-1 shadow-lg`} />
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Hapus notifikasi ini?')) {
                            deleteNotification(notification.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}