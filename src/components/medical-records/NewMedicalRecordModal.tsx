import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useMedicalRecords } from '@/lib/MedicalRecordsContext';
import { usePatients } from '@/lib/PatientContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface NewMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
}

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Patient is required' }),
  date: z.date({ required_error: 'Date is required' }),
  diagnosis: z.string().min(2, { message: 'Diagnosis is required' }),
  treatment: z.string().min(2, { message: 'Treatment is required' }),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

const NewMedicalRecordModal: React.FC<NewMedicalRecordModalProps> = ({
  isOpen,
  onClose,
  onRecordCreated,
}) => {
  const { createMedicalRecord } = useMedicalRecords();
  const { patients } = usePatients();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      date: new Date(),
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: '',
    },
  });

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptomToRemove: string) => {
    setSymptoms(symptoms.filter(s => s !== symptomToRemove));
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Find the selected patient to get their name
      const selectedPatient = patients.find(patient => patient.id === data.patientId);
      
      if (!selectedPatient) {
        throw new Error('Selected patient not found');
      }

      await createMedicalRecord({
        patientId: data.patientId,
        patientName: selectedPatient.name,
        date: format(data.date, 'yyyy-MM-dd'),
        diagnosis: data.diagnosis,
        symptoms,
        treatment: data.treatment,
        prescription: data.prescription,
        notes: data.notes,
      });

      onRecordCreated();
      form.reset();
      setSymptoms([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create medical record',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] h-[85vh] md:h-auto md:max-h-[90vh] overflow-y-auto p-6 gap-4">
        <DialogHeader className="mb-4">
          <DialogTitle>Create Medical Record</DialogTitle>
          <DialogDescription>
            Add a new medical record for a patient.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Patient Selection */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel className="text-sm font-medium">Patient</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? patients.find((patient) => patient.id === field.value)?.name
                              : "Search patients..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search patient by name or ID..." 
                            className="h-9"
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>No patients found.</CommandEmpty>
                            <CommandGroup>
                              {patients
                                .filter(patient => 
                                  patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (patient.id && patient.id.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .map((patient) => (
                                  <CommandItem
                                    key={patient.id}
                                    value={patient.id}
                                    onSelect={() => {
                                      form.setValue("patientId", patient.id || '');
                                      setOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span>{patient.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {patient.id}
                                      </span>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        patient.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Diagnosis */}
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Diagnosis</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter diagnosis" 
                        className="h-10"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Symptoms */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">Symptoms</FormLabel>
                <div className="flex">
                  <Input
                    className="h-10 flex-1 mr-2"
                    placeholder="Add symptom"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSymptom();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={addSymptom}
                    disabled={!symptomInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {symptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 px-2 py-1">
                        {symptom}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeSymptom(symptom)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Treatment */}
              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Treatment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the treatment details"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prescription */}
              <FormField
                control={form.control}
                name="prescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Prescription (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter prescription details"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 mt-2">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMedicalRecordModal; 