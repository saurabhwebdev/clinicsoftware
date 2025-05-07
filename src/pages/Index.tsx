import React, { useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import PatientCard from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { Calendar, Users, ClipboardCheck, DollarSign, Plus, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/lib/SettingsContext';
import { usePatients } from '@/lib/PatientContext';
import { useAppointments } from '@/lib/AppointmentsContext';
import { useBilling } from '@/lib/BillingContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isValid } from 'date-fns';

// Helper to safely format a date string
const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return 'N/A';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Invalid date:', dateString, error);
    return 'N/A';
  }
};

const Index = () => {
  const { settings } = useSettings();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { bills } = useBilling();
  const navigate = useNavigate();

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    const paidBills = bills.filter(bill => bill.status === 'paid');
    return paidBills.reduce((total, bill) => total + bill.total, 0);
  }, [bills]);

  // Format currency based on settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.location.currency || 'USD',
    }).format(amount);
  };

  // Get today's appointments
  const todaysAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appointment => appointment.date === today);
  }, [appointments]);

  // Group appointments by status
  const appointmentsByStatus = useMemo(() => {
    const upcoming = todaysAppointments.filter(a => a.status === 'scheduled' || a.status === 'in-progress');
    const completed = todaysAppointments.filter(a => a.status === 'completed');
    const cancelled = todaysAppointments.filter(a => a.status === 'cancelled');
    
    return { upcoming, completed, cancelled };
  }, [todaysAppointments]);

  // Get recent patients
  const recentPatients = useMemo(() => {
    // Sort patients by most recent updates
    return [...patients]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3); // Get top 3 most recent patients
  }, [patients]);

  // Safe string for today's date
  const todayFormatted = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting today\'s date:', error);
      return 'Today';
    }
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {settings.doctor.name}</p>
          </div>
          <div className="flex space-x-2">
            <Button className="hidden md:flex" onClick={() => navigate('/appointments')}>
              <Plus className="mr-1 h-4 w-4" /> New Appointment
            </Button>
            <Button variant="outline" onClick={() => navigate('/reports')}>View Reports</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Appointments" 
            value={appointments.length}
            icon={Calendar}
            trend={{ value: 8, positive: true }}
            className="border-l-4 border-l-clinic-primary"
          />
          <StatCard 
            title="Total Patients" 
            value={patients.length}
            icon={Users}
            trend={{ value: 5, positive: true }}
            className="border-l-4 border-l-clinic-secondary"
          />
          <StatCard 
            title="Medical Records" 
            value={patients.length > 0 ? patients.length * 2 : 0} // Estimated records based on patients
            icon={ClipboardCheck}
            trend={{ value: 3, positive: true }}
            className="border-l-4 border-l-clinic-accent"
          />
          <StatCard 
            title="Revenue" 
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            trend={{ value: 7, positive: true }}
            className="border-l-4 border-l-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today's Appointments</h2>
              <Button 
                variant="ghost" 
                className="text-sm text-primary flex items-center"
                onClick={() => navigate('/appointments')}
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-3">
                {appointmentsByStatus.upcoming.length > 0 ? (
                  appointmentsByStatus.upcoming.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      patient={appointment.patientName}
                      time={appointment.time}
                      date={`Today, ${todayFormatted}`}
                      purpose={appointment.purpose}
                      status={appointment.status}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-6">No upcoming appointments for today</p>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-3">
                {appointmentsByStatus.completed.length > 0 ? (
                  appointmentsByStatus.completed.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      patient={appointment.patientName}
                      time={appointment.time}
                      date={`Today, ${todayFormatted}`}
                      purpose={appointment.purpose}
                      status={appointment.status}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-6">No completed appointments for today</p>
                )}
              </TabsContent>
              
              <TabsContent value="cancelled" className="space-y-3">
                {appointmentsByStatus.cancelled.length > 0 ? (
                  appointmentsByStatus.cancelled.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      patient={appointment.patientName}
                      time={appointment.time}
                      date={`Today, ${todayFormatted}`}
                      purpose={appointment.purpose}
                      status={appointment.status}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-6">No cancelled appointments for today</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Patients</h2>
              <Button 
                variant="ghost" 
                className="text-sm text-primary flex items-center"
                onClick={() => navigate('/patients')}
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentPatients.length > 0 ? (
                recentPatients.map(patient => (
                  <PatientCard 
                    key={patient.id}
                    name={patient.name}
                    email={patient.email}
                    phone={patient.phone}
                    lastVisit={safeFormatDate(patient.updatedAt)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">No patients found</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Clinic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">{settings.clinic.name}</h3>
              <p className="text-sm text-muted-foreground">{settings.clinic.address}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.clinic.phone} | {settings.clinic.email}
              </p>
              {settings.clinic.website && (
                <p className="text-sm text-muted-foreground mt-1">{settings.clinic.website}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Working Hours</h3>
              <p className="text-sm text-muted-foreground">
                {settings.timing.workingDays.join(', ')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.timing.workingHours.start} - {settings.timing.workingHours.end}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Break: {settings.timing.breakTime.start} - {settings.timing.breakTime.end}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
