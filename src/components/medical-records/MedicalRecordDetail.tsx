import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileEdit, Trash2, AlertCircle, Calendar, FileText, Pill } from 'lucide-react';
import { useMedicalRecords, MedicalRecord } from '@/lib/MedicalRecordsContext';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface MedicalRecordDetailProps {
  recordId: string;
  onClose: () => void;
}

const MedicalRecordDetail: React.FC<MedicalRecordDetailProps> = ({ recordId, onClose }) => {
  const { medicalRecords, removeMedicalRecord } = useMedicalRecords();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const foundRecord = medicalRecords.find(r => r.id === recordId);
    setRecord(foundRecord || null);
  }, [recordId, medicalRecords]);

  const handleDeleteRecord = async () => {
    if (!record?.id) return;
    
    setIsDeleting(true);
    try {
      await removeMedicalRecord(record.id);
      setIsDeleteDialogOpen(false);
      onClose();
      toast({
        title: "Success",
        description: "Medical record deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medical record",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!record) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Record not found</h3>
        <p className="text-sm text-muted-foreground">
          The medical record you're looking for could not be found.
        </p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{record.diagnosis}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onClose}>
                <FileEdit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(record.date), 'MMMM d, yyyy')}</span>
          </div>
        </CardHeader>
        
        <CardContent className="px-0 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Patient Information</h3>
            <p className="text-sm">{record.patientName}</p>
            <p className="text-xs text-muted-foreground">ID: {record.patientId}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Symptoms</h3>
            {record.symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="bg-background">
                    {symptom}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No symptoms recorded</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Treatment</h3>
            <p className="text-sm whitespace-pre-line">{record.treatment}</p>
          </div>
          
          {record.prescription && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Pill className="h-4 w-4" />
                <span>Prescription</span>
              </h3>
              <p className="text-sm whitespace-pre-line">{record.prescription}</p>
            </div>
          )}
          
          {record.notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-line">{record.notes}</p>
            </div>
          )}
          
          {record.attachments && record.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Attachments</h3>
              <div className="grid grid-cols-2 gap-2">
                {record.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm border rounded-md p-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-0 pt-4 border-t flex justify-between">
          <div className="text-xs text-muted-foreground">
            {record.createdAt && (
              <div>Created: {format(new Date(record.createdAt), 'MMM d, yyyy')}</div>
            )}
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <div>Updated: {format(new Date(record.updatedAt), 'MMM d, yyyy')}</div>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medical record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteRecord();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MedicalRecordDetail; 