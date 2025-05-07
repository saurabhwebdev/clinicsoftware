import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { TimingSettings, useSettings } from '@/lib/SettingsContext';

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

const DURATION_OPTIONS = [
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '20 minutes', value: 20 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

const formSchema = z.object({
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  workingHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  }),
  appointmentDuration: z.number().min(5),
  breakTime: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  }),
});

const TimingSettingsForm = () => {
  const { settings, updateTimingSettings } = useSettings();
  const { toast } = useToast();
  
  const form = useForm<TimingSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: settings.timing
  });
  
  const onSubmit = async (data: TimingSettings) => {
    try {
      await updateTimingSettings(data);
      toast({
        title: 'Success',
        description: 'Timing settings updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update timing settings',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="workingDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Working Days</FormLabel>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <FormField
                    key={day.value}
                    control={form.control}
                    name="workingDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, day.value])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== day.value
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="workingHours.start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Working Hours Start</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="workingHours.end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Working Hours End</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="breakTime.start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break Time Start</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="breakTime.end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break Time End</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="appointmentDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Duration</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto">Save Timing Settings</Button>
      </form>
    </Form>
  );
};

export default TimingSettingsForm; 