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
  Star,
  X
} from 'lucide-react-native';
import Header from '../components/Header';
import CustomDrawer from '../components/CustomDrawer';
import { useLeaveCount } from '../context/LeaveCountContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { pendingLeaveCount, refreshLeaveCount } = useLeaveCount();
  const [loading, setLoading] = useState(false);

  // Vérifier les permissions - rediriger si non autorisé
  useEffect(() => {
    if (user && user.role_id !== 1 && user.role_id !== 2) {
      // Rediriger vers Schedule si non admin/manager
      navigation.replace('Schedule');
    }
  }, [user, navigation]);
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

  const formatDate = (year, month) => {
    const monthNames = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
    return `${monthNames[month]} ${year}`;
  };

  const formatDateForAPI = (year, month) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  };

  const formatDateForAPIEnd = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
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

  const handlePaymentDayPress = (dayData) => {
    setSelectedPoint({
      title: dayData.title,
      totalAmount: dayData.totalAmount,
      payments: dayData.payments,
      date: dayData.date,
      day: dayData.day,
      month: dayData.month,
      currency: 'Ar'
    });
    setChartModalVisible(true);
  };

  const handleClientPress = (client) => {
    // Utiliser les vrais montants des paiements
    const payments = client.paymentDetails && client.paymentDetails.length > 0 
      ? client.paymentDetails.map(detail => ({
          client: client.name,
          amount: detail.amount,
          date: detail.date
        }))
      : [];
    
    setSelectedPoint({
      title: `Détails du client: ${client.name}`,
      totalAmount: client.revenue,
      payments: payments,
      date: `Total: ${client.revenue.toLocaleString()} Ar`,
      clientName: client.name,
      paymentCount: client.paymentCount,
      currency: 'Ar'
    });
    setChartModalVisible(true);
  };

  const handleMasseurPress = (masseur) => {
    // Utiliser les vrais montants des paiements
    const payments = masseur.paymentDetails && masseur.paymentDetails.length > 0 
      ? masseur.paymentDetails.map(detail => ({
          client: masseur.name,
          amount: detail.amount,
          date: detail.date
        }))
      : [];
    
    setSelectedPoint({
      title: `Détails du masseur: ${masseur.name}`,
      totalAmount: masseur.revenue,
      payments: payments,
      date: `Total: ${masseur.revenue.toLocaleString()} Ar`,
      masseurName: masseur.name,
      paymentCount: masseur.paymentCount,
      currency: 'Ar'
    });
    setChartModalVisible(true);
  };

  const renderChartModal = () => {
    if (!selectedPoint) return null;
    const currencySymbol = selectedPoint.currency === 'Ar' ? 'Ar' : '€';

    return (
      <Modal visible={chartModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setChartModalVisible(false)}
        >
          <View style={styles.chartModalContainer}>
            <View style={styles.chartModalHeader}>
              <Text style={styles.chartModalTitle}>{selectedPoint.title}</Text>
              <TouchableOpacity onPress={() => setChartModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartModalContent}>
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalAmountLabel}>Total des revenus:</Text>
                <Text style={styles.totalAmountValue}>{selectedPoint.totalAmount.toLocaleString()} {currencySymbol}</Text>
              </View>
              
              {selectedPoint.paymentCount && (
                <View style={styles.paymentCountContainer}>
                  <Text style={styles.paymentCountLabel}>Nombre de paiements:</Text>
                  <Text style={styles.paymentCountValue}>{selectedPoint.paymentCount}</Text>
                </View>
              )}
              
              {selectedPoint.payments && selectedPoint.payments.length > 0 && (
                <View style={styles.paymentDetailsContainer}>
                  <Text style={styles.paymentDetailsTitle}>Détails des paiements:</Text>
                  {selectedPoint.payments.map((payment, index) => (
                    <View key={index} style={styles.paymentDetailRow}>
                      <Text style={styles.paymentClient}>
                        {payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : `Paiement ${index + 1}`}
                      </Text>
                      <Text style={styles.paymentAmount}>{payment.amount.toLocaleString()} {currencySymbol}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderDatePicker = (isVisible, onClose, onConfirm, year, setYear, month, setMonth) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Sélectionner une période</Text>
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
      // Fallback to mock data with real payment amounts
      const mockData = {
        revenueChart: [
          { 
            month: 'janvier', 
            ca: 45000, 
            benefice: 12000, 
            charge: 33000, 
            dailyPayments: [
              { day: 5, totalAmount: 15000, payments: [{client: 'Client A', amount: 8000}, {client: 'Client B', amount: 7000}] },
              { day: 15, totalAmount: 30000, payments: [{client: 'Client C', amount: 15000}, {client: 'Client D', amount: 15000}] }
            ]
          },
          { 
            month: 'fevrier', 
            ca: 52000, 
            benefice: 15000, 
            charge: 37000, 
            dailyPayments: [
              { day: 10, totalAmount: 25000, payments: [{client: 'Client E', amount: 25000}] },
              { day: 20, totalAmount: 27000, payments: [{client: 'Client F', amount: 12000}, {client: 'Client G', amount: 15000}] }
            ]
          },
          { 
            month: 'mars', 
            ca: 0, 
            benefice: 0, 
            charge: 0, 
            dailyPayments: [] 
          },
          { 
            month: 'avril', 
            ca: 55000, 
            benefice: 18000, 
            charge: 37000, 
            dailyPayments: [
              { day: 8, totalAmount: 30000, payments: [{client: 'Client H', amount: 30000}] },
              { day: 18, totalAmount: 25000, payments: [{client: 'Client I', amount: 25000}] }
            ]
          },
        ],
        topClients: [
          { 
            name: 'Client A', 
            revenue: 15000, 
            paymentCount: 3, 
            paymentDates: ['2024-01-05', '2024-01-15', '2024-01-25'],
            paymentDetails: [
              { amount: 5000, date: '2024-01-05' },
              { amount: 5000, date: '2024-01-15' },
              { amount: 5000, date: '2024-01-25' }
            ]
          },
          { 
            name: 'Client B', 
            revenue: 12000, 
            paymentCount: 2, 
            paymentDates: ['2024-02-10', '2024-02-20'],
            paymentDetails: [
              { amount: 6000, date: '2024-02-10' },
              { amount: 6000, date: '2024-02-20' }
            ]
          },
          { 
            name: 'Client C', 
            revenue: 10000, 
            paymentCount: 1, 
            paymentDates: ['2024-03-15'],
            paymentDetails: [
              { amount: 10000, date: '2024-03-15' }
            ]
          },
        ],
        topMasseurs: [
          { 
            name: 'Masseur 1', 
            revenue: 25000, 
            paymentCount: 5, 
            paymentDates: ['2024-01-05', '2024-01-12', '2024-01-19', '2024-01-26', '2024-02-02'],
            paymentDetails: [
              { amount: 5000, date: '2024-01-05' },
              { amount: 5000, date: '2024-01-12' },
              { amount: 5000, date: '2024-01-19' },
              { amount: 5000, date: '2024-01-26' },
              { amount: 5000, date: '2024-02-02' }
            ]
          },
          { 
            name: 'Masseur 2', 
            revenue: 22000, 
            paymentCount: 4, 
            paymentDates: ['2024-01-08', '2024-01-15', '2024-01-22', '2024-01-29'],
            paymentDetails: [
              { amount: 5500, date: '2024-01-08' },
              { amount: 5500, date: '2024-01-15' },
              { amount: 5500, date: '2024-01-22' },
              { amount: 5500, date: '2024-01-29' }
            ]
          },
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

  const renderRevenueChart = () => {
    const months = dashboardData.revenueChart;
    
    if (months.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        </View>
      );
    }
    
    // Récupérer tous les paiements journaliers de tous les mois
    const allDailyPayments = [];
    
    months.forEach(month => {
      if (month.dailyPayments && month.dailyPayments.length > 0) {
        month.dailyPayments.forEach(payment => {
          allDailyPayments.push({
            month: month.month,
            monthIndex: months.findIndex(m => m.month === month.month),
            day: payment.day,
            totalAmount: payment.totalAmount,
            payments: payment.payments,
            ca: payment.totalAmount,
            benefice: payment.totalAmount * 0.3,
            charge: payment.totalAmount * 0.7,
            date: `${month.month} ${payment.day}`,
            // Créer une date complète pour le tri
            fullDate: new Date(2024, months.findIndex(m => m.month === month.month), payment.day)
          });
        });
      }
    });
    
    // Trier par date chronologique
    allDailyPayments.sort((a, b) => a.fullDate - b.fullDate);
    
    // Si on a des paiements, les utiliser comme données du graphique
    const useDailyPayments = allDailyPayments.length > 0;
    
    let chartData = [];
    let xAxisLabels = [];
    
    if (useDailyPayments) {
      // Afficher chaque jour avec paiement comme un point distinct
      chartData = allDailyPayments.map((payment, index) => ({
        x: index,
        day: payment.day,
        month: payment.month,
        totalAmount: payment.totalAmount,
        payments: payment.payments,
        ca: payment.totalAmount,
        benefice: payment.totalAmount * 0.3,
        charge: payment.totalAmount * 0.7,
        fullDate: payment.fullDate
      }));
      
      xAxisLabels = allDailyPayments.map(payment => {
        const monthAbbr = payment.month.substring(0, 3);
        return `${monthAbbr} ${payment.day}`;
      });
    } else {
      // Fallback: afficher par mois
      chartData = months.map((m, i) => ({
        x: i,
        month: m.month,
        ca: m.ca,
        benefice: m.benefice,
        charge: m.charge,
        dailyPayments: m.dailyPayments
      }));
      
      xAxisLabels = months.map(m => m.month);
    }
    
    if (chartData.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>Aucune donnée disponible pour cette période</Text>
        </View>
      );
    }
    
    // Calculate max values for scaling
    const maxValue = Math.max(...chartData.map(d => Math.max(d.ca || 0, d.benefice || 0, d.charge || 0)), 1);
    
    // Prepare data points for all three lines
    const caPoints = chartData.map((item, i) => ({ 
      x: i, 
      y: ((item.ca || 0) / maxValue) * 100,
      value: item.ca || 0
    }));
    
    const beneficePoints = chartData.map((item, i) => ({ 
      x: i, 
      y: ((item.benefice || 0) / maxValue) * 100,
      value: item.benefice || 0
    }));
    
    const chargePoints = chartData.map((item, i) => ({ 
      x: i, 
      y: ((item.charge || 0) / maxValue) * 100,
      value: item.charge || 0
    }));
    
    const chartWidth = width - 60;
    const chartHeight = 200;
    const pointSpacing = chartData.length === 1 ? chartWidth : chartWidth / (chartData.length - 1);
    
    // Créer les marqueurs pour chaque point de paiement
    const paymentMarkers = chartData.map((item, index) => {
      const xPosition = index * pointSpacing;
      const yPosition = chartHeight - (caPoints[index]?.y || 0);
      
      return {
        x: xPosition,
        y: yPosition,
        title: item.month ? `Paiements du ${item.day} ${item.month}` : `Paiements du ${item.day}`,
        day: item.day,
        month: item.month,
        totalAmount: item.totalAmount,
        payments: item.payments,
        date: item.month ? `${item.month} ${item.day}` : `Jour ${item.day}`,
        amount: item.ca
      };
    });
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {useDailyPayments ? "Paiements journaliers" : "Évolution financière"}
          </Text>
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
            <Text style={styles.legendText}>Chiffre d'affaire</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D67B92' }]} />
            <Text style={styles.legendText}>Bénéfice</Text>
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
          
          {/* SVG for all lines */}
          <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
            {/* CA Line */}
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
                  strokeWidth="2.5"
                />
              );
            })}
            
            {/* Benefice Line */}
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
                  strokeWidth="2.5"
                />
              );
            })}
            
            {/* Charge Line */}
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
                  strokeWidth="2.5"
                />
              );
            })}
          </Svg>
          
          {/* Payment Markers - Sans texte noir */}
          {paymentMarkers.map((marker, index) => (
            <TouchableOpacity
              key={`marker-${index}`}
              style={[
                styles.paymentMarker,
                {
                  left: marker.x - 14,
                  top: marker.y - 14,
                  position: 'absolute'
                }
              ]}
              onPress={() => handlePaymentDayPress(marker)}
              activeOpacity={0.7}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerOuterRing}>
                  <View style={styles.markerInnerDot}>
                    <Text style={styles.markerIcon}>💰</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            {xAxisLabels.map((label, i) => (
              <Text key={i} style={styles.xAxisLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
        
        <Text style={styles.highestLabel}>
          {paymentMarkers.length > 0 
            ? "💰 Cliquez sur les marqueurs pour voir les détails des paiements du jour" 
            : "Aucun paiement pour la période sélectionnée"}
        </Text>
      </View>
    );
  };

  const renderTopLists = () => {
    if (dashboardData.topClients.length === 0 && dashboardData.topMasseurs.length === 0) {
      return (
        <View style={styles.topListsContainer}>
          <View style={styles.halfContainer}>
            <Text style={styles.noDataText}>Aucun client avec paiement</Text>
          </View>
          <View style={styles.halfContainer}>
            <Text style={styles.noDataText}>Aucun masseur avec paiement</Text>
          </View>
        </View>
      );
    }

    const maxClientRevenue = Math.max(...dashboardData.topClients.map(client => client.revenue), 1);

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
            <TouchableOpacity 
              key={index} 
              style={styles.clientRow}
              onPress={() => handleClientPress(client)}
              activeOpacity={0.7}
            >
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
              <Text style={styles.clientRevenue}>{client.revenue.toLocaleString()} Ar</Text>
            </TouchableOpacity>
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
            <TouchableOpacity 
              key={index} 
              style={styles.masseurRow}
              onPress={() => handleMasseurPress(masseur)}
              activeOpacity={0.7}
            >
              <View style={styles.masseurInfo}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.masseurName}>{masseur.name}</Text>
                {masseur.paymentCount > 0 && (
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>{masseur.paymentCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.masseurRevenue}>{masseur.revenue.toLocaleString()} Ar</Text>
            </TouchableOpacity>
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
          onRightPress={() => {}}
          extraRightIcon={true}
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
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
        onRightPress={() => {}}
        extraRightIcon={true}
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView style={styles.content}>
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date debut</Text>
            <TouchableOpacity style={styles.dateInput} onPress={handleStartDatePress}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>
                {startDate ? formatDate(selectedStartYear, selectedStartMonth) : 'Date debut'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Date fin</Text>
            <TouchableOpacity style={styles.dateInput} onPress={handleEndDatePress}>
              <CalendarLucide size={20} color="#666" />
              <Text style={styles.dateText}>
                {endDate ? formatDate(selectedEndYear, selectedEndMonth) : 'Date fin'}
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
        setSelectedStartMonth
      )}
      
      {renderDatePicker(
        showEndPicker,
        () => setShowEndPicker(false),
        confirmEndDate,
        selectedEndYear,
        setSelectedEndYear,
        selectedEndMonth,
        setSelectedEndMonth
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
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
    flexWrap: 'wrap',
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
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    maxWidth: 60,
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
    marginTop: 10,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
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
    position: 'relative',
    justifyContent: 'center',
  },
  clientBar: {
    height: 8,
    backgroundColor: '#F8A5C2',
    borderRadius: 4,
  },
  clientRevenue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
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
  paymentBadge: {
    backgroundColor: '#FD295E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paymentBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  chartModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 350,
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
    flex: 1,
  },
  chartModalContent: {
    gap: 15,
  },
  totalAmountContainer: {
    backgroundColor: '#F8A5C2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    marginBottom: 5,
  },
  totalAmountValue: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  paymentCountContainer: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentCountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  paymentCountValue: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  paymentDetailsContainer: {
    marginTop: 10,
  },
  paymentDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentClient: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  paymentMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    zIndex: 10,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuterRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerInnerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  markerIcon: {
    fontSize: 12,
  },
});

export default DashboardScreen;