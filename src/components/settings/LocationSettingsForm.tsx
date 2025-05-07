import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocationSettings, useSettings } from '@/lib/SettingsContext';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'US Dollar ($)', value: 'USD' },
  { label: 'Euro (€)', value: 'EUR' },
  { label: 'British Pound (£)', value: 'GBP' },
  { label: 'Japanese Yen (¥)', value: 'JPY' },
  { label: 'Canadian Dollar (C$)', value: 'CAD' },
  { label: 'Australian Dollar (A$)', value: 'AUD' },
  { label: 'Swiss Franc (CHF)', value: 'CHF' },
  { label: 'Chinese Yuan (¥)', value: 'CNY' },
  { label: 'Indian Rupee (₹)', value: 'INR' },
  { label: 'Brazilian Real (R$)', value: 'BRL' },
];

// Date format options
const DATE_FORMAT_OPTIONS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
  { label: 'DD MMM YYYY', value: 'DD MMM YYYY' },
];

// Time format options
const TIME_FORMAT_OPTIONS = [
  { label: '12-hour (AM/PM)', value: '12h' },
  { label: '24-hour', value: '24h' },
];

// Timezone options (a subset of common timezones)
const TIMEZONE_OPTIONS = [
  { label: 'UTC', value: 'UTC' },
  { label: 'US Eastern Time (ET)', value: 'America/New_York' },
  { label: 'US Central Time (CT)', value: 'America/Chicago' },
  { label: 'US Mountain Time (MT)', value: 'America/Denver' },
  { label: 'US Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'GMT/BST (UK)', value: 'Europe/London' },
  { label: 'Central European Time (CET)', value: 'Europe/Paris' },
  { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
  { label: 'Japan Standard Time (JST)', value: 'Asia/Tokyo' },
  { label: 'Australian Eastern Time (AET)', value: 'Australia/Sydney' },
];

// Language options
const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'English' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Chinese (Simplified)', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Russian', value: 'Russian' },
];

const formSchema = z.object({
  currency: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  timezone: z.string(),
  language: z.string(),
});

const LocationSettingsForm = () => {
  const { settings, updateLocationSettings } = useSettings();
  const { toast } = useToast();
  
  const form = useForm<LocationSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: settings.location
  });
  
  const onSubmit = async (data: LocationSettings) => {
    try {
      await updateLocationSettings(data);
      toast({
        title: 'Success',
        description: 'Location settings updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update location settings',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dateFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="timeFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto">Save Location Settings</Button>
      </form>
    </Form>
  );
};

export default LocationSettingsForm; 