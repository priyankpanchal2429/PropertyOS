'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Home,
  CheckCircle,
  AlertTriangle,
  User,
  Wrench,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [statusVal, setStatusVal] = useState<'Vacant' | 'Occupied' | 'Dirty' | 'Maintenance'>('Vacant');
  const [guestName, setGuestName] = useState('');

  // Fetch Stats and Rooms list
  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10s for real-time occupancy updates
  });

  // Mutate Room Status
  const statusMutation = useMutation({
    mutationFn: async ({
      number,
      status,
      currentGuestName,
    }: {
      number: string;
      status: string;
      currentGuestName?: string;
    }) => {
      return apiClient.patch(`/dashboard/rooms/${number}/status`, {
        status,
        currentGuestName,
      });
    },
    onSuccess: (res, variables) => {
      toast.success(`Room ${variables.number} updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedRoom(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update room status');
    },
  });

  const openStatusDialog = (room: RoomData) => {
    setSelectedRoom(room);
    setStatusVal(room.status);
    setGuestName(room.currentGuestName || '');
  };

  const handleUpdateStatus = () => {
    if (!selectedRoom) return;
    statusMutation.mutate({
      number: selectedRoom.number,
      status: statusVal,
      currentGuestName: statusVal === 'Occupied' ? guestName : undefined,
    });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
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

  // Group rooms by category
  const queenRooms = rooms.filter((r) => r.type === '1 Queen Bed');
  const kingRooms = rooms.filter((r) => r.type === '1 King Bed');
  const adaRooms = rooms.filter((r) => r.type === '1 King ADA');
  const doubleQueenRooms = rooms.filter((r) => r.type === '2 Queen Beds');

  const getStatusColor = (status: RoomData['status']) => {
    switch (status) {
      case 'Vacant':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'Occupied':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800';
      case 'Dirty':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
      case 'Maintenance':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Property Control Panel</h1>
        <p className="text-sm text-muted-foreground">
          Real-time occupancy status and layout management for your 50-room hotel.
        </p>
      </div>

      {/* Top Section: stats and weekly occupancy */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Real-time stats */}
        <Card className="border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Today's Status Summary</CardTitle>
            <CardDescription>Live count of rooms by operational state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-muted-foreground flex items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                Vacant Rooms
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.vacantRooms}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-muted-foreground flex items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                Occupied Rooms
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats.occupiedRooms}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-muted-foreground flex items-center">
                <span className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                Dirty / Checkout
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.dirtyRooms}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm text-muted-foreground flex items-center">
                <span className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                Out of Order
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats.maintenanceRooms}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-1 font-bold">
              <span className="text-sm text-foreground flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Total Task Credits
              </span>
              <span className="text-base text-primary">
                {totalCredits} cr
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Occupancy Visualizer */}
        <Card className="border shadow-none md:col-span-2 bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold">Weekly Occupancy Rate</CardTitle>
                <CardDescription>Average capacity usage from Monday to Sunday</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">{stats.occupancyRate}%</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Today's Capacity</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Horizontal Bar Chart (Mon - Sun) */}
            <div className="space-y-3.5 py-1">
              {weeklyOccupancy.map((dayData) => (
                <div key={dayData.day} className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-muted-foreground w-8">
                    {dayData.day}
                  </span>
                  <div className="flex-1 h-3.5 bg-muted rounded-full overflow-hidden relative border border-border/40">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        dayData.day === 'Sun' ? 'bg-primary' : 'bg-primary/70'
                      }`}
                      style={{ width: `${dayData.rate}%` }}
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[9px] font-black text-foreground/80">
                      {dayData.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Room Layout Grid */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Home className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Active Room Grid</h2>
        </div>

        {/* Categories Section */}
        <div className="space-y-8">
          {/* 1 Queen Bed */}
          {queenRooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                1 Queen Bed ({queenRooms.length} Rooms)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2.5">
                {queenRooms.map((room) => {
                  const credits = getRoomCredits(room.type, room.status);
                  return (
                    <button
                      key={room.number}
                      onClick={() => openStatusDialog(room)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:scale-[1.02] shadow-none relative ${getStatusColor(
                        room.status
                      )}`}
                    >
                      <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-950 shadow-xs border border-border/10">
                        {credits}
                      </span>
                      <span className="text-sm font-black tracking-tight">{room.number}</span>
                      <span className="text-[9px] font-medium tracking-wide uppercase opacity-85 mt-0.5">
                        {room.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1 King Bed */}
          {kingRooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                1 King Bed ({kingRooms.length} Rooms)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2.5">
                {kingRooms.map((room) => {
                  const credits = getRoomCredits(room.type, room.status);
                  return (
                    <button
                      key={room.number}
                      onClick={() => openStatusDialog(room)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:scale-[1.02] shadow-none relative ${getStatusColor(
                        room.status
                      )}`}
                    >
                      <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-950 shadow-xs border border-border/10">
                        {credits}
                      </span>
                      <span className="text-sm font-black tracking-tight">{room.number}</span>
                      <span className="text-[9px] font-medium tracking-wide uppercase opacity-85 mt-0.5">
                        {room.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1 King ADA */}
          {adaRooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                1 King ADA ({adaRooms.length} Rooms)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2.5">
                {adaRooms.map((room) => {
                  const credits = getRoomCredits(room.type, room.status);
                  return (
                    <button
                      key={room.number}
                      onClick={() => openStatusDialog(room)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:scale-[1.02] shadow-none relative ${getStatusColor(
                        room.status
                      )}`}
                    >
                      <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-950 shadow-xs border border-border/10">
                        {credits}
                      </span>
                      <span className="text-sm font-black tracking-tight">{room.number}</span>
                      <span className="text-[9px] font-medium tracking-wide uppercase opacity-85 mt-0.5">
                        {room.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2 Queen Beds */}
          {doubleQueenRooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                2 Queen Beds ({doubleQueenRooms.length} Rooms)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2.5">
                {doubleQueenRooms.map((room) => {
                  const credits = getRoomCredits(room.type, room.status);
                  return (
                    <button
                      key={room.number}
                      onClick={() => openStatusDialog(room)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:scale-[1.02] shadow-none relative ${getStatusColor(
                        room.status
                      )}`}
                    >
                      <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-950 shadow-xs border border-border/10">
                        {credits}
                      </span>
                      <span className="text-sm font-black tracking-tight">{room.number}</span>
                      <span className="text-[9px] font-medium tracking-wide uppercase opacity-85 mt-0.5">
                        {room.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Changing Room Status */}
      <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Room {selectedRoom?.number} Controls</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Type: {selectedRoom?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2.5">
            {/* Status Select Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Vacant', 'Occupied', 'Dirty', 'Maintenance'] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={statusVal === s ? 'default' : 'outline'}
                    className="text-xs font-bold h-9"
                    onClick={() => setStatusVal(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Guest Name input (only for Occupied) */}
            {statusVal === 'Occupied' && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <label
                  htmlFor="guestName"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Guest Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="guestName"
                    type="text"
                    placeholder="Enter guest name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="pl-9 focus-visible:ring-primary h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedRoom(null)} disabled={statusMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateStatus} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-none bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-none md:col-span-2 bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3.5 w-60" />
          </CardHeader>
          <CardContent className="space-y-3.5">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-40" />
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
                {[...Array(8)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
