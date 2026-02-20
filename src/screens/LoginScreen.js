import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogIn, UserPlus, Globe } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Champs pour la connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Champs supplémentaires pour l'inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('masseur'); // Par défaut 'masseur' comme dans la table
  
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();

  const handleAuth = async () => {
    if (isLogin) {
      // Logique de connexion
      if (!email || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      setLoading(true);
      const result = await login(email, password);
      setLoading(false);

      if (!result.success) {
        Alert.alert('Erreur', result.message);
      }
    } else {
      // Logique d'inscription
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }

      setLoading(true);
      
      // Préparer les données d'inscription selon votre table users
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      };

      const result = await register(userData);
      setLoading(false);

      if (!result.success) {
        Alert.alert('Erreur', result.message);
      } else {
        Alert.alert('Succès', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true); // Basculer vers l'écran de connexion
        // Réinitialiser les champs
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setConfirmPassword('');
      }
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (!result.success) {
      Alert.alert('Info', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
            onPress={() => {
              setIsLogin(true);
              // Réinitialiser les champs d'inscription
              setFirstName('');
              setLastName('');
              setPhone('');
              setConfirmPassword('');
            }}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
              se connecter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
            onPress={() => {
              setIsLogin(false);
              // Réinitialiser les champs de connexion
              setEmail('');
              setPassword('');
            }}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
              s'inscrire
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Salama !</Text>
          <Text style={styles.brandSubtitle}>
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <Input
                placeholder="Prénom *"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Input
                placeholder="Nom *"
                value={lastName}
                onChangeText={setLastName}
              />
              <Input
                placeholder="Téléphone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <Input
            placeholder={isLogin ? "Nom utilisateur / email" : "Email *"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            placeholder={isLogin ? "Mot de passe" : "Mot de passe *"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isLogin && (
            <Input
              placeholder="Confirmer le mot de passe *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié</Text>
            </TouchableOpacity>
          )}

          <Button
            title={isLogin ? "se connecter" : "s'inscrire"}
            onPress={handleAuth}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Globe size={24} color="#DB4437" />
            <Text style={styles.googleButtonText}>
              {isLogin ? "se connecter avec Google" : "s'inscrire avec Google"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  toggleButtonActive: {
    backgroundColor: '#FFE5EF',
    borderColor: '#F8A5C2',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  toggleTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  brandContainer: {
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#333',
    textDecorationLine: 'underline',
  },
  loginButton: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoginScreen;