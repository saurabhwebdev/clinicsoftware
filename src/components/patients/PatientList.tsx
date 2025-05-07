import React, { useState } from 'react';
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
import { 
  Eye, 
  FileEdit, 
  MoreVertical, 
  Trash, 
  Search,
  FilePlus,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePatients, Patient } from '@/lib/PatientContext';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface PatientListProps {
  onAddNewClick: () => void;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ 
  onAddNewClick, 
  onViewPatient, 
  onEditPatient
}) => {
  const { patients, loading, removePatient } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!patientToDelete?.id) return;
    
    try {
      await removePatient(patientToDelete.id);
      toast({
        title: 'Success',
        description: 'Patient deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete patient',
        variant: 'destructive'
      });
    } finally {
      setPatientToDelete(null);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-8 w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onAddNewClick}>
            <FilePlus className="h-4 w-4 mr-2" />
            Add New Patient
          </Button>
          <Button size="sm" variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-card">
          <h3 className="text-lg font-medium">No patients found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {patients.length === 0 
              ? "You haven't added any patients yet."
              : "No patients match your search criteria."}
          </p>
          {patients.length === 0 && (
            <Button className="mt-4" onClick={onAddNewClick}>
              <FilePlus className="h-4 w-4 mr-2" />
              Add Your First Patient
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">#{patient.id?.substring(0, 8) || 'N/A'}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>
                    {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {patient.bloodGroup ? (
                      <Badge variant={patient.bloodGroup.includes('+') ? 'default' : 'destructive'}>
                        {patient.bloodGroup}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPatient(patient)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditPatient(patient)}>
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive" 
                          onClick={() => setPatientToDelete(patient)}
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

      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patientToDelete?.name}'s record and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientList; 