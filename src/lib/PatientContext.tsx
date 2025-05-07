import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPatients, addPatient, updatePatient, deletePatient } from './services/patientService';
import { useAuth } from './AuthContext';

export interface Patient {
  id?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  addNewPatient: (patient: Patient) => Promise<string>;
  updatePatientData: (id: string, patient: Patient) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  refreshPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const usePatients = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPatients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getPatients(user.uid);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const refreshPatients = async () => {
    await fetchPatients();
  };

  const addNewPatient = async (patientData: Patient): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Add timestamp to patient data
      const newPatientData = {
        ...patientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const patientId = await addPatient(user.uid, newPatientData);
      
      // Refresh patients list
      await fetchPatients();
      
      return patientId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePatientData = async (id: string, patientData: Patient): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Update timestamp
      const updatedData = {
        ...patientData,
        updatedAt: new Date().toISOString()
      };
      
      await updatePatient(user.uid, id, updatedData);
      
      // Refresh patients list
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePatient = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await deletePatient(user.uid, id);
      
      // Refresh patients list
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    patients,
    loading,
    error,
    addNewPatient,
    updatePatientData,
    removePatient,
    refreshPatients
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
}; 