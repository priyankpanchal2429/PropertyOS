'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getCaliforniaDate, toCaliforniaDate, formatCaliforniaDate } from '@/lib/timezone';

import {
  AlertTriangle, Sparkles, Search, LayoutGrid, Users,
  Bed, BedDouble, Accessibility, DoorOpen, SprayCan, Wrench,
  RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Flag,
  Home, UserCheck, CircleDot, Calendar, Lock, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/* ─── Types ────────────────────────────────────────────────────────────── */
interface RoomData {
  number: string;
  type: '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds';
  status: 'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance';
  currentGuestName?: string;
}
interface StatsData {
  stats: { totalRooms: number; occupiedRooms: number; vacantRooms: number; dirtyRooms: number; maintenanceRooms: number; occupancyRate: number };
  rooms: RoomData[];
  weeklyOccupancy: Array<{ day: string; rate: number }>;
}
interface StaffMember {
  name: string; initials: string; hue: string;
  availability: { [key: string]: boolean };
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const getRoomCredits = (type: string, status: string): number => {
  if (status === 'Vacant' || status === 'Maintenance') return 0;
  if (status === 'Dirty') return type === '2 Queen Beds' ? 45 : 35;
  if (status === 'Occupied') return type === '2 Queen Beds' ? 25 : 20;
  return 0;
};

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
  placeholder: 'var(--text-placeholder, #666666)',
  cyan:      'var(--primary)',
  cyanL:     '#45D7E8',
  blue:      '#2857DA',
  blueL:     '#74AAD9',
  orange:    '#E88916',
  yellow:    '#F4B63F',
  green:     '#32C766',
  red:       '#E64C4C',
  lightGray: '#DADADA',
  darkGray:  '#4A4A4A',
};

/* ─── Donut Chart ───────────────────────────────────────────────────────── */
function DonutChart({ occupied, vacant, maintenance, total }: { occupied: number; vacant: number; maintenance: number; total: number }) {
  const r = 60, cx = 80, cy = 80, stroke = 18;
  const circumference = 2 * Math.PI * r;
  const oRatio = occupied / total, vRatio = vacant / total, mRatio = maintenance / total;
  const oDash = circumference * oRatio, vDash = circumference * vRatio, mDash = circumference * mRatio;
  const gap = 4;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.surface} strokeWidth={stroke} />
      {/* Occupied - Blue */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.blue} strokeWidth={stroke}
        strokeDasharray={`${oDash - gap} ${circumference - oDash + gap}`}
        strokeDashoffset={circumference * 0.25} strokeLinecap="round" />
      {/* Maintenance - Red */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.red} strokeWidth={stroke}
        strokeDasharray={`${mDash - gap} ${circumference - mDash + gap}`}
        strokeDashoffset={circumference * 0.25 - oDash} strokeLinecap="round" />
      {/* Vacant - Cyan */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.cyan} strokeWidth={stroke}
        strokeDasharray={`${vDash - gap} ${circumference - vDash + gap}`}
        strokeDashoffset={circumference * 0.25 - oDash - mDash} strokeLinecap="round" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={C.white} fontSize="18" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.muted} fontSize="10">Rooms</text>
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [animateChart, setAnimateChart] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [timeRange, setTimeRange] = useState<'today' | 'week'>('week');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedDate, setSelectedDate] = useState<Date>(getCaliforniaDate());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(getCaliforniaDate());
  const [selectedPreset, setSelectedPreset] = useState<string>('Today');

  const todayOccupancy = [
    { day: '08:00', rate: 12 },
    { day: '10:00', rate: 16 },
    { day: '12:00', rate: 24 },
    { day: '14:00', rate: 32 },
    { day: '16:00', rate: 28 },
    { day: '18:00', rate: 20 },
    { day: '20:00', rate: 14 }
  ];

  const staff: StaffMember[] = [
    { name: 'Ramona',  initials: 'RM', hue: C.red,    availability: { Mon: true,  Tue: true,  Wed: false, Thu: true,  Fri: true,  Sat: true,  Sun: false } },
    { name: 'Tania',   initials: 'TN', hue: C.orange, availability: { Mon: true,  Tue: true,  Wed: false, Thu: true,  Fri: false, Sat: true,  Sun: true  } },
    { name: 'Gladys',  initials: 'GD', hue: C.green,  availability: { Mon: true,  Tue: false, Wed: true,  Thu: true,  Fri: true,  Sat: false, Sun: true  } },
    { name: 'Zuli',    initials: 'ZL', hue: C.cyan,   availability: { Mon: true,  Tue: true,  Wed: true,  Thu: false, Fri: true,  Sat: true,  Sun: true  } },
    { name: 'Eucaria', initials: 'EC', hue: C.blue,   availability: { Mon: false, Tue: true,  Wed: true,  Thu: true,  Fri: true,  Sat: true,  Sun: false } },
    { name: 'Jeimi',   initials: 'JM', hue: C.blueL,  availability: { Mon: true,  Tue: false, Wed: true,  Thu: true,  Fri: false, Sat: true,  Sun: true  } },
  ];

  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayDayName = DAYS[getCaliforniaDate().getDay() === 0 ? 6 : getCaliforniaDate().getDay() - 1];
  const todayStaff = staff.filter(s => s.availability[todayDayName]);
  const scheduleColors = [C.cyan, C.orange, C.blue, C.green, C.red, C.blueL];
  const scheduleHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

  useEffect(() => { const t = setTimeout(() => setAnimateChart(true), 200); return () => clearTimeout(t); }, []);

  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ['dashboardStats'],
    queryFn: async () => { const r = await apiClient.get('/dashboard/stats'); return r.data.data; },
    refetchInterval: 10000,
  });

  // Calendar helpers
  const today = getCaliforniaDate();
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i + calendarOffset);
    return d;
  });
  const dotColors = [C.cyan, C.orange, C.blue, C.green, C.yellow];

  const handlePresetClick = (preset: string) => {
    const todayVal = getCaliforniaDate();
    let target = new Date(todayVal);

    switch (preset) {
      case 'Today':
        target = todayVal;
        break;
      case 'Yesterday':
        target.setDate(todayVal.getDate() - 1);
        break;
      case 'Last 7 Days':
        target.setDate(todayVal.getDate() - 7);
        break;
      case 'Last 30 Days':
        target.setDate(todayVal.getDate() - 30);
        break;
      case 'Last Month':
        target.setMonth(todayVal.getMonth() - 1);
        target.setDate(1);
        break;
      case 'Last 3 Month':
        target.setMonth(todayVal.getMonth() - 3);
        target.setDate(1);
        break;
      case 'Last 6 Month':
        target.setMonth(todayVal.getMonth() - 6);
        target.setDate(1);
        break;
      case 'Last 1 Year':
        target.setFullYear(todayVal.getFullYear() - 1);
        target.setDate(1);
        break;
      case 'Current Month':
        target.setDate(1);
        break;
      case 'Current F.Y.':
        if (todayVal.getMonth() < 3) {
          target = new Date(todayVal.getFullYear() - 1, 3, 1);
        } else {
          target = new Date(todayVal.getFullYear(), 3, 1);
        }
        break;
    }

    const caTarget = toCaliforniaDate(target);
    setSelectedDate(caTarget);
    setCurrentMonth(caTarget);
    setSelectedPreset(preset);
    setIsCalendarOpen(false);
  };

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    const is401 = (error as any)?.response?.status === 401;
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center" style={{ backgroundColor: C.bg }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: `${C.red}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle className="h-8 w-8" style={{ color: C.red }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: C.white }}>
          {is401 ? 'Session Expired' : 'Connection Error'}
        </h2>
        <p className="text-sm max-w-sm" style={{ color: C.muted }}>
          {is401
            ? 'Your session has expired. Please log in again to continue.'
            : 'Unable to reach the backend server. Make sure it is running on port 5001.'}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {is401 ? (
            <Button onClick={() => { window.location.href = '/login'; }}>
              Sign In Again
            </Button>
          ) : (
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { stats: realStats, rooms: realRooms, weeklyOccupancy } = data!;

  // Get active rooms and stats based on selected preset/date
  const getActiveStatsAndRooms = () => {
    if (selectedPreset === 'Today') {
      return { rooms: realRooms, stats: realStats };
    }

    // Determine target occupied/vacant/dirty/maintenance numbers
    let occupiedCount = 14;
    let vacantCount = 6;
    let dirtyCount = 0;
    let maintenanceCount = 0;

    if (selectedPreset === 'Custom') {
      const daySeed = selectedDate.getDate() % 4;
      occupiedCount = 13 + daySeed; // 13, 14, 15, or 16
      vacantCount = realRooms.length ? realRooms.length - occupiedCount : 20 - occupiedCount;
    } else {
      switch (selectedPreset) {
        case 'Yesterday':
          occupiedCount = 15; vacantCount = 5; dirtyCount = 0; maintenanceCount = 0;
          break;
        case 'Last 7 Days':
          occupiedCount = 16; vacantCount = 4; dirtyCount = 0; maintenanceCount = 0;
          break;
        case 'Last 30 Days':
          occupiedCount = 13; vacantCount = 5; dirtyCount = 1; maintenanceCount = 1;
          break;
        case 'Last Month':
          occupiedCount = 12; vacantCount = 7; dirtyCount = 1; maintenanceCount = 0;
          break;
        case 'Last 3 Month':
          occupiedCount = 11; vacantCount = 7; dirtyCount = 1; maintenanceCount = 1;
          break;
        case 'Last 6 Month':
          occupiedCount = 10; vacantCount = 8; dirtyCount = 1; maintenanceCount = 1;
          break;
        case 'Last 1 Year':
          occupiedCount = 14; vacantCount = 4; dirtyCount = 1; maintenanceCount = 1;
          break;
        case 'Current Month':
          occupiedCount = 15; vacantCount = 4; dirtyCount = 1; maintenanceCount = 0;
          break;
        case 'Current F.Y.':
          occupiedCount = 17; vacantCount = 3; dirtyCount = 0; maintenanceCount = 0;
          break;
      }
    }

    const total = realRooms.length || 20;
    if (occupiedCount > total) occupiedCount = total;
    if (occupiedCount + vacantCount > total) vacantCount = total - occupiedCount;
    dirtyCount = total - occupiedCount - vacantCount;

    const simulatedRooms = (realRooms.length ? realRooms : Array.from({ length: 20 }, (_, i) => ({
      number: String(101 + i),
      type: (i % 4 === 0 ? '1 King Bed' : i % 4 === 1 ? '2 Queen Beds' : i % 4 === 2 ? '1 Queen Bed' : '1 King ADA') as any,
      status: 'Vacant' as any,
      currentGuestName: undefined
    }) as RoomData)).map((room, idx) => {
      let status: 'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance' = 'Vacant';
      if (idx < occupiedCount) {
        status = 'Occupied';
      } else if (idx < occupiedCount + vacantCount) {
        status = 'Vacant';
      } else if (idx < occupiedCount + vacantCount + dirtyCount) {
        status = 'Dirty';
      } else {
        status = 'Maintenance';
      }
      return {
        ...room,
        status,
        currentGuestName: status === 'Occupied' ? room.currentGuestName || 'Walk-in Guest' : undefined
      };
    });

    const occupancyRate = total > 0 ? Math.round((occupiedCount / total) * 100) : 0;

    return {
      rooms: simulatedRooms,
      stats: {
        totalRooms: total,
        occupiedRooms: occupiedCount,
        vacantRooms: vacantCount,
        dirtyRooms: dirtyCount,
        maintenanceRooms: maintenanceCount,
        occupancyRate,
      }
    };
  };

  const { rooms, stats } = getActiveStatsAndRooms();
  const totalCredits = rooms.reduce((acc, room) => acc + getRoomCredits(room.type, room.status), 0);

  const selectedDayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];

  // Overwrite the selected day's item in weeklyOccupancy with the new occupancy rate
  const activeWeeklyOccupancy = weeklyOccupancy.map((item) => {
    if (item.day === selectedDayName) {
      return { ...item, rate: stats.occupancyRate };
    }
    return item;
  });

  const activeOccupancy = timeRange === 'today' ? todayOccupancy : activeWeeklyOccupancy;

  const isTodaySlot = (idx: number, dayName: string) => {
    if (timeRange === 'week') {
      return dayName === selectedDayName;
    } else {
      const currentHour = getCaliforniaDate().getHours();
      let closestHourIdx = todayOccupancy.length - 1;
      let minDiff = 24;
      todayOccupancy.forEach((item, i) => {
        const slotHour = parseInt(item.day.split(':')[0], 10);
        const diff = Math.abs(currentHour - slotHour);
        if (diff < minDiff) {
          minDiff = diff;
          closestHourIdx = i;
        }
      });
      return idx === closestHourIdx && formatCaliforniaDate(selectedDate) === formatCaliforniaDate(getCaliforniaDate());
    }
  };
  const maxRate = Math.max(...activeOccupancy.map(d => d.rate), 1);
  const totalRoomsCount = stats.totalRooms || 50;
  const vacantPct = (stats.vacantRooms / totalRoomsCount) * 100;
  const occupiedPct = (stats.occupiedRooms / totalRoomsCount) * 100;
  const maintenancePct = (stats.maintenanceRooms / totalRoomsCount) * 100;
  const dirtyPct = (stats.dirtyRooms / totalRoomsCount) * 100;

  const chartW = 1000;
  const count = activeOccupancy.length;
  const segW = chartW / count;
  const points = activeOccupancy.map((d, i) => ({
    x: segW / 2 + i * segW,
    y: 110 - (d.rate / Math.max(maxRate, 1)) * 85
  }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + 50;
    const cpY1 = p0.y;
    const cpX2 = p1.x - 50;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  const fillD = `${pathD} L ${points[points.length - 1].x} 115 L ${points[0].x} 115 Z`;

  const filteredRooms = rooms
    .filter(r => !searchQuery || r.number.includes(searchQuery) || r.status.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => activeTab === 'all' || r.type === activeTab)
    .filter(r => statusFilter === 'all' || r.status === statusFilter);

  const getStatusStyle = (s: RoomData['status']) => {
    switch (s) {
      case 'Vacant':      return { bg: `${C.green}15`, border: `${C.green}40`, color: C.green, dot: C.green };
      case 'Occupied':    return { bg: `${C.blue}15`,  border: `${C.blue}40`,  color: C.blue,  dot: C.blue  };
      case 'Dirty':       return { bg: `${C.orange}15`,border: `${C.orange}40`,color: C.orange,dot: C.orange };
      case 'Maintenance': return { bg: `${C.red}15`,   border: `${C.red}40`,   color: C.red,   dot: C.red   };
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100%', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 24, width: '100%', margin: 0 }}>

      {/* ── Greeting Bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, fontWeight: 500 }}>
            Hi, Property Manager (showing data for {formatCaliforniaDate(selectedDate)})
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.white, margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            👋 Welcome back!
          </h1>
        </div>
        
        {/* Today / Week filter buttons + Calendar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(120,120,120,0.1)',
            border: '1px solid rgba(120,120,120,0.15)',
            borderRadius: 14,
            padding: 4
          }}>
            <button
              onClick={() => {
                setTimeRange('today');
                setSelectedDate(getCaliforniaDate());
                setCurrentMonth(getCaliforniaDate());
                setSelectedPreset('Today');
              }}
              style={{
                border: 'none',
                backgroundColor: timeRange === 'today' ? '#23262b' : 'transparent',
                color: timeRange === 'today' ? '#FFFFFF' : C.muted,
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
                borderRadius: 10,
                boxShadow: timeRange === 'today' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              style={{
                border: 'none',
                backgroundColor: timeRange === 'week' ? '#23262b' : 'transparent',
                color: timeRange === 'week' ? '#FFFFFF' : C.muted,
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
                borderRadius: 10,
                boxShadow: timeRange === 'week' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              Week
            </button>
          </div>
          
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              backgroundColor: 'rgba(120,120,120,0.1)',
              border: '1px solid rgba(120,120,120,0.15)',
              color: C.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Calendar size={15} />
          </button>

          {/* Invisible click-away backdrop */}
          {isCalendarOpen && (
            <div
              onClick={() => setIsCalendarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'transparent',
                zIndex: 40,
                cursor: 'default'
              }}
            />
          )}

          {/* Calendar Dropdown */}
          {isCalendarOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                zIndex: 50,
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: 16,
                width: 440,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'row',
                gap: 16
              }}
            >
              {/* Left Side: Preset Ranges */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: 130,
                borderRight: `1px solid ${C.border}`,
                paddingRight: 12
              }}>
                {[
                  'Today',
                  'Yesterday',
                  'Last 7 Days',
                  'Last 30 Days',
                  'Last Month',
                  'Last 3 Month',
                  'Last 6 Month',
                  'Last 1 Year',
                  'Current Month',
                  'Current F.Y.'
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePresetClick(preset);
                    }}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: C.muted,
                      fontSize: 11,
                      fontWeight: 600,
                      textAlign: 'left',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      borderRadius: 8,
                      width: '100%',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(120, 120, 120, 0.08)';
                      e.currentTarget.style.color = C.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = C.muted;
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Right Side: Calendar Grid */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Calendar Month Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                    }}
                    style={{ border: 'none', backgroundColor: 'transparent', color: C.muted, cursor: 'pointer', padding: 4 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                    }}
                    style={{ border: 'none', backgroundColor: 'transparent', color: C.muted, cursor: 'pointer', padding: 4 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Grid content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Weekdays */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                    <span>Su</span>
                  </div>

                  {/* Days Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                    {(() => {
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const offset = firstDay === 0 ? 6 : firstDay - 1;
                      const daysInMonth = new Date(year, month + 1, 0).getDate();

                      const cells = [];
                      for (let i = 0; i < offset; i++) {
                        cells.push(<div key={`empty-${i}`} />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dayObj = new Date(year, month, d);
                        const isSelected = selectedDate.toDateString() === dayObj.toDateString();
                        const isToday = dayObj.getDate() === today.getDate() && 
                                        dayObj.getMonth() === today.getMonth() && 
                                        dayObj.getFullYear() === today.getFullYear();

                        cells.push(
                          <button
                            key={`day-${d}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dayObj);
                              setSelectedPreset('Custom');
                              setIsCalendarOpen(false);
                            }}
                            style={{
                              height: 30,
                              width: 30,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              border: isToday && !isSelected ? '1.5px solid #a855f7' : 'none',
                              backgroundColor: isSelected ? '#a855f7' : 'transparent',
                              color: isSelected ? '#FFFFFF' : isToday ? '#a855f7' : C.white,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {d}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Property Overview (Balance Card) - Full Width ───────────────── */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, padding: '28px 28px 24px 28px' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>Occupancy Overview</h2>

          </div>
          
          {/* Chart visual toggle buttons */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(120,120,120,0.1)',
            border: '1px solid rgba(120,120,120,0.15)',
            borderRadius: 10,
            padding: 3
          }}>
            <button
              onClick={() => setChartType('line')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: 'none',
                backgroundColor: chartType === 'line' ? '#23262b' : 'transparent',
                color: chartType === 'line' ? '#FFFFFF' : C.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </button>
            <button
              onClick={() => setChartType('bar')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: 'none',
                backgroundColor: chartType === 'bar' ? '#23262b' : 'transparent',
                color: chartType === 'bar' ? '#FFFFFF' : C.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart Row: Stat + Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginBottom: 24 }}>
          {/* Left: Rate Stat */}
          <div style={{ flexShrink: 0, minWidth: 160, paddingBottom: 32 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, marginTop: 0 }}>Avg. Occupancy Rate</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: C.white, lineHeight: 1 }}>{stats.occupancyRate}%</span>
              <span style={{ fontSize: 11, color: C.green, backgroundColor: `${C.green}15`, padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                ↗ 5.4%
              </span>
            </div>
          </div>
          
          {/* Right: Chart area — toggles between line and bar */}
          <div style={{ flex: 1 }}>
            {chartType === 'line' ? (
              /* ── Line Chart View ── */
              <div style={{ position: 'relative', width: '100%' }}>
                <svg viewBox="0 0 1000 145" width="100%" height="145" preserveAspectRatio="none" style={{ overflow: 'visible', display: 'block' }}>
                  <defs>
                    <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="30" y1="25" x2="970" y2="25" stroke="rgba(255,255,255,0.04)" />
                  <line x1="30" y1="65" x2="970" y2="65" stroke="rgba(255,255,255,0.04)" />
                  <line x1="30" y1="105" x2="970" y2="105" stroke="rgba(255,255,255,0.04)" />
                  {/* Area fill */}
                  <path d={fillD} fill="url(#area-fill)" />
                  {/* Line */}
                  <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 8px rgba(59, 130, 246, 0.35))' }} />
                  {/* Dots */}
                  {points.map((p, idx) => {
                    const isToday = isTodaySlot(idx, activeOccupancy[idx].day);
                    return (
                      <g key={idx}>
                        {isToday ? (
                          <>
                            <circle cx={p.x} cy={p.y} r="10" fill="#3b82f6" opacity="0.2" />
                            <circle cx={p.x} cy={p.y} r="5" fill="#1a1d24" stroke="#3b82f6" strokeWidth="2.5" />
                            <circle cx={p.x} cy={p.y} r="2" fill="#ffffff" />
                          </>
                        ) : (
                          <circle cx={p.x} cy={p.y} r="3" fill="#1a1d24" stroke="#93c5fd" strokeWidth="2" />
                        )}
                      </g>
                    );
                  })}
                  {/* X-axis labels */}
                  {activeOccupancy.map((d, idx) => (
                    <text key={d.day} x={points[idx].x} y={135} textAnchor="middle" fill={isTodaySlot(idx, d.day) ? '#3b82f6' : C.muted} fontSize="11" fontWeight="700" fontFamily="inherit" style={{ textTransform: 'uppercase' }}>
                      {d.day}
                    </text>
                  ))}
                </svg>
              </div>
            ) : (
              /* ── Bar Chart View ── */
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, width: '100%', maxWidth: 900, margin: '0 auto' }}>
                {activeOccupancy.map((d, idx) => {
                  const isToday = isTodaySlot(idx, d.day);
                  const fillPct = Math.max(8, (d.rate / Math.max(maxRate, 1)) * 100);
                  const maxH = 130;
                  const fillH = (fillPct / 100) * maxH;

                  return (
                    <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
                      {/* Percentage Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#3b82f6' : C.muted }}>
                          {d.rate}%
                        </span>
                        {isToday && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                        )}
                      </div>
                      {/* Bar Container */}
                      <div style={{
                        width: '100%',
                        maxWidth: 72,
                        height: maxH,
                        borderRadius: 12,
                        backgroundColor: isToday ? 'rgba(59, 130, 246, 0.08)' : 'rgba(147, 197, 253, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          height: fillH,
                          borderRadius: 12,
                          backgroundColor: isToday ? '#3b82f6' : '#93c5fd',
                          transition: 'height 0.4s ease',
                        }} />
                      </div>
                      {/* Day Label */}
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isToday ? '#3b82f6' : C.muted }}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${C.divider}`, paddingTop: 20 }}>
          {[
            { label: 'Occupied',     value: stats.occupiedRooms, unit: 'rooms', color: C.blue,   trend: '↗' },
            { label: 'Vacant',       value: stats.vacantRooms,   unit: 'rooms', color: C.green,  trend: '↗' },
            { label: 'Dirty',        value: stats.dirtyRooms,    unit: 'rooms', color: C.orange, trend: '↘' },
            { label: 'Task Credits', value: totalCredits,        unit: 'cr',    color: C.cyan,   trend: '↗' },
          ].map((s, idx) => (
            <div key={s.label} style={{
              padding: '0 20px',
              borderRight: idx < 3 ? `1px solid ${C.divider}` : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                <span style={{ fontSize: 9, color: s.color, backgroundColor: `${s.color}12`, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {s.trend}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.white, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* ── Room Status (Combined Card) ───────────────── */}
      <div style={{ 
        backgroundColor: C.card, 
        borderRadius: 16, 
        padding: 24, 
        cursor: 'pointer' 
      }}
        onClick={() => setIsGridOpen(true)}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>Room Status</h3>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            backgroundColor: 'rgba(120, 120, 120, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: C.muted
          }}>
            <MoreHorizontal style={{ width: 16, height: 16 }} />
          </div>
        </div>

        {/* 3 Columns Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          
          {/* Section 1: Occupancy */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRight: `1px solid ${C.divider}`,
            paddingRight: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8, 
                backgroundColor: '#3b82f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <Users style={{ width: 16, height: 16, color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Occupancy</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: C.white, lineHeight: 1 }}>
                    {stats.occupancyRate}%
                  </span>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                    from 100%
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
                  vs last week: <strong style={{ color: C.white }}>82%</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', width: 90, height: 75 }}>
                {(() => {
                  const x0 = 45;
                  const y0 = 57;
                  const R = 32;
                  const angle = -180 + (stats.occupancyRate / 100) * 180;
                  const rad = angle * Math.PI / 180;
                  const endX = x0 + R * Math.cos(rad);
                  const endY = y0 + R * Math.sin(rad);

                  return (
                    <svg width="90" height="60" viewBox="0 0 90 60" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                      <path d="M 13 57 A 32 32 0 0 1 77 57" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="5" strokeLinecap="round" />
                      <path d={`M 13 57 A 32 32 0 0 1 ${endX} ${endY}`} fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
                      <circle cx={endX} cy={endY} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  );
                })()}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  backgroundColor: 'rgba(34, 197, 94, 0.12)', 
                  color: '#22c55e', 
                  padding: '1px 5px', 
                  borderRadius: 4, 
                  fontSize: 9, 
                  fontWeight: 700 
                }}>
                  +4% ↗
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Available Rooms */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRight: `1px solid ${C.divider}`,
            paddingRight: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8, 
                backgroundColor: '#22c55e', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <BedDouble style={{ width: 16, height: 16, color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Available Rooms</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: C.white, lineHeight: 1 }}>
                    {stats.vacantRooms}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                    from {stats.totalRooms} rooms
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
                  vs last week: <strong style={{ color: C.white }}>12 rooms</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', width: 90, height: 75 }}>
                {(() => {
                  const x0 = 45;
                  const y0 = 57;
                  const R = 32;
                  const ratePct = stats.totalRooms ? (stats.vacantRooms / stats.totalRooms) * 100 : 0;
                  const angle = -180 + (ratePct / 100) * 180;
                  const rad = angle * Math.PI / 180;
                  const endX = x0 + R * Math.cos(rad);
                  const endY = y0 + R * Math.sin(rad);

                  return (
                    <svg width="90" height="60" viewBox="0 0 90 60" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                      <path d="M 13 57 A 32 32 0 0 1 77 57" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="5" strokeLinecap="round" />
                      <path d={`M 13 57 A 32 32 0 0 1 ${endX} ${endY}`} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
                      <circle cx={endX} cy={endY} r="4.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  );
                })()}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  backgroundColor: 'rgba(34, 197, 94, 0.12)', 
                  color: '#22c55e', 
                  padding: '1px 5px', 
                  borderRadius: 4, 
                  fontSize: 9, 
                  fontWeight: 700 
                }}>
                  +34% ↗
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Dirty Rooms */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8, 
                backgroundColor: '#ff9f43', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <SprayCan style={{ width: 16, height: 16, color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Dirty Rooms</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: C.white, lineHeight: 1 }}>
                    {stats.dirtyRooms}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                    from {stats.totalRooms} rooms
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
                  vs last week: <strong style={{ color: C.white }}>12 rooms</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', width: 90, height: 75 }}>
                {(() => {
                  const x0 = 45;
                  const y0 = 57;
                  const R = 32;
                  const ratePct = stats.totalRooms ? (stats.dirtyRooms / stats.totalRooms) * 100 : 0;
                  const angle = -180 + (ratePct / 100) * 180;
                  const rad = angle * Math.PI / 180;
                  const endX = x0 + R * Math.cos(rad);
                  const endY = y0 + R * Math.sin(rad);

                  return (
                    <svg width="90" height="60" viewBox="0 0 90 60" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                      <path d="M 13 57 A 32 32 0 0 1 77 57" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="5" strokeLinecap="round" />
                      <path d={`M 13 57 A 32 32 0 0 1 ${endX} ${endY}`} fill="none" stroke="#ff9f43" strokeWidth="5" strokeLinecap="round" />
                      <circle cx={endX} cy={endY} r="4.5" fill="#ff9f43" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  );
                })()}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  backgroundColor: 'rgba(34, 197, 94, 0.12)', 
                  color: '#22c55e', 
                  padding: '1px 5px', 
                  borderRadius: 4, 
                  fontSize: 9, 
                  fontWeight: 700 
                }}>
                  +28% ↗
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Room Grid Modal ────────────────────────────────────────────── */}
      <Dialog open={isGridOpen} onOpenChange={setIsGridOpen}>
        <DialogContent className="max-w-5xl lg:max-w-6xl max-h-[88vh] overflow-y-auto rounded-[20px] p-8 flex flex-col gap-6"
          style={{ backgroundColor: C.card }}>
          <DialogHeader className="border-b pb-4" style={{ borderColor: C.divider }}>
            <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: C.white }}>
              <Home className="h-5 w-5" style={{ color: C.cyan }} />
              Hotel Room Status Console
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: C.muted }}>Real-time status for all {stats.totalRooms} rooms.</p>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 border-b pb-4" style={{ borderColor: C.divider }}>
            {[
              { label: 'All',         value: 'all',         color: C.secondary, bg: C.surface,    border: C.border      },
              { label: 'Vacant',      value: 'Vacant',      color: C.green,  bg: `${C.green}15`,  border: `${C.green}40`  },
              { label: 'Occupied',    value: 'Occupied',    color: C.blue,   bg: `${C.blue}15`,   border: `${C.blue}40`   },
              { label: 'Dirty',       value: 'Dirty',       color: C.orange, bg: `${C.orange}15`, border: `${C.orange}40` },
              { label: 'Maintenance', value: 'Maintenance', color: C.red,    bg: `${C.red}15`,    border: `${C.red}40`    },
            ].map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value as any)}
                className="flex items-center gap-2 px-4 h-9 rounded-[8px] border text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: statusFilter === f.value ? f.bg : C.surface,
                  color: statusFilter === f.value ? f.color : C.muted,
                  borderColor: statusFilter === f.value ? f.border : C.border,
                }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {filteredRooms.map(room => {
              const credits = getRoomCredits(room.type, room.status);
              const s = getStatusStyle(room.status)!;
              return (
                <div key={room.number} className="flex flex-col justify-between px-2.5 py-2 rounded-[10px] border h-[60px]"
                  style={{ backgroundColor: s.bg, borderColor: s.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: C.white }}>{room.number}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.dot }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium" style={{ color: s.color, opacity: 0.85 }}>
                      {room.type === '1 Queen Bed' ? '1Q' : room.type === '1 King Bed' ? '1K' : room.type === '1 King ADA' ? 'ADA' : '2Q'}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: s.color }}>{credits}cr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function DashboardSkeleton() {
  const bgSkeleton = 'rgba(120, 120, 120, 0.08)';
  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100%', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 24, width: '100%', margin: 0 }} className="animate-pulse">
      
      {/* ── Greeting Bar Skeleton ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ height: 14, width: 220, backgroundColor: bgSkeleton, borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 28, width: 260, backgroundColor: bgSkeleton, borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 38, width: 140, backgroundColor: bgSkeleton, borderRadius: 14 }} />
          <div style={{ height: 38, width: 38, backgroundColor: bgSkeleton, borderRadius: 14 }} />
        </div>
      </div>

      {/* ── Occupancy Overview Chart Skeleton (Property Overview Card) ── */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '28px 28px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ height: 20, width: 180, backgroundColor: bgSkeleton, borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 12, width: 120, backgroundColor: bgSkeleton, borderRadius: 4 }} />
          </div>
          <div style={{ height: 36, width: 100, backgroundColor: bgSkeleton, borderRadius: 10 }} />
        </div>

        {/* Main Chart Area */}
        <div style={{ height: 180, width: '100%', backgroundColor: bgSkeleton, borderRadius: 12 }} />

        {/* Bottom Spacing / Divider */}
        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px', borderRight: i < 4 ? '1px solid var(--divider)' : 'none' }}>
              <div style={{ height: 11, width: 80, backgroundColor: bgSkeleton, borderRadius: 4 }} />
              <div style={{ height: 24, width: 120, backgroundColor: bgSkeleton, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Room Status (Combined Card) Skeleton ───────────────────────── */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 18, width: 120, backgroundColor: bgSkeleton, borderRadius: 6 }} />
          <div style={{ height: 32, width: 32, backgroundColor: bgSkeleton, borderRadius: 8 }} />
        </div>

        {/* 3 Columns Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              borderRight: i < 3 ? '1px solid var(--divider)' : 'none',
              paddingRight: i < 3 ? 24 : 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: bgSkeleton }} />
                <div style={{ height: 14, width: 100, backgroundColor: bgSkeleton, borderRadius: 4 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 28, width: 70, backgroundColor: bgSkeleton, borderRadius: 6 }} />
                  <div style={{ height: 12, width: 110, backgroundColor: bgSkeleton, borderRadius: 4 }} />
                </div>
                <div style={{ width: 90, height: 60, borderRadius: '50% 50% 0 0', border: `8px solid ${bgSkeleton}`, borderBottom: 'none' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
