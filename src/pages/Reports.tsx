import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/lib/SettingsContext';
import { usePatients } from '@/lib/PatientContext';
import { useAppointments } from '@/lib/AppointmentsContext';
import { useBilling } from '@/lib/BillingContext';
import { 
  Calendar, 
  Users, 
  ClipboardCheck, 
  DollarSign, 
  BarChart, 
  PieChart, 
  LineChart,
  TrendingUp
} from 'lucide-react';
import {
  BarChart as ReChartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as ReChartsLineChart,
  Line,
  PieChart as ReChartsPieChart,
  Pie,
  Cell
} from 'recharts';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports = () => {
  const { settings } = useSettings();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { bills } = useBilling();
  const [timeframe, setTimeframe] = useState('30days');

  // Format currency based on settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.location.currency || 'USD',
    }).format(amount);
  };

  // Calculate monthly revenue data
  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Initialize data for all months with 0
    const monthlyData = months.map(month => ({
      name: month,
      revenue: 0,
    }));
    
    // Filter only paid bills from the current year
    const paidBills = bills.filter(bill => {
      if (bill.status !== 'paid') return false;
      
      try {
        const billDate = new Date(bill.date);
        return billDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    
    // Aggregate bills by month
    paidBills.forEach(bill => {
      try {
        const billDate = new Date(bill.date);
        const monthIndex = billDate.getMonth();
        monthlyData[monthIndex].revenue += bill.total;
      } catch {
        // Skip invalid dates
      }
    });
    
    return monthlyData;
  }, [bills]);

  // Calculate appointment status distribution
  const appointmentStatusData = useMemo(() => {
    const statusCount = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      'in-progress': 0
    };
    
    appointments.forEach(appointment => {
      statusCount[appointment.status] += 1;
    });
    
    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
      value
    }));
  }, [appointments]);

  // Calculate patient demographics by gender
  const patientDemographics = useMemo(() => {
    const genderCount = { Male: 0, Female: 0, Other: 0 };
    
    patients.forEach(patient => {
      if (patient.gender === 'male') genderCount.Male += 1;
      else if (patient.gender === 'female') genderCount.Female += 1;
      else genderCount.Other += 1;
    });
    
    return Object.entries(genderCount).map(([name, value]) => ({
      name,
      value
    }));
  }, [patients]);

  // Calculate appointments over time
  const appointmentTrends = useMemo(() => {
    // Get last 6 months
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        name: month.toLocaleString('default', { month: 'short' }),
        date: month.toISOString().split('T')[0].substring(0, 7) // YYYY-MM format
      });
    }
    
    // Count appointments per month
    const monthlyAppointments = last6Months.map(month => {
      const count = appointments.filter(appointment => {
        return appointment.date.startsWith(month.date);
      }).length;
      
      return {
        name: month.name,
        appointments: count
      };
    });
    
    return monthlyAppointments;
  }, [appointments]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">Insights and statistics for {settings.clinic.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.total, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(patients.length * 0.05)} new patients this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {appointments.filter(a => a.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  bills.filter(bill => bill.status === 'paid').length > 0
                    ? bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.total, 0) / 
                      bills.filter(bill => bill.status === 'paid').length
                    : 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Per invoice
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>
                  Revenue generated each month for {new Date().getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsBarChart
                    data={revenueData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                          currency: settings.location.currency || 'USD',
                          style: 'currency',
                        }).format(value)
                      } 
                    />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
                  </ReChartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paid vs Unpaid Bills</CardTitle>
                  <CardDescription>
                    Breakdown of invoice payment status
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPieChart>
                      <Pie
                        data={[
                          { name: 'Paid', value: bills.filter(bill => bill.status === 'paid').length },
                          { name: 'Pending', value: bills.filter(bill => bill.status === 'pending').length },
                          { name: 'Cancelled', value: bills.filter(bill => bill.status === 'cancelled').length }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Paid', value: bills.filter(bill => bill.status === 'paid').length },
                          { name: 'Pending', value: bills.filter(bill => bill.status === 'pending').length },
                          { name: 'Cancelled', value: bills.filter(bill => bill.status === 'cancelled').length }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} invoices`, '']} />
                    </ReChartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Revenue Sources</CardTitle>
                  <CardDescription>
                    Most common billable services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="ml-4 min-w-[80px] text-sm">Consultations (70%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="ml-4 min-w-[80px] text-sm">Lab Tests (45%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="ml-4 min-w-[80px] text-sm">Procedures (35%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="ml-4 min-w-[80px] text-sm">Follow-ups (25%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="ml-4 min-w-[80px] text-sm">Vaccines (15%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of appointment statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} appointments`, '']} />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Appointments by Time of Day</CardTitle>
                <CardDescription>
                  Distribution of appointments throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsBarChart
                    data={[
                      { name: '8-10 AM', appointments: 15 },
                      { name: '10-12 PM', appointments: 22 },
                      { name: '12-2 PM', appointments: 8 },
                      { name: '2-4 PM', appointments: 17 },
                      { name: '4-6 PM', appointments: 12 },
                    ]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                    <Legend />
                    <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
                  </ReChartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Demographics</CardTitle>
                <CardDescription>
                  Distribution by gender
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPieChart>
                    <Pie
                      data={patientDemographics}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {patientDemographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} patients`, '']} />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>
                  Patient age groups
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsBarChart
                    data={[
                      { name: '0-18', count: 25 },
                      { name: '19-35', count: 42 },
                      { name: '36-50', count: 38 },
                      { name: '51-65', count: 35 },
                      { name: '65+', count: 25 },
                    ]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                    <Legend />
                    <Bar dataKey="count" fill="#00C49F" name="Patients" />
                  </ReChartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Trends</CardTitle>
                <CardDescription>
                  Appointments over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full aspect-[3/2]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsLineChart
                    data={appointmentTrends}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                    <Legend />
                    <Line type="monotone" dataKey="appointments" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </ReChartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Diagnoses</CardTitle>
                  <CardDescription>
                    Most frequent patient conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm">Hypertension</span>
                      </div>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm">Diabetes</span>
                      </div>
                      <span className="text-sm font-medium">22%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Upper Respiratory Infections</span>
                      </div>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm">Allergies</span>
                      </div>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                        <span className="text-sm">Back Pain</span>
                      </div>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Patient Visit Frequency</CardTitle>
                  <CardDescription>
                    How often patients visit the clinic
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPieChart>
                      <Pie
                        data={[
                          { name: 'First Visit', value: 32 },
                          { name: 'Monthly', value: 28 },
                          { name: 'Quarterly', value: 22 },
                          { name: 'Annually', value: 15 },
                          { name: 'Irregular', value: 3 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'First Visit', value: 32 },
                          { name: 'Monthly', value: 28 },
                          { name: 'Quarterly', value: 22 },
                          { name: 'Annually', value: 15 },
                          { name: 'Irregular', value: 3 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} patients`, '']} />
                    </ReChartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reports; 