import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  ArrowLeft,
  CreditCard,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Tag,
  Briefcase,
  Download
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const DetailChargeScreen = ({ navigation, route }) => {
  const { token } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [charge, setCharge] = useState(null);
  const { id, type } = route.params || {};

  useEffect(() => {
    if (id) {
      loadCharge();
    }
  }, [id]);

  const loadCharge = async () => {
    setLoading(true);
    try {
      let response;
      
      // Si c'est un paiement de la table payments
      if (type === 'paiement') {
        console.log('Chargement paiement ID:', id);
        response = await api.get(`/paiement/${id}`, {  // ← URL corrigée
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } 
      // Si c'est une charge de la table expenses
      else {
        console.log('Chargement expense ID:', id);
        response = await api.get(`/expense/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      console.log('Données reçues:', response.data);
      setCharge(response.data);
    } catch (error) {
      console.error('Erreur chargement charge:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails');
    } finally {
      setLoading(false);
    }
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
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'en attente':
      case 'pending':
        return <Clock size={24} color="#FF9800" />;
      case 'partiel':
      case 'partial':
        return <AlertCircle size={24} color="#F8A5C2" />;
      default:
        return <CreditCard size={24} color="#999" />;
    }
  };

  const getTypeIcon = () => {
    if (charge?.user_id) {
      return <Briefcase size={20} color="#F8A5C2" />;
    } else {
      return <Tag size={20} color="#F8A5C2" />;
    }
  };

  const getTypeTitle = () => {
    if (charge?.user_id) {
      return `Salaire - ${charge.user_first_name || ''} ${charge.user_last_name || ''}`.trim();
    } else if (charge?.expense_type_name) {
      return charge.expense_type_name;
    } else if (charge?.offer_name) {
      return charge.offer_name;
    }
    return 'Paiement';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 AR';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' AR';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détail charge"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
      </View>
    );
  }

  if (!charge) {
    return (
      <View style={styles.container}>
        <Header
          title="Détail charge"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#CCC" />
          <Text style={styles.errorText}>Charge introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Détail charge"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(charge.payment_status || charge.status) + '20' }]}>
            {getStatusIcon(charge.payment_status || charge.status)}
            <Text style={[styles.statusText, { color: getStatusColor(charge.payment_status || charge.status) }]}>
              {charge.payment_status || charge.status}
            </Text>
          </View>
        </View>

        {/* Détails principaux */}
        <View style={styles.detailCard}>
          {/* Titre/Type */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              {getTypeIcon()}
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{getTypeTitle()}</Text>
            </View>
          </View>

          {/* Date de paiement */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#F8A5C2" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date de paiement</Text>
              <Text style={styles.detailValue}>
                {formatDate(charge.payment_date || charge.date)}
              </Text>
              {charge.payment_week && (
                <Text style={styles.detailSubValue}>
                  Semaine {charge.payment_week} - {charge.payment_month}/{charge.payment_year}
                </Text>
              )}
            </View>
          </View>

          {/* Montant */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <CreditCard size={20} color="#F8A5C2" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Montant</Text>
              <Text style={[styles.detailValue, styles.amountValue]}>
                {formatAmount(charge.amount)}
              </Text>
            </View>
          </View>

          {/* Client (pour paiement de rendez-vous) */}
          {charge.client_name && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Client</Text>
                <Text style={styles.detailValue}>{charge.client_name}</Text>
                {charge.client_phone && (
                  <Text style={styles.detailSubValue}>{charge.client_phone}</Text>
                )}
              </View>
            </View>
          )}

          {/* Bénéficiaire (pour salaire) */}
          {charge.user_id && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bénéficiaire</Text>
                <Text style={styles.detailValue}>
                  {charge.user_first_name || ''} {charge.user_last_name || ''}
                </Text>
              </View>
            </View>
          )}

          {/* Masseur (pour paiement de rendez-vous) */}
          {charge.masseur_name && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Masseur</Text>
                <Text style={styles.detailValue}>{charge.masseur_name}</Text>
              </View>
            </View>
          )}

          {/* Rendez-vous associé */}
          {charge.appointment_date && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Rendez-vous</Text>
                <Text style={styles.detailValue}>
                  {formatDate(charge.appointment_date)} à {charge.start_time}
                </Text>
              </View>
            </View>
          )}

          {/* Créé par */}
          {charge.created_by_name && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Enregistré par</Text>
                <Text style={styles.detailValue}>{charge.created_by_name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Informations complémentaires */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informations complémentaires</Text>
          
          {/* ID Transaction */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Transaction :</Text>
            <Text style={styles.infoValue}>#{charge.id}</Text>
          </View>

          {/* Mode de paiement */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode de paiement :</Text>
            <Text style={styles.infoValue}>{charge.payment_method || 'Espèces'}</Text>
          </View>

          {/* Statut détaillé */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut :</Text>
            <Text style={[
              styles.infoValue,
              (charge.payment_status === 'paid' || charge.status === 'payé') ? styles.payeeText : null
            ]}>
              {charge.payment_status || charge.status}
            </Text>
          </View>

          {/* Description/Notes */}
          {(charge.description || charge.notes) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description :</Text>
              <Text style={styles.infoValue}>{charge.description || charge.notes}</Text>
            </View>
          )}

          {/* Pour salaire : période */}
          {charge.payment_week && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Période :</Text>
              <Text style={styles.infoValue}>
                Semaine {charge.payment_week} - Mois {charge.payment_month}/{charge.payment_year}
              </Text>
            </View>
          )}

          {/* Date de création */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé le :</Text>
            <Text style={styles.infoValue}>{formatDate(charge.created_at)}</Text>
          </View>
        </View>
      </ScrollView>

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
  loader: {
    marginTop: 40,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  statusSection: {
    padding: 20,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  amountValue: {
    color: '#F8A5C2',
    fontSize: 20,
    fontWeight: '600',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  payeeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default DetailChargeScreen;