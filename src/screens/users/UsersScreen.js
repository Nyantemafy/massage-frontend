import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import {
  Search,
  Plus,
  Edit2,
  X,
  Camera,
  Edit,
  Trash2,
  ChevronDown,
  Bell,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldX,
  Filter,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker from 'react-native-image-picker';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { useLeaveCount } from '../../context/LeaveCountContext';

const UsersScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  
  // États pour les modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit, delete
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    role_id: '',
    base_salary: '',
    payment_day: '5',
    employee_status: 'active',
    contract_type: '',
    hire_date: '',
    avatar_url: null,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par rôle
    if (filters.role) {
      filtered = filtered.filter(user => user.role_id?.toString() === filters.role);
    }

    // Filtrer par statut
    if (filters.status) {
      filtered = filtered.filter(user => user.employee_status === filters.status);
    }

    setFilteredUsers(filtered);
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      email: user.email || '',
      password: '',
      role_id: user.role_id?.toString() || '',
      base_salary: user.base_salary?.toString() || '',
      payment_day: user.payment_day?.toString() || '5',
      employee_status: user.employee_status || 'active',
      contract_type: user.contract_type || '',
      hire_date: user.hire_date || '',
      avatar_url: user.avatar_url || null,
    });
    setModalType('edit');
    setModalVisible(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setModalType('delete');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      Alert.alert('Erreur', 'Le nom, prénom et email sont obligatoires');
      return;
    }

    if (!formData.role_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name.trim());
      data.append('last_name', formData.last_name.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      data.append('role_id', formData.role_id);
      data.append('employee_status', formData.employee_status);
      
      if (formData.role_id === '2') { // Masseur
        data.append('base_salary', formData.base_salary || '0');
        data.append('payment_day', formData.payment_day || '5');
        data.append('contract_type', formData.contract_type || '');
        data.append('hire_date', formData.hire_date || '');
      }
      
      if (formData.password) {
        data.append('password', formData.password);
      }
      
      if (formData.avatar_url) {
        if (typeof formData.avatar_url === 'string') {
          // Si c'est une URL existante, la convertir en blob pour l'upload
          const response = await fetch(formData.avatar_url);
          const blob = await response.blob();
          data.append('avatar_url', blob, 'avatar.jpg');
        } else {
          // Nouvelle photo sélectionnée
          const response = await fetch(formData.avatar_url.uri);
          const blob = await response.blob();
          data.append('avatar_url', blob, 'avatar.jpg');
        }
      }

      if (modalType === 'add') {
        await api.post('/users', data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Succès', 'Utilisateur ajouté avec succès');
      } else if (modalType === 'edit') {
        await api.put(`/users/${selectedUser.id}`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Succès', 'Utilisateur modifié avec succès');
      }

      setModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'utilisateur');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Utilisateur supprimé');
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setFormData({
          ...formData,
          avatar_url: result.assets[0]
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const handleDeletePhoto = () => {
    setFormData({
      ...formData,
      avatar_url: null
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };
            const renderUserCard = (user) => (
    <View style={styles.userCard} key={user.id}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.userTouchable}
            onPress={() => handleEditUser(user)}
          >
            {user.avatar_url ? (
              <Image 
                source={{ 
                  uri: user.avatar_url.startsWith('http') 
                        ? user.avatar_url 
                        : `${api.defaults.baseURL.replace('/api', '')}${user.avatar_url}` 
                }} 
                style={styles.userPhoto} 
              />
            ) : (
              <View style={styles.userPhotoPlaceholder}>
                <User size={24} color="#999" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user.first_name} {user.last_name}
              </Text>
              <View style={styles.userContact}>
                {user.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={14} color="#666" />
                    <Text style={styles.contactText}>{user.phone}</Text>
                  </View>
                )}
                {user.email && (
                  <View style={styles.contactRow}>
                    <Mail size={14} color="#666" />
                    <Text style={styles.contactText}>{user.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditUser(user)}
          >
            <Edit size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(user)}
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
        title="Utilisateurs"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        rightIcon={<Bell size={24} color="#333" />}
        onRightPress={() => {}}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount} // Utilise le contexte partagé
      />

      {/* Barre de recherche et filtres */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setModalType('add');
            setSelectedUser(null);
            setFormData({
              first_name: '',
              last_name: '',
              phone: '',
              email: '',
              password: '',
              role_id: '',
              base_salary: '',
              payment_day: '5',
              employee_status: 'active',
              contract_type: '',
              hire_date: '',
              avatar_url: null,
            });
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Rôle</Text>
            <View style={styles.filterOptions}>
              {['', '1', '2', '3'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterOption,
                    filters.role === role && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters({ ...filters, role })}
                >
                  <Text style={styles.filterOptionText}>
                    {role === '' ? 'Tous' : role === '1' ? 'Admin' : role === '2' ? 'Masseur' : 'Client'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Statut</Text>
            <View style={styles.filterOptions}>
              {['', 'active', 'inactive'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filters.status === status && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters({ ...filters, status })}
                >
                  <Text style={styles.filterOptionText}>
                    {status === '' ? 'Tous' : status === 'active' ? 'Actif' : 'Inactif'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Liste des utilisateurs */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F8A5C2" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.usersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <User size={48} color="#CCC" />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
          ) : (
            filteredUsers.map(renderUserCard)
          )}
        </ScrollView>
      )}

      {/* Modal pour ajouter/modifier/utilisateur */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'add' ? 'Ajouter un utilisateur' : 
                   modalType === 'edit' ? 'Modifier un utilisateur' : 
                   'Supprimer un utilisateur'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {modalType !== 'delete' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Photo de profil</Text>
                      <View style={styles.photoContainer}>
                        {formData.avatar_url ? (
                          <TouchableOpacity
                            style={styles.photoPreviewContainer}
                            onPress={handleImagePicker}
                            disabled={saving}
                          >
                            <Image 
                              source={{ 
                                uri: typeof formData.avatar_url === 'string' 
                                  ? formData.avatar_url 
                                  : formData.avatar_url.uri 
                              }} 
                              style={styles.photoPreview} 
                            />
                            <TouchableOpacity
                              style={styles.deletePhotoButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto();
                              }}
                            >
                              <X size={16} color="#FFF" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.photoUploadButton}
                            onPress={handleImagePicker}
                            disabled={saving}
                          >
                            <Camera size={24} color="#666" />
                            <Text style={styles.photoUploadText}>
                              Ajouter une photo
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Prénom *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.first_name}
                        onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                        placeholder="Entrez le prénom"
                        editable={!saving}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nom *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.last_name}
                        onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                        placeholder="Entrez le nom"
                        editable={!saving}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        placeholder="Entrez l'email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!saving}
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
                        editable={!saving}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Mot de passe</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        placeholder="Entrez le mot de passe"
                        secureTextEntry={true}
                        editable={!saving}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Rôle *</Text>
                      <View style={styles.roleOptions}>
                        {['', '1', '2', '3'].map(role => (
                          <TouchableOpacity
                            key={role}
                            style={[
                              styles.roleOption,
                              formData.role_id === role && styles.roleOptionActive
                            ]}
                            onPress={() => setFormData({ ...formData, role_id: role })}
                          >
                            <Text style={styles.roleOptionText}>
                              {role === '' ? 'Tous' : role === '1' ? 'Admin' : role === '2' ? 'Masseur' : 'Client'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {formData.role_id === '2' && (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Statut employé</Text>
                          <View style={styles.roleOptions}>
                            {['', 'active', 'inactive'].map(status => (
                              <TouchableOpacity
                                key={status}
                                style={[
                                  styles.roleOption,
                                  formData.employee_status === status && styles.roleOptionActive
                                ]}
                                onPress={() => setFormData({ ...formData, employee_status: status })}
                              >
                                <Text style={styles.roleOptionText}>
                                  {status === '' ? 'Tous' : status === 'active' ? 'Actif' : 'Inactif'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Salaire de base</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.base_salary}
                            onChangeText={(text) => setFormData({ ...formData, base_salary: text })}
                            placeholder="Entrez le salaire de base"
                            keyboardType="numeric"
                            editable={!saving}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Jour de paiement</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.payment_day}
                            onChangeText={(text) => setFormData({ ...formData, payment_day: text })}
                            placeholder="Jour du mois (1-31)"
                            keyboardType="numeric"
                            editable={!saving}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Type de contrat</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.contract_type}
                            onChangeText={(text) => setFormData({ ...formData, contract_type: text })}
                            placeholder="Entrez le type de contrat"
                            editable={!saving}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Date d'embauche</Text>
                          <TextInput
                            style={styles.input}
                            value={formData.hire_date}
                            onChangeText={(text) => setFormData({ ...formData, hire_date: text })}
                            placeholder="AAAA-MM-JJ"
                            editable={!saving}
                          />
                        </View>
                      </>
                    )}
                  </>
                )}

                {modalType === 'delete' && (
                  <View style={styles.deleteContent}>
                    <View style={styles.deleteIcon}>
                      <AlertTriangle size={48} color="#F44336" />
                    </View>
                    <Text style={styles.deleteMessage}>
                      Êtes-vous sûr de vouloir supprimer {selectedUser?.first_name} {selectedUser?.last_name} ?
                    </Text>
                    <Text style={styles.deleteSubMessage}>
                      Cette action est irréversible
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Boutons d'action */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                {modalType !== 'delete' && (
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton, saving && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFF" />
                        <Text style={styles.submitButtonText}>
                          {modalType === 'add' ? 'Ajouter' : 'Modifier'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {modalType === 'delete' && (
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDeleteConfirm}
                  >
                    <Trash2 size={16} color="#FFF" />
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      <CustomDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8, 
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8A5C2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F8A5C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionActive: {
    backgroundColor: '#F8A5C2',
    borderColor: '#F8A5C2',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  usersList: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  userTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  // Styles pour les photos dans le modal
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoUploadText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  userContact: {
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
  userActions: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleOptionActive: {
    backgroundColor: '#F8A5C2',
    borderColor: '#F8A5C2',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  deleteContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  deleteIcon: {
    marginBottom: 20,
  },
  deleteMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#F8A5C2',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default UsersScreen;
