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

const ClientAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalClients: 0,
      recurringClientsPercentage: 0
    },
    topClients: [],
    clientList: []
  });

  useEffect(() => {
    loadClientAnalytics();
  }, [startDate, endDate]);

  const loadClientAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/clients', { params });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Erreur chargement analytics clients:', error);
      // Fallback to mock data
      const mockData = {
        summary: {
          totalClients: 156,
          recurringClientsPercentage: 68.5
        },
        topClients: [
          { id: 1, name: 'client 1', frequency: 12, revenue: 45000 },
          { id: 2, name: 'client 2', frequency: 10, revenue: 38000 },
          { id: 3, name: 'client 3', frequency: 8, revenue: 32000 },
          { id: 4, name: 'client 4', frequency: 7, revenue: 28000 },
          { id: 5, name: 'client 5', frequency: 6, revenue: 25000 },
          { id: 6, name: 'client 6', frequency: 5, revenue: 22000 },
        ],
        clientList: [
          { id: 1, name: 'Alice Martin', frequency: 12, revenue: 45000 },
          { id: 2, name: 'Bob Dupont', frequency: 10, revenue: 38000 },
          { id: 3, name: 'Carla Petit', frequency: 8, revenue: 32000 },
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
          <Text style={styles.cardLabel}>total client</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.totalClients}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FBEFF3' }]}>
          <TrendingUp size={24} color="#F8A5C2" />
          <Text style={styles.cardLabel}>% clients recurrents</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.recurringClientsPercentage}%</Text>
        </View>
      </View>
    );
  };

  const renderTopClientsChart = () => {
    const data = analyticsData.topClients;
    const maxRevenue = Math.max(...data.map(item => item.revenue));
    const barHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>top 10 frequent rendez-vous</Text>
        
        <View style={styles.barChartContainer}>
          {data.map((client, index) => (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>{client.revenue / 1000}k</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: (client.revenue / maxRevenue) * barHeight,
                      backgroundColor: index % 3 === 0 ? '#87CEEB' : index % 3 === 1 ? '#F8A5C2' : '#FFE4B5'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{client.name}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.yAxisLabels}>
          <Text style={styles.yAxisLabel}>20</Text>
          <Text style={styles.yAxisLabel}>10</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
      </View>
    );
  };

  const renderClientList = () => {
    const filteredClients = analyticsData.clientList.filter(client =>
      client.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <View style={styles.clientListContainer}>
        <View style={styles.clientListHeader}>
          <Text style={styles.clientListTitle}>les clients</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
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
          </View>
          
          {filteredClients.map((client, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{client.id}</Text>
              <Text style={styles.tableCell}>{client.name}</Text>
              <Text style={styles.tableCell}>{client.frequency}</Text>
              <Text style={styles.tableCell}>{client.revenue.toLocaleString()}€</Text>
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
          title="vue sur les client"
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
        title="vue sur les client"
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

        {/* Top Clients Chart */}
        {renderTopClientsChart()}

        {/* Client List */}
        {renderClientList()}
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
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 10,
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
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  yAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
  },
  clientListContainer: {
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
  clientListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clientListTitle: {
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

export default ClientAnalyticsScreen;
