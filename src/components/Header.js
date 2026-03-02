// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

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
  style 
}) => {
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
        {/* Premier icône à droite (optionnel) */}
        {extraRightIcon && (
          <TouchableOpacity 
            onPress={onExtraRightPress} 
            style={styles.rightIconButton}
          >
            <View style={styles.rightIconContainer}>
              <Image 
                source={require('../../assets/icone/cong-you-bing.png')}
                style={styles.rightIcon}
                resizeMode="contain"
              />
              {/* Badge de compteur */}
              {badgeCount && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {/* Deuxième icône à droite (rightIcon original) */}
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
    width: 100, // Augmenté pour accueillir deux icônes
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