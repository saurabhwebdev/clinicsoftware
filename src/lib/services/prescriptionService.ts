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
import { Prescription } from '../PrescriptionContext';

// Collection name in Firebase
const PRESCRIPTIONS_COLLECTION = 'prescriptions';

/**
 * Get all prescriptions for a user
 * @param userId The user ID
 * @returns Array of prescription data
 */
export const getPrescriptions = async (userId: string): Promise<Prescription[]> => {
  try {
    const prescriptionsRef = collection(db, 'users', userId, PRESCRIPTIONS_COLLECTION);
    const q = query(prescriptionsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const prescriptions: Prescription[] = [];
    
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data() as Prescription
      });
    });
    
    return prescriptions;
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    throw error;
  }
};

/**
 * Get a single prescription by ID
 * @param userId The user ID
 * @param prescriptionId The prescription ID
 * @returns Prescription data or null if not found
 */
export const getPrescriptionById = async (userId: string, prescriptionId: string): Promise<Prescription | null> => {
  try {
    const docRef = doc(db, 'users', userId, PRESCRIPTIONS_COLLECTION, prescriptionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as Prescription
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting prescription:', error);
    throw error;
  }
};

/**
 * Add a new prescription
 * @param userId The user ID
 * @param data The prescription data
 * @returns The ID of the created prescription
 */
export const addPrescription = async (userId: string, data: Prescription): Promise<string> => {
  try {
    const prescriptionsRef = collection(db, 'users', userId, PRESCRIPTIONS_COLLECTION);
    const docRef = await addDoc(prescriptionsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding prescription:', error);
    throw error;
  }
};

/**
 * Update a prescription
 * @param userId The user ID
 * @param prescriptionId The prescription ID
 * @param data The prescription data to update
 */
export const updatePrescription = async (userId: string, prescriptionId: string, data: Prescription): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, PRESCRIPTIONS_COLLECTION, prescriptionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
};

/**
 * Delete a prescription
 * @param userId The user ID
 * @param prescriptionId The prescription ID
 */
export const deletePrescription = async (userId: string, prescriptionId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, PRESCRIPTIONS_COLLECTION, prescriptionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting prescription:', error);
    throw error;
  }
}; 