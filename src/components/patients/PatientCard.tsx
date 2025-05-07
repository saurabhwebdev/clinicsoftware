
import React from 'react';
import { User, Phone, Mail, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PatientCardProps {
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  image?: string;
  className?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({
  name,
  email,
  phone,
  lastVisit,
  image,
  className,
}) => {
  return (
    <div className={cn("bg-card rounded-lg p-4 shadow-sm border", className)}>
      <div className="flex items-center">
        <Avatar className="h-10 w-10">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.split(' ').map(part => part[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-3 overflow-hidden">
          <h3 className="font-medium text-base truncate">{name}</h3>
          <p className="text-xs text-muted-foreground">Patient ID: P-{Math.floor(10000 + Math.random() * 90000)}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="truncate">{phone}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="truncate">{email}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Last Visit: {lastVisit}</span>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">View Profile</Button>
        <Button variant="default" size="sm" className="flex-1">Schedule</Button>
      </div>
    </div>
  );
};

export default PatientCard;
