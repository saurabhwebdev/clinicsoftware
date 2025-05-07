import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceProps {
  trigger?: React.ReactNode;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger || <span className="underline cursor-pointer">Terms of Service</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <h3 className="text-lg font-semibold">1. Introduction</h3>
            <p>
              Welcome to ClinicFlow, a digital platform designed to streamline clinic management and enhance 
              healthcare service delivery. These Terms of Service govern your use of the ClinicFlow application, 
              website, and services.
            </p>
            
            <h3 className="text-lg font-semibold">2. Acceptance of Terms</h3>
            <p>
              By accessing or using ClinicFlow, you agree to be bound by these Terms of Service. If you disagree 
              with any part of the terms, you may not access the service.
            </p>
            
            <h3 className="text-lg font-semibold">3. Description of Service</h3>
            <p>
              ClinicFlow provides clinic management tools including but not limited to patient records management, 
              appointment scheduling, billing, prescription management, and reporting. The service is provided "as is" 
              and may be modified at our discretion.
            </p>
            
            <h3 className="text-lg font-semibold">4. User Accounts</h3>
            <p>
              To use certain features of ClinicFlow, you must register for an account. You are responsible for 
              maintaining the confidentiality of your account information and for all activities that occur under your account. 
              You agree to notify us immediately of any unauthorized use of your account.
            </p>
            
            <h3 className="text-lg font-semibold">5. User Responsibilities</h3>
            <p>
              As a user of ClinicFlow, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Protect your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect the privacy and rights of patients and other users</li>
            </ul>
            
            <h3 className="text-lg font-semibold">6. Patient Data and Privacy</h3>
            <p>
              ClinicFlow handles sensitive healthcare information. By using our service, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You have obtained appropriate consent from patients for data processing</li>
              <li>You will use patient data only for legitimate healthcare purposes</li>
              <li>You will comply with all applicable healthcare privacy laws and regulations</li>
            </ul>
            <p>
              For more information on how we handle data, please see our Privacy Policy.
            </p>
            
            <h3 className="text-lg font-semibold">7. Intellectual Property</h3>
            <p>
              ClinicFlow and its original content, features, and functionality are owned by us and are protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            
            <h3 className="text-lg font-semibold">8. Limitation of Liability</h3>
            <p>
              In no event shall ClinicFlow, its directors, employees, partners, agents, suppliers, or affiliates be 
              liable for any indirect, incidental, special, consequential, or punitive damages, including without 
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access 
              to or use of or inability to access or use the service.
            </p>
            
            <h3 className="text-lg font-semibold">9. Changes to Terms</h3>
            <p>
              We reserve the right to modify or replace these Terms at any time. It is your responsibility to review 
              these Terms periodically for changes. Your continued use of ClinicFlow following the posting of any changes 
              constitutes acceptance of those changes.
            </p>
            
            <h3 className="text-lg font-semibold">10. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
              ClinicFlow operates, without regard to its conflict of law provisions.
            </p>
            
            <h3 className="text-lg font-semibold">11. Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              support@clinicflow.com
            </p>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfService; 