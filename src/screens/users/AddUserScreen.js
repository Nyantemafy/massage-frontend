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
  Plus,
  User
} from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const AddUserScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  
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
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
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
              avatar_url: {
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
      data.append('password', formData.password);
      data.append('role_id', formData.role_id);
      data.append('employee_status', formData.employee_status);
      
      if (formData.role_id === '2') { // Masseur
        data.append('base_salary', formData.base_salary || '0');
        data.append('payment_day', formData.payment_day || '5');
        data.append('contract_type', formData.contract_type || '');
        data.append('hire_date', formData.hire_date || '');
      }
      
      if (formData.avatar_url) {
        // Nouvelle photo - convertir en Blob pour l'upload
        console.log('📤 Nouvelle photo à uploader (Add User):', formData.avatar_url);
        
        const response = await fetch(formData.avatar_url.uri);
        const blob = await response.blob();
        
        data.append('avatar_url', blob, 'avatar.jpg');
      } else {
        console.log('📷 Aucune photo dans AddUser');
      }

      await api.post('/users', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Succès', 'Utilisateur ajouté avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'utilisateur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Ajouter un utilisateur"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={<Save size={24} color="#333" />}
        onRightPress={handleSubmit}
        rightDisabled={saving}
      />

      <ScrollView style={styles.content}>
        {/* Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton} onPress={selectImage}>
            {formData.avatar_url ? (
              <Image source={{ uri: formData.avatar_url.uri }} style={styles.photoPreview} />
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
              {roles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleOption,
                    formData.role_id === role.id.toString() && styles.roleOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, role_id: role.id.toString() })}
                >
                  <Text style={styles.roleOptionText}>{role.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.role_id === '2' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Statut employé</Text>
                <View style={styles.roleOptions}>
                  {['active', 'inactive'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.roleOption,
                        formData.employee_status === status && styles.roleOptionActive
                      ]}
                      onPress={() => setFormData({ ...formData, employee_status: status })}
                    >
                      <Text style={styles.roleOptionText}>
                        {status === 'active' ? 'Actif' : 'Inactif'}
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
                <Plus size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Ajouter l'utilisateur</Text>
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

export default AddUserScreen;
