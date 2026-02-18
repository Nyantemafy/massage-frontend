import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchableDropdown = ({
    label,
    placeholder,
    value,
    onSelect,
    fetchData,
    onCreateNew,
    searchPlaceholder = "Rechercher...",
    displayField = 'name',
    valueField = 'id',
    }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(value);

    useEffect(() => {
        if (modalVisible) {
        loadData();
        }
    }, [modalVisible]);

    useEffect(() => {
        if (searchText) {
        const filtered = data.filter(item =>
            item[displayField]?.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredData(filtered);
        } else {
        setFilteredData(data);
        }
    }, [searchText, data]);

    const loadData = async () => {
        setLoading(true);
        try {
        const result = await fetchData();
        setData(result);
        setFilteredData(result);
        } catch (error) {
        console.error('Erreur chargement données:', error);
        Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
        setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setSelectedItem(item);
        onSelect(item);
        setModalVisible(false);
        setSearchText('');
    };

    const handleCreateNew = async () => {
        setModalVisible(false);
        const newItem = await onCreateNew();
        if (newItem) {
        // Recharger les données et sélectionner le nouvel élément
        await loadData();
        handleSelect(newItem);
        }
    };

    const getDisplayValue = () => {
        if (!selectedItem) return '';
        if (typeof selectedItem === 'object') {
        return selectedItem[displayField] || '';
        }
        return selectedItem;
    };

    return (
        <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setModalVisible(true)}
        >
            <Text style={[styles.dropdownText, !selectedItem && styles.placeholderText]}>
            {selectedItem ? getDisplayValue() : placeholder}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Sélectionner'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#999"
                />
                {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                ) : null}
                </View>

                {loading ? (
                <ActivityIndicator size="large" color="#F8A5C2" style={styles.loader} />
                ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.itemContainer}
                        onPress={() => handleSelect(item)}
                    >
                        <Text style={styles.itemText}>{item[displayField]}</Text>
                        {selectedItem?.id === item.id && (
                        <Ionicons name="checkmark" size={20} color="#F8A5C2" />
                        )}
                    </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                    </View>
                    }
                />
                )}

                {onCreateNew && (
                <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
                    <Ionicons name="add-circle" size={24} color="#F8A5C2" />
                    <Text style={styles.addButtonText}>Ajouter nouveau</Text>
                </TouchableOpacity>
                )}
            </View>
            </View>
        </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '500',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#FAFAFA',
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        margin: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    loader: {
        padding: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 10,
    },
    addButtonText: {
        fontSize: 16,
        color: '#F8A5C2',
        fontWeight: '600',
    },
});

export default SearchableDropdown;