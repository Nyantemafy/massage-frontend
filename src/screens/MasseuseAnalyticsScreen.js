import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { 
  ChevronLeft,
  Calendar as CalendarLucide,
  Search,
  Users,
  TrendingUp,
  ChevronRight,
  X,
  Star,
  User,
  Calendar,
  CreditCard,
  DollarSign,
} from 'lucide-react-native';
import Header from '../components/Header';
import api from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

const MasseuseAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedStartYear, setSelectedStartYear] = useState(new Date().getFullYear());
  const [selectedStartMonth, setSelectedStartMonth] = useState(new Date().getMonth());
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear());
  const [selectedEndMonth, setSelectedEndMonth] = useState(new Date().getMonth());
  const [searchText, setSearchText] = useState('');
  const [selectedMasseuse, setSelectedMasseuse] = useState(null);
  const [masseuseModalVisible, setMasseuseModalVisible] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalSessions: 0,
      totalSessionsInPeriod: 0,
      averageBasket: 0
    },
    topMasseuses: [],
    masseuseList: []
  });

  // Formater la date pour l'affichage (mois année)
  const formatDisplayDate = (year, month) => {
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${monthNames[month]} ${year}`;
  };

  // Formater la date pour l'API (premier jour du mois)
  const formatDateForAPI = (year, month) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  };

  // Formater la date pour l'API (dernier jour du mois)
  const formatDateForAPIEnd = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  // Initialiser les dates par défaut (dernier mois)
  useEffect(() => {
    const endYear = new Date().getFullYear();
    const endMonth = new Date().getMonth();
    const startYear = new Date().getFullYear();
    const startMonth = new Date().getMonth() - 1;
    
    if (startMonth < 0) {
      setSelectedStartYear(startYear - 1);
      setSelectedStartMonth(11);
      setStartDate(formatDateForAPI(startYear - 1, 11));
    } else {
      setSelectedStartYear(startYear);
      setSelectedStartMonth(startMonth);
      setStartDate(formatDateForAPI(startYear, startMonth));
    }
    
    setSelectedEndYear(endYear);
    setSelectedEndMonth(endMonth);
    setEndDate(formatDateForAPIEnd(endYear, endMonth));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadMasseuseAnalytics();
    }
  }, [startDate, endDate]);

  const loadMasseuseAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/masseuses', { params });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Erreur chargement analytics masseuses:', error);
      Alert.alert('Erreur', 'Impossible de charger les données des masseuses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMasseuseDetails = async (masseuseId) => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get(`/analytics/masseuses/${masseuseId}`, { params });
      setSelectedMasseuse(response.data);
      setMasseuseModalVisible(true);
    } catch (error) {
      console.error('Erreur chargement détails masseuse:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la masseuse');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMasseuseAnalytics();
  };

  // Sélecteur de date modal
  const renderDatePicker = (isVisible, onClose, onConfirm, year, setYear, month, setMonth, isStart) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
      <Modal visible={isVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>
                {isStart ? 'Sélectionner date début' : 'Sélectionner date fin'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickersRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Année</Text>
                <ScrollView style={styles.pickerScroll}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.pickerItem,
                        year === y && styles.pickerItemSelected
                      ]}
                      onPress={() => setYear(y)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        year === y && styles.pickerItemTextSelected
                      ]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mois</Text>
                <ScrollView style={styles.pickerScroll}>
                  {months.map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.pickerItem,
                        month === i && styles.pickerItemSelected
                      ]}
                      onPress={() => setMonth(i)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        month === i && styles.pickerItemTextSelected
                      ]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const handleStartDatePress = () => {
    setShowStartPicker(true);
  };

  const handleEndDatePress = () => {
    setShowEndPicker(true);
  };

  const confirmStartDate = () => {
    const formatted = formatDateForAPI(selectedStartYear, selectedStartMonth);
    setStartDate(formatted);
    setShowStartPicker(false);
  };

  const confirmEndDate = () => {
    const formatted = formatDateForAPIEnd(selectedEndYear, selectedEndMonth);
    setEndDate(formatted);
    setShowEndPicker(false);
  };

  const renderSummaryCards = () => {
    return (
      <View style={styles.cardsContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F4FD' }]}>
          <Users size={24} color="#2196F3" />
          <Text style={styles.cardLabel}>Séances totales</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.totalSessions}</Text>
          <Text style={styles.cardSubLabel}>
            {analyticsData.summary.totalSessionsInPeriod || 0} sur la période
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FBEFF3' }]}>
          <DollarSign size={24} color="#F8A5C2" />
          <Text style={styles.cardLabel}>Panier moyen</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.averageBasket.toLocaleString()}€</Text>
          <Text style={styles.cardSubLabel}>
            par séance
          </Text>
        </View>
      </View>
    );
  };

  const renderTopMasseusesChart = () => {
    const data = analyticsData.topMasseuses;
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Top 10 masseuses</Text>
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        </View>
      );
    }
    
    const maxRevenue = Math.max(...data.map(item => item.revenue), 1);
    const maxFrequency = Math.max(...data.map(item => item.frequency), 1);
    const chartHeight = 180;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top 10 masseuses - Chiffre d'affaires</Text>
        
        <View style={styles.barChartContainer}>
          {data.map((masseuse, index) => {
            const barHeight = (masseuse.revenue / maxRevenue) * chartHeight;
            const colors = ['#FA4E79', '#D67B92', '#F8A5C2', '#FBEFF3', '#E66B8A', '#C44569', '#FF6B6B', '#FFB6C1', '#FFC0CB', '#FF69B4'];
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.barColumn}
                onPress={() => loadMasseuseDetails(masseuse.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.barValue}>{masseuse.revenue.toLocaleString()}€</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: Math.max(barHeight, 4),
                        backgroundColor: colors[index % colors.length]
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>
                  {masseuse.name.length > 10 ? masseuse.name.substring(0, 8) + '...' : masseuse.name}
                </Text>
                <Text style={styles.barSubLabel}>
                  {masseuse.frequency} séances
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>
            💰 Cliquez sur une masseuse pour voir ses détails
          </Text>
        </View>
      </View>
    );
  };

  const renderMasseuseList = () => {
    const filteredMasseuses = analyticsData.masseuseList.filter(masseuse =>
      masseuse.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <View style={styles.masseuseListContainer}>
        <View style={styles.masseuseListHeader}>
          <Text style={styles.masseuseListTitle}>Liste des masseuses</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une masseuse..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: 50 }]}>ID</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Nom</Text>
            <Text style={[styles.headerCell, { width: 70 }]}>Séances</Text>
            <Text style={[styles.headerCell, { width: 90 }]}>CA Total</Text>
            <Text style={[styles.headerCell, { width: 80 }]}>Panier moyen</Text>
            <Text style={[styles.headerCell, { width: 40 }]}> </Text>
          </View>
          
          <ScrollView style={styles.tableBody}>
            {filteredMasseuses.map((masseuse, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.tableRow}
                onPress={() => loadMasseuseDetails(masseuse.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tableCell, { width: 50 }]}>{masseuse.id}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                  {masseuse.name}
                </Text>
                <Text style={[styles.tableCell, { width: 70 }]}>{masseuse.frequency}</Text>
                <Text style={[styles.tableCell, { width: 90, fontWeight: '600', color: '#D67B92' }]}>
                  {masseuse.revenue.toLocaleString()}€
                </Text>
                <Text style={[styles.tableCell, { width: 80 }]}>
                  {masseuse.averageBasket.toLocaleString()}€
                </Text>
                <View style={[styles.tableCell, { width: 40 }]}>
                  <ChevronRight size={16} color="#D67B92" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.tableFooter}>
          <Text style={styles.tableFooterText}>
            {filteredMasseuses.length} masseuse(s) trouvée(s)
          </Text>
        </View>
      </View>
    );
  };

  // Modal des détails masseuse
  const renderMasseuseModal = () => {
    if (!selectedMasseuse) return null;
    
    const { masseuse, stats, appointments } = selectedMasseuse;
    
    return (
      <Modal visible={masseuseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.masseuseModalContainer}>
            <View style={styles.masseuseModalHeader}>
              <Text style={styles.masseuseModalTitle}>Détails de la masseuse</Text>
              <TouchableOpacity onPress={() => setMasseuseModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.masseuseModalContent}>
              {/* Informations masseuse */}
              <View style={styles.masseuseInfoCard}>
                <View style={styles.masseuseAvatar}>
                  <User size={32} color="#FFF" />
                </View>
                <View style={styles.masseuseInfo}>
                  <Text style={styles.masseuseName}>{masseuse.name}</Text>
                  <View style={styles.masseuseDetail}>
                    <Star size={14} color="#FFD700" />
                    <Text style={styles.masseuseDetailText}>
                      {stats.totalSessions} séances réalisées
                    </Text>
                  </View>
                  <View style={styles.masseuseDetail}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.masseuseDetailText}>
                      Masseuse depuis le {new Date(masseuse.hireDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Statistiques */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalRevenue.toLocaleString()}€</Text>
                  <Text style={styles.statLabel}>CA total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalSessions}</Text>
                  <Text style={styles.statLabel}>Séances</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.averageBasket.toLocaleString()}€</Text>
                  <Text style={styles.statLabel}>Panier moyen</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.bestDay || '-'}</Text>
                  <Text style={styles.statLabel}>Meilleur jour</Text>
                </View>
              </View>
              
              {/* Massage le plus pratiqué */}
              <View style={styles.favoriteCard}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.favoriteLabel}>Massage le plus pratiqué :</Text>
                <Text style={styles.favoriteValue}>{stats.favoriteMassage || 'Aucun'}</Text>
              </View>
              
              {/* Historique des RDV */}
              <Text style={styles.sectionTitle}>Historique des rendez-vous</Text>
              {appointments.length === 0 ? (
                <Text style={styles.noDataText}>Aucun rendez-vous</Text>
              ) : (
                appointments.map((apt, index) => (
                  <View key={index} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentDate}>
                        {new Date(apt.date).toLocaleDateString('fr-FR')} de {apt.start_time} à {apt.end_time}
                      </Text>
                      <View style={[styles.appointmentStatus, 
                        { backgroundColor: apt.status === 'completed' ? '#4CAF50' : '#FF9800' }]}>
                        <Text style={styles.appointmentStatusText}>
                          {apt.status === 'completed' ? 'Terminé' : 'En attente'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.appointmentClient}>Client: {apt.clientName}</Text>
                    <Text style={styles.appointmentMassage}>{apt.massageType}</Text>
                    {apt.amount > 0 && (
                      <View style={styles.appointmentPayment}>
                        <CreditCard size={14} color="#4CAF50" />
                        <Text style={styles.appointmentAmount}>{apt.amount.toLocaleString()}€</Text>
                        <Text style={styles.appointmentMethod}> - {apt.paymentMethod === 'cash' ? 'Espèces' : 'Carte'}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Analyse masseuses"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D67B92" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Analyse masseuses"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D67B92']} />
        }>
        
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date début</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={handleStartDatePress}>
              <CalendarLucide size={16} color="#D67B92" />
              <Text style={styles.dateText}>
                {startDate ? formatDisplayDate(selectedStartYear, selectedStartMonth) : 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date fin</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={handleEndDatePress}>
              <CalendarLucide size={16} color="#D67B92" />
              <Text style={styles.dateText}>
                {endDate ? formatDisplayDate(selectedEndYear, selectedEndMonth) : 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Pickers Modals */}
        {renderDatePicker(
          showStartPicker,
          () => setShowStartPicker(false),
          confirmStartDate,
          selectedStartYear,
          setSelectedStartYear,
          selectedStartMonth,
          setSelectedStartMonth,
          true
        )}
        
        {renderDatePicker(
          showEndPicker,
          () => setShowEndPicker(false),
          confirmEndDate,
          selectedEndYear,
          setSelectedEndYear,
          selectedEndMonth,
          setSelectedEndMonth,
          false
        )}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Top Masseuses Chart */}
        {renderTopMasseusesChart()}

        {/* Masseuse List */}
        {renderMasseuseList()}
      </ScrollView>

      {/* Masseuse Details Modal */}
      {renderMasseuseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  cardAmount: {
    fontSize: 24,
    color: '#333',
    fontWeight: '700',
    marginTop: 4,
  },
  cardSubLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 260,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  barContainer: {
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 28,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  barSubLabel: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  chartFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  chartFooterText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  masseuseListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  masseuseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  masseuseListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    flex: 0.6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    color: '#333',
  },
  tableContainer: {
    maxHeight: 400,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 10,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: 350,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  tableFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    alignItems: 'center',
  },
  tableFooterText: {
    fontSize: 11,
    color: '#999',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  datePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerScroll: {
    height: 150,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#F8A5C2',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#F8A5C2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal masseuse styles
  masseuseModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: screenWidth * 0.95,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  masseuseModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  masseuseModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  masseuseModalContent: {
    padding: 16,
    maxHeight: '100%',
  },
  masseuseInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FBEFF3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  masseuseAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D67B92',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  masseuseInfo: {
    flex: 1,
  },
  masseuseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  masseuseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  masseuseDetailText: {
    fontSize: 12,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D67B92',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  favoriteLabel: {
    fontSize: 12,
    color: '#666',
  },
  favoriteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appointmentStatusText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '500',
  },
  appointmentClient: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  appointmentMassage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  appointmentPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  appointmentMethod: {
    fontSize: 11,
    color: '#666',
  },
});

export default MasseuseAnalyticsScreen;