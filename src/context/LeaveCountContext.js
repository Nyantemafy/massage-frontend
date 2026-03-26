import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useAuth } from './AuthContext';

const LeaveCountContext = createContext();

export const useLeaveCount = () => {
  const context = useContext(LeaveCountContext);
  if (!context) {
    throw new Error('useLeaveCount must be used within a LeaveCountProvider');
  }
  return context;
};

export const LeaveCountProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const lastFetchTime = useRef(0);
  const pendingRequest = useRef(null);
  const CACHE_DURATION = 60000; 

  const loadPendingLeaveCount = useCallback(async (force = false) => {
    const roleName = user?.role_name || user?.role;
    const isManager = roleName === 'admin' || roleName === 'manager';
    const now = Date.now();

    if (!isManager) {
      setPendingLeaveCount(0);
      lastFetchTime.current = now;
      return 0;
    }
    
    if (!force && pendingLeaveCount > 0 && (now - lastFetchTime.current) < CACHE_DURATION) {
      return pendingLeaveCount;
    }

    if (loading) {
      if (pendingRequest.current) {
        return pendingRequest.current;
      }
      return pendingLeaveCount;
    }

    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setPendingLeaveCount(0);
        lastFetchTime.current = now;
        return 0;
      }      
      const requestPromise = (async () => {
        const response = await api.get('/leave/requests/all');
        
        if (response.status === 200) {
          let pendingCount = 0;
          
          if (response.data && Array.isArray(response.data)) {
            pendingCount = response.data.filter(req => req.status === 'pending').length;
          } else if (response.data && response.data.requests && Array.isArray(response.data.requests)) {
            pendingCount = response.data.requests.filter(req => req.status === 'pending').length;
          }
          
          setPendingLeaveCount(pendingCount);
          lastFetchTime.current = now;
          return pendingCount;
        } else {
          setPendingLeaveCount(0);
          lastFetchTime.current = now;
          return 0;
        }
      })();

      pendingRequest.current = requestPromise;
      const result = await requestPromise;
      pendingRequest.current = null;
      
      return result;
      
    } catch (error) {
      console.error('Erreur lors de la récupération du compteur:', error);
      pendingRequest.current = null;
      return pendingLeaveCount;
    } finally {
      setLoading(false);
    }
  }, [loading, pendingLeaveCount, user?.role, user?.role_name]); 

  useEffect(() => {
    if (user) {
      loadPendingLeaveCount(true);
    } else {
      setPendingLeaveCount(0);
    }
  }, [loadPendingLeaveCount, user]); 

  const refreshLeaveCount = useCallback(() => {
    return loadPendingLeaveCount(true); 
  }, [loadPendingLeaveCount]);

  const value = {
    pendingLeaveCount,
    loading,
    refreshLeaveCount,
    loadPendingLeaveCount,
  };

  return (
    <LeaveCountContext.Provider value={value}>
      {children}
    </LeaveCountContext.Provider>
  );
};
