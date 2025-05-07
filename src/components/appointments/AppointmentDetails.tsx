import React, { useState } from 'react';
import { useAppointments } from '@/lib/AppointmentsContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, FileText, User, Tag } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AppointmentDetailsProps {
  appointmentId: string;
  onClose: () => void;
}

const statusStyles = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "in-progress": "bg-amber-100 text-amber-800",
};

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointmentId, onClose }) => {
  const { getAppointmentById, updateAppointmentStatus, removeAppointment } = useAppointments();
  const appointment = getAppointmentById(appointmentId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!appointment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const handleStatusChange = async (status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress') => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      toast({
        title: "Status updated",
        description: `Appointment status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await removeAppointment(appointmentId);
      toast({
        title: "Appointment deleted",
        description: "The appointment has been successfully deleted",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await updateAppointmentStatus(appointmentId, appointment.status);
      toast({
        title: "Notes saved",
        description: "Appointment notes have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{appointment.patientName}</h3>
        <Badge className={cn("font-normal", statusStyles[appointment.status])}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace("-", " ")}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.date}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.time} ({appointment.duration} minutes)</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.purpose}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notes
        </label>
        <Textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Add notes about this appointment"
          className="min-h-[100px]"
        />
        <Button 
          onClick={handleSaveNotes} 
          size="sm" 
          disabled={isSaving}
          className="mt-2"
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Change Status</h4>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <Button
              key={option.value}
              variant={appointment.status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          Delete Appointment
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppointmentDetails; 