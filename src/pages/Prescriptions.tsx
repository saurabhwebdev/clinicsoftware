import React, { useState } from 'react';
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
import { Clipboard, PlusCircle, Search, Eye, FileEdit, MoreVertical, Trash, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { usePrescriptions, Prescription } from '@/lib/PrescriptionContext';
import { PrescriptionProvider } from '@/lib/PrescriptionContext';
import NewPrescriptionModal from '@/components/prescriptions/NewPrescriptionModal';
import PrescriptionDetail from '@/components/prescriptions/PrescriptionDetail';
import { generatePrescriptionPDF } from '@/lib/utils/pdf';
import { useSettings } from '@/lib/SettingsContext';

const PrescriptionsContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPrescriptionModalOpen, setIsNewPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [isViewingPrescription, setIsViewingPrescription] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null);
  const { prescriptions, loading, removePrescription } = usePrescriptions();
  const { toast } = useToast();
  const { settings } = useSettings();

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Manage patient prescriptions and medications</p>
        </div>
        <Button onClick={handleNewPrescription} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>New Prescription</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prescriptions..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Clipboard className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No Prescriptions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {prescriptions.length === 0 
                ? "You haven't added any prescriptions yet."
                : "No prescriptions match your search criteria."}
            </p>
            {prescriptions.length === 0 && (
              <Button className="mt-4" onClick={handleNewPrescription}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Prescription
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.patientName}</TableCell>
                    <TableCell>{format(new Date(prescription.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prescription.medications.length > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {prescription.medications.length} medication{prescription.medications.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
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

      {isViewingPrescription && selectedPrescriptionId && (
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
    </div>
  );
};

const Prescriptions = () => {
  return (
    <PrescriptionProvider>
      <MainLayout>
        <PrescriptionsContent />
      </MainLayout>
    </PrescriptionProvider>
  );
};

export default Prescriptions; 