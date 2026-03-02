import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from 'react-native';
import { 
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Camera,
  X,
  User,
  CheckCircle
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import CustomModal from '../../components/Modal';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLeaveCount } from '../../context/LeaveCountContext';

const ClientsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  
  // États pour les modals
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit, delete
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    photo: null,
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      Alert.alert('Erreur', 'Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients().finally(() => setRefreshing(false));
  };

  const handleAddClient = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      photo: null,
    });
    setModalType('add');
    setModalVisible(true);
  };

  const handleEditClient = (client) => {
    setFormData({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      phone: client.phone || '',
      email: client.email || '',
      photo: client.photo || null,
    });
    setSelectedClient(client);
    setModalType('edit');
    setModalVisible(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setModalType('delete');
    setModalVisible(true);
  };

  const selectImage = () => {
    // Pour le web, utiliser un input file
    if (typeof window !== 'undefined' && window.document) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setFormData({ 
              ...formData, 
              photo: {
                uri: event.target.result,
                type: file.type,
                name: file.name
              }
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Pour React Native mobile
      Alert.alert('Info', 'La sélection d\'image n\'est disponible que sur mobile');
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      
      if (formData.photo) {
        if (typeof formData.photo === 'string') {
          // Si c'est une URL existante, ne pas l'ajouter au FormData
        } else {
          // Nouvelle photo - convertir en Blob pour l'upload
          
          // Créer un Blob à partir de l'URI
          const response = await fetch(formData.photo.uri);
          const blob = await response.blob();
          
          data.append('photo', blob, 'photo.jpg');
        }
      } else {
      }

      if (modalType === 'add') {
        await api.post('/clients', data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Succès', 'Client ajouté avec succès');
      } else if (modalType === 'edit') {
        await api.put(`/clients/${selectedClient.id}`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Succès', 'Client modifié avec succès');
      }

      setModalVisible(false);
      loadClients();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le client');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${selectedClient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Client supprimé avec succès');
      setModalVisible(false);
      loadClients();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le client');
    }
  };

  const renderClientCard = (client) => (
    <View style={styles.clientCard} key={client.id}>
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <TouchableOpacity
            style={styles.clientTouchable}
            onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
          >
            {client.photo ? (
              <Image source={{ uri: client.photo }} style={styles.clientPhoto} />
            ) : (
              <View style={styles.clientPhotoPlaceholder}>
                <User size={24} color="#999" />
              </View>
            )}
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>
                {client.first_name} {client.last_name}
              </Text>
              <View style={styles.clientContact}>
                {client.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={14} color="#666" />
                    <Text style={styles.contactText}>{client.phone}</Text>
                  </View>
                )}
                {client.email && (
                  <View style={styles.contactRow}>
                    <Mail size={14} color="#666" />
                    <Text style={styles.contactText}>{client.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.clientActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditClient(client)}
          >
            <Edit size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteClient(client)}
          >
            <Trash2 size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Clients"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        rightIcon={<Plus size={24} color="#333" />}
        onRightPress={handleAddClient}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F8A5C2']}
            tintColor="#F8A5C2"
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
        ) : filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucun client trouvé</Text>
          </View>
        ) : (
          filteredClients.map(renderClientCard)
        )}
      </ScrollView>

      {/* Modal pour ajouter/modifier/supprimer */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {modalType === 'add' ? 'Ajouter un client' :
                     modalType === 'edit' ? 'Modifier un client' :
                     'Supprimer un client'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  {modalType === 'delete' ? (
                    <View style={styles.deleteContent}>
                      <Trash2 size={48} color="#F44336" />
                      <Text style={styles.deleteText}>
                        Êtes-vous sûr de vouloir supprimer {selectedClient?.first_name} {selectedClient?.last_name} ?
                      </Text>
                      <View style={styles.deleteActions}>
                        <TouchableOpacity
                          style={[styles.button, styles.cancelButton]}
                          onPress={() => setModalVisible(false)}
                        >
                          <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.confirmDeleteButton]}
                          onPress={handleDelete}
                        >
                          <Text style={styles.confirmDeleteButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.formContainer}>
                      {/* Photo */}
                      <View style={styles.photoSection}>
                        <TouchableOpacity style={styles.photoButton} onPress={selectImage}>
                          {formData.photo ? (
                            typeof formData.photo === 'string' ? (
                              <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
                            ) : (
                              <Image source={{ uri: formData.photo.uri }} style={styles.photoPreview} />
                            )
                          ) : (
                            <View style={styles.photoPlaceholder}>
                              <Camera size={32} color="#999" />
                              <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Formulaire */}
                      <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Prénom</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.first_name}
                            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                            placeholder="Entrez le prénom"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Nom</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.last_name}
                            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                            placeholder="Entrez le nom"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Téléphone</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            placeholder="Entrez le téléphone"
                            keyboardType="phone-pad"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Email</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            placeholder="Entrez l'email"
                            keyboardType="email-address"
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {modalType !== 'delete' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                      disabled={uploading}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.submitButton, uploading && styles.submitButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <CheckCircle size={16} color="#FFF" />
                          <Text style={styles.submitButtonText}>
                            {modalType === 'add' ? 'Ajouter' : 'Modifier'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  clientCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  clientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  clientPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  clientContact: {
    gap: 3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  clientActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8A5C2',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  formSection: {
    gap: 15,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  deleteContent: {
    alignItems: 'center',
    padding: 20,
  },
  deleteText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 15,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmDeleteButton: {
    backgroundColor: '#F44336',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#F8A5C2',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
});

export default ClientsScreen;
