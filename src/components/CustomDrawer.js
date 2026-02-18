import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const CustomDrawer = ({ visible, onClose, navigation }) => {
    const { user, logout } = useAuth();
    const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const menuItems = [
        { title: 'Tableau de bord', icon: 'grid-outline', screen: 'Dashboard' },
        { title: 'Emploi du temps', icon: 'calendar-outline', screen: 'Schedule' },
        { title: 'Paiement', icon: 'card-outline', screen: 'Payment' },
        { title: 'Conge', icon: 'calendar-clear-outline', screen: 'Leave' },
        { title: 'Clients', icon: 'people-outline', screen: 'Clients' },
        { title: 'Profil', icon: 'person-outline', screen: 'Profile' },
    ];

    const handleNavigation = (screen) => {
        onClose();
        navigation.navigate(screen);
    };

    const handleLogout = async () => {
        onClose();
        await logout();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View 
                            style={[
                                styles.drawerContainer,
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                        >
                            {/* En-tête du drawer avec icône de fermeture */}
                            <View style={styles.drawerHeader}>
                                <TouchableOpacity 
                                    onPress={onClose}
                                    style={styles.closeButton}
                                >
                                    <Image 
                                        source={require('../../assets/icone/rec.png')}
                                        style={styles.closeIcon}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.profileSection}>
                                    <View style={styles.profileImageContainer}>
                                        <View style={styles.profileImage}>
                                            <Ionicons name="person" size={48} color="#999" />
                                        </View>
                                    </View>
                                    <Text style={styles.userName}>
                                        {user?.first_name} {user?.last_name}
                                    </Text>
                                    <Text style={styles.userRole}>
                                        {user?.role_name || 'Masseuse'}
                                    </Text>
                                </View>

                                <View style={styles.menuList}>
                                    {menuItems.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.menuItem}
                                            onPress={() => handleNavigation(item.screen)}
                                        >
                                            <Ionicons name={item.icon} size={24} color="#666" />
                                            <Text style={styles.menuItemText}>{item.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity 
                                    style={styles.logoutButton}
                                    onPress={handleLogout}
                                >
                                    <Ionicons name="log-out-outline" size={24} color="#DC143C" />
                                    <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawerContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    drawerHeader: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    closeIcon: {
        width: 24,
        height: 24,
        tintColor: '#333',
    },
    profileSection: {
        backgroundColor: '#FFE5EF',
        alignItems: 'center',
        paddingTop: 60, // Augmenté pour faire de la place à l'icône de fermeture
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    profileImageContainer: {
        marginBottom: 15,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
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
        color: '#666',
    },
    menuList: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        marginTop: 30,
        padding: 15,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#DC143C',
        backgroundColor: '#FFF',
    },
    logoutButtonText: {
        fontSize: 16,
        color: '#DC143C',
        fontWeight: '600',
        marginLeft: 15,
    },
});

export default CustomDrawer;