import React from 'react';
import { Prescription } from '@/lib/PrescriptionContext';
import { format, isValid, parseISO, fromUnixTime } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PrescriptionPrintTemplateProps {
  prescription: Prescription;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  doctorName: string;
  doctorSpecialization: string;
}

// Safely format a date, handles various input types
const safeFormatDate = (dateInput: any, formatStr: string, fallback: string = 'N/A'): string => {
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

const PrescriptionPrintTemplate: React.FC<PrescriptionPrintTemplateProps> = ({
  prescription,
  clinicName,
  clinicAddress,
  clinicPhone,
  clinicEmail,
  doctorName,
  doctorSpecialization
}) => {
  const getStatusBadge = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">Active</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">Unknown</span>;
    }
  };

  return (
    <div id="prescription-print-template" className="bg-white p-8 max-w-[210mm] mx-auto font-sans">
      {/* Header with Clinic information */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clinicName}</h1>
            <p className="text-gray-600 mt-1">{clinicAddress}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>{clinicPhone}</span>
              <span>{clinicEmail}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              Prescription #{prescription.id?.substring(0, 8)}
            </div>
            <div className="text-gray-600 mt-1">
              Date: {safeFormatDate(prescription.date, 'MMMM d, yyyy')}
            </div>
            <div className="mt-2">
              {getStatusBadge(prescription.status)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Doctor and Patient Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-500 uppercase">Patient Information</h2>
          <div className="mt-2">
            <div className="font-medium text-lg">{prescription.patientName}</div>
            <div className="text-gray-600 text-sm mt-1">Patient ID: {prescription.patientId}</div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-500 uppercase">Doctor Information</h2>
          <div className="mt-2">
            <div className="font-medium text-lg">{doctorName}</div>
            <div className="text-gray-600 text-sm mt-1">{doctorSpecialization}</div>
          </div>
        </div>
      </div>
      
      {/* Medications */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Prescribed Medications</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Medication</th>
                <th className="py-3 px-4 text-left font-medium">Dosage</th>
                <th className="py-3 px-4 text-left font-medium">Frequency</th>
                <th className="py-3 px-4 text-left font-medium">Duration</th>
                <th className="py-3 px-4 text-left font-medium">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prescription.medications.map((med, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium">{med.name}</td>
                  <td className="py-3 px-4">{med.dosage}</td>
                  <td className="py-3 px-4">{med.frequency}</td>
                  <td className="py-3 px-4">{med.duration}</td>
                  <td className="py-3 px-4">{med.instructions || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notes */}
      {prescription.notes && (
        <div className="mb-8 border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
        </div>
      )}
      
      {/* Signature */}
      <div className="mt-10 pt-8 border-t">
        <div className="flex justify-end">
          <div className="w-64 text-center">
            <div className="border-b border-gray-400 mb-2 pb-4">
              &nbsp;
            </div>
            <p className="text-gray-700 font-medium">{doctorName}</p>
            <p className="text-gray-600 text-sm">{doctorSpecialization}</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
        <p>This is a computer-generated prescription and does not require a physical signature.</p>
        <p className="mt-1">Generated on {safeFormatDate(new Date(), 'MMMM d, yyyy, h:mm a')}</p>
      </div>
    </div>
  );
};

export default PrescriptionPrintTemplate; 