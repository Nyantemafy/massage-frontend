import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { 
  Plus, 
  Clock, 
  User, 
  CalendarDays,
  X,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import AppointmentCard from '../../components/AppointmentCard';
import { useLeaveCount } from '../../context/LeaveCountContext';
import api from '../../config/api';

const ScheduleScreen = ({ navigation }) => {
  const { pendingLeaveCount } = useLeaveCount();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [workloadModalVisible, setWorkloadModalVisible] = useState(false);
  const [monthWorkload, setMonthWorkload] = useState({});
  const [dayAppointments, setDayAppointments] = useState([]);
  const [appointmentsModalVisible, setAppointmentsModalVisible] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  useEffect(() => {
    loadMonthAppointments(currentMonth);
  }, [currentMonth]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/appointments?date=${selectedDate}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthAppointments = async (date) => {
    try {
      const [year, month] = date.split('-');
      const response = await api.get(`/appointments/month?year=${year}&month=${month}`);
      const workloadData = response.data;
      
      const marked = {};
      const workloadMap = {};
      
      workloadData.forEach(day => {
        // Déterminer la couleur de fond selon la charge - PLUS DE CONTRASTE
        let backgroundColor = '';
        let textColor = '#333';
        
        if (day.has_high_workload) {
          backgroundColor = '#FA4E79'; // Rouge vif pour élevé
          textColor = '#FFF';
        } else if (day.count > 1) {
          backgroundColor = '#F8A5C2'; // Rose moyen
          textColor = '#333';
        } else if (day.count === 1) {
          backgroundColor = '#FFE5EF'; // Rose très clair pour 1 RDV
          textColor = '#333';
        }
        
        // Utiliser "selected" pour avoir un cercle complet
        if (day.count > 0) {
          marked[day.date] = {
            selected: true,
            selectedColor: backgroundColor,
            selectedTextColor: textColor,
            customStyles: {
              container: {
                borderRadius: 0,
              },
              text: {
                color: textColor,
                fontWeight: day.has_high_workload ? 'bold' : 'normal',
              }
            }
          };
        }
        
        workloadMap[day.date] = day;
      });
      
      // Marquer le jour sélectionné avec une couleur différente
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#D67B92',
        selectedTextColor: '#FFF',
        customStyles: {
          text: {
            color: '#FFF',
            fontWeight: 'bold',
          }
        }
      };
      
      setMarkedDates(marked);
      setMonthWorkload(workloadMap);
    } catch (error) {
      console.error('Erreur chargement mois:', error);
    }
  };

  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    
    try {
      const response = await api.get(`/appointments?date=${day.dateString}`);
      setDayAppointments(response.data);
      setAppointmentsModalVisible(true);
    } catch (error) {
      console.error('Erreur chargement rendez-vous du jour:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    }
  };

  const handleMonthChange = (month) => {
    const newDate = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
    setCurrentMonth(newDate);
  };
  
  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const renderAppointmentsModal = () => {
    
    const dayDate = new Date(selectedDate);
    const dayLabel = dayDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const dayData = monthWorkload[selectedDate];
    const hasHighWorkload = dayData?.has_high_workload || false;
    
    // Grouper les rendez-vous par statut
    const groupedAppointments = {
      completed: dayAppointments.filter(apt => apt.status === 'completed'),
      confirmed: dayAppointments.filter(apt => apt.status === 'confirmed'),
      cancelled: dayAppointments.filter(apt => apt.status === 'cancelled'),
      pending: dayAppointments.filter(apt => apt.status === 'pending'),
    };
        
    const renderAppointmentItem = (item) => {
      // Utiliser les bonnes propriétés
      const startTime = item.start_time || item.startTime || '--:--';
      const endTime = item.end_time || item.endTime || '--:--';
      const clientName = item.client_name || item.clientName || 'Client inconnu';
      const masseurName = item.masseur_name || item.masseurName || 'Non assigné';
      
      let statusColor = '#FF9800';
      let statusText = 'Confirmé';
      
      if (item.status === 'completed') {
        statusColor = '#4CAF50';
        statusText = 'Terminé';
      } else if (item.status === 'cancelled') {
        statusColor = '#F44336';
        statusText = 'Annulé';
      } else if (item.status === 'pending') {
        statusColor = '#FFC107';
        statusText = 'En attente';
      }
      
      return (
        <TouchableOpacity 
          key={item.id}
          style={styles.appointmentItem}
          onPress={() => {
            setAppointmentsModalVisible(false);
            navigation.navigate('AppointmentDetail', { id: item.id });
          }}
        >
          <View style={styles.appointmentTimeContainer}>
            <Clock size={16} color="#D67B92" />
            <Text style={styles.appointmentTime}>
              {startTime} - {endTime}
            </Text>
          </View>
          <View style={styles.appointmentInfo}>
            <User size={16} color="#666" />
            <Text style={styles.appointmentClient}>{clientName}</Text>
          </View>
          <View style={styles.appointmentInfo}>
            <Users size={16} color="#666" />
            <Text style={styles.appointmentMasseur}>{masseurName}</Text>
          </View>
          <View style={styles.appointmentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    };
    
    {dayData && dayData.masseur_workload && Object.keys(dayData.masseur_workload).length > 0 && (
      <View style={styles.masseurWorkloadSection}>
        <Text style={styles.sectionTitle}>Charge par masseur</Text>
        {Object.entries(dayData.masseur_workload).map(([name, count]) => (
          <View key={name} style={styles.masseurWorkloadItem}>
            <View style={styles.masseurWorkloadHeader}>
              <Users size={14} color="#D67B92" />
              <Text style={styles.masseurName}>{name}</Text>
            </View>
            <View style={styles.workloadBarContainer}>
              <View 
                style={[
                  styles.workloadBar,
                  { 
                    width: `${Math.min((count / 5) * 100, 100)}%`,
                    backgroundColor: count >= 2 ? '#FA4E79' : count >= 1 ? '#F8A5C2' : '#FFE5EF'
                  }
                ]} 
              />
              <Text style={styles.workloadCount}>{count} RDV</Text>
            </View>
            {count >= 2 && (
              <Text style={styles.highWorkloadWarning}>
                ⚠️ Plus de 2 rendez-vous - Journée chargée pour ce masseur
              </Text>
            )}
          </View>
        ))}
      </View>
    )}
    return (
      <Modal visible={appointmentsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appointmentsModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {hasHighWorkload && <AlertTriangle size={20} color="#F8487F" />}
                <Text style={styles.modalTitle}>
                  {hasHighWorkload ? 'Journée chargée' : 'Rendez-vous du jour'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAppointmentsModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDate}>{dayLabel}</Text>
            
            {dayData && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <CheckCircle size={20} color="#4CAF50" />
                  <Text style={styles.statValue}>{dayData.completed_count || 0}</Text>
                  <Text style={styles.statLabel}>Terminés</Text>
                </View>
                <View style={styles.statCard}>
                  <Clock size={20} color="#FF9800" />
                  <Text style={styles.statValue}>{dayData.confirmed_count || 0}</Text>
                  <Text style={styles.statLabel}>Confirmés</Text>
                </View>
                <View style={styles.statCard}>
                  <XCircle size={20} color="#F44336" />
                  <Text style={styles.statValue}>{dayData.cancelled_count || 0}</Text>
                  <Text style={styles.statLabel}>Annulés</Text>
                </View>
              </View>
            )}
            
            <ScrollView style={styles.appointmentsListModal} showsVerticalScrollIndicator={false}>
              {/* Rendez-vous confirmés */}
              {groupedAppointments.confirmed.length > 0 && (
                <View>
                  <Text style={styles.sectionSubtitle}>📅 Confirmés ({groupedAppointments.confirmed.length})</Text>
                  {groupedAppointments.confirmed.map(renderAppointmentItem)}
                </View>
              )}
              
              {/* Rendez-vous terminés */}
              {groupedAppointments.completed.length > 0 && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionSubtitle}>✅ Terminés ({groupedAppointments.completed.length})</Text>
                  {groupedAppointments.completed.map(renderAppointmentItem)}
                </View>
              )}
              
              {/* Rendez-vous en attente */}
              {groupedAppointments.pending.length > 0 && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionSubtitle}>⏳ En attente ({groupedAppointments.pending.length})</Text>
                  {groupedAppointments.pending.map(renderAppointmentItem)}
                </View>
              )}
              
              {/* Rendez-vous annulés */}
              {groupedAppointments.cancelled.length > 0 && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionSubtitle}>❌ Annulés ({groupedAppointments.cancelled.length})</Text>
                  {groupedAppointments.cancelled.map(renderAppointmentItem)}
                </View>
              )}
              
              {dayAppointments.length === 0 && (
                <View style={styles.emptyModalContainer}>
                  <CalendarDays size={48} color="#CCC" />
                  <Text style={styles.emptyModalText}>Aucun rendez-vous ce jour</Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                setAppointmentsModalVisible(false);
                navigation.navigate('NewAppointment', { defaultDate: selectedDate });
              }}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Ajouter un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Emploi du temps"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount} 
      />

      <ScrollView style={styles.content}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFE5EF' }]} />
            <Text style={styles.legendText}>1 RDV</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F8A5C2' }]} />
            <Text style={styles.legendText}>2 RDV</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FA4E79' }]} />
            <Text style={styles.legendText}>3+ RDV ou charge masseur</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D67B92' }]} />
            <Text style={styles.legendText}>Jour sélectionné</Text>
          </View>
        </View>

        <Calendar
          current={currentMonth}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          markingType={'custom'}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#999',
            selectedDayBackgroundColor: '#F8A5C2',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#F8A5C2',
            dayTextColor: '#333',
            textDisabledColor: '#d9e1e8',
            monthTextColor: '#333',
            textMonthFontWeight: 'bold',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            arrowColor: '#F8A5C2',
          }}
        />

        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CalendarDays size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucun rendez-vous ce jour</Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onPress={() => navigation.navigate('AppointmentDetail', { id: apt.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewAppointment')}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>

      <CustomDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
      
      {appointmentsModalVisible && renderAppointmentsModal()}
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 15,
    backgroundColor: '#FFF',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  dateHeader: {
    backgroundColor: '#FFE5EF',
    padding: 15,
    marginTop: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  appointmentsList: {
    padding: 15,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8A5C2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentsModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '92%',
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D67B92',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionGroup: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  appointmentsListModal: {
    maxHeight: 400,
  },
  appointmentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D67B92',
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  appointmentClient: {
    fontSize: 13,
    color: '#333',
  },
  appointmentMasseur: {
    fontSize: 12,
    color: '#666',
  },
  appointmentStatus: {
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '500',
  },
  emptyModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyModalText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#F8A5C2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionGroup: {
    marginTop: 8,
  },
  masseurWorkloadSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  masseurWorkloadItem: {
    marginBottom: 12,
  },
  masseurWorkloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  masseurName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  workloadBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workloadBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
  workloadCount: {
    fontSize: 12,
    color: '#666',
    width: 50,
  },
  highWorkloadWarning: {
    fontSize: 11,
    color: '#FA4E79',
    marginTop: 5,
    marginLeft: 24,
  },
});

export default ScheduleScreen;