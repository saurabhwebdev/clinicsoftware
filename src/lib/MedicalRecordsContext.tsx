import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMedicalRecords, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord } from './services/medicalRecordService';
import { useAuth } from './AuthContext';

export interface MedicalRecord {
  id?: string;
  patientId: string;
  patientName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescription?: string;
  notes?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface NewMedicalRecord extends Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'> {}

interface MedicalRecordsContextType {
  medicalRecords: MedicalRecord[];
  loading: boolean;
  error: string | null;
  createMedicalRecord: (record: NewMedicalRecord) => Promise<void>;
  updateMedicalRecordData: (id: string, record: MedicalRecord) => Promise<void>;
  removeMedicalRecord: (id: string) => Promise<void>;
  refreshMedicalRecords: () => Promise<void>;
}

const MedicalRecordsContext = createContext<MedicalRecordsContextType | undefined>(undefined);

export const useMedicalRecords = (): MedicalRecordsContextType => {
  const context = useContext(MedicalRecordsContext);
  if (!context) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  return context;
};

export const MedicalRecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMedicalRecords = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getMedicalRecords(user.uid);
      setMedicalRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical records');
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, [user]);

  const refreshMedicalRecords = async () => {
    await fetchMedicalRecords();
  };

  const createMedicalRecord = async (recordData: NewMedicalRecord): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await addMedicalRecord(user.uid, recordData);
      
      // Refresh records list
      await fetchMedicalRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add medical record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMedicalRecordData = async (id: string, recordData: MedicalRecord): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await updateMedicalRecord(user.uid, id, recordData);
      
      // Refresh records list
      await fetchMedicalRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medical record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMedicalRecord = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await deleteMedicalRecord(user.uid, id);
      
      // Refresh records list
      await fetchMedicalRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medical record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    medicalRecords,
    loading,
    error,
    createMedicalRecord,
    updateMedicalRecordData,
    removeMedicalRecord,
    refreshMedicalRecords
  };

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
}; 