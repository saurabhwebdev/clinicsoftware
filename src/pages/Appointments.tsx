import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarCheck, List, PlusCircle, Clock } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';
import { useAppointments } from '@/lib/AppointmentsContext';
import AppointmentList from '@/components/appointments/AppointmentList';
import NewAppointmentModal from '@/components/appointments/NewAppointmentModal';
import AppointmentDetails from '@/components/appointments/AppointmentDetails';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const Appointments = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const { settings } = useSettings();
  const { appointments, loading } = useAppointments();
  const { toast } = useToast();

  const filteredAppointments = appointments.filter(appointment => {
    if (!date) return false;
    const appointmentDate = new Date(appointment.date);
    return (
      appointmentDate.getDate() === date.getDate() &&
      appointmentDate.getMonth() === date.getMonth() &&
      appointmentDate.getFullYear() === date.getFullYear()
    );
  });

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

  const handleSelectAppointment = (id: string) => {
    setSelectedAppointmentId(id);
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                <span>Calendar</span>
              </CardTitle>
              <CardDescription>Select a date to view appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full"
              />
              
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Working Hours</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {settings.timing.workingHours.start} - {settings.timing.workingHours.end}
                </p>
                
                <h3 className="text-sm font-medium mt-3">Break Time</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.timing.breakTime.start} - {settings.timing.breakTime.end}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list">
                <TabsList className="mb-4">
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span>List View</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedAppointmentId}>
                    <CalendarCheck className="h-4 w-4" />
                    <span>Details</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="list">
                  <AppointmentList 
                    appointments={filteredAppointments} 
                    onSelectAppointment={handleSelectAppointment}
                    loading={loading}
                  />
                </TabsContent>
                
                <TabsContent value="details">
                  {selectedAppointmentId ? (
                    <AppointmentDetails 
                      appointmentId={selectedAppointmentId} 
                      onClose={() => setSelectedAppointmentId(null)}
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Select an appointment to view details
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewAppointmentModal 
        isOpen={isNewAppointmentModalOpen} 
        onClose={() => setIsNewAppointmentModalOpen(false)}
        onAppointmentCreated={handleAppointmentCreated}
        selectedDate={date}
      />
    </MainLayout>
  );
};

export default Appointments; 