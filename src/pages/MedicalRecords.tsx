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
import { FileText, PlusCircle, Search, Eye, FileEdit, MoreVertical, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useMedicalRecords } from '@/lib/MedicalRecordsContext';
import { usePatients } from '@/lib/PatientContext';
import MedicalRecordDetail from '@/components/medical-records/MedicalRecordDetail';
import NewMedicalRecordModal from '@/components/medical-records/NewMedicalRecordModal';

const MedicalRecords = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isViewingRecord, setIsViewingRecord] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const { medicalRecords, loading, removeMedicalRecord } = useMedicalRecords();
  const { toast } = useToast();

  // Filter records by search query
  const filteredRecords = medicalRecords.filter(record => 
    record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.symptoms && record.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleNewRecord = () => {
    setIsNewRecordModalOpen(true);
  };

  const handleRecordCreated = () => {
    setIsNewRecordModalOpen(false);
    toast({
      title: "Success",
      description: "Medical record created successfully",
    });
  };

  const handleViewRecord = (id: string) => {
    setSelectedRecordId(id);
    setIsViewingRecord(true);
  };

  const handleCloseRecordDetail = () => {
    setSelectedRecordId(null);
    setIsViewingRecord(false);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      await removeMedicalRecord(recordToDelete);
      toast({
        title: "Success",
        description: "Medical record deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medical record",
        variant: "destructive",
      });
    } finally {
      setRecordToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
            <p className="text-muted-foreground">Manage patient medical records and history</p>
          </div>
          <Button onClick={handleNewRecord} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Record</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                className="pl-8 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-card">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Medical Records</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {medicalRecords.length === 0 
                  ? "You haven't added any medical records yet."
                  : "No records match your search criteria."}
              </p>
              {medicalRecords.length === 0 && (
                <Button className="mt-4" onClick={handleNewRecord}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Medical Record
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Symptoms</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.patientName}</TableCell>
                      <TableCell>{record.diagnosis}</TableCell>
                      <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.symptoms.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {record.symptoms.length} symptom{record.symptoms.length !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.treatment}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRecord(record.id || '')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive" 
                              onClick={() => setRecordToDelete(record.id || '')}
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
      </div>

      {isViewingRecord && selectedRecordId && (
        <AlertDialog open={isViewingRecord} onOpenChange={setIsViewingRecord}>
          <AlertDialogContent className="sm:max-w-[600px]">
            <MedicalRecordDetail 
              recordId={selectedRecordId} 
              onClose={handleCloseRecordDetail}
            />
          </AlertDialogContent>
        </AlertDialog>
      )}

      <NewMedicalRecordModal 
        isOpen={isNewRecordModalOpen} 
        onClose={() => setIsNewRecordModalOpen(false)}
        onRecordCreated={handleRecordCreated}
      />

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medical record and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={handleDeleteRecord}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default MedicalRecords; 