import React from 'react';
import { MedicalRecord } from '@/lib/MedicalRecordsContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileText, AlertCircle, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicalRecordListProps {
  records: MedicalRecord[];
  onSelectRecord: (id: string) => void;
  loading: boolean;
}

const MedicalRecordList: React.FC<MedicalRecordListProps> = ({
  records,
  onSelectRecord,
  loading,
}) => {
  // Loading skeletons
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // No records
  if (records.length === 0) {
    return (
      <div className="text-center p-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Medical Records</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No medical records found for this date. Create a new record using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card
          key={record.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => record.id && onSelectRecord(record.id)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-medium text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  {record.diagnosis}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Patient: {record.patientName}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-background">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </Badge>
                  {record.symptoms.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {record.symptoms.length} symptom{record.symptoms.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {record.prescription && (
                    <Badge variant="outline" className={cn("text-xs", "bg-green-50", "border-green-200", "text-green-700")}>
                      Prescription
                    </Badge>
                  )}
                </div>
              </div>
              <div className="bg-primary/10 rounded-full p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MedicalRecordList; 