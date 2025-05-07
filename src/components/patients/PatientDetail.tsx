import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Patient } from '@/lib/PatientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { FileEdit, AlertTriangle } from 'lucide-react';

interface PatientDetailProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ 
  patient, 
  open, 
  onClose, 
  onEdit 
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
          <DialogDescription>
            View detailed information about {patient.name}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Patient Info</TabsTrigger>
            <TabsTrigger value="reports">Medical Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-6">
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
              
              <Card>
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
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="flex items-center justify-center py-12 px-4 border rounded-lg bg-muted/30">
              <div className="text-center space-y-3">
                <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">Medical Reports Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We're currently working on this feature. You'll soon be able to add and manage detailed medical reports for this patient.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>
            <FileEdit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetail; 