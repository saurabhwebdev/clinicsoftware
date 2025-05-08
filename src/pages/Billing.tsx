import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { FileText, PlusCircle, Search, Eye, FileEdit, MoreVertical, Trash, Download, CheckCircle2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useBilling, Bill } from '@/lib/BillingContext';
import { BillingProvider } from '@/lib/BillingContext';
import NewBillModal from '@/components/billing/NewBillModal';
import BillDetail from '@/components/billing/BillDetail';
import { generateBillPDF } from '@/lib/utils/pdf';
import { useSettings } from '@/lib/SettingsContext';
import { sendBillEmail } from '@/lib/services/emailService';
import { usePatients } from '@/lib/PatientContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Email form validation schema
const emailFormSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address'),
  additionalEmails: z.string().optional()
});

// Form submission type
type EmailFormValues = z.infer<typeof emailFormSchema>;

const BillingContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isViewingBill, setIsViewingBill] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [billToEmail, setBillToEmail] = useState<Bill | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { bills, loading, removeBill, updateBillData } = useBilling();
  const { patients } = usePatients();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Form for email recipient
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipientEmail: '',
      additionalEmails: ''
    }
  });

  // Reset form with patient email when bill to email changes
  useEffect(() => {
    if (billToEmail) {
      // Try to find patient email from patientId
      const patientEmail = getPatientEmail(billToEmail.patientId);
      emailForm.reset({
        recipientEmail: patientEmail || '', 
        additionalEmails: ''
      });
    }
  }, [billToEmail, emailForm, patients]);

  // Function to get patient email from patient collection
  const getPatientEmail = (patientId: string): string => {
    // Find the patient with the matching ID in the patients array
    const patient = patients.find(p => p.id === patientId);
    
    // If the patient is found, return their email
    if (patient && patient.email) {
      return patient.email;
    }
    
    // If patient not found or no email, return empty string
    return '';
  };

  // Filter bills by search query
  const filteredBills = bills.filter(bill => 
    bill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewBill = () => {
    setIsNewBillModalOpen(true);
  };

  const handleBillCreated = () => {
    setIsNewBillModalOpen(false);
    toast({
      title: "Success",
      description: "Bill created successfully",
    });
  };

  const handleViewBill = (id: string) => {
    setSelectedBillId(id);
    setIsViewingBill(true);
  };

  const handleCloseBillDetail = () => {
    setSelectedBillId(null);
    setIsViewingBill(false);
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;
    
    try {
      await removeBill(billToDelete);
      toast({
        title: "Success",
        description: "Bill deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    } finally {
      setBillToDelete(null);
    }
  };

  const handleExportPDF = async (bill: Bill) => {
    try {
      await generateBillPDF(bill, settings);
      toast({
        title: "Success",
        description: "Bill PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleEmailBill = (bill: Bill) => {
    // First check if email is configured
    if (!settings.email.enabled || !settings.email.username || !settings.email.googleClientId) {
      toast({
        title: "Email Not Configured",
        description: "Please configure your email settings first",
        variant: "destructive",
      });
      return;
    }

    setBillToEmail(bill);
    setIsEmailDialogOpen(true);
  };

  const onSendEmail = async (data: EmailFormValues) => {
    if (!billToEmail) return;
    
    setIsSendingEmail(true);
    
    try {
      // Get the auth token from localStorage
      const storedToken = localStorage.getItem('googleAuthToken');
      if (!storedToken) {
        throw new Error('You need to authorize with Google in the Email Settings section first');
      }
      
      const parsedToken = JSON.parse(storedToken);
      
      // Check if token is expired
      if (parsedToken.expiresAt <= Date.now()) {
        throw new Error('Your Google authorization has expired. Please reauthorize in Email Settings');
      }
      
      // Process additional emails
      const emails = [data.recipientEmail];
      
      if (data.additionalEmails) {
        // Split by comma and trim whitespace
        const additionalEmailsList = data.additionalEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => email && email.includes('@')); // Basic validation
          
        emails.push(...additionalEmailsList);
      }
      
      // Send to each recipient
      const emailPromises = emails.map(email => 
        sendBillEmail({
          settings: settings.email,
          bill: billToEmail,
          recipientEmail: email,
          authToken: parsedToken.token,
          clinicInfo: settings.clinic,
          currencySettings: settings.location
        })
      );
      
      await Promise.all(emailPromises);
      
      toast({
        title: "Success",
        description: `Invoice sent to ${emails.length > 1 ? 'multiple recipients' : data.recipientEmail}`,
      });
      
      // Close the dialog and reset form
      setIsEmailDialogOpen(false);
      emailForm.reset();
      setBillToEmail(null);
    } catch (error) {
      console.error('Error sending bill email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invoice email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleStatusChange = async (bill: Bill, newStatus: 'pending' | 'paid' | 'cancelled') => {
    if (statusUpdating || !bill.id) return;
    
    setStatusUpdating(bill.id);
    try {
      const updatedBill = { ...bill, status: newStatus };
      await updateBillData(bill.id, updatedBill);
      
      toast({
        title: "Success",
        description: `Bill status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating bill status:', error);
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusBadge = (status: Bill['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: settings.location.currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage patient bills and invoices</p>
        </div>
        <Button onClick={handleNewBill} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>New Bill</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No Bills</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {bills.length === 0 
                ? "You haven't created any bills yet."
                : "No bills match your search criteria."}
            </p>
            {bills.length === 0 && (
              <Button className="mt-4" onClick={handleNewBill}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Bill
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{format(new Date(bill.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-medium">{bill.invoiceNumber}</TableCell>
                    <TableCell>{bill.patientName}</TableCell>
                    <TableCell>{formatCurrency(bill.total)}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewBill(bill.id || '')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={bill.status}>
                                <DropdownMenuRadioItem 
                                  value="pending"
                                  onClick={() => handleStatusChange(bill, 'pending')}
                                  disabled={statusUpdating === bill.id}
                                >
                                  <Badge variant="outline" className="text-orange-500 border-orange-500 mr-2">Pending</Badge>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem 
                                  value="paid"
                                  onClick={() => handleStatusChange(bill, 'paid')}
                                  disabled={statusUpdating === bill.id}
                                >
                                  <Badge className="bg-green-500 mr-2">Paid</Badge>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem 
                                  value="cancelled"
                                  onClick={() => handleStatusChange(bill, 'cancelled')}
                                  disabled={statusUpdating === bill.id}
                                >
                                  <Badge variant="outline" className="text-destructive border-destructive mr-2">Cancelled</Badge>
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuItem onClick={() => handleExportPDF(bill)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleEmailBill(bill)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send as Email
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive" 
                            onClick={() => setBillToDelete(bill.id || '')}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {isViewingBill && selectedBillId && (
        <AlertDialog open={isViewingBill} onOpenChange={setIsViewingBill}>
          <AlertDialogContent className="sm:max-w-[700px] max-h-[85vh] p-6 overflow-y-auto">
            <BillDetail 
              billId={selectedBillId} 
              onClose={handleCloseBillDetail}
            />
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isNewBillModalOpen && (
        <NewBillModal
          isOpen={isNewBillModalOpen}
          onClose={() => setIsNewBillModalOpen(false)}
          onBillCreated={handleBillCreated}
        />
      )}

      <AlertDialog open={!!billToDelete} onOpenChange={(open) => !open && setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBill}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Bill Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
        setIsEmailDialogOpen(open);
        if (!open) {
          setBillToEmail(null);
          emailForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
            <DialogDescription>
              The patient's email is pre-filled. You can modify it or add additional recipients.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="patient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="additionalEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Recipients (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Add any additional email addresses separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSendingEmail}>
                  {isSendingEmail ? "Sending..." : "Send Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BillingPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <BillingProvider>
          <BillingContent />
        </BillingProvider>
      </div>
    </MainLayout>
  );
};

export default BillingPage; 