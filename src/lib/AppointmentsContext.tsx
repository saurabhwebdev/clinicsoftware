import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from './services/appointmentService';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  duration: number; // in minutes
  createdAt: number;
  updatedAt: number;
}

export interface NewAppointment {
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
  duration: number;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (data: NewAppointment) => Promise<string>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  refreshAppointments: () => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const useAppointments = (): AppointmentsContextType => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};

export const AppointmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getAppointments(user.uid);
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const refreshAppointments = async () => {
    return fetchAppointments();
  };

  const createAppointment = async (data: NewAppointment): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const appointmentId = await addAppointment(user.uid, {
        ...data,
        status: 'scheduled',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      await fetchAppointments();
      return appointmentId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await updateAppointment(user.uid, id, { 
        status, 
        updatedAt: Date.now() 
      });
      
      setAppointments(prev => prev.map(appt => 
        appt.id === id 
          ? { ...appt, status, updatedAt: Date.now() } 
          : appt
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAppointment = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await deleteAppointment(user.uid, id);
      setAppointments(prev => prev.filter(appt => appt.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentById = (id: string): Appointment | undefined => {
    return appointments.find(appt => appt.id === id);
  };

  const value = {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointmentStatus,
    removeAppointment,
    getAppointmentById,
    refreshAppointments
  };

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}; 