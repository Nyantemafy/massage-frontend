import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Bell,
  X,
  Check,
  DollarSign,
  AlertCircle,
  Briefcase,
  CalendarCheck2,
  CalendarX2,
  CalendarClock,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const NotificationDropdown = ({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onNotificationPress,
  roleLabel,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <DollarSign size={16} color="#F59E0B" />;
      case 'salary_paid':
        return <Briefcase size={16} color="#16A34A" />;
      case 'leave_request':
        return <CalendarClock size={16} color="#8B5CF6" />;
      case 'leave_approved':
        return <CalendarCheck2 size={16} color="#16A34A" />;
      case 'leave_rejected':
        return <CalendarX2 size={16} color="#EF4444" />;
      case 'leave_pending':
        return <CalendarClock size={16} color="#F59E0B" />;
      default:
        return <Bell size={16} color="#666" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <View>
              <Text style={styles.dropdownTitle}>Notifications</Text>
              <Text style={styles.dropdownSubtitle}>{roleLabel}</Text>
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllReadButton} onPress={onMarkAllAsRead}>
                  <Text style={styles.markAllReadText}>Tout lire</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={44} color="#CCC" />
                <Text style={styles.emptyText}>Aucune notification</Text>
                <Text style={styles.emptySubtext}>Les alertes utiles à votre rôle apparaîtront ici.</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.unreadNotification,
                  ]}
                  onPress={() => onNotificationPress(notification)}
                >
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.is_read && styles.unreadTitle,
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.created_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.notificationMessage,
                        !notification.is_read && styles.unreadMessage,
                      ]}
                    >
                      {notification.message}
                    </Text>
                  </View>
                  {!notification.is_read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const NotificationHeader = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const roleName = user?.role_name || user?.role;

  const roleLabel = useMemo(() => {
    if (roleName === 'admin' || roleName === 'manager') {
      return 'Paiements employés et activités importantes';
    }
    if (roleName === 'masseuse') {
      return 'Salaire, congés et suivi de vos activités';
    }
    return 'Notifications personnelles';
  }, [roleName]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications?limit=8');
      setNotifications(response.data.notifications || []);
      setUnreadCount(Number(response.data.unread_count || 0));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications, user?.id]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    setShowDropdown(false);

    if (notification.type === 'payment') {
      navigation.navigate('HistoriquePaiement');
      return;
    }

    if (notification.type === 'salary_paid') {
      if (roleName === 'admin' || roleName === 'manager') {
        navigation.navigate('EntrerCharge');
      } else {
        navigation.navigate('HistoriquePaiement');
      }
      return;
    }

    if (
      notification.type === 'leave_approved' ||
      notification.type === 'leave_rejected' ||
      notification.type === 'leave_pending' ||
      notification.type === 'leave_request'
    ) {
      if (roleName === 'admin' || roleName === 'manager') {
        navigation.navigate('LeavePending');
      } else {
        navigation.navigate('Leave');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.bellButton} onPress={() => setShowDropdown(true)}>
        <Bell size={22} color="#333" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={markAllAsRead}
        onNotificationPress={handleNotificationPress}
        roleLabel={roleLabel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bellButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFF6FA',
    borderWidth: 1,
    borderColor: '#F4D6E1',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    width: width * 0.9,
    maxWidth: 420,
    maxHeight: height * 0.72,
    borderRadius: 16,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllReadButton: {
    backgroundColor: '#F8A5C2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  markAllReadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#FFF7FA',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F8A5C2',
    marginLeft: 8,
  },
});

export { NotificationHeader, NotificationDropdown };
