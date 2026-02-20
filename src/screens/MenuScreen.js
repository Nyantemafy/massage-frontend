import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LayoutGrid, Calendar, CreditCard, CalendarOff, Users, User, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const MenuScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { title: 'Tableau de bord', icon: LayoutGrid, screen: 'Dashboard' },
    { title: 'Emploi du temps', icon: Calendar, screen: 'Schedule' },
    { title: 'Paiement', icon: CreditCard, screen: 'Payment' },
    { title: 'Conge', icon: CalendarOff, screen: 'Leave' },
    { title: 'Clients', icon: Users, screen: 'Clients' },
    { title: 'Profil', icon: User, screen: 'Profile' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <User size={48} color="#999" />
            </View>
          </View>
          <Text style={styles.userName}>Nom et prenom</Text>
          <Text style={styles.userRole}>role</Text>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8A5C2',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#999',
  },
  menuList: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: {
    margin: 20,
    marginTop: 30,
    padding: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DC143C',
    backgroundColor: '#FFF',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MenuScreen;
