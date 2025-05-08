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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Search, Eye, FileEdit, MoreVertical, Trash, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAppointments, Appointment } from '@/lib/AppointmentsContext';
import NewAppointmentModal from '@/components/appointments/NewAppointmentModal';
import AppointmentDetails from '@/components/appointments/AppointmentDetails';

const Appointments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isViewingAppointment, setIsViewingAppointment] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const { appointments, loading, removeAppointment, updateAppointmentStatus } = useAppointments();
  const { toast } = useToast();

  // Filter appointments by search query
  const filteredAppointments = appointments.filter(appointment => 
    appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewAppointment = () => {
    setIsNewAppointmentModalOpen(true);
  };

  const handleAppointmentCreated = () => {
    setIsNewAppointmentModalOpen(false);
    toast({
      title: "Success",
      description: "Appointment scheduled successfully",
    });
  };

  const handleViewAppointment = (id: string) => {
    setSelectedAppointmentId(id);
    setIsViewingAppointment(true);
  };

  const handleCloseAppointmentDetail = () => {
    setSelectedAppointmentId(null);
    setIsViewingAppointment(false);
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await removeAppointment(appointmentToDelete);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    } finally {
      setAppointmentToDelete(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateAppointmentStatus(id, status);
      toast({
        title: "Success",
        description: `Appointment marked as ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const styles = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'in-progress': 'bg-amber-100 text-amber-800',
    };
    
    return (
      <Badge className={styles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manage patient appointments and schedules</p>
          </div>
          <Button onClick={handleNewAppointment} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Appointment</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>All Appointments</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search appointments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No appointments found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.patientName}</TableCell>
                        <TableCell>{formatAppointmentDate(appointment.date)}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{appointment.purpose}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAppointment(appointment.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'in-progress')}>
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Mark In Progress</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'completed')}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Mark Completed</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}>
                                <FileEdit className="mr-2 h-4 w-4" />
                                <span>Mark Cancelled</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setAppointmentToDelete(appointment.id)}
                                className="text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
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
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal 
        isOpen={isNewAppointmentModalOpen} 
        onClose={() => setIsNewAppointmentModalOpen(false)}
        onAppointmentCreated={handleAppointmentCreated}
        selectedDate={new Date()}
      />

      {/* Appointment Details Modal */}
      {selectedAppointmentId && isViewingAppointment && (
        <AppointmentDetails 
          appointmentId={selectedAppointmentId} 
          onClose={handleCloseAppointmentDetail}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={(open) => !open && setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Appointments; 