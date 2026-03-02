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
} from 'react-native';
import { 
  ArrowLeft,
  Camera,
  Save,
  X,
  User
} from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLeaveCount } from '../../context/LeaveCountContext';

const EditClientScreen = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    photo: null,
  });

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
      const client = response.data;
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        email: client.email || '',
        photo: client.photo || null,
      });
    } catch (error) {
      console.error('Erreur chargement client:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du client');
    } finally {
      setLoading(false);
    }
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
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name.trim());
      data.append('last_name', formData.last_name.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      
      if (formData.photo) {
        if (typeof formData.photo === 'string') {
          // Si c'est une URL existante, ne pas l'ajouter
        } else {
          // Nouvelle photo - convertir en Blob pour l'upload
          
          // Créer un Blob à partir de l'URI
          const response = await fetch(formData.photo.uri);
          const blob = await response.blob();
          
          data.append('photo', blob, 'photo.jpg');
        }
      } 

      await api.put(`/clients/${clientId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Succès', 'Client modifié avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de modifier le client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Modifier le client"
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
        title="Modifier le client"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={<Save size={24} color="#333" />}
        onRightPress={handleSubmit}
        rightDisabled={saving}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView style={styles.content}>
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
            <Text style={styles.label}>Email</Text>
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
        </View>

        {/* Bouton de sauvegarde */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Save size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8A5C2',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    gap: 20,
  },
  inputGroup: {
    gap: 8,
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
  saveSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  saveButton: {
    backgroundColor: '#F8A5C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default EditClientScreen;
