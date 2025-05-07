import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { DoctorSettings, useSettings } from '@/lib/SettingsContext';
import { X } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialization: z.string().min(2, 'Specialization is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(5, 'Please enter a valid phone number'),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
});

const DoctorSettingsForm = () => {
  const { settings, updateDoctorSettings } = useSettings();
  const { toast } = useToast();
  const [newQualification, setNewQualification] = React.useState('');
  
  const form = useForm<DoctorSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...settings.doctor,
      qualifications: settings.doctor.qualifications || []
    }
  });
  
  const onSubmit = async (data: DoctorSettings) => {
    try {
      await updateDoctorSettings(data);
      toast({
        title: 'Success',
        description: 'Doctor details updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update doctor details',
        variant: 'destructive'
      });
    }
  };
  
  const addQualification = () => {
    if (newQualification.trim() === '') return;
    
    const currentQualifications = form.getValues('qualifications') || [];
    form.setValue('qualifications', [...currentQualifications, newQualification]);
    setNewQualification('');
  };
  
  const removeQualification = (index: number) => {
    const currentQualifications = [...(form.getValues('qualifications') || [])];
    currentQualifications.splice(index, 1);
    form.setValue('qualifications', currentQualifications);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialization</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Pediatrics, Cardiology" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="doctor@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a short bio about yourself" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="profilePicture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter profile picture URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Qualifications</FormLabel>
          <div className="flex gap-2">
            <Input 
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              placeholder="Add qualification (e.g., MD, PhD)"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addQualification}
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {form.watch('qualifications')?.map((qualification, index) => (
              <div 
                key={index} 
                className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
              >
                <span>{qualification}</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 ml-1"
                  onClick={() => removeQualification(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <Button type="submit" className="w-full sm:w-auto">Save Doctor Details</Button>
      </form>
    </Form>
  );
};

export default DoctorSettingsForm; 