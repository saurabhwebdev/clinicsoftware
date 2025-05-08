import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  ClipboardCheck, 
  Pill, 
  FileText, 
  Settings, 
  BarChart,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  
  const toggleSidebar = () => setOpen(!open);

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: open ? '16rem' : '4.5rem',
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.3, 0.1, 0.3, 1] 
      }}
      className="bg-sidebar h-full border-r overflow-y-auto shadow-sm relative"
    >
      <div className="h-full flex flex-col">
        <motion.div 
          className={cn(
            "flex items-center p-4 h-16",
            open ? "justify-start" : "justify-center"
          )}
        >
          {open ? (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="font-bold text-xl tracking-tight bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent"
            >
              ClinicFlow
            </motion.h1>
          ) : (
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-clinic-primary to-clinic-secondary flex items-center justify-center text-white font-bold shadow-md"
            >
              C
            </motion.div>
          )}
        </motion.div>
        
        <div className="px-3">
          <Separator className="bg-sidebar-accent/30" />
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1.5">
          <SidebarLink to="/" icon={BarChart} label="Dashboard" open={open} />
          <SidebarLink to="/appointments" icon={Calendar} label="Appointments" open={open} />
          <SidebarLink to="/patients" icon={Users} label="Patients" open={open} />
          <SidebarLink to="/records" icon={ClipboardCheck} label="Medical Records" open={open} />
          <SidebarLink to="/prescriptions" icon={Pill} label="Prescriptions" open={open} />
          <SidebarLink to="/billing" icon={FileText} label="Billing" open={open} />
          <SidebarLink to="/reports" icon={Activity} label="Reports" open={open} />
          <SidebarLink to="/settings" icon={Settings} label="Settings" open={open} />
        </nav>
        
        {/* Toggle button at the bottom */}
        <div className="mt-auto p-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSidebar}
              className={cn(
                "w-full flex items-center justify-center rounded-xl border-sidebar-accent/50 bg-sidebar-accent/10",
                "hover:bg-sidebar-accent/20 hover:text-sidebar-primary transition-all"
              )}
            >
              {open ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-xs">Collapse</span>
                </>
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  open: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, open }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link 
        to={to} 
        className={cn(
          "flex items-center px-3 py-2.5 rounded-xl transition-all",
          isActive 
            ? "bg-gradient-to-r from-sidebar-accent/80 to-sidebar-accent/50 text-sidebar-primary font-medium shadow-sm" 
            : "text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-primary",
          !open && "justify-center"
        )}
      >
        <div className={cn(
          "flex items-center justify-center",
          isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        {open && (
          <div className="flex items-center flex-1">
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3"
            >
              {label}
            </motion.span>
            
            {isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default Sidebar;
