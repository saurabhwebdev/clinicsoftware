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
import { MedicalRecord } from '../MedicalRecordsContext';

// Collection name in Firebase
const MEDICAL_RECORDS_COLLECTION = 'medicalRecords';

/**
 * Get all medical records for a user
 * @param userId The user ID
 * @returns Array of medical record data
 */
export const getMedicalRecords = async (userId: string): Promise<MedicalRecord[]> => {
  try {
    const recordsRef = collection(db, 'users', userId, MEDICAL_RECORDS_COLLECTION);
    const q = query(recordsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const records: MedicalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data() as MedicalRecord
      });
    });
    
    return records;
  } catch (error) {
    console.error('Error getting medical records:', error);
    throw error;
  }
};

/**
 * Get a single medical record by ID
 * @param userId The user ID
 * @param recordId The medical record ID
 * @returns Medical record data or null if not found
 */
export const getMedicalRecordById = async (userId: string, recordId: string): Promise<MedicalRecord | null> => {
  try {
    const docRef = doc(db, 'users', userId, MEDICAL_RECORDS_COLLECTION, recordId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as MedicalRecord
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting medical record:', error);
    throw error;
  }
};

/**
 * Add a new medical record
 * @param userId The user ID
 * @param data The medical record data
 * @returns The ID of the created record
 */
export const addMedicalRecord = async (userId: string, data: MedicalRecord): Promise<string> => {
  try {
    const recordsRef = collection(db, 'users', userId, MEDICAL_RECORDS_COLLECTION);
    const docRef = await addDoc(recordsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding medical record:', error);
    throw error;
  }
};

/**
 * Update a medical record
 * @param userId The user ID
 * @param recordId The medical record ID
 * @param data The medical record data to update
 */
export const updateMedicalRecord = async (userId: string, recordId: string, data: MedicalRecord): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, MEDICAL_RECORDS_COLLECTION, recordId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    throw error;
  }
};

/**
 * Delete a medical record
 * @param userId The user ID
 * @param recordId The medical record ID
 */
export const deleteMedicalRecord = async (userId: string, recordId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, MEDICAL_RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting medical record:', error);
    throw error;
  }
}; 