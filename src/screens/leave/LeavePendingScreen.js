import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Bell,
  ChevronDown,
  Filter,
  AlertTriangle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import { useLeaveCount } from '../../context/LeaveCountContext';
import api from '../../config/api';

const LeavePendingScreen = ({ navigation }) => {
  const { pendingLeaveCount, refreshLeaveCount } = useLeaveCount();;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [isManager, setIsManager] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('solde suffisant'); // 'solde suffisant' ou 'solde dépassé'
  const [searchQuery, setSearchQuery] = useState(''); // Ajout de searchQuery
  
  const lastFetchTime = useRef(0);
  const CACHE_DURATION = 60000; // 60 secondes de cache
  
  // États pour les modales
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // États pour la modal de confirmation
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmRequestId, setConfirmRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fonctions pour gérer les modales
  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const hideSuccessModal = () => {
    setSuccessModalVisible(false);
    setSuccessMessage('');
  };

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const hideErrorModal = () => {
    setErrorModalVisible(false);
    setErrorMessage('');
  };

  const showConfirmModal = (action, requestId) => {
    setConfirmAction(action);
    setConfirmRequestId(requestId);
    setConfirmModalVisible(true);
  };

  const hideConfirmModal = () => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
    setConfirmRequestId(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !confirmRequestId) return;
    
    hideConfirmModal();
    
    if (confirmAction === 'approve') {      
      try {
        
        const response = await api.put(`/leave/requests/${confirmRequestId}/approve`);
        
        if (response.status === 200) {
          showSuccessModal('La demande de congé a été approuvée avec succès');
          await loadPendingRequests(true);
          refreshLeaveCount(); // Rafraîchir le compteur global
        } else {
          showErrorModal(response.data?.message || 'Impossible d\'approuver la demande');
        }
      } catch (error) {
        console.error('💥 Erreur approuver demande:', error);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error code:', error.code);
        showErrorModal('Une erreur est survenue lors de l\'approbation');
      }  
    } else if (confirmAction === 'reject') {
      if (!rejectReason || rejectReason.trim() === '') {
        showErrorModal('La raison du rejet est obligatoire');
        return;
      }
      
      hideConfirmModal();
      

      try {
        const response = await api.put(`/leave/requests/${confirmRequestId}/reject`, {
          rejection_reason: rejectReason.trim()
        });
        
        if (response.status === 200) {
          showSuccessModal('La demande de congé a été rejetée avec succès');
          await loadPendingRequests(true);
          refreshLeaveCount(); 
        } else {
          showErrorModal(response.data?.message || 'Impossible de rejeter la demande');
        }
      } catch (error) {
        showErrorModal('Une erreur est survenue lors du rejet');
      }
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, [filterStatus]);

  const loadPendingRequests = useCallback(async (force = false) => {
    const now = Date.now();
    
    if (!force && pendingRequests.length > 0 && (now - lastFetchTime.current) < CACHE_DURATION) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await api.get('/leave/requests/all');
      
      if (response.status === 200) {
        let requests = [];
        if (response.data && Array.isArray(response.data)) {
          requests = response.data.filter(req => req.status === 'pending');
        } else if (response.data && response.data.requests) {
          requests = response.data.requests.filter(req => req.status === 'pending');
        }
        
        setPendingRequests(requests);
        lastFetchTime.current = now;
        
        const currentUser = await AsyncStorage.getItem('userId');
        const hasOtherUserRequests = requests.some(req => req.user_id?.toString() !== currentUser);
        setIsManager(hasOtherUserRequests);
        
      } else {
        showErrorModal('Impossible de charger les demandes de congé');
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      showErrorModal('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [pendingRequests.length]);

  useFocusEffect(
    useCallback(() => {
      loadPendingRequests(false); 
    }, [loadPendingRequests])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingRequests(true);
    setRefreshing(false);
  };

  const handleApprove = async (requestId) => {
    showConfirmModal('approve', requestId);
  };

  const handleReject = async (requestId) => {
    showConfirmModal('reject', requestId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={16} color="#F44336" />;
      case 'pending':
        return <AlertTriangle size={16} color="#FF9800" />;
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
      default:
        return '#666';
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const checkBalanceStatus = (request) => {
    // Cette fonction devrait vérifier si le solde est suffisant ou dépassé
    // Pour l'exemple, on va simuler avec une condition
    const requestedDays = calculateDays(request.start_date, request.end_date);
    const availableDays = request.available_balance || 10; // À remplacer par la vraie valeur
    return requestedDays <= availableDays ? 'solde suffisant' : 'solde dépassé';
  };

  const renderFilterChip = (label, value) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === value && styles.filterChipSelected
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        selectedFilter === value && styles.filterChipTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRequest = (request) => {
    const balanceStatus = checkBalanceStatus(request);
    
    return (
      <View style={styles.requestCard} key={request.id}>
        {/* Ligne 1: Nom et prénom */}
        <View style={styles.requestRow}>
          <Users size={16} color="#666" style={styles.rowIcon} />
          <Text style={styles.userName}>
            {request.first_name} {request.last_name}
          </Text>
        </View>

        {/* Ligne 2: Motif (Type de congé) */}
        <View style={styles.requestRow}>
          <View style={[styles.typeIndicator, { backgroundColor: request.color || '#F8A5C2' }]} />
          <Text style={styles.motifText}>{request.leave_type_name}</Text>
        </View>

        {/* Ligne 3: Solde */}
        <View style={styles.requestRow}>
          <Calendar size={16} color="#666" style={styles.rowIcon} />
          <Text style={[
            styles.soldeText,
            balanceStatus === 'solde dépassé' && styles.soldeDepasse
          ]}>
            {calculateDays(request.start_date, request.end_date)} jour(s)
          </Text>
        </View>

        {/* Badge de statut de solde */}
        <View style={[
          styles.balanceBadge,
          balanceStatus === 'solde suffisant' ? styles.balanceSufficient : styles.balanceExceeded
        ]}>
          <Text style={styles.balanceBadgeText}>
            {balanceStatus === 'solde suffisant' ? '✓ Solde suffisant' : '⚠ Solde dépassé'}
          </Text>
        </View>

        {/* Période */}
        <View style={styles.periodContainer}>
          <Calendar size={14} color="#999" />
          <Text style={styles.periodText}>
            {new Date(request.start_date).toLocaleDateString('fr-FR')} - {new Date(request.end_date).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Boutons d'action */}
        {request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(request.id)}
            >
              <CheckCircle size={16} color="#4CAF50" />
              <Text style={styles.approveButtonText}>Approuver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(request.id)}
            >
              <XCircle size={16} color="#F44336" />
              <Text style={styles.rejectButtonText}>Rejeter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleExtraRightPress = () => {
    navigation.navigate('Leave');
  };

  const getFilteredRequests = () => {
    let filtered = pendingRequests;
    
    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(request => 
        request.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.motif?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Ne montrer que les demandes en attente
    filtered = filtered.filter(req => req.status === 'pending');
    
    return filtered;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F8A5C2" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <View style={styles.container}>
      <Header 
        title={isManager ? "Congés en Attente" : "Mes Demandes"} 
        showBack={true}
        onBackPress={() => navigation.goBack()}
        leftIcon={<ArrowLeft size={24} color="#333" />}
        onLeftPress={() => navigation.goBack()}
        extraRightIcon={Bell}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Filtres de solde */}
        <View style={styles.balanceFilters}>
          {renderFilterChip('Solde suffisant', 'solde suffisant')}
          {renderFilterChip('Solde dépassé', 'solde dépassé')}
        </View>

        {/* Séparateur */}
        <View style={styles.divider} />

        {/* Compteur de demandes */}
        <View style={styles.counterContainer}>
          <Users size={16} color="#F8A5C2" />
          <Text style={styles.counterText}>
            {filteredRequests.length} demande(s) en attente
          </Text>
        </View>

        {/* Liste des demandes */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#CCC" />
            <Text style={styles.emptyText}>
              Aucune demande de congé en attente
            </Text>
          </View>
        ) : (
          filteredRequests.map(renderRequest)
        )}
      </ScrollView>

      {/* Modal de confirmation */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideConfirmModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              {confirmAction === 'approve' ? (
                <CheckCircle size={48} color="#4CAF50" />
              ) : (
                <XCircle size={48} color="#F44336" />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {confirmAction === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
            </Text>
            <Text style={styles.confirmMessage}>
              {confirmAction === 'approve' 
                ? 'Êtes-vous sûr de vouloir approuver cette demande de congé ?'
                : 'Veuillez saisir la raison du rejet de cette demande de congé :'
              }
            </Text>
            {confirmAction === 'reject' && (
              <TextInput
                style={styles.confirmInput}
                placeholder="Raison du rejet"
                multiline
                numberOfLines={3}
                onChangeText={setRejectReason}
                value={rejectReason}
              />
            )}
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={hideConfirmModal}
              >
                <Text style={styles.confirmButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton, 
                  confirmAction === 'approve' ? styles.confirmApproveButton : styles.confirmRejectButton
                ]}
                onPress={confirmAction === 'approve' ? handleConfirmAction : () => {
                  if (rejectReason.trim()) {
                    handleConfirmAction();
                  } else {
                    showErrorModal('La raison du rejet est obligatoire');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>
                  {confirmAction === 'approve' ? 'Approuver' : 'Rejeter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de succès */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={48} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Succès</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal d'erreur */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideErrorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorIconContainer}>
              <AlertTriangle size={48} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={hideErrorModal}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Filtres de solde
  balanceFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterChip: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#F8A5C2',
    borderColor: '#F8A5C2',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#FFF',
  },
  
  // Séparateur
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  
  // Compteur
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  counterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Request Card (nouveau design)
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F8A5C2',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowIcon: {
    marginRight: 10,
    width: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  motifText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  soldeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  soldeDepasse: {
    color: '#F44336',
  },
  
  // Badge de statut de solde
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  balanceSufficient: {
    backgroundColor: '#E8F5E9',
  },
  balanceExceeded: {
    backgroundColor: '#FFEBEE',
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  
  // Période
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 6,
  },
  periodText: {
    fontSize: 13,
    color: '#999',
  },
  
  // Type Indicator
  typeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 5,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  approveButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#FFF',
  },
  approveButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    borderColor: '#F44336',
    backgroundColor: '#FFF',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Status Container pour les demandes traitées
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#F8A5C2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#F8A5C2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelButton: {
    borderColor: '#666',
    backgroundColor: '#FFF',
  },
  confirmApproveButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#FFF',
  },
  confirmRejectButton: {
    borderColor: '#F44336',
    backgroundColor: '#FFF',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeavePendingScreen;