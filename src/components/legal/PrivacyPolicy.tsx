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

interface PrivacyPolicyProps {
  trigger?: React.ReactNode;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger || <span className="underline cursor-pointer">Privacy Policy</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <h3 className="text-lg font-semibold">1. Introduction</h3>
            <p>
              ClinicFlow is committed to protecting your privacy. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our service.
            </p>
            
            <h3 className="text-lg font-semibold">2. Information We Collect</h3>
            <h4 className="font-medium mt-3 mb-1">2.1 Personal Information</h4>
            <p>
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Register for an account</li>
              <li>Enter patient data</li>
              <li>Send us an email or contact us</li>
              <li>Fill out forms within the application</li>
            </ul>
            
            <h4 className="font-medium mt-3 mb-1">2.2 Healthcare Information</h4>
            <p>
              As a healthcare management platform, ClinicFlow may process sensitive health information of patients, 
              including medical histories, diagnoses, treatment plans, and billing information.
            </p>
            
            <h4 className="font-medium mt-3 mb-1">2.3 Automatically Collected Information</h4>
            <p>
              When you access our service, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (e.g., IP address, browser type)</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
            
            <h3 className="text-lg font-semibold">3. How We Use Your Information</h3>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our service</li>
              <li>Process and complete healthcare transactions</li>
              <li>Comply with legal obligations</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Improve and optimize our service</li>
            </ul>
            
            <h3 className="text-lg font-semibold">4. Data Storage and Security</h3>
            <p>
              We implement appropriate technical and organizational security measures to protect your information from 
              unauthorized access, disclosure, alteration, and destruction. However, no internet or electronic storage system 
              is 100% secure, and we cannot guarantee absolute security.
            </p>
            
            <h3 className="text-lg font-semibold">5. Compliance with Healthcare Regulations</h3>
            <p>
              If you are using ClinicFlow to process patient data, you are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Obtaining appropriate patient consent</li>
              <li>Complying with all applicable healthcare privacy laws and regulations</li>
              <li>Ensuring proper authorization for access to patient information</li>
            </ul>
            
            <h3 className="text-lg font-semibold">6. Data Sharing and Disclosure</h3>
            <p>
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who help us deliver our services</li>
              <li>Legal and regulatory authorities when required by law</li>
              <li>Business partners with your consent</li>
            </ul>
            <p>
              We do not sell or rent your personal information to third parties.
            </p>
            
            <h3 className="text-lg font-semibold">7. Your Rights</h3>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
            </ul>
            
            <h3 className="text-lg font-semibold">8. Children's Privacy</h3>
            <p>
              Our service is not intended for individuals under the age of 18. We do not knowingly collect or solicit 
              personal information from children. If we learn that we have collected personal information from a child, 
              we will delete that information as quickly as possible.
            </p>
            
            <h3 className="text-lg font-semibold">9. Changes to This Privacy Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
            
            <h3 className="text-lg font-semibold">10. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              privacy@clinicflow.com
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

export default PrivacyPolicy; 