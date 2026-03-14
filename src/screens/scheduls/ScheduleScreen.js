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
import { Calendar } from 'react-native-calendars';
import { 
  Calendar as CalendarLucide, 
  Plus, 
  Clock, 
  User, 
  CalendarDays
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

  useEffect(() => {
    loadAppointments();
    loadMonthAppointments();
  }, [selectedDate]);

  useEffect(() => {
  }, [pendingLeaveCount]);

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

  const loadMonthAppointments = async (date = selectedDate) => {
    try {
      const [year, month] = date.split('-');
      const response = await api.get(`/appointments/month?year=${year}&month=${month}`);
      
      const marked = {};
      response.data.forEach(apt => {
        const date = apt.date;
        const count = apt.count;
        
        marked[date] = {
          marked: true,
          dotColor: count > 3 ? '#F8487F' : count > 1 ? '#F8A5C2' : '#FFB3D9',
        };
      });
      
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#F8A5C2',
      };
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Erreur chargement mois:', error);
    }
  };

  const getWorkloadLevel = (count) => {
    if (count > 3) return 'eleve';
    if (count > 1) return 'moyen';
    return 'faible';
  };

  const handleMonthChange = (month) => {
    const newDate = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
    setCurrentMonth(newDate);
    // Recharger les rendez-vous du mois si nécessaire
    loadMonthAppointments(newDate);
  };
  
  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
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
            <View style={[styles.legendDot, { backgroundColor: '#FFB3D9' }]} />
            <Text style={styles.legendText}>faible</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F8A5C2' }]} />
            <Text style={styles.legendText}>moyen</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F8487F' }]} />
            <Text style={styles.legendText}>eleve</Text>
          </View>
        </View>

        <Calendar
          current={currentMonth}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#999',
            selectedDayBackgroundColor: '#F8A5C2',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#F8A5C2',
            dayTextColor: '#333',
            textDisabledColor: '#d9e1e8',
            dotColor: '#F8A5C2',
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
    gap: 20,
    backgroundColor: '#FFF',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
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
});

export default ScheduleScreen;
