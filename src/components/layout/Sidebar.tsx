import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  ClipboardCheck, 
  Pill, 
  FileText, 
  Settings, 
  BarChart,
  PlusCircle,
  UserPlus,
  Receipt,
  Clock,
  DollarSign,
  Activity,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppointments } from '@/lib/AppointmentsContext';
import { usePatients } from '@/lib/PatientContext';
import { useBilling } from '@/lib/BillingContext';

interface SidebarProps {
  open: boolean;
}

// Component for quick action buttons
const QuickActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  open: boolean;
}> = ({ icon: Icon, label, onClick, open }) => (
  <Button
    variant="ghost"
    size="sm"
    className={cn(
      "flex items-center justify-start w-full px-3 py-2 text-sm rounded-md transition-colors",
      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary",
      !open && "justify-center"
    )}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    {open && <span className="ml-2 text-xs">{label}</span>}
  </Button>
);

// Component for stats item
const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  open: boolean;
}> = ({ icon: Icon, label, value, open }) => (
  <div className={cn(
    "flex items-center px-3 py-2",
    !open && "justify-center"
  )}>
    <Icon className="h-4 w-4 text-sidebar-foreground/70" />
    {open && (
      <div className="ml-3">
        <p className="text-xs text-sidebar-foreground/70">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    )}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const { appointments } = useAppointments();
  const { patients } = usePatients();
  const { bills } = useBilling();

  // Calculate today's appointments
  const [todayAppointments, setTodayAppointments] = useState(0);
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const count = appointments.filter(a => a.date === today).length;
    setTodayAppointments(count);
  }, [appointments]);

  // Calculate pending bills
  const pendingBills = bills.filter(bill => bill.status === 'pending').length;

  return (
    <aside 
      className={cn(
        "bg-sidebar h-full transition-all duration-300 border-r",
        open ? "w-64" : "w-0 md:w-16"
      )}
    >
      <div className="h-full flex flex-col">
        <div className={cn(
          "flex items-center p-4 h-16",
          open ? "justify-start" : "justify-center"
        )}>
          {open ? (
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              ClinicFlow
            </h1>
          ) : (
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-clinic-primary to-clinic-secondary flex items-center justify-center text-white font-bold">
              C
            </span>
          )}
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          <SidebarLink to="/" icon={BarChart} label="Dashboard" open={open} />
          <SidebarLink to="/appointments" icon={Calendar} label="Appointments" open={open} />
          <SidebarLink to="/patients" icon={Users} label="Patients" open={open} />
          <SidebarLink to="/records" icon={ClipboardCheck} label="Medical Records" open={open} />
          <SidebarLink to="/prescriptions" icon={Pill} label="Prescriptions" open={open} />
          <SidebarLink to="/billing" icon={FileText} label="Billing" open={open} />
          <SidebarLink to="/reports" icon={Activity} label="Reports" open={open} />
          <SidebarLink to="/settings" icon={Settings} label="Settings" open={open} />
        </nav>

        {/* Quick Actions Section */}
        <div className="mt-auto px-2 py-3">
          {open && <p className="px-3 text-xs font-medium text-sidebar-foreground/70 mb-2">QUICK ACTIONS</p>}
          <div className="space-y-1">
            <QuickActionButton 
              icon={PlusCircle} 
              label="New Appointment" 
              onClick={() => navigate('/appointments')} 
              open={open} 
            />
            <QuickActionButton 
              icon={UserPlus} 
              label="Add Patient" 
              onClick={() => navigate('/patients')} 
              open={open} 
            />
            <QuickActionButton 
              icon={Receipt} 
              label="Create Bill" 
              onClick={() => navigate('/billing')} 
              open={open} 
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-2 py-3 bg-sidebar-accent/20 mt-2 rounded-md mx-2 mb-2">
          {open && <p className="px-3 text-xs font-medium text-sidebar-foreground/70 mb-2">STATS</p>}
          <div>
            <StatItem 
              icon={Clock} 
              label="Today's Appointments" 
              value={todayAppointments} 
              open={open} 
            />
            <StatItem 
              icon={User} 
              label="Total Patients" 
              value={patients.length} 
              open={open} 
            />
            <StatItem 
              icon={DollarSign} 
              label="Pending Bills" 
              value={pendingBills} 
              open={open} 
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  open: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, open }) => {
  // Determine if link is active based on current path
  const isActive = window.location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-primary font-medium" 
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary",
        !open && "justify-center"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
      {open && <span className="ml-3">{label}</span>}
    </Link>
  );
};

export default Sidebar;
