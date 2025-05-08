import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import { AppointmentsProvider } from "@/lib/AppointmentsContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import { PatientProvider } from "@/lib/PatientContext";
import { MedicalRecordsProvider } from "@/lib/MedicalRecordsContext";
import { PrescriptionProvider } from "@/lib/PrescriptionContext";
import { BillingProvider } from "@/lib/BillingContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <PatientProvider>
          <MedicalRecordsProvider>
            <PrescriptionProvider>
              <BillingProvider>
                <AppointmentsProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        
                        {/* Protected routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/" element={<Index />} />
                          <Route path="/appointments" element={<Appointments />} />
                          <Route path="/patients" element={<Patients />} />
                          <Route path="/patients/:id" element={<PatientDetails />} />
                          <Route path="/records" element={<MedicalRecords />} />
                          <Route path="/prescriptions" element={<Prescriptions />} />
                          <Route path="/billing" element={<Billing />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/settings" element={<Settings />} />
                        </Route>
                        
                        {/* Catch-all route for 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </AppointmentsProvider>
              </BillingProvider>
            </PrescriptionProvider>
          </MedicalRecordsProvider>
        </PatientProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
