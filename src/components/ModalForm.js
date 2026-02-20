// components/ModalForm.js
import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
    ScrollView,
    TextInput,
} from 'react-native';
import { X } from 'lucide-react-native';
import Input from './Input';
import Button from './Button';

const { width } = Dimensions.get('window');

const ModalForm = ({
    visible,
    onClose,
    title,
    fields = [],
    onSubmit,
    submitText = 'Valider',
    cancelText = 'Annuler',
    initialValues = {},
    closeOnTouchOutside = true,
}) => {
    const [formData, setFormData] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleFieldChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // Effacer l'erreur du champ quand l'utilisateur commence à taper
        if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        fields.forEach(field => {
        if (field.required && !formData[field.name]) {
            newErrors[field.name] = `${field.label || field.name} est requis`;
        }
        if (field.validation) {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
        onSubmit(formData);
        // Réinitialiser le formulaire
        setFormData({});
        setErrors({});
        }
    };

    const handleClose = () => {
        setFormData({});
        setErrors({});
        if (onClose) onClose();
    };

    const renderField = (field) => {
        const commonProps = {
        key: field.name,
        placeholder: field.placeholder || `Entrez ${field.label?.toLowerCase() || ''}`,
        value: formData[field.name] || '',
        onChangeText: (text) => handleFieldChange(field.name, text),
        error: errors[field.name],
        style: field.style,
        };

        switch (field.type) {
        case 'textarea':
            return (
            <View key={field.name} style={styles.fieldContainer}>
                {field.label && <Text style={styles.fieldLabel}>{field.label}{field.required && ' *'}</Text>}
                <TextInput
                {...commonProps}
                multiline
                numberOfLines={field.numberOfLines || 3}
                style={[styles.textArea, field.style]}
                placeholderTextColor="#999"
                />
                {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
            );

        case 'number':
            return (
            <View key={field.name} style={styles.fieldContainer}>
                {field.label && <Text style={styles.fieldLabel}>{field.label}{field.required && ' *'}</Text>}
                <TextInput
                {...commonProps}
                keyboardType="numeric"
                style={[styles.input, field.style]}
                placeholderTextColor="#999"
                />
                {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
            );

        case 'email':
            return (
            <View key={field.name} style={styles.fieldContainer}>
                {field.label && <Text style={styles.fieldLabel}>{field.label}{field.required && ' *'}</Text>}
                <TextInput
                {...commonProps}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, field.style]}
                placeholderTextColor="#999"
                />
                {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
            );

        case 'phone':
            return (
            <View key={field.name} style={styles.fieldContainer}>
                {field.label && <Text style={styles.fieldLabel}>{field.label}{field.required && ' *'}</Text>}
                <TextInput
                {...commonProps}
                keyboardType="phone-pad"
                style={[styles.input, field.style]}
                placeholderTextColor="#999"
                />
                {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
            );

        default:
            return (
            <View key={field.name} style={styles.fieldContainer}>
                {field.label && <Text style={styles.fieldLabel}>{field.label}{field.required && ' *'}</Text>}
                <TextInput
                {...commonProps}
                style={[styles.input, field.style]}
                placeholderTextColor="#999"
                />
                {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
            );
        }
    };

    return (
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        >
        <TouchableWithoutFeedback onPress={closeOnTouchOutside ? handleClose : null}>
            <View style={styles.overlay}>
            <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Formulaire */}
                <ScrollView 
                    style={styles.formContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {fields.map(renderField)}
                </ScrollView>

                {/* Boutons */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                    style={[styles.footerButton, styles.cancelButton]}
                    onPress={handleClose}
                    >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                    style={[styles.footerButton, styles.submitButton]}
                    onPress={handleSubmit}
                    >
                    <Text style={styles.submitButtonText}>{submitText}</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    closeButton: {
        padding: 5,
    },
    formContainer: {
        padding: 15,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
    },
    textArea: {
        height: 80,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: 5,
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    footerButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#2196F3',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default ModalForm;