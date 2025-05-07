import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, PlusCircle, Trash, Building, User, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePrescriptions, Medication } from '@/lib/PrescriptionContext';
import { usePatients } from '@/lib/PatientContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/ui/use-toast';

interface NewPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionCreated: () => void;
}

const prescriptionFormSchema = z.object({
  patientId: z.string({ required_error: 'Please select a patient' }),
  date: z.date({ required_error: 'Please select a date' }),
  doctor: z.string().min(1, 'Doctor name is required'),
  medications: z.array(
    z.object({
      name: z.string().min(1, 'Medication name is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
      instructions: z.string().optional(),
    })
  ).min(1, 'At least one medication is required'),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const NewPrescriptionModal: React.FC<NewPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onPrescriptionCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPrescription } = usePrescriptions();
  const { patients } = usePatients();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const defaultValues: Partial<PrescriptionFormValues> = {
    date: new Date(),
    doctor: settings.doctor.name || '',
    medications: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ],
    status: 'active',
  };

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues,
  });

  // Update the doctor name when settings change
  useEffect(() => {
    if (settings.doctor.name) {
      form.setValue('doctor', settings.doctor.name);
    }
  }, [settings.doctor.name, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medications',
  });

  const onSubmit = async (data: PrescriptionFormValues) => {
    setIsSubmitting(true);
    try {
      // Find the selected patient to get the name
      const patient = patients.find(p => p.id === data.patientId);
      
      if (!patient) {
        toast({
          title: 'Error',
          description: 'Selected patient not found',
          variant: 'destructive',
        });
        return;
      }

      await createPrescription({
        patientId: data.patientId,
        patientName: patient.name,
        date: data.date.toISOString(),
        doctor: data.doctor || '',
        medications: data.medications as Medication[],
        notes: data.notes || '',
        status: data.status,
      });

      onPrescriptionCreated();
      form.reset(defaultValues);
    } catch (error) {
      console.error('Failed to create prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prescription',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMedication = () => {
    append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  };

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  // Find the current patient for display
  const currentPatient = selectedPatient 
    ? patients.find(p => p.id === selectedPatient) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center">
            <ClipboardList className="mr-2 h-6 w-6" />
            Create New Prescription
          </DialogTitle>
          <DialogDescription>
            Create a prescription for a patient with medication details.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 pb-0 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Clinic Information Section */}
              <Card className="border-muted">
                <CardHeader className="py-4">
                  <CardTitle className="text-md flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Clinic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="font-semibold text-sm">{settings.clinic.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{settings.clinic.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email: {settings.clinic.email}</p>
                      <p className="text-xs text-muted-foreground">Phone: {settings.clinic.phone}</p>
                    </div>
                    <div className="text-right">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
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
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient and Doctor Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <Card className="border-muted">
                  <CardHeader className="py-4">
                    <CardTitle className="text-md flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Patient</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePatientChange(value);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id || ''}>
                                  {patient.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentPatient && (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{currentPatient.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{currentPatient.phone}</span>
                        </div>
                        {currentPatient.dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date of Birth:</span>
                            <span>{format(new Date(currentPatient.dateOfBirth), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Doctor Information */}
                <Card className="border-muted">
                  <CardHeader className="py-4">
                    <CardTitle className="text-md flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Doctor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <FormField
                      control={form.control}
                      name="doctor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor's Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {settings.doctor && (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Specialization:</span>
                          <span>{settings.doctor.specialization}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{settings.doctor.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{settings.doctor.phone}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Medications Section */}
              <Card>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Medications
                    </CardTitle>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addMedication}
                      className="h-8"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Add Medication
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium">Medication #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`medications.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medication Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Paracetamol" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medications.${index}.dosage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dosage</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 500mg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medications.${index}.frequency`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 3 times a day" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medications.${index}.duration`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 7 days" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medications.${index}.instructions`}
                          render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                              <FormLabel>Instructions (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Take after meals with water" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border-muted">
                <CardHeader className="py-4">
                  <CardTitle className="text-md">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any additional notes about the prescription"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="h-4"></div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? 'Creating...' : 'Create Prescription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPrescriptionModal; 