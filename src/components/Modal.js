import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Info 
} from 'lucide-react-native';
import Button from './Button';

const { width } = Dimensions.get('window');

const CustomModal = ({
    visible,
    onClose,
    title,
    message,
    type = 'info', // 'info', 'success', 'error', 'warning', 'confirm'
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    onConfirm,
    onCancel,
    showCancelButton = true,
    showConfirmButton = true,
    children,
    icon,
    iconSize = 50,
    iconColor,
    closeOnTouchOutside = true,
}) => {
    const getIconConfig = () => {
        if (icon) return { name: icon, color: iconColor || '#333' };
        
        switch (type) {
        case 'success':
            return { component: CheckCircle2, color: '#4CAF50' };
        case 'error':
            return { component: XCircle, color: '#F44336' };
        case 'warning':
            return { component: AlertTriangle, color: '#FF9800' };
        case 'confirm':
            return { component: HelpCircle, color: '#2196F3' };
        case 'info':
        default:
            return { component: Info, color: '#999' };
        }
    };

    const iconConfig = getIconConfig();
    const IconComponent = iconConfig.component;

    const handleClose = () => {
        if (onClose) onClose();
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        if (onClose) onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        if (onClose) onClose();
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
                {/* Header avec bouton de fermeture */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Contenu de la modal */}
                <View style={styles.content}>
                    {/* Icône */}
                    {(iconConfig.name || type) && (
                    <View style={styles.iconContainer}>
                        <IconComponent size={iconSize} color={iconConfig.color} />
                    </View>
                    )}

                    {/* Titre */}
                    {title && (
                    <Text style={styles.title}>{title}</Text>
                    )}

                    {/* Message */}
                    {message && (
                    <Text style={styles.message}>{message}</Text>
                    )}

                    {/* Contenu personnalisé */}
                    {children}
                </View>

                {/* Boutons d'action */}
                <View style={styles.footer}>
                    {showCancelButton && (
                    <TouchableOpacity 
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>{cancelText}</Text>
                    </TouchableOpacity>
                    )}
                    
                    {showConfirmButton && (
                    <TouchableOpacity 
                        style={[styles.button, styles.confirmButton]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmButtonText}>{confirmText}</Text>
                    </TouchableOpacity>
                    )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
    },
    closeButton: {
        padding: 5,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    button: {
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
    confirmButton: {
        backgroundColor: '#FFF',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '600',
    },
});

export default CustomModal;