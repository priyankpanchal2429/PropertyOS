'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Home,
  AlertTriangle,
  Sparkles,
  Search,
  LayoutGrid,
  Calendar,
  Users,
  Clock,
  Building,
  Bed,
  BedDouble,
  Crown,
  Accessibility,
  CircleDot,
  DoorOpen,
  UserCheck,
  SprayCan,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoomData {
  number: string;
  type: '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds';
  status: 'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance';
  currentGuestName?: string;
}

interface StatsData {
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    dirtyRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
  };
  rooms: RoomData[];
  weeklyOccupancy: Array<{ day: string; rate: number }>;
}

interface StaffMember {
  name: string;
  initials: string;
  color: string;
  availability: { [key: string]: boolean };
}

const getRoomCredits = (type: string, status: string): number => {
  if (status === 'Vacant' || status === 'Maintenance') return 0;

  if (status === 'Dirty') {
    if (type === '1 Queen Bed' || type === '1 King Bed' || type === '1 King ADA') return 35;
    if (type === '2 Queen Beds') return 45;
  }

  if (status === 'Occupied') {
    if (type === '1 Queen Bed' || type === '1 King Bed' || type === '1 King ADA') return 20;
    if (type === '2 Queen Beds') return 25;
  }

  return 0;
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);
  const [occupancyCount, setOccupancyCount] = useState(0);

  // Housekeeper Staff List with Availability Toggles (Default: available 7 days)
  const [staff, setStaff] = useState<StaffMember[]>([
    { name: 'Ramona', initials: 'RM', color: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
    { name: 'Tania', initials: 'TN', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
    { name: 'Gladys', initials: 'GD', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
    { name: 'Zuli', initials: 'ZL', color: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
    { name: 'Eucaria', initials: 'EC', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
    { name: 'Jeimi', initials: 'JM', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } },
  ]);

  // Track hovered housekeeper to highlight their shifts in weekly grid
  const [hoveredStaff, setHoveredStaff] = useState<string | null>(null);

  // Modal Room Grid Filter States
  const [activeTab, setActiveTab] = useState<'all' | '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance'>('all');

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimateChart(true), 150);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const readSearch = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        setSearchQuery(params.get('search') || '');
      }
    };

    readSearch();

    window.addEventListener('search-change', readSearch);
    window.addEventListener('popstate', readSearch);

    return () => {
      window.removeEventListener('search-change', readSearch);
      window.removeEventListener('popstate', readSearch);
    };
  }, []);

  // Fetch Stats and Rooms list
  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10s for real-time occupancy updates
  });

  const targetRate = data?.stats?.occupancyRate || 0;

  React.useEffect(() => {
    if (!data) return;
    let start = 0;
    const end = targetRate;
    if (start === end) {
      setOccupancyCount(end);
      return;
    }
    const totalDuration = 1000;
    const incrementTime = Math.max(Math.floor(totalDuration / end), 15);
    const timer = setInterval(() => {
      start += 1;
      setOccupancyCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [targetRate, !!data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    const isUnauthorized = (error as any)?.response?.status === 401;
    if (isUnauthorized) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-2.5 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground font-semibold">Session expired. Redirecting to login...</p>
        </div>
      );
    }

    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 border rounded-xl p-8 bg-card text-center">
        <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
        <h2 className="text-lg font-bold">Database connection buffering</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Unable to fetch real-time room data. Please check if your MongoDB Atlas Network settings whitelist is configured to allow connections from anywhere (`0.0.0.0/0`).
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const { stats, rooms, weeklyOccupancy } = data!;
  const totalCredits = rooms.reduce((acc, room) => acc + getRoomCredits(room.type, room.status), 0);

  // Apply filters dynamically
  const filteredRooms = rooms
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.number.includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.currentGuestName?.toLowerCase().includes(q)
      );
    })
    .filter((r) => {
      if (activeTab === 'all') return true;
      return r.type === activeTab;
    })
    .filter((r) => {
      if (statusFilter === 'all') return true;
      return r.status === statusFilter;
    });

  const getStatusColor = (status: RoomData['status']) => {
    switch (status) {
      case 'Vacant':
        return 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Occupied':
        return 'bg-blue-500/5 text-blue-700 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Dirty':
        return 'bg-amber-500/5 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Maintenance':
        return 'bg-red-500/5 text-red-700 border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
    }
  };

  // Toggle availability state
  const toggleAvailability = (staffName: string, day: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.name === staffName) {
          return {
            ...s,
            availability: {
              ...s.availability,
              [day]: !s.availability[day],
            },
          };
        }
        return s;
      })
    );
  };

  // Solve Weekly Shifts based on Occupancy and Availability (Round-Robin Shift Tracker)
  const getWeeklySchedule = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const occupancyRates: { [key: string]: number } = {};
    weeklyOccupancy.forEach((d) => {
      occupancyRates[d.day] = d.rate;
    });

    const schedule: { [key: string]: StaffMember[] } = {};
    let staffIndex = 0; // Rotate starting index daily to ensure balanced distribution

    days.forEach((day) => {
      const rate = occupancyRates[day] || 50;

      // Housekeeper counts needed based on capacity
      let reqCount = 3;
      if (rate < 30) reqCount = 2;
      else if (rate <= 60) reqCount = 3;
      else if (rate <= 80) reqCount = 4;
      else reqCount = 5;

      const availableStaff = staff.filter((s) => s.availability[day]);

      if (availableStaff.length === 0) {
        schedule[day] = [];
        return;
      }

      const assigned: StaffMember[] = [];
      const countToAssign = Math.min(reqCount, availableStaff.length);
      let attempts = 0;

      while (assigned.length < countToAssign && attempts < staff.length * 2) {
        const candidate = staff[staffIndex % staff.length];
        if (candidate.availability[day] && !assigned.some((a) => a.name === candidate.name)) {
          assigned.push(candidate);
        }
        staffIndex++;
        attempts++;
      }
      schedule[day] = assigned;
    });

    return schedule;
  };

  const weeklySchedule = getWeeklySchedule();

  const occupancyRatesMap: { [key: string]: number } = {};
  weeklyOccupancy.forEach((d) => {
    occupancyRatesMap[d.day] = d.rate;
  });

  const totalWeeklyShifts = Object.values(weeklySchedule).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="space-y-8 max-w-[92rem] mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Property Control Panel</h1>
        <p className="text-sm text-muted-foreground">
          Real-time occupancy status and layout management for your 50-room hotel.
        </p>
      </div>

      {/* Top Section: Merged Console Card and Weekly Occupancy Visualizer */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Merged Card: Property Overview */}
        <Card 
          onClick={() => setIsGridOpen(true)}
          className="border shadow-none bg-card flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all hover:shadow-xs group md:col-span-2"
        >
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <LayoutGrid className="h-4.5 w-4.5 text-primary" />
                  Property Overview
                </CardTitle>
                <CardDescription>Real-time room status stats and credit allocations</CardDescription>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full group-hover:bg-primary/10 transition-colors">
                Open Status Grid →
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6 pb-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Vacant Card */}
              <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/10 flex flex-col justify-between h-[80px]">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Vacant</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.vacantRooms}</span>
                  <span className="text-[10px] text-emerald-600/70 font-semibold">/50</span>
                </div>
              </div>

              {/* Occupied Card */}
              <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/10 flex flex-col justify-between h-[80px]">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Occupied</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.occupiedRooms}</span>
                  <span className="text-[10px] text-blue-600/70 font-semibold">/50</span>
                </div>
              </div>

              {/* Dirty Card */}
              <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/10 flex flex-col justify-between h-[80px]">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Dirty</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.dirtyRooms}</span>
                  <span className="text-[10px] text-amber-600/70 font-semibold">/50</span>
                </div>
              </div>

              {/* Housekeeping Credits Card */}
              <div className="p-3.5 rounded-xl border bg-indigo-500/5 border-indigo-500/10 flex flex-col justify-between h-[80px]">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  Task Credits
                </p>
                <div className="flex items-baseline mt-1">
                  <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{totalCredits}</span>
                  <span className="text-[10px] text-indigo-600/70 font-semibold ml-1">cr</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Banner */}
            <div className="flex justify-between items-center p-3 border rounded-xl bg-muted/20 gap-3">
              <div className="text-xs text-muted-foreground font-medium">
                Click anywhere on this card to search, filter, and inspect the room statuses.
              </div>
              <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Inspect {stats.occupiedRooms + stats.dirtyRooms} Rooms →
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Occupancy Visualizer */}
        <Card className="border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  Weekly Occupancy
                </CardTitle>
                <CardDescription>Capacity usage from Mon to Sun</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary transition-all duration-300">{occupancyCount}%</p>
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Today</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end pb-6 pt-2">
            {/* Custom Vertical Bar Chart */}
            <div className="flex items-end justify-between h-[160px] w-full gap-2.5 sm:gap-3.5 pt-4">
              {weeklyOccupancy.map((dayData, index) => {
                const isToday = dayData.day === 'Sun'; // Sunday is current day in our seed stats
                return (
                  <div key={dayData.day} className="flex flex-col items-center flex-1 h-full justify-end group/bar">
                    {/* Percentage Value */}
                    <span className={`text-[10px] font-black leading-none mb-1.5 transition-all duration-500 flex items-center gap-1 ${
                      animateChart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    } ${
                      isToday ? 'text-primary animate-pulse' : 'text-muted-foreground group-hover/bar:text-foreground'
                    }`}
                    style={{ transitionDelay: `${index * 80 + 300}ms` }}
                    >
                      {dayData.rate}%
                      {isToday && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                      )}
                    </span>

                    {/* Bar Track */}
                    <div className="w-full bg-muted/30 hover:bg-muted/50 rounded-t-md relative flex flex-col justify-end overflow-hidden border border-border/20 transition-all h-[120px]">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-1000 ease-out ${
                          isToday 
                            ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                            : 'bg-primary/35 group-hover/bar:bg-primary/50'
                        }`}
                        style={{ 
                          height: animateChart ? `${dayData.rate}%` : '0%',
                          transitionDelay: `${index * 80}ms`
                        }}
                      />
                    </div>

                    {/* Day Label */}
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider mt-2 transition-colors ${
                      isToday ? 'text-primary font-black' : 'text-muted-foreground group-hover/bar:text-foreground'
                    }`}>
                      {dayData.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Housekeeper Weekly Schedule Console */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-2 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Housekeeper Weekly Schedule</CardTitle>
              <CardDescription>Dynamic shift scheduler based on hotel occupancy and staff availability</CardDescription>
            </div>
          </div>
          {/* Summary Stats Badges */}
          <div className="flex gap-2">
            <div className="text-[10px] font-bold bg-primary/5 border text-primary border-primary/10 px-2.5 py-1 rounded-lg">
              {totalWeeklyShifts} Shifts Scheduled This Week
            </div>
            <div className="text-[10px] font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-lg">
              6 Active Housekeepers
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6 space-y-6">
          {/* Legend and User Guide */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border rounded-xl bg-muted/20 gap-3">
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              <span className="font-bold text-foreground">Scheduling Tip</span>: Click directly on any cell in the table below to toggle that housekeeper's availability. The shifts and counts will instantly recalculate.
            </div>
            {/* Visual Legend */}
            <div className="flex flex-wrap gap-2 text-[9px] font-extrabold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                On Duty (Assigned)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-muted-foreground/60 border border-border/20">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Off Duty (Available)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/5 text-red-500/55 border border-red-500/10 italic">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Unavailable
              </span>
            </div>
          </div>

          {/* Unified Matrix Table */}
          <div className="overflow-x-auto border border-border/50 rounded-xl bg-muted/10 shadow-3xs">
            <table className="w-full border-collapse text-left text-xs min-w-[800px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40 font-bold">
                  <th className="p-3.5 font-bold text-muted-foreground w-[180px]">Housekeeper</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const rate = occupancyRatesMap[day] || 50;
                    const isToday = day === 'Sun';
                    return (
                      <th key={day} className={`p-3.5 text-center w-[95px] transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                        <div className={`font-extrabold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                        <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none mt-1.5 ${
                          rate > 80 ? 'bg-rose-500/10 text-rose-600' :
                          rate > 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {rate}% Cap
                        </span>
                      </th>
                    );
                  })}
                  <th className="p-3.5 font-bold text-muted-foreground text-right w-[110px]">Total Shifts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {staff.map((member) => {
                  const shiftCount = Object.values(weeklySchedule).filter((dayStaff) =>
                    dayStaff.some((s) => s.name === member.name)
                  ).length;

                  return (
                    <tr 
                      key={member.name}
                      className={`hover:bg-muted/20 transition-all ${
                        hoveredStaff === member.name ? 'bg-primary/5 font-medium' : ''
                      }`}
                      onMouseEnter={() => setHoveredStaff(member.name)}
                      onMouseLeave={() => setHoveredStaff(null)}
                    >
                      {/* Employee Details Column */}
                      <td className="p-3.5 font-bold flex items-center space-x-2.5">
                        <span className={`h-7 w-7 rounded-full border flex items-center justify-center text-[10px] font-black uppercase shadow-3xs ${member.color}`}>
                          {member.initials}
                        </span>
                        <span className="text-foreground text-xs">{member.name}</span>
                      </td>

                      {/* Day cells (Interactive Availability Toggles) */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isAssigned = (weeklySchedule[day] || []).some((s) => s.name === member.name);
                        const isAvailable = member.availability[day];
                        const isToday = day === 'Sun';

                        return (
                          <td key={day} className={`p-2 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                            <button
                              onClick={() => toggleAvailability(member.name, day)}
                              className={`w-full h-[36px] rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer border flex flex-col justify-center items-center shadow-3xs ${
                                isAssigned 
                                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-500/25' 
                                  : isAvailable 
                                    ? 'bg-muted hover:bg-muted/70 text-muted-foreground/60 border-border/10'
                                    : 'bg-red-500/5 hover:bg-red-500/10 text-red-500/40 dark:text-red-400/50 border-red-500/10 italic'
                              }`}
                              title={`Click to toggle ${member.name}'s availability on ${day}`}
                            >
                              {isAssigned ? 'ON DUTY' : isAvailable ? 'Off' : 'N/A'}
                            </button>
                          </td>
                        );
                      })}

                      {/* total shifts count */}
                      <td className="p-3.5 font-black text-right text-primary text-xs">
                        {shiftCount} shifts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border/40 font-bold">
                  <td className="p-3.5 text-muted-foreground">Staff Required</td>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const count = (weeklySchedule[day] || []).length;
                    const isToday = day === 'Sun';
                    return (
                      <td key={day} className={`p-3.5 text-center text-foreground font-black transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                        {count} Staff
                      </td>
                    );
                  })}
                  <td className="p-3.5 text-right text-muted-foreground font-black">
                    {totalWeeklyShifts} Total
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog containing the full Room Grid status console */}
      <Dialog open={isGridOpen} onOpenChange={setIsGridOpen}>
        <DialogContent className="max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[85vh] overflow-y-auto bg-card border rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Home className="h-5 w-5 text-primary" />
                  Hotel Room Status Console
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time status overview and credit allocations for all 50 rooms.
                </p>
              </div>

              {searchQuery && (
                <div className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                  Filtered by search: "{searchQuery}"
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Filtering Console Tools */}
          <div className="flex flex-col gap-3.5 border-b pb-4">
            {/* Filter 1: Room Type (Tabs) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Filter by Room Type</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'All Rooms', value: 'all', iconColor: '', icon: (selected: boolean) => <LayoutGrid className="h-7 w-7" /> },
                  { label: '1 Queen Bed', value: '1 Queen Bed', iconColor: 'text-rose-500 dark:text-rose-400', icon: (selected: boolean) => <Bed className="h-7 w-7" /> },
                  { label: '1 King Bed', value: '1 King Bed', iconColor: 'text-amber-500 dark:text-amber-400', icon: (selected: boolean) => <BedDouble className="h-7 w-7" /> },
                  { label: '1 King ADA', value: '1 King ADA', iconColor: 'text-sky-500 dark:text-sky-400', icon: (selected: boolean) => (
                    <div className="relative">
                      <BedDouble className="h-7 w-7" />
                      {!selected && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white dark:bg-sky-400 dark:text-background rounded-full p-0.5 shadow-3xs">
                          <Accessibility className="h-2.5 w-2.5 font-bold" />
                        </span>
                      )}
                      {selected && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-white/20 text-white rounded-full p-0.5">
                          <Accessibility className="h-2.5 w-2.5 font-bold" />
                        </span>
                      )}
                    </div>
                  ) },
                  { label: '2 Queen Beds', value: '2 Queen Beds', iconColor: 'text-indigo-500 dark:text-indigo-400', icon: (selected: boolean) => (
                    <div className="flex -space-x-1.5 items-center justify-center">
                      <Bed className="h-6 w-6" />
                      <Bed className="h-6 w-6 opacity-60 -mt-1.5" />
                    </div>
                  )},
                ].map((tab) => {
                  const selected = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer w-[110px] h-[86px] text-center shadow-3xs ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/10'
                          : 'bg-muted/30 hover:bg-muted text-muted-foreground border-border/40 hover:border-border/80'
                      }`}
                    >
                      <div className={`flex items-center justify-center h-8 w-full ${selected ? '' : tab.iconColor}`}>
                        {tab.icon(selected)}
                      </div>
                      <span className="text-[11px] font-black tracking-tight leading-tight mt-2 block whitespace-nowrap">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter 2: Operational Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Filter by Status</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'All Statuses', value: 'all', iconColor: '', icon: <CircleDot className="h-7 w-7" /> },
                  { label: 'Vacant', value: 'Vacant', iconColor: 'text-emerald-500 dark:text-emerald-400', icon: <DoorOpen className="h-7 w-7" /> },
                  { label: 'Occupied', value: 'Occupied', iconColor: 'text-blue-500 dark:text-blue-400', icon: <UserCheck className="h-7 w-7" /> },
                  { label: 'Dirty', value: 'Dirty', iconColor: 'text-amber-500 dark:text-amber-400', icon: <SprayCan className="h-7 w-7" /> },
                  { label: 'Maintenance', value: 'Maintenance', iconColor: 'text-red-500 dark:text-red-400', icon: <Wrench className="h-7 w-7" /> },
                ].map((f) => {
                  const selected = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer w-[110px] h-[86px] text-center shadow-3xs ${
                        selected
                          ? 'bg-foreground text-background border-foreground shadow-xs ring-2 ring-foreground/10'
                          : 'bg-muted/30 hover:bg-muted text-muted-foreground border-border/40 hover:border-border/80'
                      }`}
                    >
                      <div className={`flex items-center justify-center h-8 w-full ${selected ? '' : f.iconColor}`}>
                        {f.icon}
                      </div>
                      <span className="text-[11px] font-black tracking-tight leading-tight mt-2 block whitespace-nowrap">
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unified Dynamic Grid */}
          <div className="flex-1 min-h-[250px]">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10 flex flex-col items-center justify-center space-y-2">
                <Search className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-xs font-bold text-muted-foreground">No rooms match your active filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-8 text-xs font-bold cursor-pointer"
                  onClick={() => {
                    setActiveTab('all');
                    setStatusFilter('all');
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('search');
                      window.history.replaceState({}, '', url.toString());
                      window.dispatchEvent(new Event('search-change'));
                      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                      if (searchInput) searchInput.value = '';
                    }
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                {filteredRooms.map((room) => {
                  const credits = getRoomCredits(room.type, room.status);
                  return (
                    <div
                      key={room.number}
                      className={`flex justify-between items-center px-3 py-2 rounded-xl border transition-all shadow-2xs h-[56px] w-full ${getStatusColor(
                        room.status
                      )}`}
                    >
                      {/* Left: Room Number and type shorthand */}
                      <div>
                        <span className="text-sm font-black tracking-tight leading-none text-foreground">
                          {room.number}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-60 block mt-0.5">
                          {room.type === '1 Queen Bed' ? '1 Queen' :
                           room.type === '1 King Bed' ? '1 King' :
                           room.type === '1 King ADA' ? 'King ADA' : '2 Queen'}
                        </span>
                      </div>

                      {/* Right: Credits and status indicator */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 leading-none">
                          {credits} cr
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-wider opacity-90 flex items-center gap-1 leading-none">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            room.status === 'Vacant' ? 'bg-emerald-500' :
                            room.status === 'Occupied' ? 'bg-blue-500' :
                            room.status === 'Dirty' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {room.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-[92rem] mx-auto animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-none bg-card md:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3.5 w-60" />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-6" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton for vertical columns chart */}
        <Card className="border shadow-none bg-card flex flex-col justify-between">
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent className="flex items-end justify-between h-[160px] gap-2.5 pt-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-1 space-y-2 h-full justify-end">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="w-full bg-muted rounded-t-md flex-1" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
