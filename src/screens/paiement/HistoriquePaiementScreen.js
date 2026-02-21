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
  Search,
  Users,
  Tag,
  DollarSign
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import SearchableDropdown from '../../components/SearchableDropdown';

const { width } = Dimensions.get('window');

const HistoriquePaiementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paiements, setPaiements] = useState([]);
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [stats, setStats] = useState({
    total_amount: 0,
    payment_count: 0
  });

  // Données pour les dropdowns
  const [masseuses, setMasseuses] = useState([]);
  const [offres, setOffres] = useState([]);

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: '',
    titre: '',
    montantMin: '',
    montantMax: '',
    start_date: '',
    end_date: '',
    masseuse_id: '',
    offre_id: '',
  });

  // États pour les filtres temporaires (avant validation)
  const [tempFilters, setTempFilters] = useState({
    status: '',
    titre: '',
    montantMin: '',
    montantMax: '',
    start_date: '',
    end_date: '',
    masseuse_id: '',
    masseuse_name: '',
    offre_id: '',
    offre_name: '',
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      
      // Charger les masseuses (users avec rôle masseuse)
      const masseusesRes = await api.get('/users/masseurs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMasseuses(masseusesRes.data);

      // Charger les offres de massage
      const offresRes = await api.get('/massage/massage-offers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOffres(offresRes.data);

      // Charger l'historique des paiements
      await loadPaymentHistory();
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    }
  };

  // Charger l'historique des paiements
  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      
      const params = {};
      
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.titre) {
        params.titre = filters.titre;
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      if (filters.masseuse_id) {
        params.masseur_id = filters.masseuse_id;
      }
      if (filters.offre_id) {
        params.offer_id = filters.offre_id;
      }

      const response = await api.get('/paiement/history', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let data = response.data;

      // Filtrage côté client pour les montants
      if (filters.montantMin) {
        data = data.filter(p => p.amount >= parseFloat(filters.montantMin));
      }
      if (filters.montantMax) {
        data = data.filter(p => p.amount <= parseFloat(filters.montantMax));
      }

      setPaiements(data);
      applyClientFilters(data);
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres côté client (recherche texte)
  const applyClientFilters = (data) => {
    let filtered = [...data];

    // Filtre par titre/recherche texte
    if (filters.titre) {
      const searchTerm = filters.titre.toLowerCase();
      filtered = filtered.filter(p => 
        (p.offer_name && p.offer_name.toLowerCase().includes(searchTerm)) ||
        (p.client_name && p.client_name.toLowerCase().includes(searchTerm)) ||
        (p.masseur_name && p.masseur_name.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredPaiements(filtered);
  };

  useEffect(() => {
    applyClientFilters(paiements);
  }, [paiements, filters.titre]);

  useEffect(() => {
    loadPaymentHistory();
    loadStats();
  }, [filters.status, filters.start_date, filters.end_date, filters.masseuse_id, filters.offre_id, filters.montantMin, filters.montantMax]);

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

  // Rafraîchir
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadPaymentHistory(), loadStats()]).finally(() => setRefreshing(false));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    
    const newFilters = {
      status: tempFilters.status,
      titre: tempFilters.titre,
      montantMin: tempFilters.montantMin,
      montantMax: tempFilters.montantMax,
      start_date: tempFilters.start_date,
      end_date: tempFilters.end_date,
      masseuse_id: tempFilters.masseuse_id,
      offre_id: tempFilters.offre_id,
    };
    
    setFilters(newFilters);
    setFilterVisible(false);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setTempFilters({
      status: '',
      titre: '',
      montantMin: '',
      montantMax: '',
      start_date: '',
      end_date: '',
      masseuse_id: '',
      masseuse_name: '',
      offre_id: '',
      offre_name: '',
    });
    setFilters({
      status: '',
      titre: '',
      montantMin: '',
      montantMax: '',
      start_date: '',
      end_date: '',
      masseuse_id: '',
      offre_id: '',
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
            Offre {paiement.offer_name || paiement.titre || 'Paiement'}
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

      {paiement.masseur_name && (
        <View style={styles.masseurInfo}>
          <Users size={16} color="#999" />
          <Text style={styles.infoText}>Masseur: {paiement.masseur_name}</Text>
        </View>
      )}

      <View style={styles.paiementFooter}>
        <View>
          <Text style={styles.montantLabel}>Montant</Text>
          <Text style={styles.montantValue}>{formatAmount(paiement.amount)}</Text>
        </View>
        {paiement.offer_name && (
          <View>
            <Text style={styles.montantLabel}>Offre</Text>
            <Text style={styles.montantValue}>{paiement.offer_name}</Text>
          </View>
        )}
      </View>
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
            start_date: filters.start_date,
            end_date: filters.end_date,
            masseuse_id: filters.masseuse_id,
            masseuse_name: '',
            offre_id: filters.offre_id,
            offre_name: '',
          });
          setFilterVisible(true);
        }}
      />

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredPaiements.length}</Text>
          <Text style={styles.statLabel}>Paiements</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatAmount(filteredPaiements.reduce((sum, p) => sum + p.amount, 0))}
          </Text>
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
        ) : filteredPaiements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucun paiement trouvé</Text>
          </View>
        ) : (
          <View style={styles.paiementsList}>
            {filteredPaiements.map(renderPaiementCard)}
          </View>
        )}
      </ScrollView>

      {/* Modal de filtre */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>filtres avancés</Text>
                    <TouchableOpacity onPress={() => setFilterVisible(false)}>
                      <X size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalContent}>
                    {/* Période - Date de début et fin */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Période</Text>
                      <View style={styles.dateRangeContainer}>
                        <View style={styles.dateInputWrapper}>
                          <Text style={styles.dateLabel}>Du</Text>
                          <TextInput
                            style={styles.dateInput}
                            placeholder="JJ/MM/AAAA"
                            placeholderTextColor="#999"
                            value={tempFilters.start_date}
                            onChangeText={(text) => setTempFilters({...tempFilters, start_date: text})}
                          />
                        </View>
                        <View style={styles.dateInputWrapper}>
                          <Text style={styles.dateLabel}>Au</Text>
                          <TextInput
                            style={styles.dateInput}
                            placeholder="JJ/MM/AAAA"
                            placeholderTextColor="#999"
                            value={tempFilters.end_date}
                            onChangeText={(text) => setTempFilters({...tempFilters, end_date: text})}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Masseuse */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Masseuse</Text>
                      <SearchableDropdown
                        placeholder="Sélectionner une masseuse"
                        value={masseuses.find(m => m.id === tempFilters.masseuse_id)}
                        onSelect={(item) => setTempFilters({
                          ...tempFilters, 
                          masseuse_id: item.id,
                          masseuse_name: item.first_name + ' ' + item.last_name
                        })}
                        fetchData={() => Promise.resolve(masseuses)}
                        displayField="first_name"
                        valueField="id"
                        searchPlaceholder="Rechercher une masseuse..."
                        renderItem={(item) => (
                          <View style={styles.dropdownItem}>
                            <User size={16} color="#F8A5C2" />
                            <Text style={styles.dropdownItemText}>
                              {item.first_name} {item.last_name}
                            </Text>
                          </View>
                        )}
                        getDisplayValue={(item) => item ? `${item.first_name} ${item.last_name}` : ''}
                      />
                    </View>

                    {/* Offre */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Offre</Text>
                      <SearchableDropdown
                        placeholder="Sélectionner une offre"
                        value={offres.find(o => o.id === tempFilters.offre_id)}
                        onSelect={(item) => setTempFilters({
                          ...tempFilters, 
                          offre_id: item.id,
                          offre_name: item.name
                        })}
                        fetchData={() => Promise.resolve(offres)}
                        displayField="name"
                        valueField="id"
                        searchPlaceholder="Rechercher une offre..."
                        renderItem={(item) => (
                          <View style={styles.dropdownItem}>
                            <Tag size={16} color="#F8A5C2" />
                            <Text style={styles.dropdownItemText}>{item.name}</Text>
                          </View>
                        )}
                        getDisplayValue={(item) => item ? item.name : ''}
                      />
                    </View>

                    {/* Montant entre */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Montant entre</Text>
                      <View style={styles.montantRangeContainer}>
                        <View style={styles.montantInputWrapper}>
                          <TextInput
                            style={styles.montantInput}
                            placeholder="Min"
                            placeholderTextColor="#999"
                            value={tempFilters.montantMin}
                            onChangeText={(text) => setTempFilters({...tempFilters, montantMin: text})}
                            keyboardType="numeric"
                          />
                        </View>
                        <Text style={styles.montantSeparator}>-</Text>
                        <View style={styles.montantInputWrapper}>
                          <TextInput
                            style={styles.montantInput}
                            placeholder="Max"
                            placeholderTextColor="#999"
                            value={tempFilters.montantMax}
                            onChangeText={(text) => setTempFilters({...tempFilters, montantMax: text})}
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
              </ScrollView>
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
  masseurInfo: {
    marginBottom: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 50,
    alignSelf: 'center',
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
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  montantRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  montantSeparator: {
    fontSize: 16,
    color: '#999',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    padding: 15,
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
    padding: 15,
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