import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { User, Bell, Filter, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import CustomDrawer from '../../components/CustomDrawer';
import { useLeaveCount } from '../../context/LeaveCountContext';

const HistoryScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { pendingLeaveCount } = useLeaveCount();
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadHistory(1);
  }, []);

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const loadHistory = async (page = 1, append = false, filters = {}) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      // Construire l'URL avec les paramètres
      let url = `/appointments/history/filtered?page=${page}&limit=${ITEMS_PER_PAGE}`;
      
      // Ajouter les filtres s'ils existent
      if (filters.clientId) url += `&clientId=${filters.clientId}`;
      if (filters.masseurId) url += `&masseurId=${filters.masseurId}`;
      if (filters.offerId) url += `&offerId=${filters.offerId}`;
      if (filters.massageTypeId) url += `&massageTypeId=${filters.massageTypeId}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      if (filters.searchTerm) url += `&searchTerm=${filters.searchTerm}`;

      const response = await api.get(url);
      
      const { data, pagination } = response.data;
      
      if (append) {
        setAppointments(prev => [...prev, ...data]);
      } else {
        setAppointments(data);
      }
      
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
      setHasNextPage(pagination.hasNextPage);
      setHasPrevPage(pagination.hasPrevPage);
      
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const navigateToFilters = () => {
    navigation.navigate('Filter', {
      currentFilters: {
        clientId: activeFilters.clientId,
        clientName: activeFilters.clientName,
        masseurId: activeFilters.masseurId,
        masseurName: activeFilters.masseurName,
        offerId: activeFilters.offerId,
        offerName: activeFilters.offerName,
        massageTypeId: activeFilters.massageTypeId,
        massageTypeName: activeFilters.massageTypeName,
        status: activeFilters.status,
        dateFrom: activeFilters.startDate,
        dateTo: activeFilters.endDate,
        searchTerm: activeFilters.searchTerm,
      },
      onApplyFilters: (newFilters) => {
        setActiveFilters(newFilters);
        loadHistory(1, false, newFilters);
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(1, false);
  };

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      loadHistory(currentPage + 1, true);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadHistory(page, false);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return status || 'Inconnu';
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <User size={32} color="#999" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{item.client_name || 'Client'}</Text>
          <Text style={styles.offer} numberOfLines={1}>
            {item.offer_name || item.massage_type_name || 'Prestation'}
          </Text>
          {item.masseur_name && (
            <Text style={styles.masseurName}>Masseur: {item.masseur_name}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.time}>{item.start_time}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F8A5C2" />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, !hasPrevPage && styles.paginationButtonDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft size={20} color={hasPrevPage ? "#F8A5C2" : "#CCC"} />
        </TouchableOpacity>
        
        <Text style={styles.paginationText}>
          Page {currentPage} / {totalPages}
        </Text>
        <Text style={styles.paginationTotal}>({totalItems} rdv)</Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, !hasNextPage && styles.paginationButtonDisabled]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ChevronLeft size={20} color={hasPrevPage ? "#F8A5C2" : "#CCC"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Historique des rendez-vous"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        rightIcon={<Bell size={24} color="#333" />}
        onRightPress={() => {}}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <View style={styles.filterContainer}>
        <TouchableOpacity
        style={[styles.filterButton, Object.keys(activeFilters).length > 0 && styles.filterButtonActive]}
        onPress={navigateToFilters}
      >
        <Filter size={16} color={Object.keys(activeFilters).length > 0 ? "#FFF" : "#333"} />
        <Text style={[styles.filterButtonText, Object.keys(activeFilters).length > 0 && styles.filterButtonTextActive]}>
          Filtres {Object.keys(activeFilters).length > 0 ? `(${Object.keys(activeFilters).length})` : ''}
        </Text>
      </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Clock size={64} color="#CCC" />
                <Text style={styles.emptyText}>Aucun rendez-vous</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => navigation.navigate('NewAppointment')}
                >
                  <Text style={styles.addButtonText}>+ Nouveau rendez-vous</Text>
                </TouchableOpacity>
              </View>
            }
          />
          
          {renderPaginationControls()}
        </>
      )}
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  filterButtonActive: {
    backgroundColor: '#F8A5C2',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFE5EF',
    borderRadius: 20,
    gap: 5,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
    paddingBottom: 5,
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE5EF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFE5EF',
  },
  cardInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  offer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  masseurName: {
    fontSize: 12,
    color: '#999',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8A5C2',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 15,
  },
  paginationButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFE5EF',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  paginationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paginationTotal: {
    fontSize: 12,
    color: '#999',
  },
});

export default HistoryScreen;