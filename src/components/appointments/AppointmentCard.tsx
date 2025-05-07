
import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AppointmentProps {
  patient: string;
  time: string;
  date: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  className?: string;
}

const statusStyles = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "in-progress": "bg-amber-100 text-amber-800",
};

const AppointmentCard: React.FC<AppointmentProps> = ({
  patient,
  time,
  date,
  purpose,
  status,
  className,
}) => {
  return (
    <div className={cn("bg-card rounded-lg p-4 shadow-sm border", className)}>
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-base">{patient}</h3>
        <Badge className={cn("font-normal", statusStyles[status])}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{purpose}</p>
      
      <div className="mt-3 flex flex-col space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{date}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          <span>{time}</span>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">Reschedule</Button>
        <Button variant="default" size="sm" className="flex-1">View Details</Button>
      </div>
    </div>
  );
};

export default AppointmentCard;
