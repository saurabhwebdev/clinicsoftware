import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { X, Download, Edit, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useBilling, Bill } from '@/lib/BillingContext';
import { useToast } from '@/components/ui/use-toast';
import { generateBillPDF } from '@/lib/utils/pdf';
import { useSettings } from '@/lib/SettingsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BillDetailProps {
  billId: string;
  onClose: () => void;
}

const BillDetail: React.FC<BillDetailProps> = ({ billId, onClose }) => {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const { bills, updateBillData } = useBilling();
  const { toast } = useToast();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      try {
        // Find the bill in the context
        const foundBill = bills.find(b => b.id === billId);
        if (foundBill) {
          setBill(foundBill);
        } else {
          toast({
            title: "Error",
            description: "Bill not found",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching bill:', error);
        toast({
          title: "Error",
          description: "Failed to load bill details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId, bills, toast]);

  const handleExportPDF = async () => {
    if (!bill) return;

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

  const handleStatusChange = async (newStatus: 'pending' | 'paid' | 'cancelled') => {
    if (!bill || isStatusUpdating) return;

    setIsStatusUpdating(true);
    try {
      const updatedBill = { ...bill, status: newStatus };
      await updateBillData(billId, updatedBill);
      setBill(updatedBill);
      
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
      setIsStatusUpdating(false);
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
    <div className="relative h-full flex flex-col max-h-[80vh]">
      <AlertDialogHeader className="pb-0">
        <AlertDialogTitle className="text-2xl flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            {loading ? <Skeleton className="h-8 w-40" /> : 'Bill Details'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportPDF}
              disabled={loading || !bill}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </AlertDialogTitle>
      </AlertDialogHeader>

      <ScrollArea className="flex-grow my-4">
        {loading ? (
          <div className="space-y-4 p-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : bill ? (
          <div className="space-y-6 pr-4">
            {/* Header and Patient Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Patient Name</p>
                <p className="font-semibold">{bill.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Date</p>
                <p className="font-semibold">{format(new Date(bill.date), 'MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Invoice Number</p>
                <p className="font-semibold">{bill.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(bill.status)}
                  <Select
                    value={bill.status}
                    onValueChange={(value) => handleStatusChange(value as Bill['status'])}
                    disabled={isStatusUpdating}
                  >
                    <SelectTrigger className="w-[120px] h-7">
                      <SelectValue placeholder="Change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {isStatusUpdating && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Clinic Information */}
            <div className="border rounded-md p-4 bg-muted/50">
              <p className="font-semibold">{settings.clinic.name}</p>
              <p className="text-sm text-muted-foreground">{settings.clinic.address}</p>
              <div className="grid grid-cols-2 mt-2 text-sm">
                <p className="text-muted-foreground">Email: {settings.clinic.email}</p>
                <p className="text-muted-foreground">Phone: {settings.clinic.phone}</p>
              </div>
            </div>

            {/* Bill Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted text-muted-foreground text-sm">
                    <tr>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bill.items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border rounded-md p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.tax !== undefined && bill.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(bill.tax)}</span>
                  </div>
                )}
                {bill.discount !== undefined && bill.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(bill.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(bill.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {bill.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="border rounded-md p-3 text-sm text-muted-foreground">
                  {bill.notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Bill not found</p>
          </div>
        )}
      </ScrollArea>

      <AlertDialogFooter className="pt-2 border-t mt-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </AlertDialogFooter>
    </div>
  );
};

export default BillDetail; 