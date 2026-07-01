'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Calendar, 
  Clock, 
  Briefcase, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

interface RoomCredit {
  id: string;
  type: string;
  cleaningType: string;
  credits: number;
}

const C = {
  bg:        'var(--background)',
  sidebar:   'var(--sidebar)',
  card:      'var(--card)',
  surface:   'var(--surface)',
  border:    'var(--border)',
  divider:   'var(--divider)',
  white:     'var(--foreground)',
  secondary: 'var(--sidebar-foreground)',
  muted:     'var(--muted-foreground)',
  cyan:      'var(--primary)',
  green:     '#32C766',
  red:       '#E64C4C',
};

const WORKER_TYPES = [
  'Housekeeper',
  'Laundry',
  'Front Desk',
  'Maintenance',
  'Manager',
  'Supervisor'
];

const SKILL_LEVELS = [
  'Junior',
  'Regular',
  'Senior'
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const INITIAL_ROOM_CREDITS: RoomCredit[] = [
  { id: '1', type: '1 Queen Bed', cleaningType: 'Dirty Room', credits: 35 },
  { id: '2', type: '1 King Bed', cleaningType: 'Dirty Room', credits: 35 },
  { id: '3', type: '2 Queen Beds', cleaningType: 'Dirty Room', credits: 45 },
  { id: '4', type: '1 Queen Bed', cleaningType: 'Stayover Occupied Room', credits: 20 },
  { id: '5', type: '1 King Bed', cleaningType: 'Stayover Occupied Room', credits: 20 },
  { id: '6', type: '2 Queen Beds', cleaningType: 'Stayover Occupied Room', credits: 25 },
];

/* ═══════════════════════════════════════════════════════
   ZOD VALIDATION SCHEMA
   ═══════════════════════════════════════════════════════ */

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine((val) => val.replace(/[^0-9]/g, '').length >= 10, {
      message: 'Invalid phone number (must be at least 10 digits)'
    }),
  workerType: z.string(),
  roomCredits: z.array(z.object({
    id: z.string(),
    type: z.string(),
    cleaningType: z.string(),
    credits: z.number().int().positive('Credits must be positive whole numbers')
  })),
  availability: z.record(z.string(), z.boolean()).refine((val) => {
    return Object.values(val).some(v => v === true);
  }, {
    message: 'Employee must be available for at least one working day.'
  }),
  preferredDaysOff: z.array(z.string()).max(6, 'Preferred days off cannot exceed 6 days'),
  skillLevel: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['Active', 'Inactive']),
  joiningDate: z.string().optional(),
  notes: z.string().optional()
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

/* ═══════════════════════════════════════════════════════
   REUSABLE CUSTOM WORK PREFERENCES SYNC HOOK
   ═══════════════════════════════════════════════════════ */

export function useWorkPreferences(
  availability: Record<string, boolean>,
  setValue: (name: any, value: any, options?: any) => void
) {
  const availableCount = DAYS_OF_WEEK.filter(d => availability[d]).length;

  const toggleAvailability = (day: string) => {
    const isCurrentlyAvailable = availability[day];
    
    // Rule Validation: Prevent disabling the last available day
    if (isCurrentlyAvailable && availableCount === 1) {
      return;
    }

    const newAvailability = {
      ...availability,
      [day]: !isCurrentlyAvailable
    };

    setValue('availability', newAvailability, { shouldValidate: true });
    
    // Derive Preferred Days Off (opposite state)
    const newDaysOff = DAYS_OF_WEEK.filter(d => !newAvailability[d]);
    setValue('preferredDaysOff', newDaysOff, { shouldValidate: true });
  };

  const togglePreferredDayOff = (day: string) => {
    const isCurrentlyAvailable = availability[day];

    // Rule Validation: Prevent selecting as day off if it would leave 0 available days
    if (isCurrentlyAvailable && availableCount === 1) {
      return;
    }

    const newAvailability = {
      ...availability,
      [day]: !isCurrentlyAvailable // opposite toggle
    };

    setValue('availability', newAvailability, { shouldValidate: true });
    
    // Derive Preferred Days Off (opposite state)
    const newDaysOff = DAYS_OF_WEEK.filter(d => !newAvailability[d]);
    setValue('preferredDaysOff', newDaysOff, { shouldValidate: true });
  };

  const isDayDisabledInAvailability = (day: string) => {
    // Only disable if it is currently available and it's the last one available
    return availability[day] && availableCount === 1;
  };

  const isDayDisabledInPreferredDaysOff = (day: string) => {
    // Only disable if it is currently available (not yet off) and it's the last one available
    return availability[day] && availableCount === 1;
  };

  return {
    toggleAvailability,
    togglePreferredDayOff,
    isDayDisabledInAvailability,
    isDayDisabledInPreferredDaysOff
  };
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function OnboardPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [newRoomType, setNewRoomType] = useState('1 Queen Bed');
  const [newCleaningType, setNewCleaningType] = useState('Dirty Room');
  const [newCredits, setNewCredits] = useState<number>(30);
  const [totalHours, setTotalHours] = useState(8);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      workerType: 'Housekeeper',
      roomCredits: INITIAL_ROOM_CREDITS,
      availability: {
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true,
        Sunday: true,
      },
      preferredDaysOff: [],
      skillLevel: 'Regular',
      startTime: '08:00',
      endTime: '16:00',
      status: 'Active',
      joiningDate: '',
      notes: ''
    }
  });

  // Watch fields for logic & rendering
  const availability = watch('availability');
  const preferredDaysOff = watch('preferredDaysOff');
  const roomCredits = watch('roomCredits');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const status = watch('status');
  const notes = watch('notes');
  const joiningDate = watch('joiningDate');

  // Work Preferences Sync Hook
  const {
    toggleAvailability,
    togglePreferredDayOff,
    isDayDisabledInAvailability,
    isDayDisabledInPreferredDaysOff
  } = useWorkPreferences(availability, setValue);

  // Auto-calculate shift hours when start or end changes
  useEffect(() => {
    if (!startTime || !endTime) return;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;

    if (endMin < startMin) {
      endMin += 24 * 60; // Crossing midnight
    }

    const calculatedHrs = Number(((endMin - startMin) / 60).toFixed(1));
    setTotalHours(calculatedHrs);
  }, [startTime, endTime]);

  // Form helper: Format 24h to 12h AM/PM
  const format12H = (time24: string) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
  };

  // Shift validation logic on time limits
  const shiftTimeError = () => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (endMin <= startMin) {
      return 'Shift end time must be later than start time';
    }
    if (totalHours > 16) {
      return 'Maximum shift length is 16 hours';
    }
    return null;
  };

  // Submit form handler
  const onSubmit = async (data: EmployeeFormValues) => {
    const shiftErrorMsg = shiftTimeError();
    if (shiftErrorMsg) {
      toast.error(shiftErrorMsg);
      return;
    }

    setIsSaving(true);
    
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save to localStorage propertyos_staff
    const newEmp = {
      id: Date.now(),
      name: `${data.firstName} ${data.lastName}`.trim(),
      role: data.workerType,
      initials: `${data.firstName[0] || ''}${data.lastName[0] || ''}`.toUpperCase(),
      color: '#2857DA',
      status: data.status === 'Active' ? ('On Duty' as const) : ('Rest Day' as const),
      email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@propertyos.com`,
      phone: data.phone,
      rating: 5.0,
      roomsCleaned: 0,
      creditsEarned: 0,
      joinedDate: data.joiningDate || new Date().toISOString().split('T')[0],
      roomCredits: data.roomCredits,
      availability: data.availability,
      preferredDaysOff: data.preferredDaysOff,
      skillLevel: data.skillLevel,
      shift: { startTime: data.startTime, endTime: data.endTime, totalHours },
      notes: data.notes
    };

    try {
      const existing = JSON.parse(localStorage.getItem('propertyos_staff') || '[]');
      localStorage.setItem('propertyos_staff', JSON.stringify([...existing, newEmp]));
    } catch (e) {}

    setIsSaving(false);
    toast.success('Employee profile created successfully!');
    router.push('/dashboard/staff');
  };

  // Disable save button check
  const isFormValid = isValid && !shiftTimeError();

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ backgroundColor: 'var(--background)', minHeight: '100%', padding: '24px 0', width: '100%' }}>
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.push('/dashboard/staff')}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6 border-none bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Add New Employee</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new employee profile and configure work preferences.</p>
        </div>

        {/* Multi-Section Stacked Cards */}
        <div className="flex flex-col gap-6">

          {/* SECTION 1: Personal Information */}
          <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                <User className="h-5 w-5" style={{ color: C.cyan }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Personal Information</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Basic identification details for this staff profile.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">First Name *</label>
                <Input 
                  {...register('firstName')}
                  placeholder="John" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.firstName && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Last Name *</label>
                <Input 
                  {...register('lastName')}
                  placeholder="Doe" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.lastName && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phone Number *</label>
                <Input 
                  {...register('phone')}
                  placeholder="(555) 000-0000" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.phone && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Worker Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Worker Type *</label>
                <select 
                  {...register('workerType')}
                  className="w-full h-[46px] rounded-[12px] border px-4 py-2 text-sm font-medium transition-colors cursor-pointer outline-none shadow-sm bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                >
                  {WORKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Grid 1: Room Credit Configuration and Work Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SECTION 2: Room Credit Configuration */}
            <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3 mb-3 pb-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                  <Settings className="h-4 w-4" style={{ color: C.cyan }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Room Credit Configuration</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Configure the cleaning credits earned for each room type.</p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                Credits must be positive whole numbers, used for payroll and productivity.
              </p>

              <div className="overflow-x-auto mb-3 pr-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.divider}` }}>
                      <th className="text-left py-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Room Type</th>
                      <th className="text-left py-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cleaning</th>
                      <th className="text-right py-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-24">Credits</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomCredits.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${C.divider}` }}>
                        <td className="py-2 px-2 text-xs font-semibold text-foreground">{row.type}</td>
                        <td className="py-2 px-2 text-[11px] text-muted-foreground">{row.cleaningType.replace(' Room', '')}</td>
                        <td className="py-1 px-2 text-right">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={row.credits === 0 ? '' : row.credits}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const updated = [...roomCredits];
                              updated[idx] = { ...row, credits: val };
                              setValue('roomCredits', updated, { shouldValidate: true });
                            }}
                            className="w-20 text-right h-[32px] rounded-[6px] text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] ml-auto"
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = roomCredits.filter(r => r.id !== row.id);
                              setValue('roomCredits', updated, { shouldValidate: true });
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Custom Credit Future-Proofing */}
              {!isAddingCredit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingCredit(true)}
                  className="text-[10px] font-bold gap-1 h-8 rounded-[8px] mt-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Custom Room Type
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border mt-2 text-xs" style={{ borderColor: C.border, backgroundColor: 'rgba(120, 120, 120, 0.02)' }}>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Room Type</label>
                    <Input 
                      value={newRoomType} 
                      onChange={(e) => setNewRoomType(e.target.value)} 
                      placeholder="e.g. 1 Queen ADA" 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Cleaning Type</label>
                    <select 
                      value={newCleaningType} 
                      onChange={(e) => setNewCleaningType(e.target.value)} 
                      className="w-full h-8 rounded-md border px-2 text-xs bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                    >
                      <option value="Dirty Room">Dirty Room</option>
                      <option value="Stayover Occupied Room">Stayover Room</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Credits</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={newCredits} 
                      onChange={(e) => setNewCredits(Math.max(1, parseInt(e.target.value, 10) || 1))} 
                      className="h-8 text-xs text-right"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-1.5 mt-1">
                    <Button 
                      type="button" 
                      onClick={() => {
                        setValue('roomCredits', [...roomCredits, {
                          id: String(Date.now()),
                          type: newRoomType,
                          cleaningType: newCleaningType,
                          credits: newCredits
                        }], { shouldValidate: true });
                        setIsAddingCredit(false);
                      }}
                      className="h-8 px-3 text-xs font-bold"
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAddingCredit(false)}
                      className="h-8 px-3 text-xs font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {errors.roomCredits && (
                <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.roomCredits.message}
                </p>
              )}
            </div>            {/* SECTION 3: Shift & Availability */}
            <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}` }} className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3 pb-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                    <Calendar className="h-4 w-4" style={{ color: C.cyan }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Shift & Availability</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Configure availability, days off, and standard shifts.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Availability by Day */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Availability by Day</label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isAvailable = availability[day];
                        const isDisabled = isDayDisabledInAvailability(day);
                        const label = day.slice(0, 3);
                        
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => toggleAvailability(day)}
                            style={{
                              padding: '8px 0',
                              borderRadius: 8,
                              border: `1px solid ${isDisabled ? 'rgba(120, 120, 120, 0.15)' : isAvailable ? C.cyan : C.border}`,
                              backgroundColor: isDisabled ? 'rgba(120, 120, 120, 0.08)' : isAvailable ? `${C.cyan}15` : 'transparent',
                              color: isDisabled ? 'rgba(120, 120, 120, 0.4)' : isAvailable ? C.white : C.muted,
                              opacity: isDisabled ? 0.5 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              fontSize: 11,
                              fontWeight: 700,
                              textAlign: 'center',
                              transition: 'all 150ms ease-in-out',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Days Off */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Preferred Days Off</label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isOff = preferredDaysOff.includes(day);
                        const isDisabled = isDayDisabledInPreferredDaysOff(day);
                        const label = day.slice(0, 3);

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => togglePreferredDayOff(day)}
                            style={{
                              padding: '8px 0',
                              borderRadius: 8,
                              border: `1px solid ${isDisabled ? 'rgba(120, 120, 120, 0.15)' : isOff ? C.cyan : C.border}`,
                              backgroundColor: isDisabled ? 'rgba(120, 120, 120, 0.08)' : isOff ? `${C.cyan}15` : 'transparent',
                              color: isDisabled ? 'rgba(120, 120, 120, 0.4)' : isOff ? C.white : C.muted,
                              opacity: isDisabled ? 0.5 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              fontSize: 11,
                              fontWeight: 700,
                              textAlign: 'center',
                              transition: 'all 150ms ease-in-out',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Inline Validation Warnings */}
                    {errors.availability && (
                      <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {(errors.availability as any).message}
                      </p>
                    )}
                    {errors.preferredDaysOff && (
                      <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {(errors.preferredDaysOff as any).message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inset Scheduling Details */}
              <div className="p-3 rounded-xl border space-y-3 mt-6" style={{ borderColor: C.border, backgroundColor: 'rgba(120, 120, 120, 0.02)' }}>
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Standard Schedule
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Skill Level */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Skill Level</label>
                    <select 
                      {...register('skillLevel')}
                      className="w-full h-8 rounded-md border px-2 text-xs bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                    >
                      {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Read-Only Total Hours */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Shift Duration</label>
                    <div className="flex items-center px-2 h-8 rounded-md border bg-muted/10 font-bold text-xs text-foreground" style={{ borderColor: C.border }}>
                      {totalHours} Hours
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Start Time</label>
                    <Input
                      type="time"
                      {...register('startTime')}
                      className="rounded-md h-8 px-2 text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] w-full"
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">End Time</label>
                    <Input
                      type="time"
                      {...register('endTime')}
                      className="rounded-md h-8 px-2 text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] w-full"
                    />
                  </div>
                </div>

                {shiftTimeError() && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {shiftTimeError()}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* PAGE ACTIONS */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={() => router.push('/dashboard/staff')}
              className="h-10 px-5 rounded-[10px] font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="h-10 px-7 rounded-[10px] font-bold text-xs gap-2"
              style={{ backgroundColor: isFormValid ? C.cyan : undefined }}
            >
              {isSaving ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>

        </div>
      </div>
    </form>
  );
}
