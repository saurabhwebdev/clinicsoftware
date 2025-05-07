import React from 'react';
import { Appointment } from '@/lib/AppointmentsContext';
import AppointmentCard from './AppointmentCard';
import { Skeleton } from '@/components/ui/skeleton';

interface AppointmentListProps {
  appointments: Appointment[];
  onSelectAppointment: (id: string) => void;
  loading?: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ 
  appointments, 
  onSelectAppointment,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 shadow-sm border">
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="mt-4 flex space-x-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No appointments scheduled for this day</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} onClick={() => onSelectAppointment(appointment.id)} className="cursor-pointer">
          <AppointmentCard
            patient={appointment.patientName}
            time={appointment.time}
            date={appointment.date}
            purpose={appointment.purpose}
            status={appointment.status}
          />
        </div>
      ))}
    </div>
  );
};

export default AppointmentList; 