import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

// Fonction pour récupérer le nombre de demandes de congé en attente
export const getPendingLeaveCount = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return 0;

    const response = await api.get('/leave/requests/all');

    if (response.data && response.data.requests) {
      const pendingRequests = response.data.requests.filter(req => req.status === 'pending');
      return pendingRequests.length;
    }
    return 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de demandes en attente:', error);
    return 0;
  }
};
