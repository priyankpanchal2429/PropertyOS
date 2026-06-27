'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Briefcase,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  PartyPopper,
  Eye,
  UserPlus,
  CalendarPlus,
  Mail,
  Download,
  ArrowLeft,
  Building,
  Phone,
  MapPin,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Edit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  workerType: string;
  country: string;
  phone: string;
  email: string;
}

interface EmploymentDetails {
  workLocation: 'home' | 'office' | '';
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  addressCountry: string;
  workState: string;
  jobTitle: string;
  department: string;
  newDepartment: string;
  manager: string;
  startDate: string;
  endDate: string;
}

interface Compensation {
  employeeType: string;
  amount: string;
  employmentStatus: string;
  paySchedule: string;
  federalExempt: boolean;
  stateExempt: boolean;
  localExempt: boolean;
  showAdvanced: boolean;
  standardHours: string;
  defaultShift: string;
  ptoPolicy: string;
  holidayPolicy: string;
}

interface FormErrors {
  [key: string]: string;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Compensation', icon: DollarSign },
  { id: 4, label: 'Review', icon: ClipboardCheck },
];

const WORKER_TYPES = ['Employee', 'Contractor (Individual)', 'Contractor (Business)', 'Unpaid Team Member'];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const DEPARTMENTS = ['Housekeeping', 'Front Desk', 'Maintenance', 'Food & Beverage', 'Management', 'Security', 'Accounting'];

const EXISTING_STAFF = ['Ramona', 'Tania', 'Gladys', 'Zuli', 'Eucaria', 'Jeimi'];
const EXISTING_EMAILS = ['ramona@propertyos.com', 'tania@propertyos.com', 'gladys@propertyos.com', 'zuli@propertyos.com', 'eucaria@propertyos.com', 'jeimi@propertyos.com'];

const EMPLOYEE_TYPES = ['Salary', 'Hourly', 'Hourly (Overtime Eligible)', 'Hourly (Overtime Exempt)'];
const EMPLOYMENT_STATUSES = ['Full-Time', 'Part-Time', 'Seasonal', 'Temporary'];
const PAY_SCHEDULES = ['Weekly', 'Biweekly', 'Semi-Monthly', 'Monthly'];

const DRAFT_KEY = 'propertyos_onboard_draft';

/* ═══════════════════════════════════════════════════════
   AI HELPERS
   ═══════════════════════════════════════════════════════ */

const suggestDepartment = (jobTitle: string): string => {
  const t = jobTitle.toLowerCase();
  if (t.includes('housekeeper') || t.includes('cleaner') || t.includes('room attendant') || t.includes('laundry')) return 'Housekeeping';
  if (t.includes('front desk') || t.includes('receptionist') || t.includes('concierge') || t.includes('guest service')) return 'Front Desk';
  if (t.includes('maintenance') || t.includes('engineer') || t.includes('technician') || t.includes('repair')) return 'Maintenance';
  if (t.includes('chef') || t.includes('cook') || t.includes('waiter') || t.includes('server') || t.includes('bartender') || t.includes('food') || t.includes('beverage')) return 'Food & Beverage';
  if (t.includes('manager') || t.includes('director') || t.includes('supervisor') || t.includes('gm') || t.includes('general')) return 'Management';
  if (t.includes('security') || t.includes('guard') || t.includes('safety')) return 'Security';
  if (t.includes('account') || t.includes('finance') || t.includes('payroll') || t.includes('bookkeeper')) return 'Accounting';
  return '';
};

const suggestManager = (department: string): string => {
  const map: Record<string, string> = {
    'Housekeeping': 'Ramona',
    'Front Desk': 'Tania',
    'Maintenance': 'Gladys',
    'Management': 'No Manager',
  };
  return map[department] || '';
};

const suggestCompRange = (jobTitle: string, state: string): { min: number; max: number; type: string } | null => {
  const t = jobTitle.toLowerCase();
  const isCA = state === 'California';
  const base = isCA ? 16 : 14;
  if (t.includes('head') || t.includes('lead') || t.includes('senior')) return { min: base + 4, max: base + 8, type: 'Hourly' };
  if (t.includes('assistant') || t.includes('associate')) return { min: base + 1, max: base + 5, type: 'Hourly' };
  if (t.includes('manager') || t.includes('director')) return { min: 55000, max: 85000, type: 'Salary' };
  if (t.includes('housekeeper') || t.includes('cleaner')) return { min: base, max: base + 4, type: 'Hourly' };
  return null;
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 1) return `+${digits}`;
  if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
  if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function OnboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');

  // Form data
  const [showNewDept, setShowNewDept] = useState(false);
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '', middleName: '', lastName: '', preferredName: '',
    workerType: 'Employee', country: 'United States', phone: '', email: '',
  });

  const [employment, setEmployment] = useState<EmploymentDetails>({
    workLocation: '', addressLine1: '', addressLine2: '', city: '', state: '', zip: '', addressCountry: 'United States',
    workState: 'California', jobTitle: '', department: '', newDepartment: '', manager: '', startDate: '', endDate: '',
  });

  const [compensation, setCompensation] = useState<Compensation>({
    employeeType: '', amount: '', employmentStatus: '', paySchedule: '',
    federalExempt: false, stateExempt: false, localExempt: false,
    showAdvanced: false, standardHours: '40', defaultShift: 'Day', ptoPolicy: '', holidayPolicy: '',
  });

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.personal) setPersonal(parsed.personal);
        if (parsed.employment) setEmployment(parsed.employment);
        if (parsed.compensation) setCompensation(parsed.compensation);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
        toast.info('Draft restored from your last session.');
      }
    } catch {}
  }, []);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        personal, employment, compensation, currentStep, completedSteps,
      }));
    } catch {}
  }, [personal, employment, compensation, currentStep, completedSteps]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  // Derived AI suggestions
  const aiDeptSuggestion = employment.jobTitle.length > 2 ? suggestDepartment(employment.jobTitle) : '';
  const aiManagerSuggestion = employment.department ? suggestManager(employment.department) : '';
  const aiCompSuggestion = employment.jobTitle.length > 2 && employment.workState ? suggestCompRange(employment.jobTitle, employment.workState) : null;

  /* ─── Validation ─── */

  const validateStep1 = (): FormErrors => {
    const e: FormErrors = {};
    if (!personal.firstName.trim()) e.firstName = 'First name is required.';
    if (!personal.lastName.trim()) e.lastName = 'Last name is required.';
    if (!personal.workerType) e.workerType = 'Worker type is required.';
    if (!personal.phone.trim()) e.phone = 'Phone number is required.';
    else if (personal.phone.replace(/\D/g, '').length < 11) e.phone = 'Enter a valid phone number.';
    if (!personal.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) e.email = 'Enter a valid email address.';
    else if (EXISTING_EMAILS.includes(personal.email.toLowerCase())) e.email = 'This email is already registered to an existing employee.';
    return e;
  };

  const validateStep2 = (): FormErrors => {
    const e: FormErrors = {};
    if (!employment.workLocation) e.workLocation = 'Select a work location.';
    if (employment.workLocation === 'office') {
      if (!employment.addressLine1.trim()) e.addressLine1 = 'Address is required.';
      if (!employment.city.trim()) e.city = 'City is required.';
      if (!employment.state.trim()) e.state = 'State is required.';
      if (!employment.zip.trim()) e.zip = 'ZIP code is required.';
    }
    if (!employment.workState) e.workState = 'Work state is required.';
    if (!employment.jobTitle.trim()) e.jobTitle = 'Job title is required.';
    if (!employment.department && !employment.newDepartment.trim()) e.department = 'Department is required.';
    if (!employment.manager) e.manager = 'Manager assignment is required.';
    if (!employment.startDate) e.startDate = 'Start date is required.';
    if (employment.endDate && employment.startDate && new Date(employment.endDate) < new Date(employment.startDate)) {
      e.endDate = 'End date cannot be before start date.';
    }
    return e;
  };

  const validateStep3 = (): FormErrors => {
    const e: FormErrors = {};
    if (!compensation.employeeType) e.employeeType = 'Employee type is required.';
    if (!compensation.amount.trim()) e.amount = 'Compensation amount is required.';
    else {
      const val = parseFloat(compensation.amount.replace(/[^0-9.]/g, ''));
      if (isNaN(val) || val <= 0) e.amount = 'Enter a valid amount.';
      else if (compensation.employeeType.startsWith('Hourly') && val < 16) e.amount = 'Must be at least $16.00/hr (CA minimum wage).';
    }
    if (!compensation.employmentStatus) e.employmentStatus = 'Employment status is required.';
    if (!compensation.paySchedule) e.paySchedule = 'Pay schedule is required.';
    return e;
  };

  const handleNext = () => {
    let stepErrors: FormErrors = {};
    if (currentStep === 1) stepErrors = validateStep1();
    else if (currentStep === 2) stepErrors = validateStep2();
    else if (currentStep === 3) stepErrors = validateStep3();

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fix the highlighted errors before continuing.');
      return;
    }

    setErrors({});
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || completedSteps.includes(step)) {
      setErrors({});
      setCurrentStep(step);
    }
  };

  const handleSubmit = () => {
    if (!confirmed) {
      toast.error('Please confirm the information is accurate.');
      return;
    }
    // Generate employee ID
    const id = `EMP-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setCreatedId(id);
    localStorage.removeItem(DRAFT_KEY);
    setShowSuccess(true);
    toast.success('Employee created successfully!');
  };

  const handleSaveDraft = () => {
    saveDraft();
    toast.success('Draft saved successfully.');
  };

  /* ─── Shared Input Styling ─── */

  const selectClass = 'w-full h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring cursor-pointer dark:bg-input/30';
  const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1';
  const fieldError = (key: string) => errors[key] ? (
    <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {errors[key]}
    </p>
  ) : null;

  const aiChip = (text: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-500/20 hover:bg-violet-500/20 transition-colors cursor-pointer mt-1"
    >
      <Sparkles className="h-2.5 w-2.5" />
      AI suggests: {text}
    </button>
  );

  /* ═══════════════════════════════════════════════════════
     SUCCESS SCREEN
     ═══════════════════════════════════════════════════════ */

  if (showSuccess) {
    const dept = employment.department || employment.newDepartment;
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-8 animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Employee Successfully Added!</h1>
          <p className="text-sm text-muted-foreground font-medium">
            {personal.firstName} {personal.lastName} has been onboarded to PropertyOS.
          </p>
        </div>

        <Card className="border shadow-none bg-card text-left">
          <CardContent className="p-5 space-y-3">
            {[
              ['Employee Name', `${personal.firstName} ${personal.lastName}`],
              ['Employee ID', createdId],
              ['Department', dept],
              ['Manager', employment.manager === 'none' ? 'No Manager' : employment.manager],
              ['Start Date', employment.startDate ? new Date(employment.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'],
              ['Worker Type', personal.workerType],
              ['Employment Status', compensation.employmentStatus],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'View Profile', icon: Eye, action: () => router.push('/dashboard/staff') },
            { label: 'Add Another', icon: UserPlus, action: () => { setShowSuccess(false); setCurrentStep(1); setCompletedSteps([]); setConfirmed(false); setPersonal({ firstName: '', middleName: '', lastName: '', preferredName: '', workerType: 'Employee', country: 'United States', phone: '', email: '' }); setEmployment({ workLocation: '', addressLine1: '', addressLine2: '', city: '', state: '', zip: '', addressCountry: 'United States', workState: 'California', jobTitle: '', department: '', newDepartment: '', manager: '', startDate: '', endDate: '' }); setCompensation({ employeeType: '', amount: '', employmentStatus: '', paySchedule: '', federalExempt: false, stateExempt: false, localExempt: false, showAdvanced: false, standardHours: '40', defaultShift: 'Day', ptoPolicy: '', holidayPolicy: '' }); } },
            { label: 'Assign Schedule', icon: CalendarPlus, action: () => toast.info('Schedule module coming soon.') },
            { label: 'Invite Employee', icon: Mail, action: () => toast.success(`Invitation sent to ${personal.email}`) },
            { label: 'Download Summary', icon: Download, action: () => toast.success('Summary downloaded as PDF.') },
          ].map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 h-9 cursor-pointer"
              onClick={btn.action}
            >
              <btn.icon className="h-3.5 w-3.5" />
              {btn.label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="text-xs font-bold cursor-pointer gap-1.5" onClick={() => router.push('/dashboard/staff')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Staff Directory
        </Button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     WIZARD LAYOUT
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/staff')}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Staff
          </button>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Employee
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Complete each step to onboard a new team member.
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-8 cursor-pointer" onClick={handleSaveDraft}>
          <Save className="h-3.5 w-3.5" />
          Save Draft
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-muted/20 rounded-2xl p-3 border">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = step.id < currentStep || isCompleted;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && handleStepClick(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all
                  ${isActive ? 'bg-primary text-primary-foreground shadow-xs' : ''}
                  ${isCompleted && !isActive ? 'text-emerald-700 dark:text-emerald-300' : ''}
                  ${!isActive && !isCompleted ? 'text-muted-foreground' : ''}
                  ${isClickable ? 'cursor-pointer hover:bg-muted' : 'cursor-default'}
                `}
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isActive ? 'bg-primary-foreground/20' : ''}
                  ${isCompleted && !isActive ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}
                  ${!isActive && !isCompleted ? 'bg-muted/50 border border-border/50' : ''}
                `}>
                  {isCompleted && !isActive ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${isCompleted ? 'bg-emerald-500/40' : 'bg-border/60'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="border shadow-none bg-card">
        <CardContent className="p-6">

          {/* ═══ STEP 1: Personal Information ═══ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="border-b pb-3">
                <h2 className="text-base font-black flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-primary" />
                  Personal Information
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Basic details about the new employee.</p>
              </div>

              {/* Basic Info */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>First Name <span className="text-destructive">*</span></label>
                    <Input value={personal.firstName} onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} placeholder="John" className="text-sm" aria-invalid={!!errors.firstName} />
                    {fieldError('firstName')}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Middle Name</label>
                    <Input value={personal.middleName} onChange={(e) => setPersonal({ ...personal, middleName: e.target.value })} placeholder="(Optional)" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Last Name <span className="text-destructive">*</span></label>
                    <Input value={personal.lastName} onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} placeholder="Doe" className="text-sm" aria-invalid={!!errors.lastName} />
                    {fieldError('lastName')}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Preferred First Name</label>
                    <Input value={personal.preferredName} onChange={(e) => setPersonal({ ...personal, preferredName: e.target.value })} placeholder="(Optional)" className="text-sm" />
                  </div>
                </div>
              </div>

              {/* Worker Classification */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Worker Classification</p>
                <div className="space-y-1.5">
                  <label className={labelClass}>Worker Type <span className="text-destructive">*</span></label>
                  <select value={personal.workerType} onChange={(e) => setPersonal({ ...personal, workerType: e.target.value })} className={selectClass} aria-invalid={!!errors.workerType}>
                    {WORKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {fieldError('workerType')}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Location</p>
                <div className="space-y-1.5">
                  <label className={labelClass}>Country <span className="text-destructive">*</span></label>
                  <select value={personal.country} onChange={(e) => setPersonal({ ...personal, country: e.target.value })} className={selectClass}>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}><Phone className="h-3 w-3" /> Phone Number <span className="text-destructive">*</span></label>
                    <Input
                      value={personal.phone}
                      onChange={(e) => setPersonal({ ...personal, phone: formatPhone(e.target.value) })}
                      placeholder="+1 (555) 123-4567"
                      className="text-sm tabular-nums"
                      aria-invalid={!!errors.phone}
                    />
                    {fieldError('phone')}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}><Mail className="h-3 w-3" /> Email Address <span className="text-destructive">*</span></label>
                    <Input value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} placeholder="john.doe@email.com" className="text-sm" type="email" aria-invalid={!!errors.email} />
                    {fieldError('email')}
                    {personal.email && EXISTING_EMAILS.includes(personal.email.toLowerCase()) && !errors.email && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        Possible duplicate — this email belongs to an existing employee.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Employment Details ═══ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="border-b pb-3">
                <h2 className="text-base font-black flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary" />
                  Employment Details
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Work location, role, and reporting structure.</p>
              </div>

              {/* Work Location */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Work Location</p>
                <p className="text-xs text-muted-foreground font-medium mb-3">Where is this employee working from?</p>
                <div className="flex gap-3">
                  {(['home', 'office'] as const).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setEmployment({ ...employment, workLocation: loc })}
                      className={`flex-1 p-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        employment.workLocation === loc
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted hover:border-border'
                      }`}
                    >
                      {loc === 'home' ? '🏠 Work From Home' : '🏢 Office Location'}
                    </button>
                  ))}
                </div>
                {fieldError('workLocation')}
              </div>

              {/* Conditional Address Fields */}
              {employment.workLocation === 'office' && (
                <div className="space-y-4 p-4 rounded-xl border bg-muted/10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Work Address</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Address Line 1 <span className="text-destructive">*</span></label>
                      <Input value={employment.addressLine1} onChange={(e) => setEmployment({ ...employment, addressLine1: e.target.value })} placeholder="123 Main Street" className="text-sm" aria-invalid={!!errors.addressLine1} />
                      {fieldError('addressLine1')}
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Address Line 2</label>
                      <Input value={employment.addressLine2} onChange={(e) => setEmployment({ ...employment, addressLine2: e.target.value })} placeholder="Suite 100 (Optional)" className="text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className={labelClass}>City <span className="text-destructive">*</span></label>
                        <Input value={employment.city} onChange={(e) => setEmployment({ ...employment, city: e.target.value })} placeholder="City" className="text-sm" aria-invalid={!!errors.city} />
                        {fieldError('city')}
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>State <span className="text-destructive">*</span></label>
                        <select value={employment.state} onChange={(e) => setEmployment({ ...employment, state: e.target.value })} className={selectClass} aria-invalid={!!errors.state}>
                          <option value="">Select…</option>
                          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {fieldError('state')}
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>ZIP <span className="text-destructive">*</span></label>
                        <Input value={employment.zip} onChange={(e) => setEmployment({ ...employment, zip: e.target.value })} placeholder="90210" className="text-sm" aria-invalid={!!errors.zip} />
                        {fieldError('zip')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Info */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Employment Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Work State <span className="text-destructive">*</span></label>
                    <select value={employment.workState} onChange={(e) => setEmployment({ ...employment, workState: e.target.value })} className={selectClass} aria-invalid={!!errors.workState}>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {fieldError('workState')}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Job Title <span className="text-destructive">*</span></label>
                    <Input value={employment.jobTitle} onChange={(e) => setEmployment({ ...employment, jobTitle: e.target.value })} placeholder="e.g. Housekeeper" className="text-sm" aria-invalid={!!errors.jobTitle} />
                    {fieldError('jobTitle')}
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className={labelClass}>Department <span className="text-destructive">*</span></label>
                {!showNewDept ? (
                  <div className="flex gap-2">
                    <select
                      value={employment.department}
                      onChange={(e) => setEmployment({ ...employment, department: e.target.value })}
                      className={`flex-1 ${selectClass}`}
                      aria-invalid={!!errors.department}
                    >
                      <option value="">Select department…</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="sm" className="text-xs font-bold cursor-pointer h-9 gap-1" onClick={() => setShowNewDept(true)}>
                      + New
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={employment.newDepartment} onChange={(e) => setEmployment({ ...employment, newDepartment: e.target.value })} placeholder="New department name" className="text-sm flex-1" />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 cursor-pointer" onClick={() => { setShowNewDept(false); setEmployment({ ...employment, newDepartment: '' }); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {fieldError('department')}
                {aiDeptSuggestion && !employment.department && !showNewDept && (
                  aiChip(aiDeptSuggestion, () => setEmployment({ ...employment, department: aiDeptSuggestion }))
                )}
              </div>

              {/* Manager */}
              <div className="space-y-1.5">
                <label className={labelClass}>Manager <span className="text-destructive">*</span></label>
                <select value={employment.manager} onChange={(e) => setEmployment({ ...employment, manager: e.target.value })} className={selectClass} aria-invalid={!!errors.manager}>
                  <option value="">Select manager…</option>
                  <option value="none">No Manager</option>
                  {EXISTING_STAFF.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldError('manager')}
                {aiManagerSuggestion && !employment.manager && (
                  aiChip(aiManagerSuggestion, () => setEmployment({ ...employment, manager: aiManagerSuggestion }))
                )}
              </div>

              {/* Dates */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Employment Dates</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Start Date <span className="text-destructive">*</span></label>
                    <Input type="date" value={employment.startDate} onChange={(e) => setEmployment({ ...employment, startDate: e.target.value })} className="text-sm" aria-invalid={!!errors.startDate} />
                    {fieldError('startDate')}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>End Date <span className="text-muted-foreground text-[9px] normal-case">(Optional)</span></label>
                    <Input type="date" value={employment.endDate} onChange={(e) => setEmployment({ ...employment, endDate: e.target.value })} className="text-sm" aria-invalid={!!errors.endDate} />
                    {fieldError('endDate')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Compensation ═══ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="border-b pb-3">
                <h2 className="text-base font-black flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5 text-primary" />
                  Compensation
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Pay structure, schedule, and tax information.</p>
              </div>

              {/* Employee Type */}
              <div className="space-y-1.5">
                <label className={labelClass}>Employee Type <span className="text-destructive">*</span></label>
                <select value={compensation.employeeType} onChange={(e) => setCompensation({ ...compensation, employeeType: e.target.value })} className={selectClass} aria-invalid={!!errors.employeeType}>
                  <option value="">Select type…</option>
                  {EMPLOYEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {fieldError('employeeType')}
                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" />
                  We do not currently support paying employees by piece rate (per visit, bundle, package, etc.).
                </p>
              </div>

              {/* Compensation Amount */}
              <div className="space-y-1.5">
                <label className={labelClass}>Compensation Amount <span className="text-destructive">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={compensation.amount}
                    onChange={(e) => setCompensation({ ...compensation, amount: e.target.value })}
                    placeholder={compensation.employeeType === 'Salary' ? '72,000 /year' : '25.00 /hr'}
                    className="text-sm pl-8 tabular-nums"
                    aria-invalid={!!errors.amount}
                  />
                </div>
                {fieldError('amount')}
                {aiCompSuggestion && !compensation.amount && (
                  <div className="mt-1">
                    {aiChip(
                      aiCompSuggestion.type === 'Salary'
                        ? `$${aiCompSuggestion.min.toLocaleString()} – $${aiCompSuggestion.max.toLocaleString()}/yr`
                        : `$${aiCompSuggestion.min}.00 – $${aiCompSuggestion.max}.00/hr`,
                      () => {
                        const mid = aiCompSuggestion.type === 'Salary'
                          ? Math.round((aiCompSuggestion.min + aiCompSuggestion.max) / 2).toString()
                          : ((aiCompSuggestion.min + aiCompSuggestion.max) / 2).toFixed(2);
                        setCompensation({ ...compensation, amount: mid, employeeType: aiCompSuggestion.type.startsWith('Hourly') ? 'Hourly' : 'Salary' });
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Employment Status & Pay Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Employment Status <span className="text-destructive">*</span></label>
                  <select value={compensation.employmentStatus} onChange={(e) => setCompensation({ ...compensation, employmentStatus: e.target.value })} className={selectClass} aria-invalid={!!errors.employmentStatus}>
                    <option value="">Select status…</option>
                    {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldError('employmentStatus')}
                  <p className="text-[10px] text-muted-foreground font-medium">This determines eligibility for company benefits.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Pay Schedule <span className="text-destructive">*</span></label>
                  <select value={compensation.paySchedule} onChange={(e) => setCompensation({ ...compensation, paySchedule: e.target.value })} className={selectClass} aria-invalid={!!errors.paySchedule}>
                    <option value="">Select schedule…</option>
                    {PAY_SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldError('paySchedule')}
                </div>
              </div>

              {/* Tax Status */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Tax Exemptions <span className="text-muted-foreground text-[9px] normal-case font-semibold">(Optional)</span></p>
                <div className="flex flex-wrap gap-4">
                  {([['federalExempt', 'Federal Exempt'], ['stateExempt', 'State Exempt'], ['localExempt', 'Local Exempt']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compensation[key]}
                        onChange={(e) => setCompensation({ ...compensation, [key]: e.target.checked })}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Payroll (Collapsible) */}
              <div className="border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCompensation({ ...compensation, showAdvanced: !compensation.showAdvanced })}
                  className="flex items-center justify-between w-full p-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <span>Advanced Payroll Settings</span>
                  {compensation.showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {compensation.showAdvanced && (
                  <div className="p-4 border-t bg-muted/10 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Standard Hours / Week</label>
                        <Input value={compensation.standardHours} onChange={(e) => setCompensation({ ...compensation, standardHours: e.target.value })} placeholder="40" className="text-sm" type="number" />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Default Shift</label>
                        <select value={compensation.defaultShift} onChange={(e) => setCompensation({ ...compensation, defaultShift: e.target.value })} className={selectClass}>
                          <option value="Day">Day Shift</option>
                          <option value="Evening">Evening Shift</option>
                          <option value="Night">Night Shift</option>
                          <option value="Rotating">Rotating</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>PTO Policy</label>
                        <select value={compensation.ptoPolicy} onChange={(e) => setCompensation({ ...compensation, ptoPolicy: e.target.value })} className={selectClass}>
                          <option value="">None selected</option>
                          <option value="Standard">Standard (10 days/yr)</option>
                          <option value="Generous">Generous (15 days/yr)</option>
                          <option value="Unlimited">Unlimited PTO</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Holiday Policy</label>
                        <select value={compensation.holidayPolicy} onChange={(e) => setCompensation({ ...compensation, holidayPolicy: e.target.value })} className={selectClass}>
                          <option value="">None selected</option>
                          <option value="Federal">Federal Holidays (11 days)</option>
                          <option value="Company">Company Holidays (8 days)</option>
                          <option value="Custom">Custom Schedule</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Review & Confirm ═══ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="border-b pb-3">
                <h2 className="text-base font-black flex items-center gap-2">
                  <ClipboardCheck className="h-4.5 w-4.5 text-primary" />
                  Review & Confirm
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Verify all information before creating the employee profile.</p>
              </div>

              {/* Personal Info Review */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> Personal Information
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 h-7 cursor-pointer text-primary" onClick={() => setCurrentStep(1)}>
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Full Name', `${personal.firstName} ${personal.middleName ? personal.middleName + ' ' : ''}${personal.lastName}`],
                    ['Preferred Name', personal.preferredName || '—'],
                    ['Worker Type', personal.workerType],
                    ['Country', personal.country],
                    ['Phone', personal.phone],
                    ['Email', personal.email],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] text-muted-foreground font-medium">{l}</p>
                      <p className="font-bold truncate">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Review */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> Employment Details
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 h-7 cursor-pointer text-primary" onClick={() => setCurrentStep(2)}>
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Work Location', employment.workLocation === 'home' ? 'Work From Home' : 'Office Location'],
                    ['Work State', employment.workState],
                    ['Job Title', employment.jobTitle],
                    ['Department', employment.department || employment.newDepartment],
                    ['Manager', employment.manager === 'none' ? 'No Manager' : employment.manager],
                    ['Start Date', employment.startDate ? new Date(employment.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'],
                    ...(employment.endDate ? [['End Date', new Date(employment.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })]] : []),
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] text-muted-foreground font-medium">{l}</p>
                      <p className="font-bold truncate">{v}</p>
                    </div>
                  ))}
                </div>
                {employment.workLocation === 'office' && employment.addressLine1 && (
                  <div className="text-sm border-t pt-2 mt-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Work Address</p>
                    <p className="font-bold">{employment.addressLine1}{employment.addressLine2 ? `, ${employment.addressLine2}` : ''}, {employment.city}, {employment.state} {employment.zip}</p>
                  </div>
                )}
              </div>

              {/* Compensation Review */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-primary" /> Compensation
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 h-7 cursor-pointer text-primary" onClick={() => setCurrentStep(3)}>
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Employee Type', compensation.employeeType],
                    ['Amount', `$${compensation.amount}${compensation.employeeType === 'Salary' ? '/year' : '/hr'}`],
                    ['Employment Status', compensation.employmentStatus],
                    ['Pay Schedule', compensation.paySchedule],
                    ['Tax Exemptions', [compensation.federalExempt && 'Federal', compensation.stateExempt && 'State', compensation.localExempt && 'Local'].filter(Boolean).join(', ') || 'None'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] text-muted-foreground font-medium">{l}</p>
                      <p className="font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer mt-0.5"
                />
                <span className="text-sm font-medium">
                  I confirm that the information entered is accurate and I authorize the creation of this employee profile.
                </span>
              </label>
            </div>
          )}

          {/* ═══ Navigation Buttons ═══ */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 h-9 cursor-pointer"
              onClick={currentStep === 1 ? () => router.push('/dashboard/staff') : handleBack}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex gap-2">
              {currentStep === 4 && (
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-9 cursor-pointer" onClick={handleSaveDraft}>
                  <Save className="h-3.5 w-3.5" />
                  Save as Draft
                </Button>
              )}
              {currentStep < 4 ? (
                <Button size="sm" className="text-xs font-bold gap-1.5 h-9 cursor-pointer" onClick={handleNext}>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" className="text-xs font-bold gap-1.5 h-9 cursor-pointer" onClick={handleSubmit} disabled={!confirmed}>
                  <Check className="h-3.5 w-3.5" />
                  Create Employee
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
