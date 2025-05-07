import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useAppointments, NewAppointment } from '@/lib/AppointmentsContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { usePatients } from '@/lib/PatientContext';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
  selectedDate?: Date;
}

// Generate time slots from opening to closing time
const generateTimeSlots = (
  startTime: string,
  endTime: string,
  breakStart: string,
  breakEnd: string,
  duration: number
) => {
  const timeSlots: string[] = [];
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  const breakStartMinutes = parseTime(breakStart);
  const breakEndMinutes = parseTime(breakEnd);

  for (let i = startMinutes; i <= endMinutes - duration; i += duration) {
    // Skip slots during break time
    if (i >= breakStartMinutes && i < breakEndMinutes) {
      continue;
    }

    const hours = Math.floor(i / 60);
    const minutes = i % 60;
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    timeSlots.push(`${formattedHours}:${formattedMinutes}`);
  }

  return timeSlots;
};

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Patient is required' }),
  date: z.date({ required_error: 'Appointment date is required' }),
  time: z.string({ required_error: 'Appointment time is required' }),
  purpose: z.string().min(2, { message: 'Purpose is required' }),
  notes: z.string().optional(),
  duration: z.number().min(10, { message: 'Duration must be at least 10 minutes' }),
});

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentCreated,
  selectedDate,
}) => {
  const { createAppointment } = useAppointments();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { patients } = usePatients();
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      date: selectedDate || new Date(),
      time: '',
      purpose: '',
      notes: '',
      duration: settings.timing.appointmentDuration,
    },
  });

  // Update time slots when date or duration changes
  useEffect(() => {
    const date = form.getValues('date');
    const duration = form.getValues('duration');
    
    if (date) {
      const dayOfWeek = format(date, 'EEEE');
      const isWorkingDay = settings.timing.workingDays.includes(dayOfWeek);
      
      if (isWorkingDay) {
        const slots = generateTimeSlots(
          settings.timing.workingHours.start,
          settings.timing.workingHours.end,
          settings.timing.breakTime.start,
          settings.timing.breakTime.end,
          duration
        );
        setAvailableTimeSlots(slots);
      } else {
        setAvailableTimeSlots([]);
      }
    }
  }, [form.watch('date'), form.watch('duration'), settings.timing]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Find the selected patient to get their name
      const selectedPatient = patients.find(patient => patient.id === data.patientId);
      
      if (!selectedPatient) {
        throw new Error('Selected patient not found');
      }

      const newAppointment: NewAppointment = {
        patientName: selectedPatient.name,
        patientId: data.patientId,
        date: format(data.date, 'yyyy-MM-dd'),
        time: data.time,
        purpose: data.purpose,
        notes: data.notes,
        duration: data.duration,
      };

      await createAppointment(newAppointment);
      onAppointmentCreated();
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create appointment',
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
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new patient appointment.
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

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            disabled={(date) => {
                              const day = format(date, 'EEEE');
                              return !settings.timing.workingDays.includes(day);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={availableTimeSlots.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          {availableTimeSlots.length === 0 ? (
                            <SelectItem value="no-slots" disabled>
                              No available time slots
                            </SelectItem>
                          ) : (
                            availableTimeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Duration (minutes)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purpose */}
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Purpose</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Reason for appointment" 
                        className="h-10"
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
                        placeholder="Any additional information"
                        className="resize-none h-24 min-h-[96px]"
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
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal; 