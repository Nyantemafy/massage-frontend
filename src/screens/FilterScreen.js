import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Search, Palette, Bell, Calendar, RefreshCcw, Check, Info } from 'lucide-react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import SearchableDropdown from '../components/SearchableDropdown';
import api from '../config/api';

// Import conditionnel pour les date pickers
let DateTimePickerModal;
if (Platform.OS !== 'web') {
  DateTimePickerModal = require("react-native-modal-datetime-picker").default;
}

const FilterScreen = ({ navigation, route }) => {
  const { onApplyFilters, currentFilters = {} } = route.params || {};

  const [filters, setFilters] = useState({
    clientId: currentFilters.clientId || null,
    clientName: currentFilters.clientName || '',
    masseurId: currentFilters.masseurId || null,
    masseurName: currentFilters.masseurName || '',
    offerId: currentFilters.offerId || null,
    offerName: currentFilters.offerName || '',
    massageTypeId: currentFilters.massageTypeId || null,
    massageTypeName: currentFilters.massageTypeName || '',
    status: currentFilters.status || '',
    dateFrom: currentFilters.dateFrom || '',
    dateTo: currentFilters.dateTo || '',
    searchTerm: currentFilters.searchTerm || '',
  });

  // États pour les date pickers
  const [isDateFromPickerVisible, setDateFromPickerVisibility] = useState(false);
  const [isDateToPickerVisible, setDateToPickerVisibility] = useState(false);

  // Options de statut
  const statusOptions = [
    { id: 'confirmed', name: 'Confirmé' },
    { id: 'pending', name: 'En attente' },
    { id: 'cancelled', name: 'Annulé' },
    { id: 'completed', name: 'Terminé' },
  ];

  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Fonctions pour les date pickers
  const showDateFromPicker = () => {
    if (Platform.OS !== 'web') {
      setDateFromPickerVisibility(true);
    }
  };

  const hideDateFromPicker = () => {
    setDateFromPickerVisibility(false);
  };

  const showDateToPicker = () => {
    if (Platform.OS !== 'web') {
      setDateToPickerVisibility(true);
    }
  };

  const hideDateToPicker = () => {
    setDateToPickerVisibility(false);
  };

  const handleConfirmDateFrom = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    updateFilter('dateFrom', dateStr);
    hideDateFromPicker();
  };

  const handleConfirmDateTo = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    updateFilter('dateTo', dateStr);
    hideDateToPicker();
  };

  // Gestionnaires pour le web
  const handleWebDateFromChange = (value) => {
    updateFilter('dateFrom', value);
  };

  const handleWebDateToChange = (value) => {
    updateFilter('dateTo', value);
  };

  // Fonctions pour récupérer les données des dropdowns
  const fetchClients = async () => {
    try {
      const response = await api.get('/users/clients');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      return [];
    }
  };

  const fetchMasseurs = async () => {
    try {
      const response = await api.get('/users/filtre', {
        params: { role_id: 3 }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement masseurs:', error);
      return [];
    }
  };

  const fetchMassageTypes = async () => {
    try {
      const response = await api.get('/massage/massage-types');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement types de massage:', error);
      return [];
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await api.get('/massage/massage-offers');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement offres:', error);
      return [];
    }
  };

  const applyFilters = () => {
    // Préparer les filtres pour l'API
    const apiFilters = {
      clientId: filters.clientId,
      masseurId: filters.masseurId,
      offerId: filters.offerId,
      massageTypeId: filters.massageTypeId,
      status: filters.status,
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      searchTerm: filters.searchTerm,
    };

    // Nettoyer les filtres vides
    Object.keys(apiFilters).forEach(key => {
      if (!apiFilters[key]) delete apiFilters[key];
    });

    // Passer les filtres à l'écran précédent
    if (onApplyFilters) {
      onApplyFilters(apiFilters);
    }
    
    navigation.goBack();
  };

  const resetFilters = () => {
    setFilters({
      clientId: null,
      clientName: '',
      masseurId: null,
      masseurName: '',
      offerId: null,
      offerName: '',
      massageTypeId: null,
      massageTypeName: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
    });
  };

  const hasActiveFilters = () => {
    return filters.clientId || 
          filters.masseurId || 
          filters.offerId ||
          filters.massageTypeId ||
          filters.status || 
          filters.dateFrom || 
          filters.dateTo || 
          filters.searchTerm;
  };

  // Rendu pour le sélecteur de date
  const renderDatePicker = (type) => {
    const isFrom = type === 'from';
    const value = isFrom ? filters.dateFrom : filters.dateTo;
    const label = isFrom ? 'Date de début' : 'Date de fin';
    const showPicker = isFrom ? showDateFromPicker : showDateToPicker;
    const handleWebChange = isFrom ? handleWebDateFromChange : handleWebDateToChange;
    const isVisible = isFrom ? isDateFromPickerVisible : isDateToPickerVisible;
    const handleConfirm = isFrom ? handleConfirmDateFrom : handleConfirmDateTo;
    const hidePicker = isFrom ? hideDateFromPicker : hideDateToPicker;

    if (Platform.OS === 'web') {
      return (
        <View style={styles.datePickerContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.dateInput}
            type="date"
            value={value}
            onChangeText={handleWebChange}
            placeholder="YYYY-MM-DD"
          />
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={showPicker}
        >
          <Calendar size={20} color="#999" />
          <Text style={[styles.dateInputText, value && styles.selectedText]}>
            {value || label}
          </Text>
        </TouchableOpacity>

        {DateTimePickerModal && (
          <DateTimePickerModal
            isVisible={isVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hidePicker}
            date={value ? new Date(value) : new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Filtres"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={
          <View style={styles.headerIcons}>
            <Palette size={24} color="#333" />
            <Bell size={24} color="#333" />
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recherche</Text>
          <Input
            placeholder="Rechercher un client, une offre..."
            value={filters.searchTerm}
            onChangeText={(text) => updateFilter('searchTerm', text)}
            leftIcon={<Search size={20} color="#999" />}
          />
        </View>

        <View style={styles.divider} />

        {/* Filtres principaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtres</Text>
          
          {/* Client */}
          <SearchableDropdown
            label="Client"
            placeholder="Sélectionner un client"
            value={filters.clientId}
            valueDisplay={filters.clientName}
            onSelect={(item) => {
              updateFilter('clientId', item.id);
              updateFilter('clientName', item.first_name + ' ' + item.last_name);
            }}
            fetchData={fetchClients}
            displayField="first_name"
            searchPlaceholder="Rechercher un client..."
            clearable
          />

          {/* Masseur */}
          <SearchableDropdown
            label="Masseur"
            placeholder="Sélectionner un masseur"
            value={filters.masseurId}
            valueDisplay={filters.masseurName}
            onSelect={(item) => {
              updateFilter('masseurId', item.id);
              updateFilter('masseurName', item.first_name + ' ' + item.last_name);
            }}
            fetchData={fetchMasseurs}
            displayField="first_name"
            searchPlaceholder="Rechercher un masseur..."
            clearable
          />

          <SearchableDropdown
            label="Type de massage"
            placeholder="Sélectionner un type"
            value={filters.massageTypeId}
            valueDisplay={filters.massageTypeName}
            onSelect={(item) => {
              updateFilter('massageTypeId', item.id);
              updateFilter('massageTypeName', item.name);
            }}
            fetchData={fetchMassageTypes}
            displayField="name"
            searchPlaceholder="Rechercher un type de massage..."
            clearable
          />

          {/* Offre */}
          <SearchableDropdown
            label="Offre"
            placeholder="Sélectionner une offre"
            value={filters.offerId}
            valueDisplay={filters.offerName}
            onSelect={(item) => {
              updateFilter('offerId', item.id);
              updateFilter('offerName', item.name);
            }}
            fetchData={fetchOffers}
            displayField="name"
            searchPlaceholder="Rechercher une offre..."
            clearable
          />

          {/* Statut */}
          <SearchableDropdown
            label="Statut"
            placeholder="Sélectionner un statut"
            value={filters.status}
            valueDisplay={filters.status ? statusOptions.find(s => s.id === filters.status)?.name : ''}
            onSelect={(item) => updateFilter('status', item.id)}
            fetchData={async () => statusOptions}
            displayField="name"
            searchPlaceholder="Rechercher un statut..."
            clearable
          />
        </View>

        <View style={styles.divider} />

        {/* Période */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Période</Text>
          
          <View style={styles.dateRangeContainer}>
            {renderDatePicker('from')}
            
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>à</Text>
            </View>
            
            {renderDatePicker('to')}
          </View>
        </View>

        {/* Indicateur de filtres actifs */}
        {hasActiveFilters() && (
          <View style={styles.activeFiltersContainer}>
            <Info size={20} color="#F8A5C2" />
            <Text style={styles.activeFiltersText}>
              Des filtres sont appliqués
            </Text>
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <RefreshCcw size={20} color="#F8A5C2" />
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
            <Check size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  dateRangeContainer: {
    gap: 10,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 5,
  },
  dateSeparatorText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  datePickerContainer: {
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    gap: 10,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  selectedText: {
    color: '#333',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5EF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 20,
    gap: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#F8A5C2',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#F8A5C2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#F8A5C2',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8A5C2',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default FilterScreen;