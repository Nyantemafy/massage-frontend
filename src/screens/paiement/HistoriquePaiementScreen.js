import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  Filter,
  CreditCard,
  Calendar,
  User,
  ArrowLeft,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const HistoriquePaiementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paiements, setPaiements] = useState([]);
  const [stats, setStats] = useState({
    total_amount: 0,
    payment_count: 0
  });

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: '',
    titre: '',
    montantMin: '',
    montantMax: '',
    start_date: '',
    end_date: '',
  });

  // États pour les filtres temporaires (avant validation)
  const [tempFilters, setTempFilters] = useState({
    status: '',
    titre: '',
    montantMin: '',
    montantMax: '',
  });

  // Charger l'historique des paiements
  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.titre) params.titre = filters.titre;
      if (filters.montantMin) params.montant_min = filters.montantMin;
      if (filters.montantMax) params.montant_max = filters.montantMax;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.get('/paiement/history', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPaiements(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await api.get('/paiement/stats', {
        params: { period: 'month' },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
    loadStats();
  }, [filters]);

  // Rafraîchir
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadPaymentHistory(), loadStats()]).finally(() => setRefreshing(false));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    setFilters({
      ...filters,
      status: tempFilters.status,
      titre: tempFilters.titre,
      montantMin: tempFilters.montantMin,
      montantMax: tempFilters.montantMax,
    });
    setFilterVisible(false);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setTempFilters({
      status: '',
      titre: '',
      montantMin: '',
      montantMax: '',
    });
    setFilters({
      status: '',
      titre: '',
      montantMin: '',
      montantMax: '',
      start_date: '',
      end_date: '',
    });
    setFilterVisible(false);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'payé':
      case 'paid':
        return '#4CAF50';
      case 'en attente':
      case 'pending':
        return '#FF9800';
      case 'partiel':
      case 'partial':
        return '#F8A5C2';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'payé':
      case 'paid':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'en attente':
      case 'pending':
        return <Clock size={20} color="#FF9800" />;
      case 'partiel':
      case 'partial':
        return <AlertCircle size={20} color="#F8A5C2" />;
      default:
        return <CreditCard size={20} color="#999" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' AR';
  };

  const renderPaiementCard = (paiement) => (
    <TouchableOpacity 
      key={paiement.id} 
      style={styles.paiementCard}
      onPress={() => navigation.navigate('DetailCharge', { id: paiement.id, type: 'paiement' })}
    >
      <View style={styles.paiementHeader}>
        <View style={styles.paiementTitleContainer}>
          {getStatusIcon(paiement.payment_status || paiement.status)}
          <Text style={styles.paiementTitre}>
            {paiement.offer_name || paiement.titre || 'Paiement'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(paiement.payment_status || paiement.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(paiement.payment_status || paiement.status) }]}>
            {paiement.payment_status || paiement.status}
          </Text>
        </View>
      </View>

      <View style={styles.paiementInfo}>
        <View style={styles.infoRow}>
          <User size={16} color="#999" />
          <Text style={styles.infoText}>{paiement.client_name || 'Client'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#999" />
          <Text style={styles.infoText}>
            {formatDate(paiement.payment_date || paiement.date)}
          </Text>
        </View>
      </View>

      <View style={styles.paiementFooter}>
        <View>
          <Text style={styles.montantLabel}>Montant</Text>
          <Text style={styles.montantValue}>{formatAmount(paiement.amount)}</Text>
        </View>
        {paiement.appointment_date && (
          <View>
            <Text style={styles.montantLabel}>Rendez-vous</Text>
            <Text style={styles.montantValue}>{formatDate(paiement.appointment_date)}</Text>
          </View>
        )}
      </View>

      {paiement.masseur_name && (
        <View style={styles.motifContainer}>
          <Text style={styles.motifLabel}>Masseur</Text>
          <Text style={styles.motifValue}>{paiement.masseur_name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Historique de paiement"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        leftIcon={<ArrowLeft size={24} color="#333" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={<Filter size={24} color="#333" />}
        onRightPress={() => {
          setTempFilters({
            status: filters.status,
            titre: filters.titre,
            montantMin: filters.montantMin,
            montantMax: filters.montantMax,
          });
          setFilterVisible(true);
        }}
      />

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.payment_count || 0}</Text>
          <Text style={styles.statLabel}>Paiements</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatAmount(stats.total_amount || 0)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F8A5C2']}
            tintColor="#F8A5C2"
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
        ) : paiements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucun paiement trouvé</Text>
          </View>
        ) : (
          <View style={styles.paiementsList}>
            {paiements.map(renderPaiementCard)}
          </View>
        )}
      </ScrollView>

      {/* Modal de filtre - Version maquette */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>filtre</Text>
                  <TouchableOpacity onPress={() => setFilterVisible(false)}>
                    <X size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  {/* Status du charge */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Status du charge</Text>
                    <View style={styles.statusContainer}>
                      {['payé', 'en attente', 'partiel'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusChip,
                            tempFilters.status === status && styles.statusChipActive
                          ]}
                          onPress={() => setTempFilters({...tempFilters, status})}
                        >
                          <Text style={[
                            styles.statusChipText,
                            tempFilters.status === status && styles.statusChipTextActive
                          ]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Titre charge */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Titre charge</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="Entrer titre"
                        placeholderTextColor="#999"
                        value={tempFilters.titre}
                        onChangeText={(text) => setTempFilters({...tempFilters, titre: text})}
                      />
                    </View>
                  </View>

                  {/* Montant entre */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Montant entre</Text>
                    <View style={styles.montantRangeContainer}>
                      <View style={styles.montantInputWrapper}>
                        <TextInput
                          style={styles.montantInput}
                          placeholder="entre"
                          placeholderTextColor="#999"
                          value={tempFilters.montantMin}
                          onChangeText={(text) => setTempFilters({...tempFilters, montantMin: text})}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Boutons d'action */}
                  <View style={styles.filterActions}>
                    <TouchableOpacity 
                      style={styles.resetButton}
                      onPress={resetFilters}
                    >
                      <Text style={styles.resetButtonText}>Réinitialiser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.applyButton}
                      onPress={applyFilters}
                    >
                      <Text style={styles.applyButtonText}>Appliquer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8A5C2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
  },
  paiementsList: {
    padding: 15,
  },
  paiementCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paiementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paiementTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  paiementTitre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paiementInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  paiementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  montantLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  montantValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  motifContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  motifLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  motifValue: {
    fontSize: 14,
    color: '#333',
  },
  loader: {
    marginTop: 50,
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
  },
  // Styles pour le modal de filtre
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'lowercase',
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textTransform: 'lowercase',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  statusChipActive: {
    backgroundColor: '#F8A5C2',
    borderColor: '#F8A5C2',
  },
  statusChipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'lowercase',
  },
  statusChipTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  filterInput: {
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  montantRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  montantInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  montantInput: {
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8A5C2',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default HistoriquePaiementScreen;