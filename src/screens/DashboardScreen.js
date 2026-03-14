import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Svg, Line, Circle } from 'react-native-svg';
import { 
  Calendar as CalendarLucide, 
  Bell,
  TrendingUp,
  Star,
  Menu,
  X
} from 'lucide-react-native';
import Header from '../components/Header';
import CustomDrawer from '../components/CustomDrawer';
import api from '../config/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedStartYear, setSelectedStartYear] = useState(new Date().getFullYear());
  const [selectedStartMonth, setSelectedStartMonth] = useState(new Date().getMonth());
  const [selectedStartDay, setSelectedStartDay] = useState(new Date().getDate());
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear());
  const [selectedEndMonth, setSelectedEndMonth] = useState(new Date().getMonth());
  const [selectedEndDay, setSelectedEndDay] = useState(new Date().getDate());
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    revenueChart: [],
    topClients: [],
    topMasseurs: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate]);

  const formatDate = (year, month, day) => {
    const monthNames = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
    return `${day} ${monthNames[month]} ${year}`;
  };

  const formatDateForAPI = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleStartDatePress = () => {
    setShowStartPicker(true);
  };

  const handleEndDatePress = () => {
    setShowEndPicker(true);
  };

  const confirmStartDate = () => {
    const formatted = formatDateForAPI(selectedStartYear, selectedStartMonth, selectedStartDay);
    setStartDate(formatted);
    setShowStartPicker(false);
  };

  const confirmEndDate = () => {
    const formatted = formatDateForAPI(selectedEndYear, selectedEndMonth, selectedEndDay);
    setEndDate(formatted);
    setShowEndPicker(false);
  };

  const handlePointPress = (monthIndex, type, value) => {
    setSelectedPoint({
      month: dashboardData.revenueChart[monthIndex].month,
      type: type,
      value: value,
      ca: dashboardData.revenueChart[monthIndex].ca,
      benefice: dashboardData.revenueChart[monthIndex].benefice,
      charge: dashboardData.revenueChart[monthIndex].charge
    });
    setChartModalVisible(true);
  };

  const renderChartModal = () => {
    if (!selectedPoint) return null;

    return (
      <Modal visible={chartModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setChartModalVisible(false)}
        >
          <View style={styles.chartModalContainer}>
            <View style={styles.chartModalHeader}>
              <Text style={styles.chartModalTitle}>{selectedPoint.month}</Text>
              <TouchableOpacity onPress={() => setChartModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartModalContent}>
              <View style={styles.modalValueRow}>
                <View style={[styles.modalValueIndicator, { backgroundColor: '#FBEFF3' }]} />
                <Text style={styles.modalValueLabel}>Chiffre d'affaire:</Text>
                <Text style={styles.modalValueAmount}>{selectedPoint.ca.toLocaleString()}€</Text>
              </View>
              
              <View style={styles.modalValueRow}>
                <View style={[styles.modalValueIndicator, { backgroundColor: '#D67B92' }]} />
                <Text style={styles.modalValueLabel}>Bénéfice:</Text>
                <Text style={styles.modalValueAmount}>{selectedPoint.benefice.toLocaleString()}€</Text>
              </View>
              
              <View style={styles.modalValueRow}>
                <View style={[styles.modalValueIndicator, { backgroundColor: '#FA4E79' }]} />
                <Text style={styles.modalValueLabel}>Charge:</Text>
                <Text style={styles.modalValueAmount}>{selectedPoint.charge.toLocaleString()}€</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  const renderDatePicker = (isVisible, onClose, onConfirm, year, setYear, month, setMonth, day, setDay) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickersRow}>
              {/* Year Picker */}
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

              {/* Month Picker */}
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

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Jour</Text>
                <ScrollView style={styles.pickerScroll}>
                  {days.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.pickerItem,
                        day === d && styles.pickerItemSelected
                      ]}
                      onPress={() => setDay(d)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        day === d && styles.pickerItemTextSelected
                      ]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/dashboard', { params });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Fallback to mock data if API fails
      const mockData = {
        revenueChart: [
          { month: 'janvier', ca: 45000, benefice: 12000, charge: 33000 },
          { month: 'fevrier', ca: 52000, benefice: 15000, charge: 37000 },
          { month: 'mars', ca: 48000, benefice: 13000, charge: 35000 },
          { month: 'avril', ca: 55000, benefice: 18000, charge: 37000 },
        ],
        topClients: [
          { name: 'Client A', revenue: 15000 },
          { name: 'Client B', revenue: 12000 },
          { name: 'Client C', revenue: 10000 },
          { name: 'Client D', revenue: 8000 },
          { name: 'Client E', revenue: 6000 },
        ],
        topMasseurs: [
          { name: 'Masseur 1', revenue: 25000 },
          { name: 'Masseur 2', revenue: 22000 },
          { name: 'Masseur 3', revenue: 18000 },
          { name: 'Masseur 4', revenue: 15000 },
          { name: 'Masseur 5', revenue: 12000 },
        ]
      };
      setDashboardData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const getMaxRevenue = () => {
    const allRevenues = [
      ...dashboardData.revenueChart.map(item => item.ca),
      ...dashboardData.revenueChart.map(item => item.benefice),
      ...dashboardData.revenueChart.map(item => item.charge)
    ];
    return Math.max(...allRevenues);
  };

  const getMaxClientRevenue = () => {
    return Math.max(...dashboardData.topClients.map(client => client.revenue));
  };

  const renderRevenueChart = () => {
    const months = dashboardData.revenueChart;
    
    // Calculate max values for scaling
    const maxValue = Math.max(
      ...months.map(m => Math.max(m.ca, m.benefice, m.charge))
    );
    
    // Prepare data points for line chart
    const caPoints = months.map((m, i) => ({ x: i, y: (m.ca / maxValue) * 100 }));
    const beneficePoints = months.map((m, i) => ({ x: i, y: (m.benefice / maxValue) * 100 }));
    const chargePoints = months.map((m, i) => ({ x: i, y: (m.charge / maxValue) * 100 }));
    
    const chartWidth = width - 60;
    const chartHeight = 200;
    const pointSpacing = chartWidth / (months.length - 1 || 1);
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Chiffre d'affaire</Text>
          <TouchableOpacity 
            style={styles.detailButton}
            onPress={() => navigation.navigate('RevenueAnalytics')}
          >
            <Text style={styles.detailButtonText}>voir detail</Text>
          </TouchableOpacity>
        </View>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FBEFF3' }]} />
            <Text style={styles.legendText}>CA</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D67B92' }]} />
            <Text style={styles.legendText}>Benefice</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FA4E79' }]} />
            <Text style={styles.legendText}>Charge</Text>
          </View>
        </View>

        {/* Line Chart */}
        <View style={[styles.lineChartContainer, { height: chartHeight }]}>
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                { bottom: (i * chartHeight) / 4 }
              ]}
            />
          ))}
          
          {/* CA Line */}
          <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
            {caPoints.map((point, i) => {
              if (i === 0) return null;
              const prevPoint = caPoints[i - 1];
              return (
                <Line
                  key={`ca-${i}`}
                  x1={prevPoint.x * pointSpacing}
                  y1={chartHeight - prevPoint.y}
                  x2={point.x * pointSpacing}
                  y2={chartHeight - point.y}
                  stroke="#FBEFF3"
                  strokeWidth="3"
                />
              );
            })}
            {caPoints.map((point, i) => (
              <TouchableOpacity
                key={`ca-point-${i}`}
                style={{ position: 'absolute', left: (point.x * pointSpacing) - 10, top: (chartHeight - point.y) - 10 }}
                onPress={() => handlePointPress(i, 'CA', months[i].ca)}
              >
                <Circle
                  cx={10}
                  cy={10}
                  r="6"
                  fill="#FBEFF3"
                  stroke="#FFF"
                  strokeWidth="2"
                />
              </TouchableOpacity>
            ))}
          </Svg>
          
          {/* Benefice Line */}
          <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
            {beneficePoints.map((point, i) => {
              if (i === 0) return null;
              const prevPoint = beneficePoints[i - 1];
              return (
                <Line
                  key={`benefice-${i}`}
                  x1={prevPoint.x * pointSpacing}
                  y1={chartHeight - prevPoint.y}
                  x2={point.x * pointSpacing}
                  y2={chartHeight - point.y}
                  stroke="#D67B92"
                  strokeWidth="3"
                />
              );
            })}
            {beneficePoints.map((point, i) => (
              <TouchableOpacity
                key={`benefice-point-${i}`}
                style={{ position: 'absolute', left: (point.x * pointSpacing) - 10, top: (chartHeight - point.y) - 10 }}
                onPress={() => handlePointPress(i, 'Benefice', months[i].benefice)}
              >
                <Circle
                  cx={10}
                  cy={10}
                  r="6"
                  fill="#D67B92"
                  stroke="#FFF"
                  strokeWidth="2"
                />
              </TouchableOpacity>
            ))}
          </Svg>
          
          {/* Charge Line */}
          <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
            {chargePoints.map((point, i) => {
              if (i === 0) return null;
              const prevPoint = chargePoints[i - 1];
              return (
                <Line
                  key={`charge-${i}`}
                  x1={prevPoint.x * pointSpacing}
                  y1={chartHeight - prevPoint.y}
                  x2={point.x * pointSpacing}
                  y2={chartHeight - point.y}
                  stroke="#FA4E79"
                  strokeWidth="3"
                />
              );
            })}
            {chargePoints.map((point, i) => (
              <TouchableOpacity
                key={`charge-point-${i}`}
                style={{ position: 'absolute', left: (point.x * pointSpacing) - 10, top: (chartHeight - point.y) - 10 }}
                onPress={() => handlePointPress(i, 'Charge', months[i].charge)}
              >
                <Circle
                  cx={10}
                  cy={10}
                  r="6"
                  fill="#FA4E79"
                  stroke="#FFF"
                  strokeWidth="2"
                />
              </TouchableOpacity>
            ))}
          </Svg>
          
          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            {months.map((month, i) => (
              <Text key={i} style={styles.xAxisLabel}>
                {month.month}
              </Text>
            ))}
          </View>
        </View>
        
        <Text style={styles.highestLabel}>le plus eleve</Text>
      </View>
    );
  };

  const renderTopLists = () => {
    const maxClientRevenue = Math.max(...dashboardData.topClients.map(client => client.revenue));

    return (
      <View style={styles.topListsContainer}>
        {/* Top 5 Clients */}
        <View style={styles.halfContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.chartTitle}>Top 5 Clients</Text>
            <TouchableOpacity 
              style={styles.detailButton}
              onPress={() => navigation.navigate('ClientAnalytics')}
            >
              <Text style={styles.detailButtonText}>voir detail</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.topClients.map((client, index) => (
            <View key={index} style={styles.clientRow}>
              <Text style={styles.clientName}>{client.name}</Text>
              <View style={styles.clientBarContainer}>
                <View 
                  style={[
                    styles.clientBar,
                    { 
                      width: (client.revenue / maxClientRevenue) * (width / 2 - 60),
                      backgroundColor: '#FD295E'
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
        
        {/* Top 5 Masseurs */}
        <View style={styles.halfContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.chartTitle}>Top 5 Masseurs</Text>
            <TouchableOpacity 
              style={styles.detailButton}
              onPress={() => navigation.navigate('MasseuseAnalytics')}
            >
              <Text style={styles.detailButtonText}>voir detail</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.topMasseurs.map((masseur, index) => (
            <View key={index} style={styles.masseurRow}>
              <View style={styles.masseurInfo}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.masseurName}>{masseur.name}</Text>
              </View>
              <Text style={styles.masseurRevenue}>CA</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Tableau de bord"
          showMenu={true}
          onMenuPress={() => setDrawerVisible(true)}
          rightIcon={<TrendingUp size={24} color="#333" />}
          onRightPress={() => {}}
          extraRightIcon={true}
          onExtraRightPress={handleExtraRightPress}
          badgeCount={1}
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
        title="Tableau de bord"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        rightIcon={<TrendingUp size={24} color="#333" />}
        onRightPress={() => {}}
        extraRightIcon={true}
        onExtraRightPress={handleExtraRightPress}
        badgeCount={1}
      />

      <ScrollView style={styles.content}>
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date debut</Text>
            <TouchableOpacity style={styles.dateInput} onPress={handleStartDatePress}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>
                {startDate ? formatDate(selectedStartYear, selectedStartMonth, selectedStartDay) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date fin</Text>
            <TouchableOpacity style={styles.dateInput} onPress={handleEndDatePress}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>
                {endDate ? formatDate(selectedEndYear, selectedEndMonth, selectedEndDay) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue Chart */}
        {renderRevenueChart()}

        {/* Top Lists Side by Side */}
        {renderTopLists()}
      </ScrollView>

      <CustomDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />

      {/* Date Pickers */}
      {renderDatePicker(
        showStartPicker,
        () => setShowStartPicker(false),
        confirmStartDate,
        selectedStartYear,
        setSelectedStartYear,
        selectedStartMonth,
        setSelectedStartMonth,
        selectedStartDay,
        setSelectedStartDay
      )}
      
      {renderDatePicker(
        showEndPicker,
        () => setShowEndPicker(false),
        confirmEndDate,
        selectedEndYear,
        setSelectedEndYear,
        selectedEndMonth,
        setSelectedEndMonth,
        selectedEndDay,
        setSelectedEndDay
      )}

      {/* Chart Modal */}
      {renderChartModal()}
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
    marginBottom: 20,
    gap: 15,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailButton: {
    backgroundColor: '#F8A5C2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
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
  lineChartContainer: {
    position: 'relative',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  svgChart: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#666',
  },
  topListsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  halfContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highestLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 14,
    color: '#333',
    width: 80,
    fontWeight: '500',
  },
  clientBarContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  clientBar: {
    height: 8,
    backgroundColor: '#F8A5C2',
    borderRadius: 4,
  },
  masseurRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  masseurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masseurName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  masseurRevenue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Date Picker Styles
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
    width: width * 0.9,
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
  // Value Labels Styles
  valueLabelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  valueLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  caValueText: {
    fontSize: 10,
    color: '#FBEFF3',
    fontWeight: '600',
  },
  beneficeValueText: {
    fontSize: 10,
    color: '#D67B92',
    fontWeight: '600',
  },
  chargeValueText: {
    fontSize: 10,
    color: '#FA4E79',
    fontWeight: '600',
  },
  // Chart Modal Styles
  chartModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartModalContent: {
    gap: 15,
  },
  modalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalValueIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalValueLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalValueAmount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default DashboardScreen;
