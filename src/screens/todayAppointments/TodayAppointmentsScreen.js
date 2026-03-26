import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const TodayAppointmentsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const roleName = user?.role_name || user?.role;
  const isManager = roleName === 'admin' || roleName === 'manager';

  const title = isManager ? 'Rendez-vous du jour' : 'Mes rendez-vous du jour';
  const subtitle = isManager
    ? 'Vue instantanée de tous les rendez-vous de la journée.'
    : 'Seulement les rendez-vous qui vous concernent aujourd\'hui.';

  const loadToday = useCallback(async () => {
    try {
      const res = await api.get('/appointments/today');
      setAppointments(res.data?.appointments || []);
    } catch (error) {
      console.error('Error loading today appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const summary = useMemo(() => {
    const completed = appointments.filter((item) => item.status === 'completed').length;
    const confirmed = appointments.filter((item) => item.status === 'confirmed').length;
    return {
      total: appointments.length,
      completed,
      confirmed,
    };
  }, [appointments]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.timeText}>
          {item.start_time} - {item.end_time || '--:--'}
        </Text>
        <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusDone : styles.statusPlanned]}>
          <Text style={[styles.statusText, item.status === 'completed' ? styles.statusDoneText : styles.statusPlannedText]}>
            {item.status === 'completed' ? 'Terminé' : item.status === 'confirmed' ? 'Confirmé' : item.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <UserRound size={15} color="#8A8A8A" />
        <Text style={styles.infoText}>{item.client_name || 'Client inconnu'}</Text>
      </View>

      <View style={styles.infoRow}>
        <CalendarDays size={15} color="#8A8A8A" />
        <Text style={styles.infoText}>{item.offer_name || 'Prestation non spécifiée'}</Text>
      </View>

      {isManager && (
        <View style={styles.infoRow}>
          <Clock3 size={15} color="#8A8A8A" />
          <Text style={styles.infoText}>{item.masseur_name || 'Non assigné'}</Text>
        </View>
      )}

      {item.location ? (
        <View style={styles.infoRow}>
          <MapPin size={15} color="#8A8A8A" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={title}
          showMenu={true}
          onMenuPress={() => setDrawerVisible(true)}
          extraRightIcon={true}
          showLeaveShortcut={isManager}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F8A5C2" />
        </View>
        <CustomDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          navigation={navigation}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={title}
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        extraRightIcon={true}
        showLeaveShortcut={isManager}
      />

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{subtitle}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{summary.total}</Text>
              <Text style={styles.metricLabel}>Aujourd'hui</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{summary.confirmed}</Text>
              <Text style={styles.metricLabel}>Confirmés</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{summary.completed}</Text>
              <Text style={styles.metricLabel}>Terminés</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadToday();
              }}
              colors={['#F8A5C2']}
              tintColor="#F8A5C2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CalendarDays size={44} color="#D0D0D0" />
              <Text style={styles.emptyTitle}>Aucun rendez-vous aujourd'hui</Text>
              <Text style={styles.emptyText}>
                {isManager
                  ? 'Aucun rendez-vous n’est planifié pour le moment.'
                  : 'Vous n’avez aucun rendez-vous assigné pour aujourd’hui.'}
              </Text>
            </View>
          }
          contentContainerStyle={appointments.length === 0 ? styles.emptyListContent : styles.listContent}
        />
      </View>

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
    backgroundColor: '#F7F7F8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3E1E8',
  },
  heroTitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFF7FA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },
  metricLabel: {
    fontSize: 12,
    color: '#7B7B7B',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F8A5C2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPlanned: {
    backgroundColor: '#FFF0D9',
  },
  statusDone: {
    backgroundColor: '#E7F7EC',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPlannedText: {
    color: '#9A6400',
  },
  statusDoneText: {
    color: '#177245',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default TodayAppointmentsScreen;
