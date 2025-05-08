import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clipboard, PlusCircle, Search, Eye, FileEdit, MoreVertical, Trash, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { usePrescriptions, Prescription } from '@/lib/PrescriptionContext';
import { PrescriptionProvider } from '@/lib/PrescriptionContext';
import NewPrescriptionModal from '@/components/prescriptions/NewPrescriptionModal';
import PrescriptionDetail from '@/components/prescriptions/PrescriptionDetail';
import { generatePrescriptionPDF } from '@/lib/utils/pdf';
import { useSettings } from '@/lib/SettingsContext';
import { sendPrescriptionEmail } from '@/lib/services/emailService';
import { usePatients } from '@/lib/PatientContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Email form validation schema
const emailFormSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address'),
  additionalEmails: z.string().optional()
});

// Form submission type
type EmailFormValues = z.infer<typeof emailFormSchema>;

const PrescriptionsContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPrescriptionModalOpen, setIsNewPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [isViewingPrescription, setIsViewingPrescription] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [prescriptionToEmail, setPrescriptionToEmail] = useState<Prescription | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { prescriptions, loading, removePrescription } = usePrescriptions();
  const { patients } = usePatients();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Form for email recipient
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipientEmail: '',
      additionalEmails: ''
    }
  });

  // Reset form with patient email when prescription to email changes
  useEffect(() => {
    if (prescriptionToEmail) {
      // Try to find patient email from patientId
      const patientEmail = getPatientEmail(prescriptionToEmail.patientId);
      emailForm.reset({
        recipientEmail: patientEmail || '', 
        additionalEmails: ''
      });
    }
  }, [prescriptionToEmail, emailForm, patients]);

  // Function to get patient email from patient collection
  const getPatientEmail = (patientId: string): string => {
    // Find the patient with the matching ID in the patients array
    const patient = patients.find(p => p.id === patientId);
    
    // If the patient is found, return their email
    if (patient && patient.email) {
      return patient.email;
    }
    
    // If patient not found or no email, return empty string
    return '';
  };

  // Filter prescriptions by search query
  const filteredPrescriptions = prescriptions.filter(prescription => 
    prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prescription.medications.some(med => med.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNewPrescription = () => {
    setIsNewPrescriptionModalOpen(true);
  };

  const handlePrescriptionCreated = () => {
    setIsNewPrescriptionModalOpen(false);
    toast({
      title: "Success",
      description: "Prescription created successfully",
    });
  };

  const handleViewPrescription = (id: string) => {
    setSelectedPrescriptionId(id);
    setIsViewingPrescription(true);
  };

  const handleClosePrescriptionDetail = () => {
    setSelectedPrescriptionId(null);
    setIsViewingPrescription(false);
  };

  const handleDeletePrescription = async () => {
    if (!prescriptionToDelete) return;
    
    try {
      await removePrescription(prescriptionToDelete);
      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    } finally {
      setPrescriptionToDelete(null);
    }
  };

  const handleExportPDF = async (prescription: Prescription) => {
    try {
      await generatePrescriptionPDF(prescription, settings);
      toast({
        title: "Success",
        description: "Prescription PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleEmailPrescription = (prescription: Prescription) => {
    // First check if email is configured
    if (!settings.email.enabled || !settings.email.username || !settings.email.googleClientId) {
      toast({
        title: "Email Not Configured",
        description: "Please configure your email settings first",
        variant: "destructive",
      });
      return;
    }

    setPrescriptionToEmail(prescription);
    setIsEmailDialogOpen(true);
  };

  const onSendEmail = async (data: EmailFormValues) => {
    if (!prescriptionToEmail) return;
    
    setIsSendingEmail(true);
    
    try {
      // Get the auth token from localStorage
      const storedToken = localStorage.getItem('googleAuthToken');
      if (!storedToken) {
        throw new Error('You need to authorize with Google in the Email Settings section first');
      }
      
      const parsedToken = JSON.parse(storedToken);
      
      // Check if token is expired
      if (parsedToken.expiresAt <= Date.now()) {
        throw new Error('Your Google authorization has expired. Please reauthorize in Email Settings');
      }
      
      // Process additional emails
      const emails = [data.recipientEmail];
      
      if (data.additionalEmails) {
        // Split by comma and trim whitespace
        const additionalEmailsList = data.additionalEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => email && email.includes('@')); // Basic validation
          
        emails.push(...additionalEmailsList);
      }
      
      // Send to each recipient
      const emailPromises = emails.map(email => 
        sendPrescriptionEmail({
          settings: settings.email,
          prescription: prescriptionToEmail,
          recipientEmail: email,
          authToken: parsedToken.token,
          clinicInfo: settings.clinic,
          doctorInfo: settings.doctor
        })
      );
      
      await Promise.all(emailPromises);
      
      toast({
        title: "Success",
        description: `Prescription sent to ${emails.length > 1 ? 'multiple recipients' : data.recipientEmail}`,
      });
      
      // Close the dialog and reset form
      setIsEmailDialogOpen(false);
      emailForm.reset();
      setPrescriptionToEmail(null);
    } catch (error) {
      console.error('Error sending prescription email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send prescription email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadge = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Prescriptions</h2>
        <Button onClick={handleNewPrescription}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by patient name or medication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No prescriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>{prescription.date}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prescription.patientName}</div>
                        <div className="text-sm text-gray-500">ID: {prescription.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {prescription.medications.map(med => med.name).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPrescription(prescription.id || '')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPDF(prescription)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEmailPrescription(prescription)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send as Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive" 
                            onClick={() => setPrescriptionToDelete(prescription.id || '')}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selectedPrescriptionId && (
        <AlertDialog open={isViewingPrescription} onOpenChange={setIsViewingPrescription}>
          <AlertDialogContent className="sm:max-w-[700px] max-h-[85vh] p-6 overflow-hidden">
            <PrescriptionDetail 
              prescriptionId={selectedPrescriptionId} 
              onClose={handleClosePrescriptionDetail}
            />
          </AlertDialogContent>
        </AlertDialog>
      )}

      <NewPrescriptionModal 
        isOpen={isNewPrescriptionModalOpen} 
        onClose={() => setIsNewPrescriptionModalOpen(false)}
        onPrescriptionCreated={handlePrescriptionCreated}
      />

      <AlertDialog open={!!prescriptionToDelete} onOpenChange={(open) => !open && setPrescriptionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this prescription and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={handleDeletePrescription}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Prescription Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
        setIsEmailDialogOpen(open);
        if (!open) {
          setPrescriptionToEmail(null);
          emailForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Prescription via Email</DialogTitle>
            <DialogDescription>
              The patient's email is pre-filled. You can modify it or add additional recipients.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="patient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="additionalEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Recipients (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Add any additional email addresses separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSendingEmail}>
                  {isSendingEmail ? "Sending..." : "Send Prescription"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PrescriptionsPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <PrescriptionProvider>
          <PrescriptionsContent />
        </PrescriptionProvider>
      </div>
    </MainLayout>
  );
};

export default PrescriptionsPage; 