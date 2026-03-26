import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/scheduls/LoginScreen';
import ScheduleScreen from '../screens/scheduls/ScheduleScreen';
import NewAppointmentScreen from '../screens/scheduls/NewAppointmentScreen';
import AppointmentDetailScreen from '../screens/scheduls/AppointmentDetailScreen';
import HistoryScreen from '../screens/scheduls/HistoryScreen';
import FilterScreen from '../screens/scheduls/FilterScreen';

// Paiement Screens
import EntrerChargeScreen from '../screens/paiement/EntrerChargeScreen';
import EncaissementScreen from '../screens/paiement/EncaissementScreen';
import HistoriquePaiementScreen from '../screens/paiement/HistoriquePaiementScreen';
import DetailChargeScreen from '../screens/paiement/DetailChargeScreen';
import ChargesListScreen from '../screens/paiement/ChargesListScreen';
import ChargeDetailScreen from '../screens/paiement/ChargeDetailScreen';

// Clients Screens
import ClientsScreen from '../screens/clients/ClientsScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import AddClientScreen from '../screens/clients/AddClientScreen';
import EditClientScreen from '../screens/clients/EditClientScreen';

// Users Screens
import UsersScreen from '../screens/users/UsersScreen';
import UserDetailScreen from '../screens/users/UserDetailScreen';

// Profile Screen
import ProfileScreen from '../screens/profile/ProfileScreen';

// Leave Screens
import LeaveScreen from '../screens/leave/LeaveScreen';
import LeaveRequestScreen from '../screens/leave/LeaveRequestScreen';
import LeavePendingScreen from '../screens/leave/LeavePendingScreen';
import AddUserScreen from '../screens/users/AddUserScreen';
import EditUserScreen from '../screens/users/EditUserScreen';

// Dashboard Screen
import DashboardScreen from '../screens/DashboardScreen';

// Revenue Analytics Screen
import RevenueAnalyticsScreen from '../screens/RevenueAnalyticsScreen';
import TodayAppointmentsScreen from '../screens/todayAppointments/TodayAppointmentsScreen';

// Client Analytics Screen
import ClientAnalyticsScreen from '../screens/ClientAnalyticsScreen';

// Masseuse Analytics Screen
import MasseuseAnalyticsScreen from '../screens/MasseuseAnalyticsScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState('Dashboard');

  // Charger la dernière page visitée au démarrage
  useEffect(() => {
    const loadLastRoute = async () => {
      try {
        const lastRoute = await AsyncStorage.getItem('lastVisitedRoute');
        
        // Définir la route selon le rôle de l'utilisateur
        let defaultRoute = 'Schedule'; // Route par défaut pour les non-admins
        if (user?.role_id === 1 || user?.role_id === 2) { // Admin ou Manager
          defaultRoute = 'Dashboard';
        }
        
        // Liste des routes valides
        const validRoutes = [
          'Dashboard', 'RevenueAnalytics', 'ClientAnalytics', 'MasseuseAnalytics',
          'TodayAppointments', 'Schedule', 'NewAppointment', 'AppointmentDetail',
          'History', 'Filter', 'EntrerCharge', 'Encaissement', 'HistoriquePaiement',
          'DetailCharge', 'ChargesList', 'ChargeDetail', 'Clients', 'ClientDetail',
          'AddClient', 'EditClient', 'Users', 'UserDetail', 'AddUser', 'EditUser',
          'Profile', 'Leave', 'LeaveRequest', 'LeavePending'
        ];
        
        // Utiliser la dernière route si elle est valide et correspond au rôle
        if (lastRoute && validRoutes.includes(lastRoute)) {
          // Vérifier si la route est accessible selon le rôle
          if (lastRoute === 'Dashboard' && (user?.role_id === 1 || user?.role_id === 2)) {
            setInitialRoute(lastRoute);
          } else if (lastRoute !== 'Dashboard') {
            setInitialRoute(lastRoute);
          } else {
            setInitialRoute(defaultRoute);
          }
        } else {
          setInitialRoute(defaultRoute); // Route par défaut selon le rôle
        }
      } catch (error) {
        console.log('Erreur lors du chargement de la dernière route:', error);
        // Route par défaut selon le rôle en cas d'erreur
        const defaultRoute = (user?.role_id === 1 || user?.role_id === 2) ? 'Dashboard' : 'Schedule';
        setInitialRoute(defaultRoute);
      }
    };

    if (user) {
      loadLastRoute();
    } else {
      // Si pas d'utilisateur, réinitialiser à la route par défaut
      setInitialRoute('Schedule');
    }
  }, [user]);

  // Sauvegarder la route actuelle lors de la navigation
  const handleStateChange = (state) => {
    const currentRoute = state.routes[state.index].name;
    
    // Vérifier si l'utilisateur a accès à cette route avant de la sauvegarder
    if (currentRoute === 'Dashboard' && user?.role_id !== 1 && user?.role_id !== 2) {
      // Ne pas sauvegarder Dashboard pour les non-admins
      return;
    }
    
    AsyncStorage.setItem('lastVisitedRoute', currentRoute);
  };

  if (loading) {
    return null; // ou un écran de chargement
  }

  return (
    <NavigationContainer onStateChange={handleStateChange}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="RevenueAnalytics" component={RevenueAnalyticsScreen} />
            <Stack.Screen name="ClientAnalytics" component={ClientAnalyticsScreen} />
            <Stack.Screen name="MasseuseAnalytics" component={MasseuseAnalyticsScreen} />
            <Stack.Screen name="TodayAppointments" component={TodayAppointmentsScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Filter" component={FilterScreen} />
            
            {/* Paiement Screens */}
            <Stack.Screen name="EntrerCharge" component={EntrerChargeScreen} />
            <Stack.Screen name="Encaissement" component={EncaissementScreen} />
            <Stack.Screen name="HistoriquePaiement" component={HistoriquePaiementScreen} />
            <Stack.Screen name="DetailCharge" component={DetailChargeScreen} />
            <Stack.Screen name="ChargesList" component={ChargesListScreen} />
            <Stack.Screen name="ChargeDetail" component={ChargeDetailScreen} />
            
            {/* Clients Screens */}
            <Stack.Screen name="Clients" component={ClientsScreen} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
            <Stack.Screen name="AddClient" component={AddClientScreen} />
            <Stack.Screen name="EditClient" component={EditClientScreen} />
            
            {/* Users Screens */}
            <Stack.Screen name="Users" component={UsersScreen} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} />
            <Stack.Screen name="AddUser" component={AddUserScreen} />
            <Stack.Screen name="EditUser" component={EditUserScreen} />
            
            {/* Profile Screen */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            
            {/* Leave Screens */}
            <Stack.Screen name="Leave" component={LeaveScreen} />
            <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
            <Stack.Screen name="LeavePending" component={LeavePendingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
