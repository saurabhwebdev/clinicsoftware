import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePatients, Patient } from '@/lib/PatientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, Calendar, ClipboardCheck, Pill } from 'lucide-react';
import PatientForm from '@/components/patients/PatientForm';
import { useToast } from '@/components/ui/use-toast';

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, loading, updatePatientData } = usePatients();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && patients.length > 0 && id) {
      const foundPatient = patients.find(p => p.id === id);
      setPatient(foundPatient || null);
    }
  }, [id, patients, loading]);

  const handleUpdatePatient = async (data: Patient) => {
    try {
      if (!data.id) throw new Error('Patient ID is required');
      
      await updatePatientData(data.id, data);
      setPatient(data);
      
      toast({
        title: 'Success',
        description: 'Patient updated successfully',
        variant: 'default'
      });
      
      setIsEditingPatient(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update patient',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  if (!patient) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </div>
          <div className="text-center p-8 border rounded-lg bg-card">
            <h3 className="text-lg font-medium">Patient not found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The patient you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-4" onClick={() => navigate('/patients')}>
              Return to Patients List
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              <p className="text-muted-foreground">
                Patient ID: #{patient.id?.substring(0, 8) || 'Not assigned'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingPatient(true)}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
            <Button variant="default" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Patient Info</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Patient ID</div>
                    <div>#{patient.id?.substring(0, 8) || 'Not assigned'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                    <div>{patient.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                    <div>{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMMM d, yyyy') : 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <div>
                      <Badge variant="outline">{patient.gender}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Blood Group</div>
                    <div>
                      {patient.bloodGroup ? (
                        <Badge variant={patient.bloodGroup.includes('+') ? 'default' : 'destructive'}>
                          {patient.bloodGroup}
                        </Badge>
                      ) : 'Not provided'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{patient.email}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{patient.phone}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Address</div>
                    <div>{patient.address}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Allergies</div>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline">{allergy}</Badge>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No allergies recorded</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Medical History</div>
                  <div className="text-sm">
                    {patient.medicalHistory ? (
                      <p className="whitespace-pre-line">{patient.medicalHistory}</p>
                    ) : (
                      <div className="text-muted-foreground">No medical history recorded</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appointments">
            <Card className="border rounded-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium">No appointments found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This patient doesn't have any appointments scheduled.
                  </p>
                  <Button className="mt-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="records">
            <Card className="border rounded-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium">No medical records found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This patient doesn't have any medical records yet.
                  </p>
                  <Button className="mt-4">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Add Medical Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prescriptions">
            <Card className="border rounded-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Pill className="h-4 w-4 mr-2" />
                  Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium">No prescriptions found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This patient doesn't have any prescriptions yet.
                  </p>
                  <Button className="mt-4">
                    <Pill className="h-4 w-4 mr-2" />
                    Create Prescription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {isEditingPatient && (
        <PatientForm 
          patient={patient}
          open={isEditingPatient}
          onClose={() => setIsEditingPatient(false)}
          onSubmit={handleUpdatePatient}
          title="Edit Patient"
        />
      )}
    </MainLayout>
  );
};

export default PatientDetails; 