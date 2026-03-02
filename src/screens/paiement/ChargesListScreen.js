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
  Briefcase,
  Tag,
  DollarSign,
  Search
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLeaveCount } from '../../context/LeaveCountContext';

const { width } = Dimensions.get('window');

const ChargesListScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { pendingLeaveCount } = useLeaveCount();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [charges, setCharges] = useState([]);
  const [filteredCharges, setFilteredCharges] = useState([]);
  const [typeFilter, setTypeFilter] = useState('tous');
  const [searchQuery, setSearchQuery] = useState('');

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: 'paid',
    year: '',
    month: '',
    startDate: '',
    endDate: '',
  });

  // États pour les filtres temporaires
  const [tempFilters, setTempFilters] = useState({
    year: '',
    month: '',
    startDate: '',
    endDate: '',
  });

  // Charger les charges
  const loadCharges = async () => {
    setLoading(true);
    try {
      const params = {
        status: 'paid',
      };
      
      if (filters.year) params.year = filters.year;
      if (filters.month) params.month = filters.month;

      const response = await api.get('/expense', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCharges(response.data);
    } catch (error) {
      console.error('Erreur chargement charges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les charges côté client
  useEffect(() => {
    let filtered = [...charges];

    // Filtre par type
    if (typeFilter === 'salaire') {
      filtered = filtered.filter(c => c.user_id);
    } else if (typeFilter === 'autre') {
      filtered = filtered.filter(c => c.expense_type_id);
    }

    // Filtre par recherche (titre/description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.expense_type_name && c.expense_type_name.toLowerCase().includes(query)) ||
        (c.user_first_name && c.user_first_name.toLowerCase().includes(query)) ||
        (c.user_last_name && c.user_last_name.toLowerCase().includes(query))
      );
    }

    // Filtre par date (startDate/endDate)
    if (filters.startDate) {
      filtered = filtered.filter(c => new Date(c.payment_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(c => new Date(c.payment_date) <= new Date(filters.endDate));
    }

    setFilteredCharges(filtered);
  }, [charges, typeFilter, searchQuery, filters.startDate, filters.endDate]);

  useEffect(() => {
    loadCharges();
  }, [filters.year, filters.month]);

  // Rafraîchir
  const onRefresh = () => {
    setRefreshing(true);
    loadCharges().finally(() => setRefreshing(false));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    setFilters({
      ...filters,
      year: tempFilters.year,
      month: tempFilters.month,
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate,
    });
    setFilterVisible(false);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setTempFilters({
      year: '',
      month: '',
      startDate: '',
      endDate: '',
    });
    setFilters({
      status: 'paid',
      year: '',
      month: '',
      startDate: '',
      endDate: '',
    });
    setTypeFilter('tous');
    setSearchQuery('');
    setFilterVisible(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' AR';
  };

  const getTypeIcon = (charge) => {
    if (charge.user_id) {
      return <Briefcase size={20} color="#F8A5C2" />;
    } else {
      return <Tag size={20} color="#F8A5C2" />;
    }
  };

  const getTypeLabel = (charge) => {
    if (charge.user_id) {
      return 'Salaire';
    } else if (charge.expense_type_name) {
      return charge.expense_type_name;
    }
    return 'Charge';
  };

  const renderChargeCard = (charge) => (
    <TouchableOpacity 
      key={charge.id} 
      style={styles.chargeCard}
      onPress={() => navigation.navigate('ChargeDetail', { id: charge.id })}
    >
      <View style={styles.chargeHeader}>
        <View style={styles.chargeTitleContainer}>
          {getTypeIcon(charge)}
          <Text style={styles.chargeTitre}>
            {charge.user_id 
              ? `Salaire - ${charge.user_first_name || ''} ${charge.user_last_name || ''}`
              : charge.expense_type_name || 'Charge'
            }
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: charge.user_id ? '#F8A5C2' : '#4CAF50' }]}>
          <Text style={styles.typeBadgeText}>
            {getTypeLabel(charge)}
          </Text>
        </View>
      </View>

      <View style={styles.chargeInfo}>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#999" />
          <Text style={styles.infoText}>
            {formatDate(charge.payment_date)}
            {charge.payment_week && ` - Semaine ${charge.payment_week}`}
          </Text>
        </View>
      </View>

      <View style={styles.chargeFooter}>
        <View style={styles.montantContainer}>
          <Text style={styles.montantLabel}>Montant</Text>
          <Text style={styles.montantValue}>{formatAmount(charge.amount)}</Text>
        </View>
        {charge.description ? (
          <View style={styles.descriptionPreview}>
            <Text style={styles.descriptionPreviewText} numberOfLines={1}>
              {charge.description}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Charges payées"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        leftIcon={<ArrowLeft size={24} color="#333" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={<Filter size={24} color="#333" />}
        onRightPress={() => {
          setTempFilters({
            year: filters.year,
            month: filters.month,
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          setFilterVisible(true);
        }}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par titre, description, bénéficiaire..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtres par type */}
      <View style={styles.typeFilterContainer}>
        <TouchableOpacity
          style={[styles.typeFilter, typeFilter === 'tous' && styles.typeFilterActive]}
          onPress={() => setTypeFilter('tous')}
        >
          <Text style={[styles.typeFilterText, typeFilter === 'tous' && styles.typeFilterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeFilter, typeFilter === 'salaire' && styles.typeFilterActive]}
          onPress={() => setTypeFilter('salaire')}
        >
          <Briefcase size={16} color={typeFilter === 'salaire' ? '#FFF' : '#666'} />
          <Text style={[styles.typeFilterText, typeFilter === 'salaire' && styles.typeFilterTextActive]}>
            Salaires
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeFilter, typeFilter === 'autre' && styles.typeFilterActive]}
          onPress={() => setTypeFilter('autre')}
        >
          <Tag size={16} color={typeFilter === 'autre' ? '#FFF' : '#666'} />
          <Text style={[styles.typeFilterText, typeFilter === 'autre' && styles.typeFilterTextActive]}>
            Autres charges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredCharges.length}</Text>
          <Text style={styles.statLabel}>Charges</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatAmount(filteredCharges.reduce((sum, c) => sum + parseFloat(c.amount), 0))}
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
        ) : filteredCharges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucune charge trouvée</Text>
          </View>
        ) : (
          <View style={styles.chargesList}>
            {filteredCharges.map(renderChargeCard)}
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
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>filtre par date</Text>
                  <TouchableOpacity onPress={() => setFilterVisible(false)}>
                    <X size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  {/* Année */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Année</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="Ex: 2026"
                        placeholderTextColor="#999"
                        value={tempFilters.year}
                        onChangeText={(text) => setTempFilters({...tempFilters, year: text})}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Mois */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Mois</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="Ex: 1-12"
                        placeholderTextColor="#999"
                        value={tempFilters.month}
                        onChangeText={(text) => setTempFilters({...tempFilters, month: text})}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Date de début */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Date de début</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                        value={tempFilters.startDate}
                        onChangeText={(text) => setTempFilters({...tempFilters, startDate: text})}
                      />
                    </View>
                  </View>

                  {/* Date de fin */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Date de fin</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                        value={tempFilters.endDate}
                        onChangeText={(text) => setTempFilters({...tempFilters, endDate: text})}
                      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  typeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 10,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  typeFilterActive: {
    backgroundColor: '#F8A5C2',
  },
  typeFilterText: {
    fontSize: 14,
    color: '#666',
  },
  typeFilterTextActive: {
    color: '#FFF',
    fontWeight: '600',
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
  chargesList: {
    padding: 15,
  },
  chargeCard: {
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
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chargeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chargeTitre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  chargeInfo: {
    marginBottom: 12,
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
  chargeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  montantContainer: {
    flex: 1,
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
  descriptionPreview: {
    flex: 1,
    alignItems: 'flex-end',
  },
  descriptionPreviewText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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

export default ChargesListScreen;