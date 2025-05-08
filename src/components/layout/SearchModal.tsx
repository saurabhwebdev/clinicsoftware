import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  FileText, 
  PlusCircle, 
  ClipboardList, 
  Pill
} from 'lucide-react';
import { usePatients, Patient } from '@/lib/PatientContext';
import { format } from 'date-fns';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onOpenChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { patients } = usePatients();
  const navigate = useNavigate();

  // Reset search when modal is opened
  useEffect(() => {
    if (open) {
      setSearchTerm('');
    }
  }, [open]);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handlePatientSelect = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
    onOpenChange(false);
  };

  const handleCreateNewPatient = () => {
    navigate('/patients/new');
    onOpenChange(false);
  };

  const handleCreateNewAppointment = () => {
    navigate('/appointments/new');
    onOpenChange(false);
  };

  const handleCreateNewMedicalRecord = () => {
    navigate('/medical-records/new');
    onOpenChange(false);
  };

  const handleCreateNewPrescription = () => {
    navigate('/prescriptions/new');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput 
            placeholder="Search patients by name, email, or phone..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {filteredPatients.length > 0 && (
              <CommandGroup heading="Patients">
                {filteredPatients.slice(0, 5).map((patient) => (
                  <CommandItem 
                    key={patient.id} 
                    onSelect={() => handlePatientSelect(patient)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <div>
                        <p>{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.email} • {patient.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{patient.gender}</Badge>
                  </CommandItem>
                ))}
                {filteredPatients.length > 5 && (
                  <CommandItem className="text-sm text-muted-foreground justify-center">
                    + {filteredPatients.length - 5} more results
                  </CommandItem>
                )}
              </CommandGroup>
            )}

            <CommandSeparator />
            
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={handleCreateNewPatient}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>New Patient</span>
              </CommandItem>
              <CommandItem onSelect={handleCreateNewAppointment}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>New Appointment</span>
              </CommandItem>
              <CommandItem onSelect={handleCreateNewMedicalRecord}>
                <FileText className="mr-2 h-4 w-4" />
                <span>New Medical Record</span>
              </CommandItem>
              <CommandItem onSelect={handleCreateNewPrescription}>
                <Pill className="mr-2 h-4 w-4" />
                <span>New Prescription</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal; 