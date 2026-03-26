import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { 
  ArrowLeft,
  CreditCard,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Flower2,
  CheckCircle2,
  X
} from 'lucide-react-native';
import Header from '../../components/Header';
import CustomDrawer from '../../components/CustomDrawer';
import SearchableDropdown from '../../components/SearchableDropdown';
import CustomModal from '../../components/Modal'; 
import api from '../../config/api';
import { useLeaveCount } from '../../context/LeaveCountContext';

const { width } = Dimensions.get('window');

const EntrerChargeScreen = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { pendingLeaveCount } = useLeaveCount();
  const [refreshing, setRefreshing] = useState(false);
  const [typeCharge, setTypeCharge] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState(null);
  const [week, setWeek] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // États pour la modal de succès
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [paidEmployeeName, setPaidEmployeeName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidPeriod, setPaidPeriod] = useState('');

  const [createTypeModalVisible, setCreateTypeModalVisible] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  // Récupérer la liste des employés
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employee');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      return [];
    }
  };

  const handleExtraRightPress = () => {
    navigation.navigate('LeavePending');
  };

  // Récupérer la liste des types de charges
  const fetchExpenseTypes = async () => {
    try {
      const response = await api.get('/expense/types');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement types de charges:', error);
      return [];
    }
  };

  // Créer un nouvel employé
  const handleCreateEmployee = async () => {
    navigation.navigate('CreateEmployee', {
      onGoBack: (newEmployee) => {
        if (newEmployee) {
          setSelectedEmployee(newEmployee);
        }
      }
    });
    return null;
  };

  // Créer un nouveau type de charge
    const handleCreateExpenseType = () => {
        setCreateTypeModalVisible(true);
        return null;
    };

  const handleSaveNewType = async () => {
    if (!newTypeName.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir un nom');
        return;
    }

    try {
        const response = await api.post('/expense/types', {
        name: newTypeName.trim(),
        description: newTypeDescription.trim()
        });

        // Sélectionner automatiquement le nouveau type
        setSelectedExpenseType(response.data);
        
        // Réinitialiser et fermer le modal
        setNewTypeName('');
        setNewTypeDescription('');
        setCreateTypeModalVisible(false);
        
        Alert.alert('Succès', 'Type de charge créé avec succès');
    } catch (error) {
        console.error('Erreur création type:', error);
        if (error.response?.status === 400) {
        Alert.alert('Erreur', error.response.data.message || 'Ce type existe déjà');
        } else {
        Alert.alert('Erreur', 'Impossible de créer le type de charge');
        }
    }
    };

  const handleEnregistrer = async () => {
    if (!typeCharge) {
      Alert.alert('Erreur', 'Veuillez choisir un type de charge');
      return;
    }

    if (typeCharge === 'salaire') {
      if (!selectedEmployee || !week || !month || !year || !amount) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

    } else {
      if (!selectedExpenseType || !amount) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }
    }

    try {
      const expenseData = {};

      if (typeCharge === 'salaire') {
        expenseData.user_id = selectedEmployee.id;
        expenseData.amount = parseFloat(amount);
        expenseData.payment_week = parseInt(week);
        expenseData.payment_month = parseInt(month);
        expenseData.payment_year = parseInt(year);
        expenseData.description = `Salaire semaine ${week} - ${month}/${year}`;
        expenseData.status = 'paid';
        
        // Préparer les infos pour la modal
        setPaidEmployeeName(`${selectedEmployee.first_name} ${selectedEmployee.last_name}`);
        setPaidAmount(amount);
        setPaidPeriod(`Semaine ${week} - ${month}/${year}`);
      } else {
        expenseData.expense_type_id = selectedExpenseType.id;
        expenseData.amount = parseFloat(amount);
        expenseData.description = description;
        expenseData.payment_week = null;
        expenseData.payment_month = null;
        expenseData.payment_year = null;
        expenseData.status = 'paid';
        
        // Préparer les infos pour la modal
        setPaidEmployeeName(selectedExpenseType.name);
        setPaidAmount(amount);
        setPaidPeriod(new Date().toLocaleDateString('fr-FR'));
      }

      expenseData.payment_date = new Date().toISOString();

      // Enregistrer une dépense salaire via le nouvel endpoint dédié
      if (typeCharge === 'salaire') {
        await api.post('/expenses/salary', expenseData);
      } else {
        await api.post('/expense', expenseData);
      }
      
      // Afficher la modal de succès
      setSuccessModalVisible(true);

    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la charge');
    }
  };

  // Rafraîchir la page
  const onRefresh = () => {
    setRefreshing(true);
    
    // Réinitialiser tous les champs
    setTypeCharge('');
    setSelectedEmployee(null);
    setSelectedExpenseType(null);
    setWeek('');
    setMonth('');
    setYear(new Date().getFullYear().toString());
    setAmount('');
    setDescription('');
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Gérer la fermeture de la modal et le rafraîchissement
  const handleModalClose = () => {
    setSuccessModalVisible(false);
    onRefresh(); // Rafraîchir la page pour un nouveau paiement
  };

  // Générer les options de semaine (1 à 4 pour le mois)
  const getWeekOptions = () => {
    const weeks = [];
    for (let i = 1; i <= 4; i++) {
      weeks.push({
        id: i.toString(),
        name: `Semaine ${i}`
      });
    }
    return weeks;
  };

  const weekOptions = getWeekOptions();

  // Générer les options de mois
  const monthOptions = [
    { id: '1', name: 'Janvier' },
    { id: '2', name: 'Février' },
    { id: '3', name: 'Mars' },
    { id: '4', name: 'Avril' },
    { id: '5', name: 'Mai' },
    { id: '6', name: 'Juin' },
    { id: '7', name: 'Juillet' },
    { id: '8', name: 'Août' },
    { id: '9', name: 'Septembre' },
    { id: '10', name: 'Octobre' },
    { id: '11', name: 'Novembre' },
    { id: '12', name: 'Décembre' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Encaissement"
        showMenu={true}
        onMenuPress={() => setDrawerVisible(true)}
        leftIcon={<ArrowLeft size={24} color="#333" />}
        onLeftPress={() => navigation.goBack()}
        extraRightIcon={true} 
        onExtraRightPress={handleExtraRightPress}
        badgeCount={pendingLeaveCount}
      />

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
        {/* Fleur décorative comme dans la maquette */}
        <View style={styles.flowerContainer}>
          <Flower2 size={40} color="#F8A5C2" />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type charge</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  typeCharge === 'salaire' && styles.typeOptionActive
                ]}
                onPress={() => setTypeCharge('salaire')}
              >
                <Briefcase size={24} color={typeCharge === 'salaire' ? '#F8A5C2' : '#999'} />
                <Text style={[
                  styles.typeOptionText,
                  typeCharge === 'salaire' && styles.typeOptionTextActive
                ]}>
                  Salaire
                </Text>
              </TouchableOpacity>

              <Text style={styles.separator}>ou</Text>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  typeCharge === 'autre' && styles.typeOptionActive
                ]}
                onPress={() => setTypeCharge('autre')}
              >
                <CreditCard size={24} color={typeCharge === 'autre' ? '#F8A5C2' : '#999'} />
                <Text style={[
                  styles.typeOptionText,
                  typeCharge === 'autre' && styles.typeOptionTextActive
                ]}>
                  Autre
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {typeCharge === 'salaire' && (
            <>
              {/* Sélection de l'employé */}
              <SearchableDropdown
                label="Employé"
                placeholder="Sélectionner un employé"
                value={selectedEmployee}
                onSelect={setSelectedEmployee}
                fetchData={fetchEmployees}
                onCreateNew={handleCreateEmployee}
                displayField="first_name"
                valueField="id"
                searchPlaceholder="Rechercher un employé..."
              />

              {/* Montant du salaire */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant</Text>
                <View style={styles.inputContainer}>
                  <DollarSign size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Saisir le montant"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Période de paiement */}
              <Text style={styles.sectionTitle}>Période à payer</Text>
              
              <View style={styles.periodContainer}>
                {/* Semaine - Maintenant 4 options seulement */}
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>Semaine</Text>
                  <SearchableDropdown
                    placeholder="Choisir semaine"
                    value={weekOptions.find(w => w.id === week)}
                    onSelect={(item) => setWeek(item.id)}
                    fetchData={() => Promise.resolve(weekOptions)}
                    displayField="name"
                    valueField="id"
                  />
                </View>

                {/* Mois */}
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>Mois</Text>
                  <SearchableDropdown
                    placeholder="Choisir mois"
                    value={monthOptions.find(m => m.id === month)}
                    onSelect={(item) => setMonth(item.id)}
                    fetchData={() => Promise.resolve(monthOptions)}
                    displayField="name"
                    valueField="id"
                  />
                </View>

                {/* Année */}
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>Année</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Année"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {typeCharge === 'autre' && (
            <>
              {/* Sélection du type de charge */}
              <SearchableDropdown
                label="Type de charge"
                placeholder="Sélectionner un type"
                value={selectedExpenseType}
                onSelect={setSelectedExpenseType}
                fetchData={fetchExpenseTypes}
                onCreateNew={handleCreateExpenseType}
                displayField="name"
                valueField="id"
                searchPlaceholder="Rechercher un type..."
              />

              {/* Montant */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant</Text>
                <View style={styles.inputContainer}>
                  <DollarSign size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Saisir le montant"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Description de la charge"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.enregistrerButton}
          onPress={handleEnregistrer}
        >
          <Text style={styles.enregistrerButtonText}>Payé</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de succès */}
      <CustomModal
        visible={successModalVisible}
        onClose={handleModalClose}
        type="success"
        title="Paiement effectué !"
        message={
          typeCharge === 'salaire'
            ? `Le salaire de ${paidEmployeeName} pour ${paidPeriod} a été enregistré avec succès.`
            : `La charge "${paidEmployeeName}" de ${paidAmount} FCFA a été enregistrée avec succès.`
        }
        confirmText="Nouveau paiement"
        showCancelButton={false}
        icon={CheckCircle2}
        iconColor="#4CAF50"
      />

        {/* Modal de création de type de charge */}
        <Modal
        visible={createTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateTypeModalVisible(false)}
        >
        <TouchableWithoutFeedback onPress={() => setCreateTypeModalVisible(false)}>
            <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Nouveau type de charge</Text>
                    <TouchableOpacity onPress={() => setCreateTypeModalVisible(false)}>
                    <X size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom *</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                        style={styles.input}
                        placeholder="Ex: Fournitures de bureau"
                        value={newTypeName}
                        onChangeText={setNewTypeName}
                        autoFocus
                        />
                    </View>
                    </View>

                    <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (optionnel)</Text>
                    <View style={styles.textAreaContainer}>
                        <TextInput
                        style={styles.textArea}
                        placeholder="Description..."
                        value={newTypeDescription}
                        onChangeText={setNewTypeDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        />
                    </View>
                    </View>
                </View>

                <View style={styles.modalFooter}>
                    <TouchableOpacity
                    style={[styles.modalButton, styles.cancelModalButton]}
                    onPress={() => setCreateTypeModalVisible(false)}
                    >
                    <Text style={styles.cancelModalButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style={[styles.modalButton, styles.saveModalButton]}
                    onPress={handleSaveNewType}
                    >
                    <Text style={styles.saveModalButtonText}>Créer</Text>
                    </TouchableOpacity>
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
  flowerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeOption: {
    alignItems: 'center',
    padding: 10,
  },
  typeOptionActive: {
    backgroundColor: '#FFE5EF',
    borderRadius: 8,
  },
  typeOptionText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  typeOptionTextActive: {
    color: '#F8A5C2',
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  textArea: {
    height: 80,
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  periodContainer: {
    gap: 15,
  },
  periodItem: {
    marginBottom: 10,
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  enregistrerButton: {
    backgroundColor: '#F8A5C2',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  enregistrerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  cancelModalButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  saveModalButton: {
    backgroundColor: '#FFF',
  },
  saveModalButtonText: {
    fontSize: 16,
    color: '#F8A5C2',
    fontWeight: '600',
  },
});

export default EntrerChargeScreen;
