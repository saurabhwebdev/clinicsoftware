import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings as SettingsIcon, Clock, User, MapPin, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { SettingsProvider, useSettings } from '@/lib/SettingsContext';
import ClinicSettingsForm from '@/components/settings/ClinicSettingsForm';
import TimingSettingsForm from '@/components/settings/TimingSettingsForm';
import DoctorSettingsForm from '@/components/settings/DoctorSettingsForm';
import LocationSettingsForm from '@/components/settings/LocationSettingsForm';
import EmailSettingsForm from '@/components/settings/EmailSettingsForm';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/use-toast';

const SettingsContent = () => {
  const { settings, loading, error, resetSettings } = useSettings();
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const handleResetSettings = async () => {
    try {
      await resetSettings();
      toast({
        title: "Settings Reset",
        description: "All settings have been restored to default values.",
      });
      setIsResetDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your clinic configuration and preferences</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setIsResetDialogOpen(true)}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reset Settings</span>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-medium text-destructive">Error Loading Settings</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Tabs defaultValue="clinic" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto">
              <TabsTrigger value="clinic" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Clinic</span>
              </TabsTrigger>
              <TabsTrigger value="timing" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timing</span>
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Doctor</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Location</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="clinic">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Settings</CardTitle>
                <CardDescription>
                  Manage your clinic's information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClinicSettingsForm />
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Current Settings:</div>
                  <div>Name: {settings.clinic.name}</div>
                  <div>Email: {settings.clinic.email}</div>
                  <div>Phone: {settings.clinic.phone}</div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="timing">
            <Card>
              <CardHeader>
                <CardTitle>Timing Settings</CardTitle>
                <CardDescription>
                  Configure working hours, days, and appointment durations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimingSettingsForm />
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Current Settings:</div>
                  <div>Working Hours: {settings.timing.workingHours.start} - {settings.timing.workingHours.end}</div>
                  <div>Appointment Duration: {settings.timing.appointmentDuration} minutes</div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="doctor">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Details</CardTitle>
                <CardDescription>
                  Update your professional information and credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorSettingsForm />
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Current Settings:</div>
                  <div>Name: {settings.doctor.name}</div>
                  <div>Specialization: {settings.doctor.specialization}</div>
                  <div>Email: {settings.doctor.email}</div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location & Preferences</CardTitle>
                <CardDescription>
                  Set your currency, date format, and other regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationSettingsForm />
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Current Settings:</div>
                  <div>Currency: {settings.location.currency}</div>
                  <div>Date Format: {settings.location.dateFormat}</div>
                  <div>Time Format: {settings.location.timeFormat}</div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure email settings for automated notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailSettingsForm />
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Current Settings:</div>
                  <div>Email Notifications: {settings.email.enabled ? 'Enabled' : 'Disabled'}</div>
                  {settings.email.enabled && (
                    <>
                      <div>Service: {settings.email.service}</div>
                      <div>From: {settings.email.fromName} ({settings.email.fromEmail})</div>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to their default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetSettings}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Settings = () => {
  return (
    <SettingsProvider>
      <MainLayout>
        <SettingsContent />
      </MainLayout>
    </SettingsProvider>
  );
};

export default Settings; 