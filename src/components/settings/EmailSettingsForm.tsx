import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { EmailSettings, useSettings } from '@/lib/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HelpCircle, 
  Mail, 
  Info,
  ExternalLink,
  Check,
  AlertTriangle,
  Loader2,
  SendIcon,
  Lock
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendTestEmail as sendTestEmailService, createTestEmailTemplate } from '@/lib/services/emailService';
import { useGoogleLogin } from '@react-oauth/google';

const formSchema = z.object({
  enabled: z.boolean(),
  service: z.string(),
  username: z.string().email('Please enter a valid email address'),
  fromName: z.string().min(1, 'Sender name is required'),
  fromEmail: z.string().email('Please enter a valid email address')
});

const testEmailSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address')
});

const EmailSettingsForm = () => {
  const { settings, updateEmailSettings } = useSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);
  
  const form = useForm<EmailSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: settings.email
  });

  const testEmailForm = useForm<{ recipientEmail: string }>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipientEmail: ''
    }
  });

  const watchEnabled = form.watch('enabled');
  
  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google auth success:', tokenResponse);
      toast({
        title: 'Google Authentication Successful',
        description: 'You can now send emails through the Gmail API',
        variant: 'default'
      });
      setIsGoogleAuthorized(true);
    },
    onError: (errorResponse) => {
      console.error('Google auth error:', errorResponse);
      toast({
        title: 'Authentication Failed',
        description: 'Could not authenticate with Google. Please try again.',
        variant: 'destructive'
      });
    },
    scope: 'https://www.googleapis.com/auth/gmail.send',
  });

  const onSubmit = async (data: EmailSettings) => {
    setIsSubmitting(true);
    try {
      await updateEmailSettings(data);
      toast({
        title: 'Success',
        description: 'Email settings updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update email settings',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTestEmail = async (data: { recipientEmail: string }) => {
    if (!settings.email.enabled) {
      toast({
        title: 'Error',
        description: 'Please enable email notifications first',
        variant: 'destructive'
      });
      return;
    }

    if (!settings.email.username) {
      toast({
        title: 'Error',
        description: 'Please configure your email address first',
        variant: 'destructive'
      });
      return;
    }

    // If not authorized yet with Google
    if (!isGoogleAuthorized) {
      toast({
        title: 'Google Authentication Required',
        description: 'Please authorize with Google before sending emails',
        variant: 'destructive'
      });
      googleLogin(); // Start the Google login flow
      return;
    }

    setIsSendingTest(true);
    try {
      // Use the email service to send the test email
      await sendTestEmailService({
        settings: settings.email,
        recipientEmail: data.recipientEmail
      });
      
      // Create a test email template
      const emailTemplate = createTestEmailTemplate(data.recipientEmail, settings.email);
      
      toast({
        title: 'Simulated Email Sent',
        description: `This is a simulation. No real email was sent to ${data.recipientEmail}`,
        variant: 'default'
      });
      setTestDialogOpen(false);
      testEmailForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email. Please check your email configuration.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Enable Email Notifications</FormLabel>
                  <FormDescription>
                    Send automated emails for appointments, prescriptions, and bills
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {watchEnabled && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Gmail API Integration</AlertTitle>
            <AlertDescription className="text-blue-700">
              This application uses Google's Gmail API for sending emails. You'll need to authorize with your Google account to send emails.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Service</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="custom" disabled>Custom SMTP (Coming Soon)</SelectItem>
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gmail Address</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@gmail.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The Gmail account you'll use to send emails
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fromName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Name</FormLabel>
                <FormControl>
                  <Input placeholder="ClinicFlow Center" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The name that will appear in the "From" field
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fromEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Email</FormLabel>
                <FormControl>
                  <Input placeholder="notifications@yourclinic.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The email address that will appear in the "From" field
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        {/* Google Authorization section */}
        {watchEnabled && (
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-medium">Google API Authorization</h3>
            <p className="text-sm text-muted-foreground mb-2">
              To send emails through Gmail, you need to authorize this application with your Google account.
            </p>
            <Button 
              type="button" 
              variant={isGoogleAuthorized ? "outline" : "default"} 
              className="w-full sm:w-auto"
              onClick={() => googleLogin()}
            >
              {isGoogleAuthorized ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Authorized with Google
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Authorize with Google
                </>
              )}
            </Button>
            
            <div className="mt-2 text-sm text-muted-foreground">
              <p>For more information about setting up Gmail API, see our <a href="/docs/GmailApiSetup.md" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center">
                Gmail API Setup Guide <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Save Email Settings
              </>
            )}
          </Button>
          
          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={!settings.email.enabled || !settings.email.username || !isGoogleAuthorized}
              >
                <SendIcon className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogDescription>
                  Send a test email to verify your email configuration is working correctly.
                </DialogDescription>
              </DialogHeader>
              {/* Simulation Notice */}
              <div className="mb-4 p-2 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span>This is a simulation. No real email will be sent until the final implementation is enabled.</span>
              </div>
              <Form {...testEmailForm}>
                <form onSubmit={testEmailForm.handleSubmit(sendTestEmail)} className="space-y-4 py-4">
                  <FormField
                    control={testEmailForm.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter email address" 
                            {...field} 
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormDescription>
                          This is where the test email will be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="mt-4">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setTestDialogOpen(false)}
                      disabled={isSendingTest}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSendingTest}>
                      {isSendingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <SendIcon className="mr-2 h-4 w-4" />
                          Send Test
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </form>
    </Form>
  );
};

export default EmailSettingsForm; 