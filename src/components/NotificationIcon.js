import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Bell } from 'lucide-react-native';

const NotificationIcon = ({ count, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Bell size={24} color="#333" />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default NotificationIcon;
