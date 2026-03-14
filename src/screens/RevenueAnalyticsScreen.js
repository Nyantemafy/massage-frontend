import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Svg, Circle, Path, Rect } from 'react-native-svg';
import { 
  ChevronLeft,
  Calendar as CalendarLucide,
  TrendingUp,
  DollarSign,
  CreditCard,
} from 'lucide-react-native';
import Header from '../components/Header';
import api from '../config/api';

const { width } = Dimensions.get('window');

const RevenueAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    revenueByType: [],
    expenses: [],
    summary: {
      ca: 0,
      benefice: 0,
      charge: 0
    }
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [startDate, endDate]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/revenue', { params });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      // Fallback to mock data
      const mockData = {
        revenueByType: [
          { type: 'Massage Complet', amount: 45000, percentage: 35 },
          { type: 'Massage Relaxant', amount: 32000, percentage: 25 },
          { type: 'Massage Dos', amount: 25000, percentage: 20 },
          { type: 'Foot Massage', amount: 16000, percentage: 12 },
          { type: 'Massage Facial', amount: 10000, percentage: 8 }
        ],
        expenses: [
          { type: 'Salaire', amount: 35000 },
          { type: 'Credit', amount: 15000 },
          { type: 'Huile', amount: 8000 }
        ],
        summary: {
          ca: 128000,
          benefice: 70000,
          charge: 58000
        }
      };
      setAnalyticsData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const renderPieChart = () => {
    const data = analyticsData.revenueByType;
    const centerX = width / 2 - 60;
    const centerY = 120;
    const radius = 80;
    
    let currentAngle = -90; // Start from top
    
    const createPieSlice = (startAngle, percentage, color) => {
      const angle = (percentage * 360) / 100;
      const endAngle = startAngle + angle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return { path: pathData, endAngle };
    };
    
    const colors = ['#F8A5C2', '#FBEFF3', '#D67B92', '#FA4E79', '#E66B8A'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>repartition du chiffre d'affaire par type massage</Text>
        
        <Svg width={width - 120} height={240}>
          {data.map((item, index) => {
            const slice = createPieSlice(currentAngle, item.percentage, colors[index]);
            currentAngle = slice.endAngle;
            
            return (
              <Path
                key={index}
                d={slice.path}
                fill={colors[index]}
                stroke="#FFF"
                strokeWidth={2}
              />
            );
          })}
        </Svg>
        
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors[index] }]} />
              <Text style={styles.legendText}>{item.type}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderExpenseChart = () => {
    const data = analyticsData.expenses;
    const maxAmount = Math.max(...data.map(item => item.amount));
    const barWidth = (width - 120) / data.length - 20;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>recapitulation des charges</Text>
        
        <View style={styles.barChartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barAmount}>{item.amount.toLocaleString()}€</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.expenseBar,
                    { 
                      width: barWidth,
                      height: (item.amount / maxAmount) * 120,
                      backgroundColor: '#FA4E79'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{item.type}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSummaryCards = () => {
    return (
      <View style={styles.cardsContainer}>
        <TouchableOpacity style={[styles.summaryCard, { backgroundColor: '#FBEFF3' }]}>
          <DollarSign size={24} color="#333" />
          <Text style={styles.cardLabel}>CA</Text>
          <Text style={styles.cardAmount}>{analyticsData.summary.ca.toLocaleString()}€</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.summaryCard, { backgroundColor: '#D67B92' }]}>
          <TrendingUp size={24} color="#FFF" />
          <Text style={[styles.cardLabel, { color: '#FFF' }]}>Benefice</Text>
          <Text style={[styles.cardAmount, { color: '#FFF' }]}>
            {analyticsData.summary.benefice.toLocaleString()}€
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.summaryCard, { backgroundColor: '#FA4E79' }]}>
          <CreditCard size={24} color="#FFF" />
          <Text style={[styles.cardLabel, { color: '#FFF' }]}>Charge</Text>
          <Text style={[styles.cardAmount, { color: '#FFF' }]}>
            {analyticsData.summary.charge.toLocaleString()}€
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="chiffre d'affaire"
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
        title="chiffre d'affaire"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>date debut</Text>
            <TouchableOpacity style={styles.dateInput}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>{startDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>date fin</Text>
            <TouchableOpacity style={styles.dateInput}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>{endDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Pie Chart */}
        {renderPieChart()}

        {/* Expense Chart */}
        {renderExpenseChart()}
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
    fontSize: 14,
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 15,
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
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 10,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  expenseBar: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default RevenueAnalyticsScreen;
