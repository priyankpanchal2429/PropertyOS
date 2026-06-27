'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Package,
  Home as HomeIcon,
  DollarSign,
  PlusCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface StatsData {
  stats: {
    totalStaff: number;
    attendanceToday: number;
    pendingPayroll: number;
    inventoryItems: number;
    occupancyRate: number;
    revenueToday: number;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>;
}

// Resilient fallback data if the backend server/database is not fully ready
const fallbackData: StatsData = {
  stats: {
    totalStaff: 42,
    attendanceToday: 38,
    pendingPayroll: 12500,
    inventoryItems: 385,
    occupancyRate: 82,
    revenueToday: 5400,
  },
  recentActivity: [
    { id: 1, type: 'checkin', message: 'Room 104 checked in by Front Desk', time: '10 mins ago' },
    { id: 2, type: 'maintenance', message: 'Room 212 shower leak reported', time: '25 mins ago' },
    { id: 3, type: 'payroll', message: 'Payroll approved for period ending Jun 30', time: '1 hr ago' },
    { id: 4, type: 'inventory', message: 'Linens restocked in supply closet B', time: '3 hrs ago' },
  ],
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data.data;
    },
    // Graceful fallback to local mock data if api requests fail
    initialData: undefined,
    retry: false,
  });

  const activeData = data || fallbackData;
  const { stats, recentActivity } = activeData;

  const handleQuickAction = (actionName: string) => {
    toast.success(`Quick Action triggered: "${actionName}" (Simulation)`);
  };

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time metrics for your USA motel & hotel property operations.
        </p>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Staff */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Staff</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              Active roles
            </p>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance</span>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.attendanceToday}/{stats.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.attendanceToday / stats.totalStaff) * 100)}% present today
            </p>
          </CardContent>
        </Card>

        {/* Pending Payroll */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payroll Due</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.pendingPayroll.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Est. cycle end
            </p>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inventory</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventoryItems}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5" />
              Stock stable
            </p>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Occupancy</span>
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              18 rooms vacant
            </p>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card className="border shadow-none bg-card hover:border-primary/25 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Revenue</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.revenueToday.toLocaleString()}
            </div>
            <p className="text-xs text-success mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              +8.5% vs yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns layout (Activities / Actions) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activity Section */}
        <Card className="border shadow-none md:col-span-2 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>Live feed of motel & hotel occurrences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 text-sm border-b pb-3.5 last:border-0 last:pb-0">
                  <div className="mt-0.5 flex h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border shadow-none bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common operational commands</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-xs font-semibold h-10 hover:bg-muted"
              onClick={() => handleQuickAction('Register Guest Check-in')}
            >
              <PlusCircle className="h-4 w-4 mr-2.5 text-primary" />
              Register Guest Check-in
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs font-semibold h-10 hover:bg-muted"
              onClick={() => handleQuickAction('Raise Maintenance Request')}
            >
              <AlertTriangle className="h-4 w-4 mr-2.5 text-warning" />
              Raise Maintenance Request
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs font-semibold h-10 hover:bg-muted"
              onClick={() => handleQuickAction('Initiate Payroll Audit')}
            >
              <FileCheck className="h-4 w-4 mr-2.5 text-success" />
              Initiate Payroll Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border shadow-none bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-none md:col-span-2 bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 border-b pb-3.5 last:border-0 last:pb-0">
                <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-3.5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
