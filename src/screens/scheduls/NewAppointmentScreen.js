import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Calendar, ChevronDown, Clock, Bell } from 'lucide-react-native';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SearchableDropdown from '../../components/SearchableDropdown';
import InputModal from '../../components/InputModal';
import api from '../../config/api';
import CustomModal from '../../components/Modal';
import ModalForm from '../../components/ModalForm';

let DateTimePickerModal;
if (Platform.OS !== 'web') {
  DateTimePickerModal = require("react-native-modal-datetime-picker").default;
}

const NewAppointmentScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    client_id: null,
    masseur_id: null,
    massage_type_id: null,
    offer_id: null,
    remarque: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '', // Champ de texte libre
    send_notification: false,
  });

  const [loading, setLoading] = useState(false);
  const [masseurs, setMasseurs] = useState([]);
  
  // États pour les modals
  const [showMassageTypeModal, setShowMassageTypeModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // États pour les date/time pickers (mobile uniquement)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const showModal = (config) => {
    setModalConfig({
      visible: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
      showCancelButton: config.showCancelButton !== undefined ? config.showCancelButton : true,
      confirmText: config.confirmText || 'Confirmer',
      cancelText: config.cancelText || 'Annuler',
      icon: config.icon,
      iconColor: config.iconColor,
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // Charger les masseurs au démarrage
  useEffect(() => {
    loadMasseurs();
  }, []);

  const loadMasseurs = async () => {
    try {
      const response = await api.get('/users/masseurs');
      setMasseurs(response.data);
    } catch (error) {
      console.error('Erreur chargement masseurs:', error);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fonctions pour les date/time pickers (mobile uniquement)
  const showDatePicker = () => {
    if (Platform.OS !== 'web') {
      setDatePickerVisibility(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const showStartTimePicker = () => {
    if (Platform.OS !== 'web') {
      setStartTimePickerVisibility(true);
    }
  };

  const hideStartTimePicker = () => {
    setStartTimePickerVisibility(false);
  };

  const showEndTimePicker = () => {
    if (Platform.OS !== 'web') {
      setEndTimePickerVisibility(true);
    }
  };

  const hideEndTimePicker = () => {
    setEndTimePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    updateField('date', dateStr);
    hideDatePicker();
  };

  const handleConfirmStartTime = (time) => {
    const timeStr = time.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    updateField('start_time', timeStr);
    hideStartTimePicker();
  };

  const handleConfirmEndTime = (time) => {
    const timeStr = time.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    updateField('end_time', timeStr);
    hideEndTimePicker();
  };

  // Gestionnaires pour le web
  const handleWebDateChange = (value) => {
    updateField('date', value);
  };

  const handleWebStartTimeChange = (value) => {
    updateField('start_time', value);
  };

  const handleWebEndTimeChange = (value) => {
    updateField('end_time', value);
  };

  // Fonctions pour récupérer les données
  const fetchClients = async () => {
    const response = await api.get('/users/clients');
    return response.data;
  };

  const fetchMassageTypes = async () => {
    const response = await api.get('/massage/massage-types');
    return response.data;
  };

  const fetchMassageOffers = async () => {
    const response = await api.get('/massage/massage-offers');
    return response.data;
  };

  const fetchMasseurs = async () => {
    const response = await api.get('/users/filtre', {
      params: { role_id: 3 }
    });
    return response.data;
  };

  // Fonctions pour créer de nouveaux éléments avec modals
  const createNewMassageType = async (formData) => {
    try {
      const response = await api.post('/massage/massage-types', {
        name: formData.name,
        description: formData.description
      });
      
      showModal({
        type: 'success',
        title: 'Succès',
        message: 'Type de massage créé avec succès',
        showCancelButton: false,
        confirmText: 'OK',
        onConfirm: async () => {
          // Recharger et sélectionner le nouveau type
          const types = await fetchMassageTypes();
          const newType = response.data.massageType || response.data;
          updateField('massage_type_id', newType.id);
          setShowMassageTypeModal(false);
          hideModal();
        }
      });
      
    } catch (error) {
      showModal({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la création',
        showCancelButton: false,
        confirmText: 'OK'
      });
    }
  };

  const createNewOffer = async (formData) => {
    try {
      const response = await api.post('/massage/massage-offers', {
        name: formData.name,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes),
        price: parseFloat(formData.price)
      });
      
      showModal({
        type: 'success',
        title: 'Succès',
        message: 'Offre créée avec succès',
        showCancelButton: false,
        confirmText: 'OK',
        onConfirm: async () => {
          // Recharger et sélectionner la nouvelle offre
          const offers = await fetchMassageOffers();
          const newOffer = response.data.offer || response.data;
          updateField('offer_id', newOffer.id);
          setShowOfferModal(false);
          hideModal();
        }
      });
      
    } catch (error) {
      showModal({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la création',
        showCancelButton: false,
        confirmText: 'OK'
      });
    }
  };

  const handleSubmit = async () => {
    // Validation des champs obligatoires avec la modal
    if (!formData.client_id) {
      showModal({
        type: 'warning',
        title: 'Validation',
        message: 'Veuillez sélectionner un client',
        showCancelButton: false,
        confirmText: 'OK'
      });
      return;
    }
    
    if (!formData.date) {
      showModal({
        type: 'warning',
        title: 'Validation',
        message: 'Veuillez sélectionner une date',
        showCancelButton: false,
        confirmText: 'OK'
      });
      return;
    }
    
    if (!formData.start_time) {
      showModal({
        type: 'warning',
        title: 'Validation',
        message: 'Veuillez sélectionner une heure de début',
        showCancelButton: false,
        confirmText: 'OK'
      });
      return;
    }

    // Modal de confirmation avant envoi
    showModal({
      type: 'confirm',
      title: 'Confirmation',
      message: 'Voulez-vous créer ce rendez-vous ?',
      confirmText: 'Oui, créer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        hideModal();
        setLoading(true);
        
        try {
          // Préparer les données pour l'API
          const appointmentData = {
            ...formData,
            date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time || null,
            location: formData.location || null,
            remarque: formData.remarque || null,
            send_notification: formData.send_notification || false
          };

          console.log('Données envoyées:', appointmentData);

          const response = await api.post('/appointments', appointmentData);
          
          // Modal de succès
          showModal({
            type: 'success',
            title: 'Succès',
            message: 'Rendez-vous créé avec succès',
            showCancelButton: false,
            confirmText: 'OK',
            onConfirm: () => {
              hideModal();
              navigation.goBack();
            }
          });
          
        } catch (error) {
          console.error('Erreur création rendez-vous:', error);
          
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.error || 
                              'Impossible de créer le rendez-vous';
          
          // Modal d'erreur
          showModal({
            type: 'error',
            title: 'Erreur',
            message: errorMessage,
            showCancelButton: false,
            confirmText: 'OK'
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        hideModal();
      }
    });
  };

  // Rendu conditionnel pour le sélecteur de date
  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webDateContainer}>
          <Text style={styles.webLabel}>Date *</Text>
          <TextInput
            style={styles.webInput}
            type="date"
            value={formData.date}
            onChangeText={handleWebDateChange}
            placeholder="YYYY-MM-DD"
          />
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={showDatePicker}
        >
          <Calendar size={20} color="#999" />
          <Text style={[styles.dateInputText, formData.date && styles.selectedText]}>
            {formData.date || 'Date *'}
          </Text>
          <ChevronDown size={20} color="#999" />
        </TouchableOpacity>

        {DateTimePickerModal && (
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            date={formData.date ? new Date(formData.date) : new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}
      </>
    );
  };

  // Rendu conditionnel pour les sélecteurs d'heure
  const renderTimePickers = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webTimeRow}>
          <View style={styles.webTimeContainer}>
            <Text style={styles.webLabel}>Heure de début *</Text>
            <TextInput
              style={styles.webInput}
              type="time"
              value={formData.start_time}
              onChangeText={handleWebStartTimeChange}
              placeholder="HH:MM"
            />
          </View>
          <View style={styles.webTimeContainer}>
            <Text style={styles.webLabel}>Heure de fin</Text>
            <TextInput
              style={styles.webInput}
              type="time"
              value={formData.end_time}
              onChangeText={handleWebEndTimeChange}
              placeholder="HH:MM"
            />
          </View>
        </View>
      );
    }

    return (
      <>
        <View style={styles.timeRow}>
          <TouchableOpacity 
            style={styles.timeInput}
            onPress={showStartTimePicker}
          >
            <Clock size={20} color="#999" />
            <Text style={[styles.timeInputText, formData.start_time && styles.selectedText]}>
              {formData.start_time || 'Heure début *'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.timeInput}
            onPress={showEndTimePicker}
          >
            <Clock size={64} color="#CCC" />
            <Text style={[styles.timeInputText, formData.end_time && styles.selectedText]}>
              {formData.end_time || 'Heure fin'}
            </Text>
          </TouchableOpacity>
        </View>

        {DateTimePickerModal && (
          <>
            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmStartTime}
              onCancel={hideStartTimePicker}
              date={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            />

            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmEndTime}
              onCancel={hideEndTimePicker}
              date={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            />
          </>
        )}
      </>
    );
  };

  // Rendu pour le champ location (texte libre)
  const renderLocationInput = () => {
    return (
      <View style={styles.locationContainer}>
        <Text style={styles.locationLabel}>Lieu</Text>
        <TextInput
          style={styles.locationTextInput}
          value={formData.location}
          onChangeText={(text) => updateField('location', text)}
          placeholder="Entrez l'adresse ou le lieu du rendez-vous"
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Ajouter rendez-vous"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={<Bell size={24} color="#333" />}
      />

      <ScrollView style={styles.content}>
        <SearchableDropdown
          label="Client *"
          placeholder="Sélectionner un client"
          value={formData.client_id}
          onSelect={(item) => updateField('client_id', item.id)}
          fetchData={fetchClients}
          displayField="first_name"
          searchPlaceholder="Rechercher un client..."
        />

        <SearchableDropdown
          label="Masseur"
          placeholder="Sélectionner un masseur (optionnel)"
          value={formData.masseur_id}
          onSelect={(item) => updateField('masseur_id', item.id)}
          fetchData={fetchMasseurs}
          displayField="first_name"
          searchPlaceholder="Rechercher un masseur..."
        />

        <SearchableDropdown
          label="Type de massage"
          placeholder="Sélectionner un type"
          value={formData.massage_type_id}
          onSelect={(item) => updateField('massage_type_id', item.id)}
          fetchData={fetchMassageTypes}
          onCreateNew={() => setShowMassageTypeModal(true)}
          displayField="name"
          searchPlaceholder="Rechercher un type de massage..."
        />

        <SearchableDropdown
          label="Offre"
          placeholder="Sélectionner une offre"
          value={formData.offer_id}
          onSelect={(item) => updateField('offer_id', item.id)}
          fetchData={fetchMassageOffers}
          onCreateNew={() => setShowOfferModal(true)}
          displayField="name"
          searchPlaceholder="Rechercher une offre..."
        />

        <Input
          placeholder="Remarque..."
          value={formData.remarque}
          onChangeText={(text) => updateField('remarque', text)}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {renderDatePicker()}
        {renderTimePickers()}
        {renderLocationInput()}

        <TouchableOpacity 
          style={styles.notificationRow}
          onPress={() => updateField('send_notification', !formData.send_notification)}
        >
          <Bell 
            size={20} 
            color={formData.send_notification ? "#F8A5C2" : "#999"} 
          />
          <Text style={styles.notificationText}>
            {formData.send_notification ? 'Notification activée' : 'Envoyer une notification'}
          </Text>
        </TouchableOpacity>

        <Button
          title="Enregistrer le rendez-vous"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />

        {/* Modal pour créer un type de massage */}
        <InputModal
          visible={showMassageTypeModal}
          onClose={() => setShowMassageTypeModal(false)}
          title="Nouveau type de massage"
          fields={[
            {
              name: 'name',
              label: 'Nom',
              placeholder: 'Ex: Massage Relaxant',
              required: true,
            },
            {
              name: 'description',
              label: 'Description',
              placeholder: 'Description du massage...',
              type: 'textarea',
            },
          ]}
          onSubmit={createNewMassageType}
          submitText="Créer"
        />

        {/* Modal pour créer une offre */}
        <InputModal
          visible={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          title="Nouvelle offre"
          fields={[
            {
              name: 'name',
              label: 'Nom de l\'offre',
              placeholder: 'Ex: Massage Relaxant',
              required: true,
            },
            {
              name: 'description',
              label: 'Description',
              placeholder: 'Description de l\'offre...',
              type: 'textarea',
            },
            {
              name: 'duration_minutes',
              label: 'Durée (minutes)',
              placeholder: '60',
              type: 'number',
              required: true,
            },
            {
              name: 'price',
              label: 'Prix (FCFA)',
              placeholder: '12000',
              type: 'number',
              required: true,
            },
          ]}
          onSubmit={createNewOffer}
          submitText="Créer l'offre"
        />
      </ScrollView>

      {/* Modal générique */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          else hideModal();
        }}
        onCancel={() => {
          if (modalConfig.onCancel) modalConfig.onCancel();
          hideModal();
        }}
        showCancelButton={modalConfig.showCancelButton}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        icon={modalConfig.icon}
        iconColor={modalConfig.iconColor}
        onClose={hideModal}
      />
    </View>
  );
};;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
    marginBottom: 15,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    marginBottom: 15,
    gap: 10,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    gap: 10,
  },
  timeInputText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  // Styles pour le champ location
  locationContainer: {
    marginBottom: 15,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  locationTextInput: {
    height: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
    marginBottom: 20,
  },
  notificationText: {
    fontSize: 16,
    color: '#666',
  },
  selectedText: {
    color: '#333',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 30,
  },
  // Styles pour web
  webDateContainer: {
    marginBottom: 15,
  },
  webTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  webTimeContainer: {
    flex: 1,
  },
  webLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  webInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    width: '100%',
  },
});

export default NewAppointmentScreen;