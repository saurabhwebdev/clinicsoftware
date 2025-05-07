import React, { useEffect, useState } from 'react';
import { format, isValid, parseISO, fromUnixTime } from 'date-fns';
import { AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Printer, FileText, Building, User, ClipboardList, Calendar, Download } from 'lucide-react';
import { Prescription, usePrescriptions } from '@/lib/PrescriptionContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { generatePrescriptionPDF } from '@/lib/utils/pdf';

interface PrescriptionDetailProps {
  prescriptionId: string;
  onClose: () => void;
}

const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({ prescriptionId, onClose }) => {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const { prescriptions } = usePrescriptions();
  const { settings } = useSettings();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrescription = async () => {
      setLoading(true);
      try {
        // Find the prescription in the context
        const found = prescriptions.find(p => p.id === prescriptionId);
        if (found) {
          setPrescription(found);
        } else {
          console.error('Prescription not found');
        }
      } catch (error) {
        console.error('Error fetching prescription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [prescriptionId, prescriptions]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!prescription) return;
    
    try {
      await generatePrescriptionPDF(prescription, settings);
      toast({
        title: "Success",
        description: "Prescription PDF generated successfully",
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

  const getStatusBadge = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Safely format a date string or timestamp, returning a fallback if invalid
  const safeFormatDate = (dateInput: any, formatStr: string, fallback: string = 'Invalid date'): string => {
    try {
      if (!dateInput) return fallback;
      
      // If it's already a Date object
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? format(dateInput, formatStr) : fallback;
      }
      
      // If it's a Firebase Timestamp (has seconds and nanoseconds)
      if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
        return format(fromUnixTime(dateInput.seconds), formatStr);
      }
      
      // If it's a string (could be ISO format)
      if (typeof dateInput === 'string') {
        const date = parseISO(dateInput);
        return isValid(date) ? format(date, formatStr) : fallback;
      }
      
      return fallback;
    } catch (error) {
      console.error('Error formatting date:', error);
      return fallback;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <AlertDialogTitle className="text-xl flex items-center">
          <ClipboardList className="mr-2 h-5 w-5" />
          Prescription Details
        </AlertDialogTitle>
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="ghost" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDialogHeader>
      <Separator className="my-2" />
      
      {loading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : prescription ? (
        <ScrollArea className="flex-1 pr-3">
          <div id="prescription-content" className="space-y-6 pt-3 pb-6">
            {/* Clinic Header */}
            <Card className="bg-muted/50 border-none">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{settings.clinic.name}</h3>
                    <p className="text-sm text-muted-foreground">{settings.clinic.address}</p>
                    <div className="flex items-center gap-4 text-sm pt-1">
                      <span>{settings.clinic.email}</span>
                      <span>{settings.clinic.phone}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {prescription.date ? safeFormatDate(prescription.date, 'MMMM d, yyyy') : 'Date not available'}
                      </span>
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(prescription.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient and Doctor Information */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Patient Information */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <h3 className="font-semibold text-base">{prescription.patientName}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: {prescription.patientId}</p>
                </CardContent>
              </Card>

              {/* Doctor Information */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <h3 className="font-semibold text-base">{prescription.doctor}</h3>
                  <p className="text-sm text-muted-foreground">{settings.doctor.specialization}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Medications */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Instructions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescription.medications.map((med, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.duration}</TableCell>
                          <TableCell>{med.instructions || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {/* Notes */}
            {prescription.notes && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-sm whitespace-pre-wrap">{prescription.notes}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Footer with timestamps */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>
                  Created: {safeFormatDate(prescription.createdAt, 'MMM d, yyyy h:mm a', 'Not available')}
                </span>
              </div>
              {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="h-3 w-3" />
                  <span>
                    Last Updated: {safeFormatDate(prescription.updatedAt, 'MMM d, yyyy h:mm a', 'Not available')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Prescription not found</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetail; 