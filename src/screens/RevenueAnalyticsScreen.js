import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  CreditCard,
  BarChart3,
  PieChart,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart as RNKPieChart } from 'react-native-chart-kit';
import Header from '../components/Header';
import api from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

const RevenueAnalyticsScreen = ({ navigation }) => {
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
  const [activeTab, setActiveTab] = useState('revenue');
  const [analyticsData, setAnalyticsData] = useState({
    revenueByType: [],
    expenses: [],
    summary: {
      ca: 0,
      benefice: 0,
      charge: 0
    },
    evolution: [],
    detailedStats: null
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
    
    // Si on est en janvier, l'année précédente
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
      loadAllAnalyticsData();
    }
  }, [startDate, endDate]);

  const loadAllAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRevenueData(),
        loadExpensesData(),
        loadEvolutionData(),
        loadDetailedStats()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données analytiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/revenue', { params });
      setAnalyticsData(prev => ({
        ...prev,
        revenueByType: response.data.revenueByType,
        summary: response.data.summary
      }));
    } catch (error) {
      console.error('Erreur chargement CA:', error);
    }
  };

  const loadExpensesData = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/expenses', { params });
      setAnalyticsData(prev => ({
        ...prev,
        expenses: response.data.expenses.map(exp => ({
          type: exp.type,
          amount: exp.totalAmount
        }))
      }));
    } catch (error) {
      console.error('Erreur chargement dépenses:', error);
    }
  };

  const loadEvolutionData = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/evolution', { params });
      setAnalyticsData(prev => ({
        ...prev,
        evolution: response.data.evolution
      }));
    } catch (error) {
      console.error('Erreur chargement évolution:', error);
    }
  };

  const loadDetailedStats = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/detailed', { params });
      setAnalyticsData(prev => ({
        ...prev,
        detailedStats: response.data
      }));
    } catch (error) {
      console.error('Erreur chargement stats détaillées:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllAnalyticsData();
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

  // Graphique en camembert avec react-native-chart-kit
  const renderPieChart = () => {
    const data = analyticsData.revenueByType;
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <PieChart size={20} color="#D67B92" />
            <Text style={styles.chartTitle}>Répartition du CA par type de massage</Text>
          </View>
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        </View>
      );
    }

    const pieData = data.map((item, index) => ({
      name: item.type,
      amount: item.amount,
      population: item.amount,
      color: ['#F8A5C2', '#FBEFF3', '#D67B92', '#FA4E79', '#E66B8A'][index % 5],
      legendFontColor: '#333',
      legendFontSize: 11,
    }));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <PieChart size={20} color="#D67B92" />
          <Text style={styles.chartTitle}>Répartition du CA par type de massage</Text>
        </View>
        
        <RNKPieChart
          data={pieData}
          width={screenWidth - 60}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: pieData[index].color }]} />
              <Text style={styles.legendText}>
                {item.type} ({item.percentage}%)
              </Text>
              <Text style={styles.legendAmount}>{item.amount.toLocaleString()}€</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Graphique en barres pour les charges
  const renderExpenseChart = () => {
    const data = analyticsData.expenses;
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <CreditCard size={20} color="#FA4E79" />
            <Text style={styles.chartTitle}>Récapitulation des charges</Text>
          </View>
          <Text style={styles.noDataText}>Aucune dépense enregistrée</Text>
        </View>
      );
    }
    
    const labels = data.map(item => item.type.length > 8 ? item.type.substring(0, 6) + '...' : item.type);
    const amounts = data.map(item => item.amount);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <CreditCard size={20} color="#FA4E79" />
          <Text style={styles.chartTitle}>Récapitulation des charges</Text>
        </View>
        
        <BarChart
          data={{
            labels: labels,
            datasets: [{ data: amounts }]
          }}
          width={screenWidth - 60}
          height={220}
          yAxisLabel=""
          yAxisSuffix="€"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(250, 78, 121, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
            style: { borderRadius: 16 },
            barPercentage: 0.7,
          }}
          verticalLabelRotation={30}
          fromZero
          showValuesOnTopOfBars
        />
      </View>
    );
  };

  // Graphique d'évolution (ligne)
  const renderEvolutionChart = () => {
    const data = analyticsData.evolution;
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <BarChart3 size={20} color="#D67B92" />
            <Text style={styles.chartTitle}>Évolution du CA</Text>
          </View>
          <Text style={styles.noDataText}>Aucune donnée d'évolution disponible</Text>
        </View>
      );
    }
    
    const labels = data.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    });
    const revenues = data.map(item => item.revenue);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <BarChart3 size={20} color="#D67B92" />
          <Text style={styles.chartTitle}>Évolution du CA mensuel</Text>
        </View>
        
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: revenues }]
          }}
          width={screenWidth - 60}
          height={220}
          yAxisLabel=""
          yAxisSuffix="€"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(214, 123, 146, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#D67B92'
            }
          }}
          bezier
          formatYLabel={(value) => `${Math.round(value / 1000)}k`}
          fromZero
        />
        
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>
            📊 Total RDV: {data.reduce((sum, item) => sum + item.appointmentsCount, 0)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDetailedStats = () => {
    const stats = analyticsData.detailedStats;
    if (!stats) return null;
    
    return (
      <View style={styles.detailedStatsContainer}>
        <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
        
        {/* Taux de conversion */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Taux de conversion</Text>
          <View style={styles.conversionContainer}>
            <View style={styles.conversionItem}>
              <Text style={styles.conversionValue}>
                {stats.conversionRate?.rate || 0}%
              </Text>
              <Text style={styles.conversionLabel}>Rendez-vous payés</Text>
            </View>
            <View style={styles.conversionDetails}>
              <Text style={styles.conversionDetailText}>
                {stats.conversionRate?.paidAppointments || 0} / {stats.conversionRate?.totalAppointments || 0} RDV
              </Text>
            </View>
          </View>
        </View>
        
        {/* Top massages */}
        {stats.topMassageTypes && stats.topMassageTypes.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Top 5 des massages</Text>
            {stats.topMassageTypes.map((item, index) => (
              <View key={index} style={styles.topItem}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemContent}>
                  <Text style={styles.topItemName}>{item.type}</Text>
                  <Text style={styles.topItemStats}>
                    {item.revenue.toLocaleString()}€ • {item.count} RDV
                  </Text>
                </View>
                <Text style={styles.topItemPrice}>
                  {item.averagePrice.toLocaleString()}€/RDV
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSummaryCards = () => {
    return (
      <View style={styles.cardsContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF' }]}>
          <DollarSign size={24} color="#F8A5C2" />
          <Text style={styles.cardLabel}>CA Total</Text>
          <Text style={styles.cardAmount}>
            {analyticsData.summary.ca.toLocaleString()}€
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#D67B92' }]}>
          <TrendingUp size={24} color="#FFF" />
          <Text style={[styles.cardLabel, { color: '#FFF' }]}>Bénéfice</Text>
          <Text style={[styles.cardAmount, { color: '#FFF' }]}>
            {analyticsData.summary.benefice.toLocaleString()}€
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FA4E79' }]}>
          <CreditCard size={24} color="#FFF" />
          <Text style={[styles.cardLabel, { color: '#FFF' }]}>Charges</Text>
          <Text style={[styles.cardAmount, { color: '#FFF' }]}>
            {analyticsData.summary.charge.toLocaleString()}€
          </Text>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'revenue' && styles.activeTab]}
          onPress={() => setActiveTab('revenue')}>
          <PieChart size={18} color={activeTab === 'revenue' ? '#D67B92' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.activeTabText]}>
            CA par type
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}>
          <CreditCard size={18} color={activeTab === 'expenses' ? '#FA4E79' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Charges
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'evolution' && styles.activeTab]}
          onPress={() => setActiveTab('evolution')}>
          <BarChart3 size={18} color={activeTab === 'evolution' ? '#D67B92' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'evolution' && styles.activeTabText]}>
            Évolution
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Analyse financière"
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
        title="Analyse financière"
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
              <Calendar size={20} color="#D67B92" />
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
              <Calendar size={20} color="#D67B92" />
              <Text style={styles.dateText}>
                {endDate ? formatDisplayDate(selectedEndYear, selectedEndMonth) : 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={20} color="#D67B92" />
          </TouchableOpacity>
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

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'revenue' && renderPieChart()}
        {activeTab === 'expenses' && renderExpenseChart()}
        {activeTab === 'evolution' && renderEvolutionChart()}

        {/* Detailed Stats */}
        {renderDetailedStats()}
      </ScrollView>
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
    alignItems: 'center',
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
  refreshButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FBEFF3',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#D67B92',
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chartFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  chartFooterText: {
    fontSize: 11,
    color: '#999',
  },
  legendContainer: {
    marginTop: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  legendAmount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 40,
  },
  detailedStatsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  conversionContainer: {
    alignItems: 'center',
  },
  conversionItem: {
    alignItems: 'center',
  },
  conversionValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D67B92',
  },
  conversionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  conversionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  conversionDetailText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FBEFF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D67B92',
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  topItemStats: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  topItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D67B92',
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
});

export default RevenueAnalyticsScreen;