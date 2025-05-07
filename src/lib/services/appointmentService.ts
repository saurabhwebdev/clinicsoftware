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
import { Appointment } from '../AppointmentsContext';

// Collection name in Firebase
const APPOINTMENTS_COLLECTION = 'appointments';

/**
 * Get all appointments for a user
 * @param userId The user ID
 * @returns Array of appointment data
 */
export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const userAppointmentsCollection = collection(db, 'users', userId, APPOINTMENTS_COLLECTION);
    const q = query(userAppointmentsCollection, orderBy('date', 'asc'), orderBy('time', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};

/**
 * Get a specific appointment by ID
 * @param userId The user ID
 * @param appointmentId The appointment ID
 * @returns Appointment data or null if not found
 */
export const getAppointmentById = async (userId: string, appointmentId: string): Promise<Appointment | null> => {
  try {
    const appointmentRef = doc(db, 'users', userId, APPOINTMENTS_COLLECTION, appointmentId);
    const docSnap = await getDoc(appointmentRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Appointment;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
};

/**
 * Add a new appointment
 * @param userId The user ID
 * @param data The appointment data
 * @returns The new appointment ID
 */
export const addAppointment = async (userId: string, data: Omit<Appointment, 'id'>): Promise<string> => {
  try {
    const userAppointmentsCollection = collection(db, 'users', userId, APPOINTMENTS_COLLECTION);
    const docRef = await addDoc(userAppointmentsCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

/**
 * Update an appointment
 * @param userId The user ID
 * @param appointmentId The appointment ID
 * @param data The updated data (partial)
 */
export const updateAppointment = async (
  userId: string, 
  appointmentId: string, 
  data: Partial<Appointment>
): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'users', userId, APPOINTMENTS_COLLECTION, appointmentId);
    await updateDoc(appointmentRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * Delete an appointment
 * @param userId The user ID
 * @param appointmentId The appointment ID
 */
export const deleteAppointment = async (userId: string, appointmentId: string): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'users', userId, APPOINTMENTS_COLLECTION, appointmentId);
    await deleteDoc(appointmentRef);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
}; 