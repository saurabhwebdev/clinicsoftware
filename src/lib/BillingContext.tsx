import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBills, addBill, updateBill, deleteBill } from './services/billingService';
import { useAuth } from './AuthContext';

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Bill {
  id?: string;
  patientId: string;
  patientName: string;
  date: string;
  invoiceNumber: string;
  items: BillItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

interface NewBill extends Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> {}

interface BillingContextType {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  createBill: (bill: NewBill) => Promise<string>;
  updateBillData: (id: string, bill: Bill) => Promise<void>;
  removeBill: (id: string) => Promise<void>;
  refreshBills: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = (): BillingContextType => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBills = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getBills(user.uid);
      setBills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  const refreshBills = async () => {
    await fetchBills();
  };

  const createBill = async (billData: NewBill): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const billId = await addBill(user.uid, billData);
      
      // Refresh bills list
      await fetchBills();
      
      return billId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bill');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBillData = async (id: string, billData: Bill): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await updateBill(user.uid, id, billData);
      
      // Refresh bills list
      await fetchBills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bill');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeBill = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await deleteBill(user.uid, id);
      
      // Refresh bills list
      await fetchBills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bill');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    bills,
    loading,
    error,
    createBill,
    updateBillData,
    removeBill,
    refreshBills
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}; 