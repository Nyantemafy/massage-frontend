import React, { useState } from 'react';
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
import { 
    Grid, 
    Calendar as CalendarLucide, 
    CreditCard, 
    CalendarX, 
    Users, 
    User, 
    LogOut 
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const CustomDrawer = ({ visible, onClose, navigation }) => {
    const { user, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
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
        { title: 'Tableau de bord', icon: Grid, screen: 'Dashboard' },
        { title: 'Emploi du temps', icon: CalendarLucide, screen: 'Schedule' },
        { title: 'Paiement', icon: CreditCard, screen: 'Payment' },
        { title: 'Congé', icon: CalendarX, screen: 'Leave' },
        { title: 'Clients', icon: Users, screen: 'Clients' },
        { title: 'Profil', icon: User, screen: 'Profile' },
    ];

    const handleNavigation = (screen) => {
        onClose();
        navigation.navigate(screen);
    };

    const handleLogout = async () => {
        setShowLogoutModal(false);
        onClose();
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={onClose}
            >
                {/* Supprimer TouchableWithoutFeedback ici pour permettre le défilement */}
                <View style={styles.modalOverlay}>
                    {/* TouchableWithoutFeedback seulement pour l'overlay */}
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>
                    
                    {/* Drawer animé - PAS de TouchableWithoutFeedback autour */}
                    <Animated.View 
                        style={[
                            styles.drawerContainer,
                            { transform: [{ translateX: slideAnim }] }
                        ]}
                    >
                        {/* Header avec bouton fermeture */}
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

                        {/* ScrollView pour le contenu défilable */}
                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            bounces={true}
                            scrollEnabled={true}
                        >
                            {/* Profile Section */}
                            <View style={styles.profileSection}>
                                <View style={styles.profileImageContainer}>
                                    <View style={styles.profileImage}>
                                        <User size={48} color="#F8A5C2" />
                                    </View>
                                </View>
                                <Text style={styles.userName}>
                                    {user?.first_name || 'Nom'} {user?.last_name || 'et prénom'}
                                </Text>
                                <Text style={styles.userRole}>
                                    {user?.role_name || 'role'}
                                </Text>
                            </View>

                            {/* Menu Items */}
                            <View style={styles.menuList}>
                                {menuItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.menuItem}
                                        onPress={() => handleNavigation(item.screen)}
                                    >
                                        <item.icon size={24} color="#666" />
                                        <Text style={styles.menuItemText}>{item.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Logout Button */}
                            <View style={styles.logoutContainer}>
                                <TouchableOpacity 
                                    style={styles.logoutButton}
                                    onPress={() => setShowLogoutModal(true)}
                                >
                                    <LogOut size={24} color="#DC143C" />
                                    <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Version de l'application */}
                            <Text style={styles.versionText}>Version 1.0.0</Text>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Modal de confirmation de déconnexion (inchangée) */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.confirmModalContainer}>
                                <View style={styles.confirmModalContent}>
                                    <View style={styles.confirmIconContainer}>
                                        <LogOut size={50} color="#DC143C" />
                                    </View>
                                    <Text style={styles.confirmTitle}>Déconnexion</Text>
                                    <Text style={styles.confirmMessage}>
                                        Êtes-vous sûr de vouloir vous déconnecter ?
                                    </Text>
                                    <View style={styles.confirmButtons}>
                                        <TouchableOpacity
                                            style={[styles.confirmButton, styles.cancelButton]}
                                            onPress={() => setShowLogoutModal(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Annuler</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.confirmButton, styles.confirmLogoutButton]}
                                            onPress={handleLogout}
                                        >
                                            <Text style={styles.confirmLogoutButtonText}>Se déconnecter</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'row',
    },
    drawerContainer: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    drawerHeader: {
        paddingTop: 40,
        paddingLeft: 15,
        paddingBottom: 10,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    profileSection: {
        backgroundColor: '#FFE5EF',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        marginBottom: 10,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    userRole: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        textTransform: 'lowercase',
    },
    menuList: {
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 15,
    },
    logoutContainer: {
        marginTop: 20,
        paddingTop: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    logoutButtonText: {
        fontSize: 16,
        color: '#DC143C',
        fontWeight: '600',
        marginLeft: 15,
    },
    versionText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    // Styles pour la modal de confirmation
    confirmModalContainer: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    confirmModalContent: {
        padding: 25,
        alignItems: 'center',
    },
    confirmIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFE5EF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    confirmMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    confirmLogoutButton: {
        backgroundColor: '#DC143C',
    },
    confirmLogoutButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default CustomDrawer;