import React, { useState, useEffect } from 'react';
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

// Interface for storing Google auth token
interface GoogleAuthToken {
  token: string;
  expiresAt: number; // Timestamp when token expires
}

const EmailSettingsForm = () => {
  const { settings, updateEmailSettings } = useSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);
  const [googleAuthToken, setGoogleAuthToken] = useState<GoogleAuthToken | null>(null);
  
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
  
  // On component mount, check if we have a stored auth token
  useEffect(() => {
    const storedToken = localStorage.getItem('googleAuthToken');
    if (storedToken) {
      try {
        const parsedToken: GoogleAuthToken = JSON.parse(storedToken);
        
        // Check if token is still valid (not expired)
        if (parsedToken.expiresAt > Date.now()) {
          setGoogleAuthToken(parsedToken);
          setIsGoogleAuthorized(true);
          console.log('Restored Google auth token from storage');
        } else {
          // Token expired, remove from storage
          localStorage.removeItem('googleAuthToken');
          console.log('Stored Google token expired');
        }
      } catch (e) {
        console.error('Error parsing stored Google auth token:', e);
        localStorage.removeItem('googleAuthToken');
      }
    }
  }, []);
  
  // Google login handler - no longer using client ID here since we're using a custom implementation
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google auth success:', tokenResponse);
      
      // Store the token with expiration time (default to 1 hour if not provided)
      const expiresIn = tokenResponse.expires_in || 3600;
      const authToken: GoogleAuthToken = {
        token: tokenResponse.access_token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // Set to 7 days (1 week)
      };
      
      // Save to state and localStorage
      setGoogleAuthToken(authToken);
      localStorage.setItem('googleAuthToken', JSON.stringify(authToken));
      
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
    // If already authorized with a valid token, no need to re-authorize
    if (isGoogleAuthorized && googleAuthToken && googleAuthToken.expiresAt > Date.now()) {
      toast({
        title: 'Already Authorized',
        description: 'You are already authorized with Google',
        variant: 'default'
      });
      return;
    }
    
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
          
          // Store the token with expiration time
          const expiresIn = response.expires_in || 3600;
          const authToken: GoogleAuthToken = {
            token: response.access_token,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // Set to 7 days (1 week)
          };
          
          // Save to state and localStorage
          setGoogleAuthToken(authToken);
          localStorage.setItem('googleAuthToken', JSON.stringify(authToken));
          
          toast({
            title: 'Google Authentication Successful',
            description: 'You can now send emails through the Gmail API',
            variant: 'default'
          });
          setIsGoogleAuthorized(true);
          
          // If test dialog is open, automatically trigger email send
          if (testDialogOpen && testEmailForm.getValues().recipientEmail) {
            sendTestEmail(testEmailForm.getValues());
          }
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
    if (!watchEnabled) {
      toast({
        title: 'Error',
        description: 'Please enable email notifications first',
        variant: 'destructive'
      });
      return;
    }

    const username = form.getValues('username');
    if (!username) {
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

    // If not authorized yet with Google or token expired, trigger authorization
    if (!isGoogleAuthorized || !googleAuthToken || googleAuthToken.expiresAt <= Date.now()) {
      toast({
        title: 'Google Authentication Required',
        description: 'Please authorize with Google before sending emails',
        variant: 'default'
      });
      handleGoogleLogin(); // Start the Google login flow
      return;
    }

    setIsSendingTest(true);
    try {
      // Get the current form values to ensure we're using the latest settings
      const currentSettings = form.getValues();
      
      // Use the email service to send the test email, passing the auth token
      await sendTestEmailService({
        settings: currentSettings,
        recipientEmail: data.recipientEmail,
        authToken: googleAuthToken.token
      });
      
      // Create a test email template
      const emailTemplate = createTestEmailTemplate(data.recipientEmail, currentSettings);
      
      toast({
        title: 'Email Sent Successfully',
        description: `Your test email has been sent to ${data.recipientEmail}`,
        variant: 'default'
      });
      setTestDialogOpen(false);
      testEmailForm.reset();
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email. Please check your email configuration and Google authorization.',
        variant: 'destructive'
      });
      
      // If the error might be due to an expired token, prompt for reauthorization
      if (error === 'Unauthorized' || (error instanceof Error && error.message.includes('auth'))) {
        setIsGoogleAuthorized(false);
        localStorage.removeItem('googleAuthToken');
        setGoogleAuthToken(null);
        
        toast({
          title: 'Authorization Expired',
          description: 'Your Google authorization has expired. Please authorize again.',
          variant: 'default'
        });
      }
    } finally {
      setIsSendingTest(false);
    }
  };
  
  // Get readable expiration time for display
  const getTokenExpirationTime = () => {
    if (!googleAuthToken) return 'Not authorized';
    
    const expiresIn = Math.max(0, Math.floor((googleAuthToken.expiresAt - Date.now()) / 1000 / 60)); // minutes
    if (expiresIn < 1) return 'Expired';
    
    // Show days if more than 24 hours
    if (expiresIn > 1440) { // more than 24 hours (1440 minutes)
      const days = Math.floor(expiresIn / 1440); // days
      return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
    }
    
    // Show hours if more than 60 minutes
    if (expiresIn >= 60) {
      const hours = Math.floor(expiresIn / 60);
      return `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    // Show minutes if less than 60 minutes
    return `Expires in ${expiresIn} minute${expiresIn !== 1 ? 's' : ''}`;
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
                  <p className="mb-2">Follow these step-by-step instructions to set up your Google API credentials:</p>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>Go to the <a href="https://console.cloud.google.com/" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">Google Cloud Console <ExternalLink className="h-3 w-3 inline" /></a> and sign in with your Google account</li>
                    <li>Click on the project dropdown near the top of the page, then click "New Project"</li>
                    <li>Enter a name for your project (e.g., "ClinicFlow"), then click "Create"</li>
                    <li>Once the project is created, make sure it's selected in the dropdown at the top</li>
                    <li>In the left sidebar, click "APIs & Services" &raquo; "Library"</li>
                    <li>In the search bar, type "Gmail API" and click on it when it appears</li>
                    <li>Click the "Enable" button to activate the Gmail API for your project</li>
                    <li>After enabling, you'll be taken to the API overview page. Click "Create Credentials" to set up your credentials</li>
                    <li><strong>Configure OAuth Consent Screen:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>On the "Create credentials" page, click "Configure Consent Screen"</li>
                        <li>Select "External" as the user type (unless you have Google Workspace), then click "Create"</li>
                        <li>Fill in the required app information:
                          <ul className="list-circle pl-5 mt-1 space-y-1">
                            <li>App name: "ClinicFlow" (or your clinic's name)</li>
                            <li>User support email: Your email address</li>
                            <li>Developer contact information: Your email address</li>
                          </ul>
                        </li>
                        <li>Click "Save and Continue"</li>
                        <li>On the "Scopes" page, click "Add or Remove Scopes" and add: <code>https://www.googleapis.com/auth/gmail.send</code></li>
                        <li>Click "Save and Continue"</li>
                        <li>On the "Test users" page, click "Add Users" and enter your own email address</li>
                        <li>Click "Save and Continue", then "Back to Dashboard"</li>
                      </ul>
                    </li>
                    <li><strong>Create OAuth Client ID:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>In the left sidebar, click "APIs & Services" &raquo; "Credentials"</li>
                        <li>Click "Create Credentials" and select "OAuth client ID"</li>
                        <li>For "Application type", select "Web application"</li>
                        <li>Name: "ClinicFlow Web Client" (or any name you prefer)</li>
                        <li>Under "Authorized JavaScript origins", click "Add URI" and enter your website URL (during development, use <code>http://localhost:3000</code>)</li>
                        <li>Click "Create"</li>
                        <li>A popup will appear with your Client ID - copy this value and paste it in the "Google OAuth Client ID" field above</li>
                      </ul>
                    </li>
                    <li><strong>Create API Key:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>In the left sidebar, ensure you're in "APIs & Services" &raquo; "Credentials"</li>
                        <li>Click "Create Credentials" and select "API Key"</li>
                        <li>Copy the generated API Key and paste it in the "Google API Key" field above</li>
                        <li>For better security, click "Restrict Key" and limit it to the Gmail API</li>
                      </ul>
                    </li>
                    <li>Return to this page and enter the Client ID and API Key in the fields above</li>
                    <li>Click "Authorize with Google" to connect your Google account</li>
                    <li>Follow the Google authorization prompts to grant permission to your app</li>
                  </ol>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="font-medium text-amber-800">Important Notes:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-amber-700">
                      <li>Your app will initially be in "Testing" mode, which is sufficient for personal use</li>
                      <li>If you see warnings about "unverified app", this is normal during testing</li>
                      <li>For production use, you would need to submit your app for verification by Google</li>
                    </ul>
                  </div>
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
                    <span className="ml-2 text-xs text-muted-foreground">({getTokenExpirationTime()})</span>
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Authorize with Google
                  </>
                )}
              </Button>
              
              {isGoogleAuthorized && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Your authorization will be remembered for 7 days. You won't need to re-authorize during this period.
                </p>
              )}
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
              
              {!isGoogleAuthorized && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Authorization Required</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    You'll need to authorize with Google before sending a test email.
                  </AlertDescription>
                </Alert>
              )}
              
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
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                    {!isGoogleAuthorized && (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="w-full sm:w-auto"
                        onClick={handleGoogleLogin}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Authorize with Google
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSendingTest}
                      className="w-full sm:w-auto"
                    >
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