import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PatientList from '@/components/patients/PatientList';
import PatientForm from '@/components/patients/PatientForm';
import PatientDetail from '@/components/patients/PatientDetail';
import { Patient, PatientProvider, usePatients } from '@/lib/PatientContext';
import { useToast } from '@/components/ui/use-toast';

const PatientsContent = () => {
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewingPatient, setIsViewingPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  
  const { addNewPatient, updatePatientData } = usePatients();
  const { toast } = useToast();
  
  const handleAddPatient = async (data: Patient) => {
    try {
      await addNewPatient(data);
      toast({
        title: 'Success',
        description: 'Patient added successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add patient',
        variant: 'destructive'
      });
    }
  };
  
  const handleUpdatePatient = async (data: Patient) => {
    try {
      if (!data.id) throw new Error('Patient ID is required');
      
      await updatePatientData(data.id, data);
      toast({
        title: 'Success',
        description: 'Patient updated successfully',
        variant: 'default'
      });
      
      if (isViewingPatient) {
        setSelectedPatient(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update patient',
        variant: 'destructive'
      });
    }
  };
  
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewingPatient(true);
  };
  
  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditingPatient(true);
    setIsViewingPatient(false);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground">Manage your clinic's patients and their records</p>
      </div>
      
      <PatientList 
        onAddNewClick={() => setIsAddingPatient(true)}
        onViewPatient={handleViewPatient} 
        onEditPatient={handleEditPatient}
      />
      
      {isAddingPatient && (
        <PatientForm 
          open={isAddingPatient}
          onClose={() => setIsAddingPatient(false)}
          onSubmit={handleAddPatient}
          title="Add New Patient"
        />
      )}
      
      {isEditingPatient && selectedPatient && (
        <PatientForm 
          patient={selectedPatient}
          open={isEditingPatient}
          onClose={() => setIsEditingPatient(false)}
          onSubmit={handleUpdatePatient}
          title="Edit Patient"
        />
      )}
      
      {isViewingPatient && selectedPatient && (
        <PatientDetail 
          patient={selectedPatient}
          open={isViewingPatient}
          onClose={() => setIsViewingPatient(false)}
          onEdit={() => {
            setIsEditingPatient(true);
            setIsViewingPatient(false);
          }}
        />
      )}
    </div>
  );
};

const Patients = () => {
  return (
    <PatientProvider>
      <MainLayout>
        <PatientsContent />
      </MainLayout>
    </PatientProvider>
  );
};

export default Patients; 