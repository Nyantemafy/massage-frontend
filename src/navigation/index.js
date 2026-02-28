import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import AddUserScreen from '../screens/users/AddUserScreen';
import EditUserScreen from '../screens/users/EditUserScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // ou un écran de chargement
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
