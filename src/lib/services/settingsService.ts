import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings } from '../SettingsContext';

/**
 * Get settings for a user
 * @param userId The user ID
 * @returns Settings data or null if not found
 */
export const getSettings = async (userId: string): Promise<Settings | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'config');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Settings;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

/**
 * Update settings for a user
 * @param userId The user ID
 * @param data The settings data
 */
export const updateSettings = async (userId: string, data: Settings): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'config');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}; 