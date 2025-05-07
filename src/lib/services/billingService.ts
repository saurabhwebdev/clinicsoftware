import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Bill } from '../BillingContext';

// Collection name in Firebase
const BILLS_COLLECTION = 'bills';

/**
 * Get all bills for a user
 * @param userId The user ID
 * @returns Array of bill data
 */
export const getBills = async (userId: string): Promise<Bill[]> => {
  try {
    const billsRef = collection(db, 'users', userId, BILLS_COLLECTION);
    const q = query(billsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const bills: Bill[] = [];
    
    querySnapshot.forEach((doc) => {
      bills.push({
        id: doc.id,
        ...doc.data() as Bill
      });
    });
    
    return bills;
  } catch (error) {
    console.error('Error getting bills:', error);
    throw error;
  }
};

/**
 * Get a single bill by ID
 * @param userId The user ID
 * @param billId The bill ID
 * @returns Bill data or null if not found
 */
export const getBillById = async (userId: string, billId: string): Promise<Bill | null> => {
  try {
    const docRef = doc(db, 'users', userId, BILLS_COLLECTION, billId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as Bill
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting bill:', error);
    throw error;
  }
};

/**
 * Add a new bill
 * @param userId The user ID
 * @param data The bill data
 * @returns The ID of the created bill
 */
export const addBill = async (userId: string, data: Bill): Promise<string> => {
  try {
    const billsRef = collection(db, 'users', userId, BILLS_COLLECTION);
    const docRef = await addDoc(billsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding bill:', error);
    throw error;
  }
};

/**
 * Update a bill
 * @param userId The user ID
 * @param billId The bill ID
 * @param data The bill data to update
 */
export const updateBill = async (userId: string, billId: string, data: Bill): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, BILLS_COLLECTION, billId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    throw error;
  }
};

/**
 * Delete a bill
 * @param userId The user ID
 * @param billId The bill ID
 */
export const deleteBill = async (userId: string, billId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, BILLS_COLLECTION, billId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
}; 