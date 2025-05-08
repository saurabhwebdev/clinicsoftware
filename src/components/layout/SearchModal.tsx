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
  Pill,
  Search
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
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-xl flex items-center">
            <Search className="h-5 w-5 mr-2 text-muted-foreground" />
            Search
          </DialogTitle>
        </DialogHeader>
        <Command className="rounded-t-none border-t">
          <CommandInput 
            placeholder="Search patients by name, email, or phone..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-none focus:ring-0"
          />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty className="py-6">
              <div className="flex flex-col items-center text-center p-4">
                <Search className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching with a different term
                </p>
              </div>
            </CommandEmpty>
            
            {filteredPatients.length > 0 && (
              <CommandGroup heading="Patients" className="px-2">
                {filteredPatients.slice(0, 5).map((patient) => (
                  <CommandItem 
                    key={patient.id} 
                    onSelect={() => handlePatientSelect(patient)}
                    className="flex items-center justify-between rounded-md p-2 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.email} • {patient.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">{patient.gender}</Badge>
                  </CommandItem>
                ))}
                {filteredPatients.length > 5 && (
                  <CommandItem className="text-sm text-center text-muted-foreground justify-center py-2 italic">
                    + {filteredPatients.length - 5} more results
                  </CommandItem>
                )}
              </CommandGroup>
            )}

            <CommandSeparator className="my-1" />
            
            <CommandGroup heading="Quick Actions" className="px-2">
              <CommandItem 
                onSelect={handleCreateNewPatient}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-green-100 flex items-center justify-center">
                  <PlusCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">New Patient</span>
              </CommandItem>
              <CommandItem 
                onSelect={handleCreateNewAppointment}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">New Appointment</span>
              </CommandItem>
              <CommandItem 
                onSelect={handleCreateNewMedicalRecord}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-medium">New Medical Record</span>
              </CommandItem>
              <CommandItem 
                onSelect={handleCreateNewPrescription}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-purple-100 flex items-center justify-center">
                  <Pill className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium">New Prescription</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal; 