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
  Lock,
  Key
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
import { Textarea } from "@/components/ui/textarea";
import { sendTestEmail as sendTestEmailService, createTestEmailTemplate } from '@/lib/services/emailService';
import { useGoogleLogin } from '@react-oauth/google';

// Add types for the Google API
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2: {
          initTokenClient: (params: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

// Updated schema to include Google API credentials
const formSchema = z.object({
  enabled: z.boolean(),
  service: z.string(),
  username: z.string().email('Please enter a valid email address'),
  fromName: z.string().min(1, 'Sender name is required'),
  fromEmail: z.string().email('Please enter a valid email address'),
  googleClientId: z.string().min(1, 'Client ID is required'),
  googleApiKey: z.string().min(1, 'API Key is required'),
  googleApiScopes: z.string().optional()
});

// Updated EmailSettings type
type ExtendedEmailSettings = EmailSettings & {
  googleClientId: string;
  googleApiKey: string;
  googleApiScopes: string;
};

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
  
  // Initialize with default values including Google API credentials
  const defaultValues: ExtendedEmailSettings = {
    ...settings.email,
    googleClientId: settings.email.googleClientId || '',
    googleApiKey: settings.email.googleApiKey || '',
    googleApiScopes: settings.email.googleApiScopes || 'https://www.googleapis.com/auth/gmail.send'
  };
  
  const form = useForm<ExtendedEmailSettings>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const testEmailForm = useForm<{ recipientEmail: string }>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipientEmail: ''
    }
  });

  const watchEnabled = form.watch('enabled');
  const watchClientId = form.watch('googleClientId');
  
  // Google login handler - no longer using client ID here since we're using a custom implementation
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
    flow: 'implicit'
  });

  const onSubmit = async (data: ExtendedEmailSettings) => {
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

  const handleGoogleLogin = () => {
    // Make sure client ID is set
    if (!watchClientId) {
      toast({
        title: 'Missing Client ID',
        description: 'Please add your Google OAuth Client ID first',
        variant: 'destructive'
      });
      return;
    }
    
    // Initialize the OAuth client with the client ID
    const params = {
      client_id: watchClientId,
      callback: (response: any) => {
        if (response.access_token) {
          console.log('Google auth success:', response);
          toast({
            title: 'Google Authentication Successful',
            description: 'You can now send emails through the Gmail API',
            variant: 'default'
          });
          setIsGoogleAuthorized(true);
        } else {
          console.error('Google auth error:', response);
          toast({
            title: 'Authentication Failed',
            description: 'Could not authenticate with Google. Please try again.',
            variant: 'destructive'
          });
        }
      },
      scope: form.getValues('googleApiScopes') || 'https://www.googleapis.com/auth/gmail.send'
    };
    
    // Use the Google Identity Services library
    if (window.google && window.google.accounts) {
      window.google.accounts.oauth2.initTokenClient(params).requestAccessToken();
    } else {
      // Fallback to useGoogleLogin
      googleLogin();
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
    
    // Make sure Google API credentials are set
    if (!watchClientId || !form.getValues('googleApiKey')) {
      toast({
        title: 'Missing API Credentials',
        description: 'Please add your Google API Client ID and API Key first',
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
      handleGoogleLogin(); // Start the Google login flow
      return;
    }

    setIsSendingTest(true);
    try {
      // Use the email service to send the test email
      await sendTestEmailService({
        settings: form.getValues(),
        recipientEmail: data.recipientEmail
      });
      
      // Create a test email template
      const emailTemplate = createTestEmailTemplate(data.recipientEmail, form.getValues());
      
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
                  The email address that will appear as the sender
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fromName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Clinic Name" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The name that will appear as the sender
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        {/* Google API Credentials Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Google API Credentials</h3>
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Important</AlertTitle>
            <AlertDescription className="text-amber-700">
              You must create a project in the <a href="https://console.cloud.google.com/" className="underline" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>, enable the Gmail API, and create OAuth credentials to use this feature.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="googleClientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Google OAuth Client ID
                    <HelpCircle className="w-4 h-4 inline-block ml-1 text-muted-foreground" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890-example.apps.googleusercontent.com" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    OAuth Client ID from Google Cloud Console
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="googleApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Google API Key
                    <HelpCircle className="w-4 h-4 inline-block ml-1 text-muted-foreground" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="AIzaSyA1B2C3D4_example_key" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    API Key from Google Cloud Console
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="googleApiScopes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    API Scopes
                    <HelpCircle className="w-4 h-4 inline-block ml-1 text-muted-foreground" />
                  </FormLabel>
                  <FormControl>
                    <Input 
                      defaultValue="https://www.googleapis.com/auth/gmail.send" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Required scopes for the Gmail API (leave as is unless you know what you're doing)
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-instructions">
                <AccordionTrigger className="text-sm font-medium">
                  How to set up Google API credentials
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="mb-2">Follow these steps to set up your Google API credentials:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Go to the <a href="https://console.cloud.google.com/" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">Google Cloud Console <ExternalLink className="h-3 w-3 inline" /></a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>In the sidebar, navigate to &quot;APIs &amp; Services&quot; &raquo; &quot;Library&quot;</li>
                    <li>Search for "Gmail API" and enable it</li>
                    <li>Go to &quot;APIs &amp; Services&quot; &raquo; &quot;Credentials&quot;</li>
                    <li>Click "Create Credentials" and select "OAuth client ID"</li>
                    <li>Set the application type to "Web application"</li>
                    <li>Add your domain to "Authorized JavaScript origins"</li>
                    <li>Click "Create" and copy the Client ID</li>
                    <li>Create an API Key by clicking "Create Credentials" &raquo; "API Key"</li>
                    <li>Copy the API Key and paste it above</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          {watchEnabled && watchClientId && (
            <div className="mt-4">
              <Button 
                type="button" 
                variant={isGoogleAuthorized ? "outline" : "default"} 
                className="w-full sm:w-auto"
                onClick={handleGoogleLogin}
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
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" disabled={!watchEnabled}>
                <Mail className="mr-2 h-4 w-4" />
                Test Email Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogDescription>
                  Send a test email to verify your configuration
                </DialogDescription>
              </DialogHeader>
              <Form {...testEmailForm}>
                <form onSubmit={testEmailForm.handleSubmit(sendTestEmail)} className="space-y-4">
                  <FormField
                    control={testEmailForm.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input placeholder="recipient@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
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
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmailSettingsForm; 