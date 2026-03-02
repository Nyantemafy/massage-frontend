import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { 
  Clock,
  Calendar,
  AlertCircle,
  User,
  Tag,
  Briefcase,
  CreditCard,
  FileText,
  ArrowLeft,
  DollarSign,
  Download
} from 'lucide-react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useLeaveCount } from '../../context/LeaveCountContext';

const ChargeDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { token } = useAuth();
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { pendingLeaveCount } = useLeaveCount();
  
  useEffect(() => {
    loadCharge();
  }, []);

  const loadCharge = async () => {
    try {
      const response = await api.get(`/expense/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCharge(response.data);
    } catch (error) {
      console.error('Erreur chargement charge:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 AR';
    try {
      return new Intl.NumberFormat('fr-FR').format(amount) + ' AR';
    } catch (e) {
      return amount + ' AR';
    }
  };

  const getTypeIcon = () => {
    if (charge?.user_id) {
      return <Briefcase size={32} color="#F8A5C2" />;
    } else {
      return <Tag size={32} color="#F8A5C2" />;
    }
  };

  const getTypeTitle = () => {
    if (charge?.user_id) {
      return `Salaire - ${charge.user_first_name || ''} ${charge.user_last_name || ''}`.trim();
    } else {
      return charge?.expense_type_name || 'Charge';
    }
  };

  const generateReceiptHTML = () => {
    if (!charge) return '';

    const date = new Date();
    const receiptNumber = `REC-${charge.id}-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu de paiement</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #f0f2f5;
            padding: 20px;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          }
          .header {
            background: linear-gradient(135deg, #F8A5C2, #F8487F);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            letter-spacing: 1px;
            font-weight: 800;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .receipt-number {
            background: white;
            margin: -25px 30px 0;
            padding: 15px 25px;
            border-radius: 50px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
          }
          .receipt-number span {
            color: #F8A5C2;
            font-weight: bold;
            font-size: 18px;
          }
          .company-info {
            padding: 30px;
            background: #f8f9fa;
            margin: 20px 30px;
            border-radius: 15px;
          }
          .company-info h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
            border-bottom: 2px solid #F8A5C2;
            padding-bottom: 5px;
            display: inline-block;
          }
          .company-info p {
            color: #666;
            margin: 8px 0;
            font-size: 14px;
          }
          .details {
            padding: 0 30px;
          }
          .details h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .detail-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 20px;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #666;
            font-weight: 500;
            font-size: 14px;
          }
          .detail-value {
            color: #333;
            font-weight: 600;
            font-size: 14px;
          }
          .amount-section {
            padding: 20px 30px;
          }
          .amount-card {
            background: linear-gradient(135deg, #FFF5F8, #FFE5EF);
            border-radius: 12px;
            padding: 20px;
            border: 2px solid #F8A5C2;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .amount-label {
            color: #F8A5C2;
            font-size: 16px;
            font-weight: 600;
          }
          .amount-value {
            color: #F8A5C2;
            font-size: 24px;
            font-weight: 800;
          }
          .footer {
            margin-top: 30px;
            padding: 20px 30px 30px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 2px dashed #999;
            width: 100%;
            margin-bottom: 10px;
          }
          .signature-box p {
            color: #666;
            font-size: 12px;
          }
          .footer-text {
            text-align: center;
            color: #999;
            font-size: 12px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>REÇU DE PAIEMENT</h1>
            <p>Document officiel - Salama Massage</p>
          </div>

          <div class="receipt-number">
            <span>N° ${receiptNumber}</span>
          </div>

          <div class="company-info">
            <h3>Salama Massage</h3>
            <p>📍 Lot II J 171, Ambohijatovo, Antananarivo</p>
            <p>📞 +261 34 00 000 00</p>
            <p>✉️ contact@salama-massage.com</p>
          </div>

          <div class="details">
            <h3>Détails du paiement</h3>
            <div class="detail-card">
              <div class="detail-row">
                <span class="detail-label">Date de paiement</span>
                <span class="detail-value">${formatDateShort(charge.payment_date)}</span>
              </div>

              ${charge.user_id ? `
              <div class="detail-row">
                <span class="detail-label">Bénéficiaire</span>
                <span class="detail-value">${charge.user_first_name || ''} ${charge.user_last_name || ''}</span>
              </div>
              ` : ''}

              ${charge.expense_type_name ? `
              <div class="detail-row">
                <span class="detail-label">Type de charge</span>
                <span class="detail-value">${charge.expense_type_name}</span>
              </div>
              ` : ''}

              ${charge.payment_week ? `
              <div class="detail-row">
                <span class="detail-label">Période</span>
                <span class="detail-value">Semaine ${charge.payment_week} - ${charge.payment_month}/${charge.payment_year}</span>
              </div>
              ` : ''}

              <div class="detail-row">
                <span class="detail-label">Enregistré par</span>
                <span class="detail-value">${charge.created_by_name || 'Système'}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">ID Transaction</span>
                <span class="detail-value">#${charge.id}</span>
              </div>

              ${charge.description ? `
              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${charge.description}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-card">
              <div class="amount-row">
                <span class="amount-label">Montant total</span>
                <span class="amount-value">${formatAmount(charge.amount)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Signature du bénéficiaire</p>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Cachet de l'entreprise</p>
              </div>
            </div>
            <div class="footer-text">
              <p>Reçu généré le ${formatDateShort(new Date())}</p>
              <p>Ce document fait office de preuve de paiement</p>
              <p>Merci de votre confiance</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  const generatePDF = async () => {
    if (!charge) return;

    setGenerating(true);
    
    try {
      // Générer le HTML
      const html = generateReceiptHTML();
       
      if (!html || html.length < 100) {
        throw new Error('HTML généré invalide');
      }

      // Générer le PDF directement
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Créer un nom de fichier avec la date
      const date = new Date();
      const fileName = `recu_${charge.id}_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.pdf`;
      const newPath = FileSystem.documentDirectory + fileName;

      // Copier le fichier vers un emplacement permanent
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });

      // Partager directement le PDF
      await Sharing.shareAsync(newPath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reçu de paiement',
        UTI: 'com.adobe.pdf'
      });

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      // Pas d'alerte, erreur silencieuse
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePDF = () => {
    generatePDF();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détail charge"
          showBack
          onBackPress={() => navigation.goBack()}
          extraRightIcon={true} 
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
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
          extraRightIcon={true} 
          onExtraRightPress={handleExtraRightPress}
          badgeCount={pendingLeaveCount}
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
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

      <ScrollView style={styles.content}>
        {/* En-tête avec icône */}
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            {getTypeIcon()}
          </View>
          <Text style={styles.headerTitle}>{getTypeTitle()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statusText}>Payé</Text>
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.infoCard}>
            {/* Montant */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <DollarSign size={24} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Montant</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatAmount(charge.amount)}
                </Text>
              </View>
            </View>

            {/* Date de paiement */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={24} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date de paiement</Text>
                <Text style={styles.detailValue}>
                  {formatDate(charge.payment_date)}
                </Text>
                {charge.payment_week && (
                  <Text style={styles.detailSubValue}>
                    Semaine {charge.payment_week} - {charge.payment_month}/{charge.payment_year}
                  </Text>
                )}
              </View>
            </View>

            {/* Bénéficiaire (pour salaire) */}
            {charge.user_id && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={24} color="#F8A5C2" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Bénéficiaire</Text>
                  <Text style={styles.detailValue}>
                    {charge.user_first_name || ''} {charge.user_last_name || ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Type de charge (pour autre) */}
            {charge.expense_type_id && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Tag size={24} color="#F8A5C2" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Type de charge</Text>
                  <Text style={styles.detailValue}>
                    {charge.expense_type_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Créé par */}
            {charge.created_by_name && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={24} color="#F8A5C2" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Enregistré par</Text>
                  <Text style={styles.detailValue}>
                    {charge.created_by_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Date de création */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={24} color="#F8A5C2" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date d'enregistrement</Text>
                <Text style={styles.detailValue}>
                  {formatDate(charge.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {charge.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionCard}>
              <FileText size={20} color="#F8A5C2" style={styles.descriptionIcon} />
              <Text style={styles.descriptionText}>{charge.description}</Text>
            </View>
          </View>
        )}

        {/* Informations complémentaires */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations complémentaires</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ID de transaction</Text>
              <Text style={styles.metaValue}>#{charge.id}</Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Statut</Text>
              <Text style={[styles.metaValue, styles.statusPaid]}>Payé</Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mode de paiement</Text>
              <Text style={styles.metaValue}>Espèces</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de téléchargement PDF */}
      <View style={styles.downloadButtonContainer}>
        <TouchableOpacity 
          style={[styles.downloadButton, generating && styles.downloadButtonDisabled]}
          onPress={handleGeneratePDF}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Download size={20} color="#FFF" />
              <Text style={styles.downloadButtonText}>
                {generating ? 'Génération...' : 'Télécharger le reçu PDF'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#F8A5C2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
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
  descriptionSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  descriptionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  descriptionIcon: {
    marginTop: 2,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
  },
  metaValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusPaid: {
    color: '#4CAF50',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  downloadButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  downloadButton: {
    backgroundColor: '#F8A5C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  downloadButtonDisabled: {
    backgroundColor: '#CCC',
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChargeDetailScreen;