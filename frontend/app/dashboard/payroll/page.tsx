'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  TrendingUp,
  CalendarCheck,
  Search,
  Play,
  FileText,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Banknote,
  Users,
  ChevronRight,
  Printer,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

/* ──────────────────── Types ──────────────────── */

interface PayrollEntry {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  hourlyRate: number;
  hoursWorked: number;
  overtimeHours: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending' | 'Processing';
}

interface PayPeriodHistory {
  id: number;
  period: string;
  totalPaid: number;
  employees: number;
  status: 'Completed' | 'Processing';
  date: string;
}

/* ──────────────────── Helper ──────────────────── */

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/* ──────────────────── Seed Data ──────────────────── */

const buildPayroll = (): PayrollEntry[] => {
  const staff = [
    { id: 1, name: 'Ramona', role: 'Head Housekeeper', initials: 'RM', color: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300', hourlyRate: 22.0, hoursWorked: 80, overtimeHours: 4 },
    { id: 2, name: 'Tania', role: 'Assistant Housekeeper', initials: 'TN', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300', hourlyRate: 19.5, hoursWorked: 78, overtimeHours: 2 },
    { id: 3, name: 'Gladys', role: 'Lead Housekeeper', initials: 'GD', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300', hourlyRate: 20.0, hoursWorked: 80, overtimeHours: 6 },
    { id: 4, name: 'Zuli', role: 'Housekeeper', initials: 'ZL', color: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-300', hourlyRate: 17.5, hoursWorked: 76, overtimeHours: 0 },
    { id: 5, name: 'Eucaria', role: 'Housekeeper', initials: 'EC', color: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300', hourlyRate: 16.5, hoursWorked: 80, overtimeHours: 3 },
    { id: 6, name: 'Jeimi', role: 'Housekeeper', initials: 'JM', color: 'bg-pink-500/10 text-pink-700 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-300', hourlyRate: 16.5, hoursWorked: 72, overtimeHours: 0 },
  ];

  return staff.map((s) => {
    const regularPay = s.hoursWorked * s.hourlyRate;
    const otPay = s.overtimeHours * s.hourlyRate * 1.5;
    const grossPay = regularPay + otPay;
    const taxRate = 0.22; // ~22% (Fed + CA State + FICA)
    const benefitsFlat = 45;
    const deductions = Math.round(grossPay * taxRate * 100) / 100 + benefitsFlat;
    const netPay = Math.round((grossPay - deductions) * 100) / 100;

    return {
      ...s,
      grossPay: Math.round(grossPay * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      netPay,
      status: s.id <= 4 ? 'Paid' as const : 'Pending' as const,
    };
  });
};

const payHistory: PayPeriodHistory[] = [
  { id: 1, period: 'Jun 2 – Jun 15, 2026', totalPaid: 8426.30, employees: 6, status: 'Completed', date: 'Jun 16, 2026' },
  { id: 2, period: 'May 19 – Jun 1, 2026', totalPaid: 8190.15, employees: 6, status: 'Completed', date: 'Jun 2, 2026' },
  { id: 3, period: 'May 5 – May 18, 2026', totalPaid: 8312.80, employees: 6, status: 'Completed', date: 'May 19, 2026' },
  { id: 4, period: 'Apr 20 – May 4, 2026', totalPaid: 7985.44, employees: 5, status: 'Completed', date: 'May 5, 2026' },
  { id: 5, period: 'Apr 6 – Apr 19, 2026', totalPaid: 7650.20, employees: 5, status: 'Completed', date: 'Apr 20, 2026' },
];

/* ──────────────────── Component ──────────────────── */

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollEntry[]>(buildPayroll);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [viewingPayslip, setViewingPayslip] = useState<PayrollEntry | null>(null);
  const [editingRate, setEditingRate] = useState<PayrollEntry | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Derived stats
  const totalGross = payroll.reduce((s, p) => s + p.grossPay, 0);
  const totalHours = payroll.reduce((s, p) => s + p.hoursWorked + p.overtimeHours, 0);
  const avgRate = payroll.reduce((s, p) => s + p.hourlyRate, 0) / payroll.length;
  const totalNet = payroll.reduce((s, p) => s + p.netPay, 0);

  const filtered = payroll.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPayroll((prev) =>
        prev.map((p) => (p.status === 'Pending' ? { ...p, status: 'Processing' as const } : p))
      );
      setTimeout(() => {
        setPayroll((prev) =>
          prev.map((p) => (p.status === 'Processing' ? { ...p, status: 'Paid' as const } : p))
        );
        setIsProcessing(false);
        setShowRunPayroll(false);
        toast.success('Payroll processed successfully! All employees marked as Paid.');
      }, 1500);
    }, 1000);
  };

  const handleSaveRate = () => {
    if (!editingRate) return;
    const newRate = parseFloat(editRateValue);
    if (isNaN(newRate) || newRate < 16.0) {
      toast.error('Rate must be at least $16.00 (CA minimum wage).');
      return;
    }
    setPayroll((prev) =>
      prev.map((p) => {
        if (p.id !== editingRate.id) return p;
        const regularPay = p.hoursWorked * newRate;
        const otPay = p.overtimeHours * newRate * 1.5;
        const grossPay = Math.round((regularPay + otPay) * 100) / 100;
        const deductions = Math.round(grossPay * 0.22 * 100) / 100 + 45;
        const netPay = Math.round((grossPay - deductions) * 100) / 100;
        return { ...p, hourlyRate: newRate, grossPay, deductions, netPay };
      })
    );
    toast.success(`Updated ${editingRate.name}'s pay rate to ${fmt(newRate)}/hr.`);
    setEditingRate(null);
    setEditRateValue('');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300',
      Pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300',
      Processing: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300',
    };
    const icons: Record<string, React.ReactNode> = {
      Paid: <CheckCircle className="h-3 w-3" />,
      Pending: <AlertCircle className="h-3 w-3" />,
      Processing: <Loader2 className="h-3 w-3 animate-spin" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || ''}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const pendingCount = payroll.filter((p) => p.status === 'Pending').length;

  return (
    <div className="space-y-8 max-w-[92rem] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Banknote className="h-6 w-6 text-primary" />
            Payroll Management
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Manage wages, hours, and payment history for all staff
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border bg-muted/30 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
            Jun 16 – Jun 28, 2026 · Biweekly
          </div>
          <Button
            size="sm"
            className="font-bold text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
            onClick={() => setShowRunPayroll(true)}
            disabled={pendingCount === 0}
          >
            <Play className="h-3.5 w-3.5" />
            Run Payroll {pendingCount > 0 && `(${pendingCount})`}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Payroll</p>
                <p className="text-2xl font-black mt-1 tracking-tight">{fmt(totalGross)}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Gross this period</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Hours</p>
                <p className="text-2xl font-black mt-1 tracking-tight">{totalHours}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Across {payroll.length} staff</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Hourly Rate</p>
                <p className="text-2xl font-black mt-1 tracking-tight">{fmt(avgRate)}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">CA min $16.00/hr</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Payout</p>
                <p className="text-2xl font-black mt-1 tracking-tight">{fmt(totalNet)}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">After deductions</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Current Period Payroll
              </CardTitle>
              <CardDescription className="text-xs">Jun 16 – Jun 28, 2026 · {payroll.length} employees</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employees…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs font-medium bg-muted/30 border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t bg-muted/30">
                  <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Employee</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Rate/hr</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Hours</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">OT Hrs</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Gross Pay</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Deductions</th>
                  <th className="text-right font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Net Pay</th>
                  <th className="text-center font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Status</th>
                  <th className="text-center font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-black uppercase shadow-2xs flex-shrink-0 ${entry.color}`}>
                          {entry.initials}
                        </span>
                        <div>
                          <p className="font-bold text-foreground">{entry.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{entry.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-bold tabular-nums">{fmt(entry.hourlyRate)}</td>
                    <td className="text-right px-4 py-3 font-semibold tabular-nums">{entry.hoursWorked}</td>
                    <td className="text-right px-4 py-3 font-semibold tabular-nums">
                      {entry.overtimeHours > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">{entry.overtimeHours}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-right px-4 py-3 font-bold tabular-nums">{fmt(entry.grossPay)}</td>
                    <td className="text-right px-4 py-3 font-semibold tabular-nums text-red-600 dark:text-red-400">
                      −{fmt(entry.deductions)}
                    </td>
                    <td className="text-right px-4 py-3 font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                      {fmt(entry.netPay)}
                    </td>
                    <td className="text-center px-4 py-3">{statusBadge(entry.status)}</td>
                    <td className="text-center px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                          title="View Payslip"
                          onClick={() => setViewingPayslip(entry)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                          title="Edit Pay Rate"
                          onClick={() => {
                            setEditingRate(entry);
                            setEditRateValue(entry.hourlyRate.toString());
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground font-medium">
                      No employees match your search.
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Totals Footer */}
              <tfoot>
                <tr className="border-t bg-muted/20 font-black">
                  <td className="px-4 py-2.5 text-xs">Totals</td>
                  <td className="px-4 py-2.5"></td>
                  <td className="text-right px-4 py-2.5 text-xs tabular-nums">{payroll.reduce((s, p) => s + p.hoursWorked, 0)}</td>
                  <td className="text-right px-4 py-2.5 text-xs tabular-nums text-amber-600 dark:text-amber-400">{payroll.reduce((s, p) => s + p.overtimeHours, 0)}</td>
                  <td className="text-right px-4 py-2.5 text-xs tabular-nums">{fmt(totalGross)}</td>
                  <td className="text-right px-4 py-2.5 text-xs tabular-nums text-red-600 dark:text-red-400">−{fmt(payroll.reduce((s, p) => s + p.deductions, 0))}</td>
                  <td className="text-right px-4 py-2.5 text-xs tabular-nums text-emerald-700 dark:text-emerald-300">{fmt(totalNet)}</td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Payment History
          </CardTitle>
          <CardDescription className="text-xs">Recent pay period summaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {payHistory.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/5 border flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{h.period}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {h.employees} employees · Processed {h.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-foreground tabular-nums">{fmt(h.totalPaid)}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Total paid</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {h.status}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ────────────── View Payslip Dialog ────────────── */}
      <Dialog open={!!viewingPayslip} onOpenChange={(open) => !open && setViewingPayslip(null)}>
        <DialogContent className="max-w-md bg-card border rounded-2xl p-6 shadow-2xl">
          {viewingPayslip && (
            <div className="space-y-5">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-11 w-11 rounded-full border flex items-center justify-center text-sm font-black uppercase shadow-2xs ${viewingPayslip.color}`}>
                      {viewingPayslip.initials}
                    </span>
                    <div>
                      <DialogTitle className="text-base font-black text-foreground">{viewingPayslip.name}</DialogTitle>
                      <span className="text-xs text-muted-foreground font-semibold">{viewingPayslip.role}</span>
                    </div>
                  </div>
                  {statusBadge(viewingPayslip.status)}
                </div>
              </DialogHeader>

              {/* Payslip Breakdown */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Earnings Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Regular Pay ({viewingPayslip.hoursWorked} hrs × {fmt(viewingPayslip.hourlyRate)})</span>
                    <span className="font-bold tabular-nums">{fmt(viewingPayslip.hoursWorked * viewingPayslip.hourlyRate)}</span>
                  </div>
                  {viewingPayslip.overtimeHours > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Overtime ({viewingPayslip.overtimeHours} hrs × {fmt(viewingPayslip.hourlyRate * 1.5)})</span>
                      <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{fmt(viewingPayslip.overtimeHours * viewingPayslip.hourlyRate * 1.5)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-xs">
                    <span className="font-bold">Gross Pay</span>
                    <span className="font-black tabular-nums">{fmt(viewingPayslip.grossPay)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deductions</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Federal + CA State + FICA (~22%)</span>
                    <span className="font-bold tabular-nums text-red-600 dark:text-red-400">−{fmt(Math.round(viewingPayslip.grossPay * 0.22 * 100) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Benefits (Health + Dental)</span>
                    <span className="font-bold tabular-nums text-red-600 dark:text-red-400">−{fmt(45)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-xs">
                    <span className="font-bold">Total Deductions</span>
                    <span className="font-black tabular-nums text-red-600 dark:text-red-400">−{fmt(viewingPayslip.deductions)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black">Net Pay</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{fmt(viewingPayslip.netPay)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Pay Period: Jun 16 – Jun 28, 2026</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold gap-1.5 h-9 cursor-pointer"
                  onClick={() => {
                    toast.success(`Payslip for ${viewingPayslip.name} sent to printer.`);
                  }}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs font-bold gap-1.5 h-9 cursor-pointer"
                  onClick={() => {
                    toast.success(`Payslip downloaded as ${viewingPayslip.name}_payslip_jun2026.pdf`);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ────────────── Run Payroll Confirmation Dialog ────────────── */}
      <Dialog open={showRunPayroll} onOpenChange={(open) => !open && !isProcessing && setShowRunPayroll(false)}>
        <DialogContent className="max-w-sm bg-card border rounded-2xl p-6 shadow-2xl">
          <div className="space-y-5 text-center">
            <DialogHeader>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Play className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-base font-black">Run Payroll</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Process payments for {pendingCount} pending employee{pendingCount !== 1 ? 's' : ''} in the current pay period.
              </p>
            </DialogHeader>

            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Pay Period</span>
                <span className="font-bold">Jun 16 – Jun 28, 2026</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Pending Employees</span>
                <span className="font-bold">{pendingCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Pending Amount</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  {fmt(payroll.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.netPay, 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs font-bold h-9 cursor-pointer"
                onClick={() => setShowRunPayroll(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs font-bold h-9 cursor-pointer gap-1.5"
                onClick={handleRunPayroll}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Confirm & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ────────────── Edit Pay Rate Dialog ────────────── */}
      <Dialog open={!!editingRate} onOpenChange={(open) => !open && setEditingRate(null)}>
        <DialogContent className="max-w-sm bg-card border rounded-2xl p-6 shadow-2xl">
          {editingRate && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-base font-black">Edit Pay Rate</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Update hourly rate for <strong>{editingRate.name}</strong>
                </p>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                  <span className={`h-9 w-9 rounded-full border flex items-center justify-center text-[10px] font-black uppercase shadow-2xs ${editingRate.color}`}>
                    {editingRate.initials}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{editingRate.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{editingRate.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    New Hourly Rate (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.25"
                      min="16.00"
                      value={editRateValue}
                      onChange={(e) => setEditRateValue(e.target.value)}
                      className="pl-8 h-9 text-sm font-bold bg-muted/30 border"
                      placeholder="e.g. 18.50"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Current rate: {fmt(editingRate.hourlyRate)}/hr · CA minimum: $16.00/hr
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                  onClick={() => { setEditingRate(null); setEditRateValue(''); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                  onClick={handleSaveRate}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
