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
  X as Close
} from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLeaveCount } from '../../context/LeaveCountContext';

const ClientDetailScreen = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const loadClient = async () => {
    try {
      const response = await api.get(`/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClient(response.data);
    } catch (error) {
      console.error('Erreur chargement client:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du client');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails du client"
          showBack
          onBackPress={() => navigation.goBack()}
          extraRightIcon={true} 
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails du client"
          showBack
          onBackPress={() => navigation.goBack()}
          extraRightIcon={true} 
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client non trouvé</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Détails du client"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={<Edit size={24} color="#333" />}
        onRightPress={() => navigation.navigate('EditClient', { clientId: clientId })}
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
            {client.photo ? (
              <Image source={{ uri: client.photo }} style={styles.mainPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <User size={48} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Informations principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom complet</Text>
              <Text style={styles.infoValue}>
                {client.first_name} {client.last_name}
              </Text>
            </View>
            
            {client.phone && (
              <View style={styles.infoRow}>
                <Phone size={16} color="#666" />
                <Text style={styles.infoValue}>{client.phone}</Text>
              </View>
            )}
            
            {client.email && (
              <View style={styles.infoRow}>
                <Mail size={16} color="#666" />
                <Text style={styles.infoValue}>{client.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Informations additionnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={16} color="#666" />
              <Text style={styles.infoLabel}>Date d'inscription</Text>
              <Text style={styles.infoValue}>
                {new Date(client.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre de rendez-vous</Text>
              <Text style={styles.infoValue}>{client.appointments_count || 0}</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditClient', { clientId: clientId })}
            >
              <Edit size={20} color="#666" />
              <Text style={styles.actionButtonText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AppointmentForm', { clientId: clientId })}
            >
              <Calendar size={20} color="#666" />
              <Text style={styles.actionButtonText}>Prendre rendez-vous</Text>
            </TouchableOpacity>
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
            
            {client.photo && (
              <Image 
                source={{ uri: client.photo }} 
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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

export default ClientDetailScreen;
