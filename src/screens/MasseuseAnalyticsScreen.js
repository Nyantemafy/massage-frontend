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
} from 'react-native';
import { 
  ChevronLeft,
  Calendar as CalendarLucide,
  Search,
  Users,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import Header from '../components/Header';
import api from '../config/api';

const { width } = Dimensions.get('window');

const MasseuseAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalSessions: 0,
      averageBasket: 0
    },
    topMasseuses: [],
    masseuseList: []
  });

  useEffect(() => {
    loadMasseuseAnalytics();
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
      // Fallback to mock data
      const mockData = {
        summary: {
          totalSessions: 1247,
          averageBasket: 85.50
        },
        topMasseuses: [
          { id: 1, name: 'Masseuse 1', frequency: 156, revenue: 125000, averageBasket: 800 },
          { id: 2, name: 'Masseuse 2', frequency: 142, revenue: 118000, averageBasket: 830 },
          { id: 3, name: 'Masseuse 3', frequency: 128, revenue: 98000, averageBasket: 765 },
          { id: 4, name: 'Masseuse 4', frequency: 115, revenue: 89000, averageBasket: 774 },
          { id: 5, name: 'Masseuse 5', frequency: 98, revenue: 76000, averageBasket: 775 },
        ],
        masseuseList: [
          { id: 1, name: 'Sophie Martin', frequency: 156, revenue: 125000, averageBasket: 800 },
          { id: 2, name: 'Marie Dupont', frequency: 142, revenue: 118000, averageBasket: 830 },
          { id: 3, name: 'Laura Petit', frequency: 128, revenue: 98000, averageBasket: 765 },
        ]
      };
      setAnalyticsData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => {
    return (
      <View style={styles.cardsContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F4FD' }]}>
          <Users size={24} color="#2196F3" />
          <Text style={styles.cardLabel}>Nombre total de seance</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.totalSessions}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FBEFF3' }]}>
          <TrendingUp size={24} color="#F8A5C2" />
          <Text style={styles.cardLabel}>panier moyen/seance</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.averageBasket}€</Text>
        </View>
      </View>
    );
  };

  const renderMasseuseChart = () => {
    const data = analyticsData.topMasseuses;
    const maxValue = Math.max(...data.map(item => Math.max(item.revenue, item.frequency)));
    const barWidth = (width - 120) / data.length - 15;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>chiffre d'affaire</Text>
        
        <View style={styles.horizontalBarChartContainer}>
          {data.map((masseuse, index) => (
            <View key={index} style={styles.horizontalBarItem}>
              <Text style={styles.masseuseName}>{masseuse.name}</Text>
              <View style={styles.horizontalBarsContainer}>
                <View 
                  style={[
                    styles.horizontalBar,
                    { 
                      width: (masseuse.revenue / maxValue) * (width - 180),
                      backgroundColor: '#FA4E79',
                      marginBottom: 4
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.horizontalBar,
                    { 
                      width: (masseuse.frequency / maxValue) * (width - 180),
                      backgroundColor: '#FBEFF3'
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FA4E79' }]} />
            <Text style={styles.legendText}>chiffre d'affaire</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FBEFF3' }]} />
            <Text style={styles.legendText}>nombre de seance</Text>
          </View>
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
          <Text style={styles.masseuseListTitle}>les masseuses</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une masseuse..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>ID</Text>
            <Text style={styles.headerCell}>Nom</Text>
            <Text style={styles.headerCell}>frequence</Text>
            <Text style={styles.headerCell}>CA Total</Text>
            <Text style={styles.headerCell}>Panier Moyen</Text>
          </View>
          
          {filteredMasseuses.map((masseuse, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{masseuse.id}</Text>
              <Text style={styles.tableCell}>{masseuse.name}</Text>
              <Text style={styles.tableCell}>{masseuse.frequency}</Text>
              <Text style={styles.tableCell}>{masseuse.revenue.toLocaleString()}€</Text>
              <Text style={styles.tableCell}>{masseuse.averageBasket}€</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.paginationButton}>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="vue sur les masseuses"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F8A5C2" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="vue sur les masseuses"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>date debut</Text>
            <TouchableOpacity style={styles.dateInput}>
              <CalendarLucide size={16} color="#666" />
              <Text style={styles.dateText}>{startDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>date fin</Text>
            <TouchableOpacity style={styles.dateInput}>
              <CalendarLucide size={16} color="#666" />
              <Text style={styles.dateText}>{endDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Masseuse Chart */}
        {renderMasseuseChart()}

        {/* Masseuse List */}
        {renderMasseuseList()}
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
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
  },
  cardAmount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  horizontalBarChartContainer: {
    marginBottom: 15,
  },
  horizontalBarItem: {
    marginBottom: 15,
  },
  masseuseName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  horizontalBarsContainer: {
    marginLeft: 10,
  },
  horizontalBar: {
    height: 8,
    borderRadius: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
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
    fontSize: 12,
    color: '#666',
  },
  masseuseListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  masseuseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  masseuseListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#F8A5C2',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  tableContainer: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  paginationButton: {
    backgroundColor: '#F8A5C2',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
});

export default MasseuseAnalyticsScreen;
