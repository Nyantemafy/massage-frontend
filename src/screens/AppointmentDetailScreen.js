import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import api from '../config/api';

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('duree');

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${id}`);
      console.log(response)
      setAppointment(response.data);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger le rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer la durée entre start_time et end_time
  const calculateDuration = () => {
    if (!appointment?.start_time || !appointment?.end_time) {
      return 'Non définie';
    }

    try {
      // Convertir les heures en minutes
      const startParts = appointment.start_time.split(':');
      const endParts = appointment.end_time.split(':');
      
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      
      let durationMinutes = endMinutes - startMinutes;
      
      // Gérer le cas où l'heure de fin est le lendemain
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}min`;
      }
    } catch (error) {
      console.error('Erreur calcul durée:', error);
      return 'Erreur de calcul';
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Formater l'heure
  const formatTime = (timeString) => {
    if (!timeString) return 'Non définie';
    return timeString.substring(0, 5); // Prend seulement HH:MM
  };

  // Obtenir le contenu selon l'onglet actif
  const getTabContent = () => {
    switch (activeTab) {
      case 'duree':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Heure de début</Text>
                <Text style={styles.detailValue}>{formatTime(appointment?.start_time)}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Heure de fin</Text>
                <Text style={styles.detailValue}>{formatTime(appointment?.end_time) || 'Non définie'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Durée totale</Text>
                <Text style={[styles.detailValue, styles.durationValue]}>{calculateDuration()}</Text>
              </View>
            </View>
          </View>
        );
      
      case 'lieu':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Adresse</Text>
                <Text style={styles.detailValue}>
                  {appointment?.location || 'Aucun lieu spécifié'}
                </Text>
              </View>
            </View>
            
            {appointment?.location && (
              <TouchableOpacity 
                style={styles.mapButton}
                onPress={() => {
                  // Ouvrir dans Google Maps ou Apple Plans
                  const url = Platform.select({
                    ios: `maps:0,0?q=${encodeURIComponent(appointment.location)}`,
                    android: `geo:0,0?q=${encodeURIComponent(appointment.location)}`,
                  });
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="map-outline" size={20} color="#FFF" />
                <Text style={styles.mapButtonText}>Voir sur la carte</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'Date':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date du rendez-vous</Text>
                <Text style={styles.detailValue}>{formatDate(appointment?.date)}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={24} color="#F8A5C2" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Horaire</Text>
                <Text style={styles.detailValue}>
                  {formatTime(appointment?.start_time)} - {formatTime(appointment?.end_time) || '?'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Statut</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment?.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(appointment?.status) }]}>
                  {getStatusText(appointment?.status)}
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return status || 'Inconnu';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détail rendez-vous"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Header
          title="Détail rendez-vous"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
          <Text style={styles.errorText}>Rendez-vous introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Détail rendez-vous"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={
          <View style={styles.headerIcons}>
            <Ionicons name="color-palette-outline" size={24} color="#333" />
            <Ionicons name="notifications-outline" size={24} color="#333" style={{ marginLeft: 15 }} />
          </View>
        }
      />

      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={64} color="#F8A5C2" />
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'duree' && styles.activeTab]}
            onPress={() => setActiveTab('duree')}
          >
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={activeTab === 'duree' ? '#F8A5C2' : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'duree' && styles.activeTabText]}>
              Durée
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lieu' && styles.activeTab]}
            onPress={() => setActiveTab('lieu')}
          >
            <Ionicons 
              name="location-outline" 
              size={20} 
              color={activeTab === 'lieu' ? '#F8A5C2' : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'lieu' && styles.activeTabText]}>
              Lieu
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Date' && styles.activeTab]}
            onPress={() => setActiveTab('Date')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={activeTab === 'Date' ? '#F8A5C2' : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'Date' && styles.activeTabText]}>
              Date
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu de l'onglet actif */}
        <View style={styles.infoSection}>
          {getTabContent()}
        </View>

        {/* Informations client (toujours affichées) */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Informations prestation</Text>
          
          <View style={styles.clientCard}>
            <View style={styles.clientInfoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.clientInfoLabel}>Client:</Text>
              <Text style={styles.clientInfoValue}>{appointment.client_name || 'Non spécifié'}</Text>
            </View>
            
            <View style={styles.clientInfoRow}>
              <Ionicons name="body-outline" size={20} color="#666" />
              <Text style={styles.clientInfoLabel}>Type massage:</Text>
              <Text style={styles.clientInfoValue}>{appointment.type_massage || 'Non spécifié'}</Text>
            </View>
            
            <View style={styles.clientInfoRow}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.clientInfoLabel}>Offre:</Text>
              <Text style={styles.clientInfoValue}>{appointment.offer || 'Non spécifié'}</Text>
            </View>
            
            {appointment.masseur_name && (
              <View style={styles.clientInfoRow}>
                <Ionicons name="fitness-outline" size={20} color="#666" />
                <Text style={styles.clientInfoLabel}>Masseur:</Text>
                <Text style={styles.clientInfoValue}>{appointment.masseur_name}</Text>
              </View>
            )}
          </View>

          {appointment.remarque && (
            <>
              <Text style={styles.sectionTitle}>Remarque</Text>
              <View style={styles.remarqueContainer}>
                <Text style={styles.remarqueText}>{appointment.remarque}</Text>
              </View>
            </>
          )}
        </View>

        {/* Bouton d'action */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditAppointment', { id: appointment.id })}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
            <Text style={styles.editButtonText}>Modifier</Text>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5EF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8A5C2',
  },
  loader: {
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#F8A5C2',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: '#F8A5C2',
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  tabContent: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  durationValue: {
    color: '#F8A5C2',
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8A5C2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
  },
  mapButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clientSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  clientCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  clientInfoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  clientInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  remarqueContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    minHeight: 80,
  },
  remarqueText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8A5C2',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentDetailScreen;