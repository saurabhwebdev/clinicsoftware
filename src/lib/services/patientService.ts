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
import { Patient } from '../PatientContext';

// Collection name in Firebase
const PATIENTS_COLLECTION = 'patients';

/**
 * Get all patients for a user
 * @param userId The user ID
 * @returns Array of patient data
 */
export const getPatients = async (userId: string): Promise<Patient[]> => {
  try {
    const patientsRef = collection(db, 'users', userId, PATIENTS_COLLECTION);
    const q = query(patientsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      patients.push({
        id: doc.id,
        ...doc.data() as Patient
      });
    });
    
    return patients;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

/**
 * Get a single patient by ID
 * @param userId The user ID
 * @param patientId The patient ID
 * @returns Patient data or null if not found
 */
export const getPatientById = async (userId: string, patientId: string): Promise<Patient | null> => {
  try {
    const docRef = doc(db, 'users', userId, PATIENTS_COLLECTION, patientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as Patient
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

/**
 * Add a new patient
 * @param userId The user ID
 * @param data The patient data
 * @returns The ID of the created patient
 */
export const addPatient = async (userId: string, data: Patient): Promise<string> => {
  try {
    const patientsRef = collection(db, 'users', userId, PATIENTS_COLLECTION);
    const docRef = await addDoc(patientsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

/**
 * Update a patient
 * @param userId The user ID
 * @param patientId The patient ID
 * @param data The patient data to update
 */
export const updatePatient = async (userId: string, patientId: string, data: Patient): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, PATIENTS_COLLECTION, patientId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Delete a patient
 * @param userId The user ID
 * @param patientId The patient ID
 */
export const deletePatient = async (userId: string, patientId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, PATIENTS_COLLECTION, patientId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}; 