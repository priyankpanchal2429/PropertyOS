'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  CheckCircle,
  Building,
  Star,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
  MoreVertical,
  Printer,
  Edit,
  UserMinus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface StaffProfile {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: 'On Duty' | 'Rest Day' | 'On Break';
  email: string;
  phone: string;
  rating: number;
  roomsCleaned: number;
  creditsEarned: number;
  joinedDate: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal target profiles for actions
  const [viewingStaff, setViewingStaff] = useState<StaffProfile | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [resigningStaff, setResigningStaff] = useState<StaffProfile | null>(null);

  // Initial Seed Staff Members (6 housekeepers requested)
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);

  // Form states for editing housekeeper
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'On Duty' | 'Rest Day' | 'On Break'>('On Duty');

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName || !editEmail || !editPhone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setStaffList((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name: editName,
              role: editRole,
              email: editEmail,
              phone: editPhone,
              status: editStatus,
              initials: editName.slice(0, 2).toUpperCase(),
            }
          : s
      )
    );

    setEditingStaff(null);
    toast.success(`Successfully updated ${editName}'s profile.`);
  };

  const handleResignStaff = () => {
    if (!resigningStaff) return;

    setStaffList((prev) => prev.filter((s) => s.id !== resigningStaff.id));
    toast.success(`${resigningStaff.name} has been officially resigned from staff.`);
    setResigningStaff(null);
  };

  const openEditModal = (person: StaffProfile) => {
    setEditingStaff(person);
    setEditName(person.name);
    setEditRole(person.role);
    setEditEmail(person.email);
    setEditPhone(person.phone);
    setEditStatus(person.status);
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const onDutyCount = staffList.filter((s) => s.status === 'On Duty').length;
  const totalWeeklyRooms = staffList.reduce((acc, curr) => acc + curr.roomsCleaned, 0);
  const totalWeeklyCredits = staffList.reduce((acc, curr) => acc + curr.creditsEarned, 0);

  return (
    <div className="space-y-8 max-w-[92rem] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Directory & Coordination</h1>
          <p className="text-sm text-muted-foreground">
            Manage your housekeeping crew, review work ratings, and monitor operational credit allocations.
          </p>
        </div>

        {/* Add Staff Modal */}
        <Button 
          onClick={() => router.push('/dashboard/staff/onboard')}
          className="font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* On Duty Stats */}
        <Card className="border shadow-none bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff On Duty Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-primary">{onDutyCount}</span>
              <span className="text-xs text-muted-foreground font-semibold">/ {staffList.length} Active</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${staffList.length ? (onDutyCount / staffList.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cleaned Rooms count */}
        <Card className="border shadow-none bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Rooms Cleaned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalWeeklyRooms}</span>
              <span className="text-xs text-muted-foreground font-semibold">Rooms clean</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[70%]" />
            </div>
          </CardContent>
        </Card>

        {/* Credits Accumulator */}
        <Card className="border shadow-none bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalWeeklyCredits} cr</span>
              <span className="text-xs text-muted-foreground font-semibold">Points accrued</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[65%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Console Section */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Staff Directory</CardTitle>
              <CardDescription>Coordinate staff scheduling, performance metrics, and shifts allocation</CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search staff by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-muted/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl bg-muted/5 flex flex-col items-center justify-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs font-bold text-muted-foreground">No staff members match "{searchQuery}"</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 h-8 text-xs font-bold cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/50 rounded-xl bg-muted/10 shadow-3xs">
              <table className="w-full border-collapse text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 font-bold text-muted-foreground">
                    <th className="p-3.5 w-[200px]">Staff Member</th>
                    <th className="p-3.5 w-[110px]">Status</th>
                    <th className="p-3.5 w-[100px]">Rating</th>
                    <th className="p-3.5 w-[140px]">Performance</th>
                    <th className="p-3.5">Contact Info</th>
                    <th className="p-3.5 text-right w-[240px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredStaff.map((person) => (
                    <tr 
                      key={person.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Staff Member Details */}
                      <td className="p-3.5 font-bold flex items-center space-x-2.5">
                        <span className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-black uppercase shadow-3xs ${person.color}`}>
                          {person.initials}
                        </span>
                        <div>
                          <span className="text-foreground text-xs block">{person.name}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold block mt-0.5">{person.role}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          person.status === 'On Duty' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' :
                          person.status === 'On Break' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10' :
                          'bg-red-500/5 text-red-500/40 border border-red-500/10'
                        }`}>
                          {person.status}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="p-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span>{person.rating}</span>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="p-3.5">
                        <div>
                          <span className="text-foreground font-bold block">{person.roomsCleaned} Rooms</span>
                          <span className="text-[10px] text-primary font-bold block mt-0.5">{person.creditsEarned} cr</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5 text-muted-foreground leading-tight">
                        <div className="flex flex-col space-y-0.5">
                          <span className="truncate">{person.email}</span>
                          <span>{person.phone}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-[9px] font-bold cursor-pointer h-7"
                            onClick={() => {
                              toast.success(`Sent shift briefing details to ${person.name}'s phone.`);
                            }}
                          >
                            Brief Shift
                          </Button>
                          <Button
                            size="xs"
                            className="text-[9px] font-bold cursor-pointer h-7"
                            onClick={() => {
                              toast.success(`Task assigned. Cleaning ticket generated for ${person.name}.`);
                            }}
                          >
                            Assign Task
                          </Button>

                          {/* Options Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/30 rounded-md flex items-center justify-center focus:outline-none">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border w-40 text-xs">
                              <DropdownMenuItem 
                                onClick={() => setViewingStaff(person)}
                                className="cursor-pointer gap-2 text-xs"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                View / Print
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openEditModal(person)}
                                className="cursor-pointer gap-2 text-xs"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setResigningStaff(person)}
                                className="cursor-pointer gap-2 text-destructive font-semibold hover:bg-destructive/10 text-xs"
                              >
                                <UserMinus className="h-3.5 w-3.5 text-destructive" />
                                Resign Staff
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. View / Print Dialog Profile */}
      <Dialog open={!!viewingStaff} onOpenChange={(open) => !open && setViewingStaff(null)}>
        <DialogContent className="max-w-md bg-card border rounded-2xl p-6 shadow-2xl">
          {viewingStaff && (
            <div className="space-y-6">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center space-x-3">
                  <span className={`h-11 w-11 rounded-full border flex items-center justify-center text-sm font-black uppercase shadow-2xs ${viewingStaff.color}`}>
                    {viewingStaff.initials}
                  </span>
                  <div>
                    <DialogTitle className="text-base font-black text-foreground">{viewingStaff.name}</DialogTitle>
                    <span className="text-xs text-muted-foreground font-semibold">{viewingStaff.role}</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Summary Details sheet */}
              <div id="printable-brief-card" className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3.5 bg-muted/15 border p-3.5 rounded-xl">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Weekly Performance</span>
                    <span className="text-xs font-bold text-foreground mt-1 block">
                      {viewingStaff.roomsCleaned} Rooms Cleaned
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Credits Earned</span>
                    <span className="text-xs font-bold text-primary mt-1 block">
                      {viewingStaff.creditsEarned} points (cr)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-bold">Status Badge:</span>
                    <span className="font-extrabold text-foreground">{viewingStaff.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-bold">Email address:</span>
                    <span className="font-extrabold text-foreground">{viewingStaff.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-bold">Phone contact:</span>
                    <span className="font-extrabold text-foreground">{viewingStaff.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-bold">Member Rating:</span>
                    <span className="font-extrabold text-foreground flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {viewingStaff.rating} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-bold">Registration Date:</span>
                    <span className="font-extrabold text-foreground">{viewingStaff.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold cursor-pointer"
                  onClick={() => setViewingStaff(null)}
                >
                  Close View
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs font-bold gap-1.5 cursor-pointer"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.print();
                    }
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Print Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Edit Profile Dialog Form */}
      <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-md bg-card border rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Housekeeper Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Full Name *</label>
              <Input
                required
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Operational Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Housekeeper">Housekeeper</option>
                <option value="Lead Housekeeper">Lead Housekeeper</option>
                <option value="Assistant Housekeeper">Assistant Housekeeper</option>
                <option value="Head Housekeeper">Head Housekeeper</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Duty Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="On Duty">On Duty</option>
                <option value="Rest Day">Rest Day</option>
                <option value="On Break">On Break</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email Address *</label>
              <Input
                required
                type="email"
                placeholder="Email Address"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phone Number *</label>
              <Input
                required
                placeholder="Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold cursor-pointer"
                onClick={() => setEditingStaff(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-bold cursor-pointer">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Confirm Resignation Dialog */}
      <Dialog open={!!resigningStaff} onOpenChange={(open) => !open && setResigningStaff(null)}>
        <DialogContent className="max-w-sm bg-card border rounded-2xl p-6 shadow-2xl">
          {resigningStaff && (
            <div className="space-y-4">
              <DialogHeader className="pb-2 border-b">
                <DialogTitle className="text-base font-bold text-destructive flex items-center gap-1.5">
                  <UserMinus className="h-5 w-5 text-destructive" />
                  Confirm Staff Resignation
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to resign <span className="font-bold text-foreground">{resigningStaff.name}</span>? This action is permanent and will remove them from the active housekeeper scheduling pool and directory.
              </p>
              <div className="flex gap-2 pt-3 border-t justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold cursor-pointer"
                  onClick={() => setResigningStaff(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700"
                  onClick={handleResignStaff}
                >
                  Resign Staff
                </Button>
              </div>
            </div>
          )}
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
