import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings } from './services/settingsService';
import { useAuth } from './AuthContext';

// Define the settings types
export interface ClinicSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  website?: string;
}

export interface TimingSettings {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  appointmentDuration: number; // in minutes
  breakTime: {
    start: string;
    end: string;
  };
}

export interface DoctorSettings {
  name: string;
  specialization: string;
  email: string;
  phone: string;
  bio?: string;
  profilePicture?: string;
  qualifications?: string[];
}

export interface LocationSettings {
  currency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
}

export interface EmailSettings {
  enabled: boolean;
  service: string;
  username: string;
  fromName: string;
  fromEmail: string;
}

export interface Settings {
  clinic: ClinicSettings;
  timing: TimingSettings;
  doctor: DoctorSettings;
  location: LocationSettings;
  email: EmailSettings;
}

// Default settings
const defaultSettings: Settings = {
  clinic: {
    name: 'ClinicFlow Center',
    email: 'info@clinicflow.com',
    phone: '+1 (555) 123-4567',
    address: '123 Medical Center Blvd, Suite 100, Health City, HC 12345',
    logo: '',
    website: 'https://clinicflow.com'
  },
  timing: {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    appointmentDuration: 30,
    breakTime: {
      start: '13:00',
      end: '14:00'
    }
  },
  doctor: {
    name: 'Dr. Alex Johnson',
    specialization: 'General Practitioner',
    email: 'doctor@clinicflow.com',
    phone: '+1 (555) 987-6543',
    bio: 'Experienced general practitioner with over 10 years of practice.',
    profilePicture: '',
    qualifications: ['MD', 'MBBS']
  },
  location: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'UTC',
    language: 'English'
  },
  email: {
    enabled: false,
    service: 'gmail',
    username: '',
    fromName: 'ClinicFlow Center',
    fromEmail: 'notifications@clinicflow.com'
  }
};

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateClinicSettings: (data: ClinicSettings) => Promise<void>;
  updateTimingSettings: (data: TimingSettings) => Promise<void>;
  updateDoctorSettings: (data: DoctorSettings) => Promise<void>;
  updateLocationSettings: (data: LocationSettings) => Promise<void>;
  updateEmailSettings: (data: EmailSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await getSettings(user.uid);
        if (data) {
          // Merge with default settings to ensure all fields exist
          const mergedSettings: Settings = {
            clinic: { ...defaultSettings.clinic, ...data.clinic },
            timing: { ...defaultSettings.timing, ...data.timing },
            doctor: { ...defaultSettings.doctor, ...data.doctor },
            location: { ...defaultSettings.location, ...data.location },
            email: { ...defaultSettings.email, ...data.email }
          };
          setSettings(mergedSettings);
        } else {
          // If no settings exist, store the default settings
          await updateSettings(user.uid, defaultSettings);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateClinicSettings = async (clinicData: ClinicSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, clinic: clinicData };
      await updateSettings(user.uid, updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clinic settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTimingSettings = async (timingData: TimingSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, timing: timingData };
      await updateSettings(user.uid, updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timing settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDoctorSettings = async (doctorData: DoctorSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, doctor: doctorData };
      await updateSettings(user.uid, updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update doctor settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLocationSettings = async (locationData: LocationSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, location: locationData };
      await updateSettings(user.uid, updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmailSettings = async (emailData: EmailSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, email: emailData };
      await updateSettings(user.uid, updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateSettings(user.uid, defaultSettings);
      setSettings(defaultSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    settings,
    loading,
    error,
    updateClinicSettings,
    updateTimingSettings,
    updateDoctorSettings,
    updateLocationSettings,
    updateEmailSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 