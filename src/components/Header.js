// components/Header.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { 
  ChevronLeft,
  CalendarDays,
} from 'lucide-react-native';
import { NotificationHeader } from './NotificationHeader';
import { useAuth } from '../context/AuthContext';
import { useLeaveCount } from '../context/LeaveCountContext';
import { useNavigation } from '@react-navigation/native';

const Header = ({ 
  title, 
  onBackPress, 
  showBack = false,
  showMenu = false,
  onMenuPress,
  rightIcon,
  onRightPress,
  extraRightIcon,
  onExtraRightPress,
  badgeCount,
  showLeaveShortcut = true,
  showTodayShortcut = false,
  onTodayPress,
  style 
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const roleName = user?.role_name || user?.role;
  const isManager = roleName === 'admin' || roleName === 'manager';
  const resolvedBadgeCount = typeof badgeCount === 'number' ? badgeCount : pendingLeaveCount;

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity 
            onPress={onBackPress}
            style={styles.backButton}
          >
            <View style={styles.iconContainer}>
              <ChevronLeft size={24} color="#333" />
            </View>
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity 
            onPress={onMenuPress}
            style={styles.menuButton}
          >
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/icone/app.png')}
                style={styles.menuIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.rightContainer}>
        <NotificationHeader />

        {showTodayShortcut && (
          <TouchableOpacity 
            onPress={onTodayPress || (() => navigation.navigate('TodayAppointments'))}
            style={styles.rightIconButton}
          >
            <View style={[styles.rightIconContainer, styles.shortcutContainer]}>
              <CalendarDays size={20} color="#333" />
            </View>
          </TouchableOpacity>
        )}
        
        {isManager && showLeaveShortcut && extraRightIcon && (
          <TouchableOpacity 
            onPress={onExtraRightPress || (() => navigation.navigate('LeavePending'))} 
            style={styles.rightIconButton}
          >
            <View style={[styles.rightIconContainer, styles.shortcutContainer]}>
              <Image 
                source={require('../../assets/icone/cong-you-bing.png')}
                style={styles.rightIcon}
                resizeMode="contain"
              />
              {resolvedBadgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {resolvedBadgeCount > 99 ? '99+' : resolvedBadgeCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightPress} 
            style={styles.rightIconButton}
          >
            {typeof rightIcon === 'string' ? (
              <View style={styles.rightIconContainer}>
                <Image 
                  source={{ uri: rightIcon }}
                  style={styles.rightIcon}
                  resizeMode="contain"
                />
              </View>
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftContainer: {
    width: 50,
  },
  rightContainer: {
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  backButton: {
    padding: 5,
  },
  menuButton: {
    padding: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F8A5C2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shortcutContainer: {
    backgroundColor: '#FFF6FA',
    borderWidth: 1,
    borderColor: '#F4D6E1',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#333', // Optionnel: pour appliquer une couleur à l'icône
  },
  rightIcon: {
    width: 24,
    height: 24,
    tintColor: '#333', // Optionnel: pour appliquer une couleur à l'icône
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  rightIconButton: {
    padding: 5,
  },
});

export default Header;
