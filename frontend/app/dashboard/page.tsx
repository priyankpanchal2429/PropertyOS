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

  const filterRooms = (list: RoomData[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (r) =>
        r.number.includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.currentGuestName?.toLowerCase().includes(q)
    );
  };

  // Group rooms by category and apply search query filters
  const queenRooms = filterRooms(rooms.filter((r) => r.type === '1 Queen Bed'));
  const kingRooms = filterRooms(rooms.filter((r) => r.type === '1 King Bed'));
  const adaRooms = filterRooms(rooms.filter((r) => r.type === '1 King ADA'));
  const doubleQueenRooms = filterRooms(rooms.filter((r) => r.type === '2 Queen Beds'));

  const totalFiltered = queenRooms.length + kingRooms.length + adaRooms.length + doubleQueenRooms.length;

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Property Control Panel</h1>
        <p className="text-sm text-muted-foreground">
          Real-time occupancy status and layout management for your 50-room hotel.
        </p>
      </div>

      {/* Top Section: stats, weekly occupancy, and Room Grid Entry Card */}
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
        <Card className="border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold">Weekly Occupancy Rate</CardTitle>
                <CardDescription>Capacity usage Mon - Sun</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">{stats.occupancyRate}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center pb-5">
            {/* Horizontal Bar Chart (Mon - Sun) */}
            <div className="space-y-2.5 py-1">
              {weeklyOccupancy.map((dayData) => (
                <div key={dayData.day} className="flex items-center space-x-3">
                  <span className="text-[10px] font-bold text-muted-foreground w-6">
                    {dayData.day}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative border border-border/40">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        dayData.day === 'Sun' ? 'bg-primary' : 'bg-primary/70'
                      }`}
                      style={{ width: `${dayData.rate}%` }}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[8px] font-black text-foreground/80">
                      {dayData.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Room Grid Card */}
        <Card
          onClick={() => setIsGridOpen(true)}
          className="border shadow-none bg-card flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all hover:shadow-xs group"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  Active Room Grid
                </CardTitle>
                <CardDescription>Hotel room grid status overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            <p className="text-xs text-muted-foreground">
              Monitor active clean statuses, credits, and occupancy states for all 50 rooms.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Rooms</p>
                <p className="text-lg font-black text-foreground mt-0.5">{stats.totalRooms}</p>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daily Credits</p>
                <p className="text-lg font-black text-primary mt-0.5">{totalCredits} cr</p>
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-6 pt-0 flex items-center text-xs font-bold text-primary group-hover:underline">
            Open Room Status Grid →
          </div>
        </Card>
      </div>

      {/* Dialog containing the full Room Grid status console */}
      <Dialog open={isGridOpen} onOpenChange={setIsGridOpen}>
        <DialogContent className="max-w-4xl md:max-w-6xl lg:max-w-7xl max-h-[85vh] overflow-y-auto bg-card border rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
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

          {/* Full Grids Section */}
          <div className="space-y-8">
            {searchQuery && totalFiltered === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20 flex flex-col items-center justify-center space-y-2">
                <Search className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-muted-foreground">No rooms found matching "{searchQuery}"</p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary font-semibold cursor-pointer"
                  onClick={() => {
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
                  Clear Search Filter
                </Button>
              </div>
            ) : (
              <>
                {/* 1 Queen Bed */}
                {queenRooms.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      1 Queen Bed ({queenRooms.length} Rooms)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                      {queenRooms.map((room) => {
                        const credits = getRoomCredits(room.type, room.status);
                        return (
                          <div
                            key={room.number}
                            className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all shadow-xs h-[92px] w-full ${getStatusColor(
                              room.status
                            )}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                                1 Queen
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                {credits} cr
                              </span>
                            </div>
                            <span className="text-lg font-black tracking-tight leading-none mt-1.5 mb-1.5">{room.number}</span>
                            <div className="flex items-center text-[8px] font-black tracking-wider uppercase gap-1 w-full opacity-80">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                room.status === 'Vacant' ? 'bg-emerald-500' :
                                room.status === 'Occupied' ? 'bg-blue-500' :
                                room.status === 'Dirty' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              {room.status}
                            </div>
                          </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                      {kingRooms.map((room) => {
                        const credits = getRoomCredits(room.type, room.status);
                        return (
                          <div
                            key={room.number}
                            className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all shadow-xs h-[92px] w-full ${getStatusColor(
                              room.status
                            )}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                                1 King
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                {credits} cr
                              </span>
                            </div>
                            <span className="text-lg font-black tracking-tight leading-none mt-1.5 mb-1.5">{room.number}</span>
                            <div className="flex items-center text-[8px] font-black tracking-wider uppercase gap-1 w-full opacity-80">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                room.status === 'Vacant' ? 'bg-emerald-500' :
                                room.status === 'Occupied' ? 'bg-blue-500' :
                                room.status === 'Dirty' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              {room.status}
                            </div>
                          </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                      {adaRooms.map((room) => {
                        const credits = getRoomCredits(room.type, room.status);
                        return (
                          <div
                            key={room.number}
                            className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all shadow-xs h-[92px] w-full ${getStatusColor(
                              room.status
                            )}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                                King ADA
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                {credits} cr
                              </span>
                            </div>
                            <span className="text-lg font-black tracking-tight leading-none mt-1.5 mb-1.5">{room.number}</span>
                            <div className="flex items-center text-[8px] font-black tracking-wider uppercase gap-1 w-full opacity-80">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                room.status === 'Vacant' ? 'bg-emerald-500' :
                                room.status === 'Occupied' ? 'bg-blue-500' :
                                room.status === 'Dirty' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              {room.status}
                            </div>
                          </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                      {doubleQueenRooms.map((room) => {
                        const credits = getRoomCredits(room.type, room.status);
                        return (
                          <div
                            key={room.number}
                            className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all shadow-xs h-[92px] w-full ${getStatusColor(
                              room.status
                            )}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                                2 Queen
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                {credits} cr
                              </span>
                            </div>
                            <span className="text-lg font-black tracking-tight leading-none mt-1.5 mb-1.5">{room.number}</span>
                            <div className="flex items-center text-[8px] font-black tracking-wider uppercase gap-1 w-full opacity-80">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                room.status === 'Vacant' ? 'bg-emerald-500' :
                                room.status === 'Occupied' ? 'bg-blue-500' :
                                room.status === 'Dirty' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              {room.status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card">
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

        <Card className="border shadow-none bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
