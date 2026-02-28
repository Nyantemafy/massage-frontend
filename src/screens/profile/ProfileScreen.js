import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { 
  ArrowLeft,
  Camera,
  Save,
  Edit2,
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  User,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/Header';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: null,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || null,
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
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

  const handleSaveProfile = async () => {
    if (saving) return;
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let data = new FormData();
      
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone || '');
      
      // TOUJOURS uploader la photo si elle existe
      if (formData.avatar_url) {
        if (typeof formData.avatar_url === 'string') {
          // Si c'est une URL existante, la convertir en blob pour l'upload
          console.log('📸 Photo existante, conversion pour upload');
          const response = await fetch(formData.avatar_url);
          const blob = await response.blob();
          data.append('avatar_url', blob, 'avatar.jpg');
        } else {
          // Nouvelle photo sélectionnée
          console.log('📤 Nouvelle photo à uploader:', formData.avatar_url);
          const response = await fetch(formData.avatar_url.uri);
          const blob = await response.blob();
          data.append('avatar_url', blob, 'avatar.jpg');
        }
      }

      const response = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        Alert.alert('Succès', 'Profil mis à jour');
        setEditing(false);
        loadUserProfile();
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Impossible de charger le profil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Mon Profil" 
        showBack={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          !editing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Edit2 size={20} color="#007AFF" />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Photo et Infos principales */}
        <View style={styles.profileHeader}>
          <View style={styles.photoSection}>
            {editing ? (
              <View style={styles.photoEditContainer}>
                {formData.avatar_url ? (
                  <View style={styles.photoPreviewContainer}>
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
                      onPress={handleDeletePhoto}
                    >
                      <X size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
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
            ) : (
              <View style={styles.photoDisplayContainer}>
                {user.avatar_url ? (
                  <Image 
                    source={{ 
                      uri: user.avatar_url.startsWith('http') 
                        ? user.avatar_url 
                        : `http://localhost:3000${user.avatar_url}` 
                    }} 
                    style={styles.userPhoto} 
                  />
                ) : (
                  <View style={styles.userPhotoPlaceholder}>
                    <User size={40} color="#999" />
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.userInfos}>
            {editing ? (
              <View style={styles.nameEditContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                  placeholder="Prénom"
                  editable={!saving}
                />
                <TextInput
                  style={styles.nameInput}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                  placeholder="Nom"
                  editable={!saving}
                />
              </View>
            ) : (
              <>
                <Text style={styles.userName}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </>
            )}
          </View>
        </View>

        {/* Section Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de contact</Text>
          
          <View style={styles.infoRow}>
            <Mail size={20} color="#666" />
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email"
                keyboardType="email-address"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoText}>{user.email}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Phone size={20} color="#666" />
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Téléphone"
                keyboardType="phone-pad"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoText}>{user.phone || 'Non renseigné'}</Text>
            )}
          </View>
        </View>

        {/* Section Actions */}
        {!editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color="#666" />
              <Text style={styles.actionText}>Paramètres</Text>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <LogOut size={20} color="#FF3B30" />
              <Text style={[styles.actionText, styles.logoutText]}>Déconnexion</Text>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Boutons d'action pour l'édition */}
      {editing && (
        <View style={styles.editActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setEditing(false);
              setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar_url: user.avatar_url || null,
              });
            }}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Save size={20} color="#FFF" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoEditContainer: {
    alignItems: 'center',
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
  photoDisplayContainer: {
    alignItems: 'center',
  },
  userPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  userInfos: {
    alignItems: 'center',
  },
  nameEditContainer: {
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 4,
    minWidth: 200,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutText: {
    color: '#FF3B30',
  },
  editActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ProfileScreen;
