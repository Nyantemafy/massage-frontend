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
} from 'react-native';
import { 
  CreditCard, 
  Calendar, 
  User, 
  ArrowLeft,
  CheckCircle,
  Search,
  Flower2
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import SearchableDropdown from '../../components/SearchableDropdown';
import CustomModal from '../../components/Modal';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const EncaissementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [montant, setMontant] = useState('');
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour la modal de succès
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [paidClient, setPaidClient] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // Fonction pour formater la date
    const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        
        // Format: 12/06/2025
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Erreur formatage date:', error);
        return dateString;
    }
    };

    // Variante pour un format plus long (ex: 12 juin 2025)
    const formatDateLong = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long' // Optionnel : ajoute le jour de la semaine
        };
        
        return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
        console.error('Erreur formatage date:', error);
        return dateString;
    }
    };

  // Charger les rendez-vous non payés
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/appointments', {
        params: {
          status: 'confirmed' // Rendez-vous confirmés non encore payés
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Filtrer pour n'avoir que les rendez-vous sans paiement
      const unpaidAppointments = response.data.filter(apt => !apt.payment_id);
      setAppointments(unpaidAppointments);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Rafraîchir la page
  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments().finally(() => setRefreshing(false));
  };

  // Fonction pour rechercher les rendez-vous (pour SearchableDropdown)
  const fetchAppointments = async () => {
    try {
        const response = await api.get('/appointments', {
        params: {
            status: 'confirmed'
        },
        headers: {
            'Authorization': `Bearer ${token}`
        }
        });
        console.log(response.data)
        // Filtrer les rendez-vous sans paiement et formater pour l'affichage
        return response.data
        .filter(apt => !apt.payment_id)
        .map(apt => ({
            id: apt.id,
            client_name: apt.client_name || 'Client inconnu',
            date: apt.date,
            formattedDate: formatDate(apt.date), // Date formatée
            start_time: apt.start_time,
            offer_name: apt.offer || 'Massage',
            amount: apt.price || 0,
            location: apt.location,
            // Format pour l'affichage dans le dropdown avec date formatée
            displayName: `${apt.client_name || 'Client'} - ${formatDate(apt.date)} ${apt.start_time} - Offre ${apt.offer || 'Massage'}`
        }));
    } catch (error) {
        console.error('Erreur chargement rendez-vous:', error);
        return [];
    }
  };

  const handleSelectRdv = (item) => {
    setSelectedRdv(item);
    // Pré-remplir le montant avec le prix du rendez-vous
    if (item.amount) {
      setMontant(item.amount.toString());
    }
  };

  const handleEnregistrer = async () => {
    if (!selectedRdv) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rendez-vous');
      return;
    }

    if (!montant || parseFloat(montant) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    try {
      const response = await api.post('/paiement/process', {
        appointment_id: selectedRdv.id,
        amount: parseFloat(montant),
        payment_method: 'espèces', // À modifier selon votre logique
        notes: `Paiement pour rendez-vous du ${selectedRdv.date}`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Afficher la modal de succès
      setPaidClient(selectedRdv.client_name);
      setPaidAmount(montant);
      setSuccessModalVisible(true);

    } catch (error) {
      console.error('Erreur paiement:', error);
      
      if (error.response?.status === 409) {
        Alert.alert(
          'Déjà payé', 
          'Ce rendez-vous a déjà été encaissé'
        );
        // Rafraîchir la liste
        loadAppointments();
        setSelectedRdv(null);
        setMontant('');
      } else if (error.response?.status === 404) {
        Alert.alert('Erreur', 'Rendez-vous non trouvé');
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement');
      }
    }
  };

  // Gérer la fermeture de la modal et le rafraîchissement
  const handleModalClose = () => {
    setSuccessModalVisible(false);
    setSelectedRdv(null);
    setMontant('');
    loadAppointments(); // Rafraîchir la liste
  };

  return (
    <View style={styles.container}>
      <Header
        title="Encaissement"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        leftIcon={<ArrowLeft size={24} color="#333" />}
        onLeftPress={() => navigation.goBack()}
      />

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
        {/* Fleur décorative */}
        <View style={styles.flowerContainer}>
          <Flower2 size={40} color="#F8A5C2" />
        </View>

        <View style={styles.formContainer}>
          {/* Sélection du rendez-vous avec SearchableDropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rendez-vous</Text>
            <SearchableDropdown
              label=""
              placeholder="Sélectionner un rendez-vous"
              value={selectedRdv}
              onSelect={handleSelectRdv}
              fetchData={fetchAppointments}
              displayField="displayName"
              valueField="id"
              searchPlaceholder="Rechercher par client, date..."
              renderItem={(item) => (
                <View style={styles.dropdownItemCustom}>
                  <View style={styles.dropdownItemHeader}>
                    <User size={16} color="#F8A5C2" />
                    <Text style={styles.dropdownItemClient}>{item.client_name}</Text>
                  </View>
                  <View style={styles.dropdownItemDetails}>
                    <View style={styles.dropdownItemDate}>
                      <Calendar size={14} color="#999" />
                      <Text style={styles.dropdownItemDateText}>
                        {item.formattedDate} à {item.start_time}
                      </Text>
                    </View>
                    <Text style={styles.dropdownItemAmount}>
                      {item.amount} FCFA
                    </Text>
                  </View>
                  {item.location ? (
                    <Text style={styles.dropdownItemLocation}>
                      📍 {item.location}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </View>

          {/* Montant */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Montant</Text>
            <View style={styles.inputContainer}>
              <CreditCard size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Saisir le montant"
                value={montant}
                onChangeText={setMontant}
                keyboardType="numeric"
                editable={true}
              />
            </View>
          </View>

          {/* Affichage des détails du rendez-vous sélectionné */}
          {selectedRdv && (
            <View style={styles.selectedRdvCard}>
              <Text style={styles.selectedRdvTitle}>Détails du rendez-vous</Text>
              <View style={styles.selectedRdvRow}>
                <User size={16} color="#F8A5C2" />
                <Text style={styles.selectedRdvText}>{selectedRdv.client_name}</Text>
              </View>
              <View style={styles.selectedRdvRow}>
                <Calendar size={16} color="#F8A5C2" />
                <Text style={styles.selectedRdvText}>
                  {formatDateLong(selectedRdv.date)} à {selectedRdv.start_time}
                </Text>
              </View>
              <View style={styles.selectedRdvRow}>
                <CreditCard size={16} color="#F8A5C2" />
                <Text style={styles.selectedRdvText}>
                    Offre {selectedRdv.offer_name}
                </Text>
              </View>
              {selectedRdv.location && (
                <View style={styles.selectedRdvRow}>
                  <Text style={styles.selectedRdvText}>📍 {selectedRdv.location}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.enregistrerButton,
            (!selectedRdv || !montant) && styles.enregistrerButtonDisabled
          ]}
          onPress={handleEnregistrer}
          disabled={!selectedRdv || !montant}
        >
          <Text style={styles.enregistrerButtonText}>Encaisser</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de succès */}
      <CustomModal
        visible={successModalVisible}
        onClose={handleModalClose}
        type="success"
        title="Paiement effectué !"
        message={`Le paiement de ${paidClient} pour un montant de ${paidAmount} FCFA a été enregistré avec succès.`}
        confirmText="Nouvel encaissement"
        showCancelButton={false}
        icon={CheckCircle}
        iconColor="#4CAF50"
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
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  // Styles pour les items personnalisés du dropdown
  dropdownItemCustom: {
    padding: 12,
  },
  dropdownItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dropdownItemClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  dropdownItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 24,
  },
  dropdownItemDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemDateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  flowerContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
    opacity: 0.8
  },
  dropdownItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8A5C2',
  },
  dropdownItemLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    marginLeft: 24,
  },
  // Styles pour la carte du rendez-vous sélectionné
  selectedRdvCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F8A5C2',
    borderLeftWidth: 4,
  },
  selectedRdvTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8A5C2',
    marginBottom: 10,
  },
  selectedRdvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  selectedRdvText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  enregistrerButton: {
    backgroundColor: '#F8A5C2',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  enregistrerButtonDisabled: {
    backgroundColor: '#FFB6C1',
    opacity: 0.5,
  },
  enregistrerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default EncaissementScreen;