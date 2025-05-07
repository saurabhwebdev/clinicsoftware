import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPrescriptions, addPrescription, updatePrescription, deletePrescription } from './services/prescriptionService';
import { useAuth } from './AuthContext';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id?: string;
  patientId: string;
  patientName: string;
  date: string;
  medications: Medication[];
  notes?: string;
  doctor?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

interface NewPrescription extends Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'> {}

interface PrescriptionContextType {
  prescriptions: Prescription[];
  loading: boolean;
  error: string | null;
  createPrescription: (prescription: NewPrescription) => Promise<string>;
  updatePrescriptionData: (id: string, prescription: Prescription) => Promise<void>;
  removePrescription: (id: string) => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const usePrescriptions = (): PrescriptionContextType => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescriptions must be used within a PrescriptionProvider');
  }
  return context;
};

export const PrescriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPrescriptions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getPrescriptions(user.uid);
      setPrescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const refreshPrescriptions = async () => {
    await fetchPrescriptions();
  };

  const createPrescription = async (prescriptionData: NewPrescription): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const prescriptionId = await addPrescription(user.uid, prescriptionData);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
      
      return prescriptionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePrescriptionData = async (id: string, prescriptionData: Prescription): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await updatePrescription(user.uid, id, prescriptionData);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePrescription = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await deletePrescription(user.uid, id);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    prescriptions,
    loading,
    error,
    createPrescription,
    updatePrescriptionData,
    removePrescription,
    refreshPrescriptions
  };

  return (
    <PrescriptionContext.Provider value={value}>
      {children}
    </PrescriptionContext.Provider>
  );
}; 