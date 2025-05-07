import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, PlusCircle, Trash, Building, User, FileText, CalculatorIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useBilling, BillItem } from '@/lib/BillingContext';
import { usePatients } from '@/lib/PatientContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/ui/use-toast';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: () => void;
}

const billFormSchema = z.object({
  patientId: z.string({ required_error: 'Please select a patient' }),
  date: z.date({ required_error: 'Please select a date' }),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price must be positive'),
      amount: z.number().min(0, 'Amount must be positive'),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  tax: z.number().min(0, 'Tax must be positive').optional(),
  discount: z.number().min(0, 'Discount must be positive').optional(),
  total: z.number().min(0, 'Total must be positive'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
});

type BillFormValues = z.infer<typeof billFormSchema>;

const NewBillModal: React.FC<NewBillModalProps> = ({
  isOpen,
  onClose,
  onBillCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBill } = useBilling();
  const { patients } = usePatients();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const isCalculating = React.useRef(false);

  // Generate a unique invoice number
  const generateInvoiceNumber = () => {
    const prefix = 'INV-';
    const dateStr = format(new Date(), 'yyyyMMdd');
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${dateStr}-${randomSuffix}`;
  };

  const defaultValues: Partial<BillFormValues> = {
    date: new Date(),
    invoiceNumber: generateInvoiceNumber(),
    items: [
      { description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'pending',
  };

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Calculate totals when items change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Skip if already calculating or no name is provided
      if (isCalculating.current || !name) return;
      
      // Only recalculate if the change is to an item, tax, or discount
      if (name.startsWith('items') || name === 'tax' || name === 'discount') {
        try {
          isCalculating.current = true;
          
          const items = form.getValues('items') || [];
          const tax = form.getValues('tax') || 0;
          const discount = form.getValues('discount') || 0;
          
          // If we're changing an item's quantity or unit price, update its amount
          if (name.includes('quantity') || name.includes('unitPrice')) {
            const match = name.match(/items\.(\d+)\./);
            if (match && match[1]) {
              const index = parseInt(match[1]);
              const item = items[index];
              if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
                const amount = item.quantity * item.unitPrice;
                form.setValue(`items.${index}.amount`, amount, { shouldDirty: true });
              }
            }
          } else {
            // Otherwise, recalculate all amounts
            items.forEach((item, index) => {
              if (typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
                const amount = item.quantity * item.unitPrice;
                form.setValue(`items.${index}.amount`, amount, { shouldDirty: true });
              }
            });
          }
          
          // Calculate subtotal
          const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
          form.setValue('subtotal', subtotal, { shouldDirty: true });
          
          // Calculate total
          const total = subtotal + tax - discount;
          form.setValue('total', total >= 0 ? total : 0, { shouldDirty: true });
        } finally {
          // Make sure we always reset the calculating flag
          isCalculating.current = false;
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: BillFormValues) => {
    setIsSubmitting(true);
    try {
      // Find the selected patient to get the name
      const patient = patients.find(p => p.id === data.patientId);
      
      if (!patient) {
        toast({
          title: 'Error',
          description: 'Selected patient not found',
          variant: 'destructive',
        });
        return;
      }

      await createBill({
        patientId: data.patientId,
        patientName: patient.name,
        date: data.date.toISOString(),
        invoiceNumber: data.invoiceNumber,
        items: data.items as BillItem[],
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        notes: data.notes || '',
        status: data.status,
      });

      onBillCreated();
      form.reset(defaultValues);
    } catch (error) {
      console.error('Failed to create bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bill',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({ description: '', quantity: 1, unitPrice: 0, amount: 0 });
  };

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  // Find the current patient for display
  const currentPatient = selectedPatient 
    ? patients.find(p => p.id === selectedPatient) 
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: settings.location.currency || 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            Create New Bill
          </DialogTitle>
          <DialogDescription>
            Create a bill for a patient with service/product details.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 pb-0 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Clinic Information Section */}
              <Card className="border-muted">
                <CardHeader className="py-4">
                  <CardTitle className="text-md flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Clinic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="font-semibold text-sm">{settings.clinic.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{settings.clinic.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email: {settings.clinic.email}</p>
                      <p className="text-xs text-muted-foreground">Phone: {settings.clinic.phone}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Selection Section */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-md flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePatientChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.length > 0 ? (
                                patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id || ''}>
                                    {patient.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No patients available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentPatient && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <div className="font-medium">{currentPatient.name}</div>
                        <div className="text-muted-foreground mt-1">
                          {currentPatient.phone && <div>Phone: {currentPatient.phone}</div>}
                          {currentPatient.email && <div>Email: {currentPatient.email}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Billing Items Section */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-md flex items-center">
                    <CalculatorIcon className="mr-2 h-4 w-4" />
                    Bill Items
                  </CardTitle>
                  <CardDescription>Add services, procedures, or products</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 space-y-6">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-6 md:col-span-5">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : undefined}>
                                  Description
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Service description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : undefined}>
                                  Qty
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    min={1}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : undefined}>
                                  Price
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(Number(e.target.value))} 
                                    min={0}
                                    step={0.01}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : undefined}>
                                  Amount
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    value={field.value.toFixed(2)} 
                                    disabled 
                                    className="bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="h-8 w-8"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={addItem}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>

                  {/* Totals Section */}
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <FormField
                          control={form.control}
                          name="subtotal"
                          render={({ field }) => (
                            <span className="font-medium">{formatCurrency(field.value)}</span>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Tax:</span>
                        <div className="w-[100px]">
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(Number(e.target.value))} 
                                    min={0}
                                    step={0.01}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Discount:</span>
                        <div className="w-[100px]">
                          <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(Number(e.target.value))} 
                                    min={0}
                                    step={0.01}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <FormField
                          control={form.control}
                          name="total"
                          render={({ field }) => (
                            <span className="text-primary text-lg">{formatCurrency(field.value)}</span>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details Section */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-md">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add any additional notes about this bill..."
                            className="resize-none min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting}
            className={isSubmitting ? "opacity-70" : ""}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⭘</span>
                Creating...
              </>
            ) : (
              'Create Bill'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewBillModal; 