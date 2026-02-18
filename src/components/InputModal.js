import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InputModal = ({
    visible,
    onClose,
    title,
    fields,
    onSubmit,
    submitText = 'Créer',
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    React.useEffect(() => {
        if (visible) {
        // Initialiser les champs avec leurs valeurs par défaut
        const initialData = {};
        fields.forEach(field => {
            initialData[field.name] = field.defaultValue || '';
        });
        setFormData(initialData);
        setErrors({});
        }
    }, [visible]);

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Effacer l'erreur du champ quand l'utilisateur commence à taper
        if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        fields.forEach(field => {
        if (field.required && !formData[field.name]) {
            newErrors[field.name] = `${field.label || field.name} est requis`;
        }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
        onSubmit(formData);
        }
    };

    return (
        <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        >
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
        >
            <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={onClose}
            >
            <View style={styles.modalContent}>
                <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                    {fields.map((field, index) => (
                    <View key={index} style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>
                        {field.label} {field.required && <Text style={styles.required}>*</Text>}
                        </Text>
                        
                        {field.type === 'textarea' ? (
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={field.placeholder}
                            value={formData[field.name]}
                            onChangeText={(text) => updateField(field.name, text)}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#999"
                        />
                        ) : field.type === 'number' ? (
                        <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            value={formData[field.name]}
                            onChangeText={(text) => updateField(field.name, text)}
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                        ) : (
                        <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            value={formData[field.name]}
                            onChangeText={(text) => updateField(field.name, text)}
                            placeholderTextColor="#999"
                        />
                        )}
                        
                        {errors[field.name] && (
                        <Text style={styles.errorText}>{errors[field.name]}</Text>
                        )}
                    </View>
                    ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={onClose}
                    >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={handleSubmit}
                    >
                    <Text style={styles.submitButtonText}>{submitText}</Text>
                    </TouchableOpacity>
                </View>
                </TouchableOpacity>
            </View>
            </TouchableOpacity>
        </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
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
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 10,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '500',
    },
    required: {
        color: '#DC143C',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    errorText: {
        color: '#DC143C',
        fontSize: 12,
        marginTop: 5,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#F8A5C2',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default InputModal;