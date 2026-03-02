import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { 
  FileText,
  AlertTriangle,
  Calendar,
  Save,
  Bell,
  LogOut,
  ChevronRight,
  Info,
  CheckCircle,
  Flower2,
  Clock,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import CustomModal from '../../components/Modal';
import CustomDrawer from '../../components/CustomDrawer';
import SearchableDropdown from '../../components/SearchableDropdown';
import api from '../../config/api';
import { useLeaveCount } from '../../context/LeaveCountContext';

// Import conditionnel du DatePicker
let DateTimePicker;
if (Platform.OS === 'web') {
  // Pour le web, on utilisera un input de type date
  DateTimePicker = ({ value, onChange, min, style, ...props }) => (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      style={{
        width: '100%',
        padding: '15px',
        fontSize: '16px',
        border: '1px solid #E0E0E0',
        borderRadius: '10px',
        fontFamily: 'inherit',
        ...style
      }}
    />
  );
} else {
  // Pour mobile, on utilise la bibliothèque native
  const RNDateTimePicker = require('react-native-modal-datetime-picker').default;
  DateTimePicker = RNDateTimePicker;
}

const LeaveRequestScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { pendingLeaveCount } = useLeaveCount();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [balances, setBalances] = useState([]);
  
  // État pour la modal de succès
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // États pour les modales d'erreur
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadLeaveTypes(), loadBalances(), loadUsers()]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/users');
      
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/types');
      
      if (response.status === 200) {
        setLeaveTypes(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
    }
  };

  const loadBalances = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/balances');
      
      if (response.status === 200) {
        setBalances(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement soldes:', error);
    }
  };

  const getAvailableBalance = (typeId) => {
    const balance = balances.find(b => b.leave_type_id === typeId);
    if (balance) {
      return balance.total_days - balance.used_days - balance.pending_days;
    }
    return 0;
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const validateForm = () => {
    if (!selectedType) {
      showErrorModal('Veuillez sélectionner un type de congé');
      return false;
    }
    
    if (!startDate) {
      showErrorModal('Veuillez sélectionner une date de début');
      return false;
    }
    
    if (!endDate) {
      showErrorModal('Veuillez sélectionner une date de fin');
      return false;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      showErrorModal('La date de début doit être antérieure à la date de fin');
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(startDate) < today) {
      showErrorModal('La date de début ne peut pas être dans le passé');
      return false;
    }
    
    const requestedDays = calculateDays();
    const availableDays = getAvailableBalance(selectedType);
    
    if (requestedDays > availableDays) {
      showErrorModal(`Vous n'avez que ${availableDays} jour(s) disponible(s) pour ce type de congé`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (loading) return;
    
    if (!selectedType || !startDate || !endDate) {
      showErrorModal('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (new Date(startDate) < new Date().setHours(0,0,0,0)) {
      showErrorModal('La date de début ne peut pas être dans le passé');
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      showErrorModal('La date de fin ne peut pas être avant la date de début');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const requestData = {
        leave_type_id: selectedType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
        user_id: selectedUser
      };
      
      
      const response = await api.post('/leave/requests', requestData);     
      
      if (response.status === 201) {
        setSuccessModalVisible(true);
      } else {
        showErrorModal(response.data.message || 'Impossible d\'envoyer la demande');
      }
    } catch (error) {
      console.error('Erreur envoi demande:', error);
      showErrorModal('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour le Date Picker (mobile uniquement)
  const showDatePicker = (mode) => {
    if (Platform.OS !== 'web') {
      setDatePickerMode(mode);
      setDatePickerVisibility(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    const dateString = date.toISOString().split('T')[0];
    
    if (datePickerMode === 'start') {
      setStartDate(dateString);
      // Si la date de fin est avant la nouvelle date de début, ajuster
      if (endDate && new Date(endDate) < date) {
        setEndDate(dateString);
      }
    } else {
      setEndDate(dateString);
      // Si la date de début est après la nouvelle date de fin, ajuster
      if (startDate && new Date(startDate) > date) {
        setStartDate(dateString);
      }
    }
    
    hideDatePicker();
  };

  // Gestionnaire pour le web
  const handleWebDateChange = (value, mode) => {
    if (mode === 'start') {
      setStartDate(value);
      // Si la date de fin est avant la nouvelle date de début, ajuster
      if (endDate && new Date(endDate) < new Date(value)) {
        setEndDate(value);
      }
    } else {
      setEndDate(value);
      // Si la date de début est après la nouvelle date de fin, ajuster
      if (startDate && new Date(startDate) > new Date(value)) {
        setStartDate(value);
      }
    }
  };

  // Obtenir la date minimum pour le picker
  const getMinimumDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (datePickerMode === 'start') {
      return today;
    } else {
      // Pour la date de fin, minimum = date de début ou aujourd'hui
      if (startDate) {
        return new Date(startDate);
      }
      return today;
    }
  };

  // Obtenir la date par défaut pour le picker
  const getDefaultDate = () => {
    if (datePickerMode === 'start') {
      if (startDate) {
        return new Date(startDate);
      } else {
        // Par défaut : aujourd'hui + 1 jour
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
      }
    } else {
      if (endDate) {
        return new Date(endDate);
      } else if (startDate) {
        // Par défaut : date de début + 1 jour
        const date = new Date(startDate);
        date.setDate(date.getDate() + 1);
        return date;
      } else {
        // Par défaut : aujourd'hui + 2 jours
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date;
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleModalClose = () => {
    setSuccessModalVisible(false);
    navigation.goBack();
  };

  const handleErrorModalClose = () => {
    setErrorModalVisible(false);
    setErrorMessage('');
  };

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  // Fonctions pour SearchableDropdown
  const fetchLeaveTypes = async (search = '') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/types');
      
      if (response.status === 200) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur chargement types:', error);
      return [];
    }
  };

  const createNewLeaveType = async (newType) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.post('/leave/types', {
        name: newType,
        description: `Type de congé: ${newType}`,
        max_days_per_year: 30,
        requires_document: false,
        color: '#F8A5C2'
      });
      
      if (response.status === 201) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur création type:', error);
      return null;
    }
  };

  const handleLeaveTypeSelect = (type) => {
    setSelectedType(type.id);
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  // Fonctions pour la gestion des utilisateurs
  const fetchUsers = async (search = '') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/users?search=${encodeURIComponent(search)}`);
      
      if (response.status === 200) {
        // Ajouter un champ display pour un meilleur affichage
        return response.data.map(user => ({
          ...user,
          display: `${user.first_name} ${user.last_name}`.trim()
        }));
      }
      return [];
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      return [];
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user.id);
    // Recharger les soldes pour l'utilisateur sélectionné
    loadBalancesForUser(user.id);
  };

  const loadBalancesForUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/leave/balances/${userId}`);
      
      if (response.status === 200) {
        setBalances(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement soldes utilisateur:', error);
    }
  };

  const renderLeaveType = (type) => {
    const availableDays = getAvailableBalance(type.id);
    const isSelected = selectedType === type.id;
    const isDisabled = availableDays <= 0;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.typeCard,
          isSelected && styles.typeCardSelected,
          isDisabled && styles.typeCardDisabled
        ]}
        onPress={() => !isDisabled && setSelectedType(type.id)}
        disabled={isDisabled}
      >
        <View style={styles.typeHeader}>
          <View style={[styles.typeIndicator, { backgroundColor: type.color || '#F8A5C2' }]} />
          <View style={styles.typeHeaderContent}>
            <Text style={[
              styles.typeName,
              isSelected && styles.typeNameSelected,
              isDisabled && styles.typeNameDisabled
            ]}>
              {type.name}
            </Text>
            <View style={[
              styles.balanceBadge,
              availableDays > 0 ? styles.balanceAvailable : styles.balanceUnavailable
            ]}>
              <Text style={styles.balanceBadgeText}>
                {availableDays}j dispo
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.typeDescription}>{type.description}</Text>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <CheckCircle size={20} color="#F8A5C2" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Demande de Congé"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        rightIcon={<Bell size={24} color="#333" />}
        onRightPress={() => {}}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fleur décorative */}
        <View style={styles.flowerContainer}>
          <Flower2 size={40} color="#F8A5C2" />
        </View>

        <View style={styles.formContainer}>
          {/* Section Utilisateur */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employé concerné</Text>
            <SearchableDropdown
              label=""
              placeholder="Sélectionner un employé"
              value={selectedUser ? users.find(u => u.id === selectedUser) : null}
              onSelect={handleUserSelect}
              fetchData={fetchUsers}
              searchPlaceholder="Rechercher un employé..."
              displayField="display"
              allowCreate={false}
              createPlaceholder=""
            />
            
            {selectedUser && (
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserText}>
                  Employé sélectionné: {users.find(u => u.id === selectedUser)?.first_name || ''} {users.find(u => u.id === selectedUser)?.last_name || ''}
                </Text>
              </View>
            )}
          </View>

          {/* Section Type de congé */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de congé</Text>
            <SearchableDropdown
              label=""
              placeholder="Sélectionner ou créer un type de congé"
              value={selectedType ? leaveTypes.find(t => t.id === selectedType) : null}
              onSelect={handleLeaveTypeSelect}
              fetchData={fetchLeaveTypes}
              onCreateNew={createNewLeaveType}
              searchPlaceholder="Rechercher un type de congé..."
              displayField="name"
              allowCreate={true}
              createPlaceholder="Créer un nouveau type de congé"
            />
            
            {selectedType && (
              <View style={styles.selectedTypeInfo}>
                <Text style={styles.selectedTypeText}>
                  Type sélectionné: {leaveTypes.find(t => t.id === selectedType)?.name || ''}
                </Text>
                <Text style={styles.availableDaysText}>
                  Jours disponibles: {getAvailableBalance(selectedType)} jour(s)
                </Text>
              </View>
            )}
          </View>

          {/* Section Dates */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Période du congé</Text>
            
            {Platform.OS === 'web' ? (
              // Pour le web : input de type date
              <>
                <View style={styles.dateInput}>
                  <Calendar size={20} color="#F8A5C2" />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>Date de début</Text>
                    <DateTimePicker
                      value={startDate}
                      onChange={(value) => handleWebDateChange(value, 'start')}
                      min={new Date().toISOString().split('T')[0]}
                      style={{ marginTop: 5 }}
                    />
                  </View>
                </View>
                
                <View style={styles.dateInput}>
                  <Calendar size={20} color="#F8A5C2" />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>Date de fin</Text>
                    <DateTimePicker
                      value={endDate}
                      onChange={(value) => handleWebDateChange(value, 'end')}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      style={{ marginTop: 5 }}
                    />
                  </View>
                </View>
              </>
            ) : (
              // Pour mobile : boutons qui ouvrent le picker modal
              <>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatePicker('start')}
                >
                  <Calendar size={20} color="#F8A5C2" />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>Date de début</Text>
                    <Text style={styles.dateInputValue}>
                      {startDate ? formatDateLong(startDate) : 'Sélectionner une date'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatePicker('end')}
                >
                  <Calendar size={20} color="#F8A5C2" />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>Date de fin</Text>
                    <Text style={styles.dateInputValue}>
                      {endDate ? formatDateLong(endDate) : 'Sélectionner une date'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            
            {startDate && endDate && (
              <View style={styles.daysSummary}>
                <Clock size={16} color="#F8A5C2" />
                <Text style={styles.daysSummaryText}>
                  Durée totale: {calculateDays()} jour(s)
                </Text>
              </View>
            )}
          </View>

          {/* Section Motif */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motif (optionnel)</Text>
            <View style={styles.reasonContainer}>
              <FileText size={20} color="#F8A5C2" />
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Précisez la raison de votre demande..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Section Informations */}
          {selectedType && (
            <View style={styles.infoCard}>
              <Info size={20} color="#F8A5C2" />
              <Text style={styles.infoText}>
                Votre demande sera soumise à validation et apparaîtra dans l'attente d'approbation.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bouton de soumission */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedType || !startDate || !endDate || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedType || !startDate || !endDate || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Envoyer la demande</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* DateTime Picker Modal - uniquement pour mobile */}
      {Platform.OS !== 'web' && (
        <DateTimePicker
          isVisible={isDatePickerVisible}
          mode="date"
          date={getDefaultDate()}
          minimumDate={getMinimumDate()}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          confirmTextIOS="Confirmer"
          cancelTextIOS="Annuler"
          headerTextIOS="Choisir une date"
          display="inline"
          locale="fr-FR"
          buttonTextColorIOS="#F8A5C2"
          themeVariant="light"
        />
      )}

      {/* Modal de succès */}
      <CustomModal
        visible={successModalVisible}
        onClose={handleModalClose}
        type="success"
        title="Demande envoyée !"
        message={`Votre demande de congé a été envoyée avec succès. Elle est en attente de validation.`}
        confirmText="Retour à l'historique"
        showCancelButton={false}
        icon={CheckCircle}
        iconColor="#4CAF50"
      />

      {/* Modal d'erreur */}
      <CustomModal
        visible={errorModalVisible}
        onClose={handleErrorModalClose}
        type="error"
        title="Erreur"
        message={errorMessage}
        confirmText="OK"
        showCancelButton={false}
        icon={AlertTriangle}
        iconColor="#F44336"
      />
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
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  flowerContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
    opacity: 0.8
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  
  // Type Card Styles
  typeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: '#F8A5C2',
    borderWidth: 2,
    backgroundColor: '#FFF5F8',
  },
  typeCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeNameSelected: {
    color: '#F8A5C2',
  },
  typeNameDisabled: {
    color: '#999',
  },
  balanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceAvailable: {
    backgroundColor: '#E8F5E9',
  },
  balanceUnavailable: {
    backgroundColor: '#FFEBEE',
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  typeDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 22,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  
  // Selected User Info
  selectedUserInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  selectedUserText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  // Selected Type Info
  selectedTypeInfo: {
    backgroundColor: '#FFF5F8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F8A5C2',
  },
  selectedTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  availableDaysText: {
    fontSize: 13,
    color: '#666',
  },
  
  // Date Input Styles
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  dateInputContent: {
    marginLeft: 12,
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateInputValue: {
    fontSize: 14,
    color: '#333',
  },
  daysSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    gap: 8,
  },
  daysSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8A5C2',
  },
  
  // Reason Input Styles
  reasonContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  reasonInput: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
    minHeight: 80,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F8A5C2',
    borderLeftWidth: 4,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  
  // Bottom Container
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8A5C2',
    borderRadius: 25,
    padding: 15,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#FFB6C1',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default LeaveRequestScreen;