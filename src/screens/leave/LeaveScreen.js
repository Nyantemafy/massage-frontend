import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Filter,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useLeaveCount } from '../../context/LeaveCountContext';
import { useAuth } from '../../context/AuthContext';

const LeaveScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('historique');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { pendingLeaveCount } = useLeaveCount();
  const { user } = useAuth();
  const roleName = user?.role_name || user?.role;
  const isManager = roleName === 'admin' || roleName === 'manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadLeaveRequests(),
        loadLeaveBalances(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/requests');
      
      if (response.status === 200) {
        setLeaveRequests(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    }
  };

  const loadLeaveBalances = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/balances');
      
      if (response.status === 200) {
        setLeaveBalances(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement soldes:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/leave/notifications?unread_only=true');
      
      if (response.status === 200) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setDropdownVisible(false);
    
    if (option === 'demande') {
      navigation.navigate('LeaveRequest');
    } else if (option === 'attente') {
      navigation.navigate('LeavePending');
    }
    // 'historique' reste sur l'écran actuel
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={16} color="#F44336" />;
      case 'pending':
        return <AlertTriangle size={16} color="#FF9800" />;
      case 'cancelled':
        return <XCircle size={16} color="#999" />;
      default:
        return <Clock size={16} color="#666" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#999';
      default:
        return '#666';
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const renderDropdown = () => (
    <Modal
      visible={dropdownVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDropdownVisible(false)}
    >
      <TouchableOpacity 
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setDropdownVisible(false)}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Options Congé</Text>
            <TouchableOpacity onPress={() => setDropdownVisible(false)}>
              <XCircle size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.dropdownOption}
            onPress={() => handleOptionSelect('historique')}
          >
            <Clock size={20} color="#666" />
            <Text style={styles.dropdownOptionText}>Historique des congés</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dropdownOption}
            onPress={() => handleOptionSelect('demande')}
          >
            <Plus size={20} color="#007AFF" />
            <Text style={styles.dropdownOptionText}>Demande de congé</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dropdownOption}
            onPress={() => handleOptionSelect('attente')}
          >
            <AlertTriangle size={20} color="#FF9800" />
            <Text style={styles.dropdownOptionText}>Congés en attente</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderLeaveRequest = (request) => (
    <View style={styles.requestCard} key={request.id}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTypeInfo}>
          <View style={[styles.typeIndicator, { backgroundColor: request.color }]} />
          <Text style={styles.requestType}>{request.leave_type_name}</Text>
        </View>
        <View style={styles.requestStatus}>
          {getStatusIcon(request.status)}
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {getStatusText(request.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestDates}>
        <Text style={styles.datesText}>
          {new Date(request.start_date).toLocaleDateString('fr-FR')} - {' '}
          {new Date(request.end_date).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={styles.daysCount}>
          {calculateDays(request.start_date, request.end_date)} jour(s)
        </Text>
      </View>
      
      {request.reason && (
        <Text style={styles.reasonText} numberOfLines={2}>
          Motif: {request.reason}
        </Text>
      )}
      
      <View style={styles.requestFooter}>
        <Text style={styles.requestDate}>
          Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
        </Text>
        {request.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(request.id)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBalanceCard = (balance) => (
    <View style={styles.balanceCard} key={balance.id}>
      <View style={styles.balanceHeader}>
        <View style={[styles.balanceIndicator, { backgroundColor: balance.color }]} />
        <Text style={styles.balanceType}>{balance.name}</Text>
      </View>
      
      <View style={styles.balanceInfo}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total</Text>
          <Text style={styles.balanceValue}>{balance.total_days}j</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Utilisé</Text>
          <Text style={[styles.balanceValue, { color: '#F44336' }]}>
            {balance.used_days}j
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>En attente</Text>
          <Text style={[styles.balanceValue, { color: '#FF9800' }]}>
            {balance.pending_days}j
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Restant</Text>
          <Text style={[styles.balanceValue, { color: '#4CAF50' }]}>
            {balance.total_days - balance.used_days - balance.pending_days}j
          </Text>
        </View>
      </View>
    </View>
  );

  const handleCancelRequest = async (requestId) => {
    Alert.alert(
      'Annulation',
      'Êtes-vous sûr de vouloir annuler cette demande de congé ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await api.put(`/leave/requests/${requestId}/cancel`);
              
              if (response.status === 200) {
                Alert.alert('Succès', 'Demande de congé annulée');
                loadLeaveRequests();
                loadLeaveBalances();
              } else {
                Alert.alert('Erreur', 'Impossible d\'annuler la demande');
              }
            } catch (error) {
              console.error('Erreur annulation:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Gestion des Congés" 
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        extraRightIcon={true}
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
        showLeaveShortcut={isManager}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Section Historique */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique des Demandes</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {leaveRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#CCC" />
              <Text style={styles.emptyText}>Aucune demande de congé</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => handleOptionSelect('demande')}
              >
                <Plus size={16} color="#FFF" />
                <Text style={styles.emptyButtonText}>Faire une demande</Text>
              </TouchableOpacity>
            </View>
          ) : (
            leaveRequests.map(renderLeaveRequest)
          )}
        </View>
      </ScrollView>

      {/* Dropdown Modal */}
      {renderDropdown()}
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  
  // Dropdown Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  
  // Balance Card Styles
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  balanceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Request Card Styles
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  requestDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datesText: {
    fontSize: 14,
    color: '#666',
  },
  daysCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeaveScreen;
