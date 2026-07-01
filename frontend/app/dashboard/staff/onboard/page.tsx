'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function OnboardPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // ─── STATE MANAGEMENT ───
  
  // Section 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [workerType, setWorkerType] = useState('Housekeeper');

  // Section 2: Room Credits
  const [roomCredits, setRoomCredits] = useState<RoomCredit[]>(INITIAL_ROOM_CREDITS);
  const [newRoomType, setNewRoomType] = useState('1 Queen Bed');
  const [newCleaningType, setNewCleaningType] = useState('Dirty Room');
  const [newCredits, setNewCredits] = useState<number>(30);
  const [isAddingCredit, setIsAddingCredit] = useState(false);

  // Section 3: Work Preferences
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true,
  });
  const [preferredDaysOff, setPreferredDaysOff] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('Regular');

  // Section 4: Shift Config
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [totalHours, setTotalHours] = useState(8);

  // Section 5: Employment Status
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [joiningDate, setJoiningDate] = useState('');
  const [notes, setNotes] = useState('');

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── EFFECTS & HELPERS ───

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

  // Form helper: Format 24h to 12h AM/PM for summaries
  const format12H = (time24: string) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
  };

  // Inline Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    
    // Phone validation
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (phoneClean.length < 10) {
      errs.phone = 'Invalid phone number (must be at least 10 digits)';
    }

    // Shift validation
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (endMin <= startMin) {
      errs.shiftTime = 'Shift end time must be later than start time';
    } else if (totalHours > 16) {
      errs.shiftTime = 'Maximum shift length is 16 hours';
    }

    // Preferred days off validation
    if (preferredDaysOff.length > 6) {
      errs.daysOff = 'Preferred days off cannot exceed 6 days';
    }

    // Credits validation
    const hasInvalidCredits = roomCredits.some(c => c.credits <= 0 || !Number.isInteger(c.credits));
    if (hasInvalidCredits) {
      errs.credits = 'Credits must be positive whole numbers';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Run validation on value changes for dynamic submit enablement
  const isValid = firstName.trim() !== '' && 
                  lastName.trim() !== '' && 
                  phone.replace(/[^0-9]/g, '').length >= 10 &&
                  (startTime.split(':').map(Number)[0] * 60 + startTime.split(':').map(Number)[1] < 
                   endTime.split(':').map(Number)[0] * 60 + endTime.split(':').map(Number)[1]) &&
                  totalHours <= 16 &&
                  preferredDaysOff.length <= 6 &&
                  !roomCredits.some(c => c.credits <= 0 || !Number.isInteger(c.credits));

  // Handle Save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please resolve validation errors before saving.');
      return;
    }

    setIsSaving(true);
    
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save to localStorage propertyos_staff
    const newEmp = {
      id: Date.now(),
      name: `${firstName} ${lastName}`.trim(),
      role: workerType,
      initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
      color: '#2857DA',
      status: status === 'Active' ? ('On Duty' as const) : ('Rest Day' as const),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@propertyos.com`,
      phone: phone,
      rating: 5.0,
      roomsCleaned: 0,
      creditsEarned: 0,
      joinedDate: joiningDate || new Date().toISOString().split('T')[0],
      roomCredits,
      availability,
      preferredDaysOff,
      skillLevel,
      shift: { startTime, endTime, totalHours },
      notes
    };

    try {
      const existing = JSON.parse(localStorage.getItem('propertyos_staff') || '[]');
      localStorage.setItem('propertyos_staff', JSON.stringify([...existing, newEmp]));
    } catch (e) {}

    setIsSaving(false);
    toast.success('Employee profile created successfully!');
    router.push('/dashboard/staff');
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100%', padding: '24px 0', width: '100%' }}>
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Back Button */}
        <button
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
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="John" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.firstName && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Last Name *</label>
                <Input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Doe" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.lastName && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.lastName}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phone Number *</label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="(555) 000-0000" 
                  className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                />
                {errors.phone && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.phone}
                  </p>
                )}
              </div>

              {/* Worker Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Worker Type *</label>
                <select 
                  value={workerType} 
                  onChange={(e) => setWorkerType(e.target.value)} 
                  className="w-full h-[46px] rounded-[12px] border px-4 py-2 text-sm font-medium transition-colors cursor-pointer outline-none shadow-sm bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                >
                  {WORKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Room Credit Configuration */}
          <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                <Settings className="h-5 w-5" style={{ color: C.cyan }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Room Credit Configuration</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Configure the cleaning credits earned for each room type.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              These values are used for payroll calculations, productivity tracking, and performance reporting. Credits must be positive whole numbers.
            </p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.divider}` }}>
                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Room Type</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Cleaning Type</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-36">Credits</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {roomCredits.map((row) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${C.divider}` }}>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{row.type}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{row.cleaningType}</td>
                      <td className="py-3 px-4 text-right">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={row.credits === 0 ? '' : row.credits}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setRoomCredits(prev => prev.map(r => r.id === row.id ? { ...r, credits: val } : r));
                          }}
                          className="w-28 text-right h-[38px] rounded-[8px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] ml-auto"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setRoomCredits(prev => prev.filter(r => r.id !== row.id))}
                          className="text-muted-foreground hover:text-destructive transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
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
                className="text-xs font-bold gap-1.5 h-9 rounded-[10px] mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Room Type
              </Button>
            ) : (
              <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border mt-4" style={{ borderColor: C.border, backgroundColor: 'rgba(120, 120, 120, 0.02)' }}>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Room Type</label>
                  <Input 
                    value={newRoomType} 
                    onChange={(e) => setNewRoomType(e.target.value)} 
                    placeholder="e.g. 1 Queen ADA" 
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cleaning Type</label>
                  <select 
                    value={newCleaningType} 
                    onChange={(e) => setNewCleaningType(e.target.value)} 
                    className="w-full h-9 rounded-[12px] border px-3 text-sm font-medium bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                  >
                    <option value="Dirty Room">Dirty Room</option>
                    <option value="Stayover Occupied Room">Stayover Occupied Room</option>
                    <option value="Maintenance Check">Maintenance Check</option>
                  </select>
                </div>
                <div className="space-y-1.5 w-32">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Credits</label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={newCredits} 
                    onChange={(e) => setNewCredits(Math.max(1, parseInt(e.target.value, 10) || 1))} 
                    className="h-9 text-sm text-right"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={() => {
                      setRoomCredits(prev => [...prev, {
                        id: String(Date.now()),
                        type: newRoomType,
                        cleaningType: newCleaningType,
                        credits: newCredits
                      }]);
                      setIsAddingCredit(false);
                    }}
                    className="h-9 text-xs font-bold"
                  >
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsAddingCredit(false)}
                    className="h-9 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {errors.credits && (
              <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-2">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.credits}
              </p>
            )}
          </div>

          {/* SECTION 3: Work Preferences */}
          <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                <Calendar className="h-5 w-5" style={{ color: C.cyan }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Work Preferences</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Configure availability, preferred days off, and skill settings.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Availability by Day */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Availability by Day</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isAvailable = availability[day];
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setAvailability(prev => ({ ...prev, [day]: !prev[day] }))}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 12,
                          border: `1px solid ${isAvailable ? C.cyan : C.border}`,
                          backgroundColor: isAvailable ? `${C.cyan}15` : 'transparent',
                          color: isAvailable ? C.white : C.muted,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Days Off */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Preferred Days Off</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isOff = preferredDaysOff.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isOff) {
                            setPreferredDaysOff(prev => prev.filter(d => d !== day));
                          } else {
                            if (preferredDaysOff.length >= 6) {
                              toast.error('Preferred days off cannot exceed 6 days.');
                              return;
                            }
                            setPreferredDaysOff(prev => [...prev, day]);
                          }
                        }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 12,
                          border: `1px solid ${isOff ? C.cyan : C.border}`,
                          backgroundColor: isOff ? `${C.cyan}15` : 'transparent',
                          color: isOff ? C.white : C.muted,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {errors.daysOff && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.daysOff}
                  </p>
                )}
              </div>

              {/* Skill Level */}
              <div className="space-y-1.5 max-w-sm">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Skill Level</label>
                <select 
                  value={skillLevel} 
                  onChange={(e) => setSkillLevel(e.target.value)} 
                  className="w-full h-[46px] rounded-[12px] border px-4 py-2 text-sm font-medium transition-colors cursor-pointer outline-none shadow-sm bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                >
                  {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Shift Configuration */}
          <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                <Clock className="h-5 w-5" style={{ color: C.cyan }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Shift Configuration</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Define standard starting/ending hours and track calculated length.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Shift Start Time</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[70px]">
                    {format12H(startTime)}
                  </span>
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Shift End Time</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[70px]">
                    {format12H(endTime)}
                  </span>
                </div>
              </div>

              {/* Read-Only Total Hours */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Shift Hours</label>
                <div className="flex items-center px-4 h-[46px] rounded-[12px] border bg-muted/10 font-bold text-sm text-foreground" style={{ borderColor: C.border }}>
                  {totalHours} Hours
                </div>
              </div>
            </div>
            {errors.shiftTime && (
              <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-4">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.shiftTime}
              </p>
            )}
          </div>

          {/* SECTION 5: Employment Status */}
          <div style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.cyan}15` }}>
                <Briefcase className="h-5 w-5" style={{ color: C.cyan }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Employment Status</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Control administrative joining details and comments.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Status Toggles */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Status</label>
                  <div className="flex gap-2">
                    {(['Active', 'Inactive'] as const).map((s) => {
                      const isSelected = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? (s === 'Active' ? C.green : C.red) : C.border}`,
                            backgroundColor: isSelected ? (s === 'Active' ? `${C.green}15` : `${C.red}15`) : 'transparent',
                            color: isSelected ? (s === 'Active' ? C.green : C.red) : C.muted,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Joining Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Joining Date</label>
                  <Input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="rounded-[12px] h-[46px] border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Employee Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Employee Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter employee record notes or additional work arrangements..."
                  rows={4}
                  className="w-full rounded-[12px] border px-4 py-3 text-sm font-medium transition-colors outline-none shadow-sm bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* PAGE ACTIONS */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={() => router.push('/dashboard/staff')}
              className="h-11 px-6 rounded-[12px] font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!isValid || isSaving}
              onClick={handleSave}
              className="h-11 px-8 rounded-[12px] font-bold text-xs gap-2"
              style={{ backgroundColor: isValid ? C.cyan : undefined }}
            >
              {isSaving ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
