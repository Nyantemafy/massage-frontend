import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Camera,
  User,
  X as Close,
  DollarSign,
  Briefcase,
  CheckCircle,
  Menu
} from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLeaveCount } from '../../context/LeaveCountContext';

const UserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const loadUser = async () => {
    try {
      const response = await api.get(`/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails de l'utilisateur"
          leftIcon={<Menu size={24} color="#333" />}
          onLeftPress={() => navigation.openDrawer()}
          showBack
          onBackPress={() => navigation.goBack()}
          extraRightIcon={true} 
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F8A5C2" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Détails de l'utilisateur"
        showBack
        onBackPress={() => navigation.goBack()}
        leftIcon={<Menu size={24} color="#333" />}
        onLeftPress={() => navigation.openDrawer()}
        rightIcon={<Edit size={24} color="#333" />}
        onRightPress={() => navigation.navigate('EditUser', { userId: userId })}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView style={styles.content}>
        {/* Photo principale */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={() => setPhotoModalVisible(true)}
            activeOpacity={0.8}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.mainPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <User size={48} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom complet</Text>
              <Text style={styles.infoValue}>
                {user.first_name} {user.last_name}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            
            {user.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rôle</Text>
              <Text style={styles.infoValue}>
                {user.role_id === 1 ? 'Admin' : user.role_id === 2 ? 'Masseur' : 'Client'}
              </Text>
            </View>
            
            {user.employee_status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Statut</Text>
                <Text style={[
                  styles.infoValue,
                  user.employee_status === 'active' ? styles.statusActive : styles.statusInactive
                ]}>
                  {user.employee_status === 'active' ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Informations professionnelles */}
        {user.role_id === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations professionnelles</Text>
            <View style={styles.infoCard}>
              {user.base_salary && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Salaire de base</Text>
                  <Text style={styles.infoValue}>{user.base_salary} €</Text>
                </View>
              )}
              
              {user.payment_day && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Jour de paiement</Text>
                  <Text style={styles.infoValue}>Le {user.payment_day} du mois</Text>
                </View>
              )}
              
              {user.contract_type && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type de contrat</Text>
                  <Text style={styles.infoValue}>{user.contract_type}</Text>
                </View>
              )}
              
              {user.hire_date && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date d'embauche</Text>
                  <Text style={styles.infoValue}>
                    {new Date(user.hire_date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditUser', { userId: userId })}
            >
              <Edit size={20} color="#666" />
              <Text style={styles.actionButtonText}>Modifier</Text>
            </TouchableOpacity>
            
            {user.role_id === 2 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('LeaveManagement', { userId: userId })}
              >
                <Calendar size={20} color="#666" />
                <Text style={styles.actionButtonText}>Congés</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Modal pour agrandir la photo */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.photoModalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoModalVisible(false)}
        >
          <View style={styles.photoModalContent}>
            <TouchableOpacity
              style={styles.closePhotoButton}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Close size={24} color="#FFF" />
            </TouchableOpacity>
            
            {user.avatar_url && (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={styles.zoomedPhoto}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    borderRadius: 60,
    overflow: 'hidden',
  },
  mainPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F8A5C2',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  // Styles pour le modal de photo
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePhotoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  zoomedPhoto: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  statusActive: {
    color: '#4CAF50',
  },
  statusInactive: {
    color: '#F44336',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 5,
  },
});

export default UserDetailScreen;
