'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCaliforniaDate } from '@/lib/timezone';
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
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100%', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 24, width: '100%', margin: 0 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.white, letterSpacing: '-0.02em', margin: 0 }}>
            Staff Directory & Coordination
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Manage your housekeeping crew, review work ratings, and monitor operational credit allocations.
          </p>
        </div>

        <Button 
          onClick={() => router.push('/dashboard/staff/onboard')}
          style={{ backgroundColor: C.cyan, color: '#000', fontWeight: 800, padding: '0 16px', height: 40, borderRadius: 12, border: 'none' }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      {/* Stats Row */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, padding: '24px 28px', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>Team Overview</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${C.divider}`, paddingTop: 20 }}>
          {[
            { label: 'Total Staff', value: staffList.length, unit: 'members', color: C.blue, trend: '↗' },
            { label: 'On Duty Today', value: onDutyCount, unit: 'active', color: C.green, trend: '↗' },
            { label: 'Rooms Cleaned', value: totalWeeklyRooms, unit: 'rooms', color: C.orange, trend: '↗' },
            { label: 'Credits Earned', value: totalWeeklyCredits, unit: 'cr', color: C.cyan, trend: '↗' },
          ].map((s, idx) => (
            <div key={s.label} style={{
              padding: '0 20px',
              borderRight: idx < 3 ? `1px solid ${C.divider}` : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{s.label}</span>
                <span style={{ fontSize: 9, color: s.color, backgroundColor: `${s.color}15`, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {s.trend}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: C.white, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Staff Roster Card */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, padding: '24px 28px', border: `1px solid ${C.border}` }}>
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>Staff Roster</h2>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4, margin: 0 }}>Coordinate staff scheduling and view individual performance metrics</p>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
            <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: C.muted }} />
            <Input
              placeholder="Search staff by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, fontSize: 13, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.divider}`, color: C.white, borderRadius: 10, height: 38 }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table/List */}
        {filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', border: `1px dashed ${C.divider}`, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: C.muted, opacity: 0.5 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>No staff members match "{searchQuery}"</p>
            <Button
              variant="outline"
              size="sm"
              style={{ marginTop: 12, height: 32, fontSize: 12, fontWeight: 700, backgroundColor: 'transparent', borderColor: C.divider, color: C.white }}
              onClick={() => setSearchQuery('')}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.divider}` }}>
                  {['Staff Member', 'Status', 'Rating', 'Performance', 'Contact Info', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 5 ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person) => (
                  <tr key={person.id} style={{ borderBottom: `1px solid ${C.divider}` }}>
                    {/* Staff Member Details */}
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ 
                        height: 36, width: 36, borderRadius: '50%', border: `1px solid ${C.divider}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: 11, fontWeight: 900, color: C.white, backgroundColor: 'rgba(255,255,255,0.03)'
                      }}>
                        {person.initials}
                      </span>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.white, display: 'block' }}>{person.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginTop: 2 }}>{person.role}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        backgroundColor: person.status === 'On Duty' ? `${C.green}15` : person.status === 'On Break' ? `${C.orange}15` : `${C.red}15`,
                        color: person.status === 'On Duty' ? C.green : person.status === 'On Break' ? C.orange : C.red,
                        border: `1px solid ${person.status === 'On Duty' ? `${C.green}40` : person.status === 'On Break' ? `${C.orange}40` : `${C.red}40`}`
                      }}>
                        {person.status}
                      </span>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{person.rating}</span>
                      </div>
                    </td>

                    {/* Performance */}
                    <td style={{ padding: '14px' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.white, display: 'block' }}>{person.roomsCleaned} Rooms</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, display: 'block', marginTop: 2 }}>{person.creditsEarned} cr</span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{person.email}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>{person.phone}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                        <Button
                          variant="outline"
                          size="xs"
                          style={{ height: 28, fontSize: 11, fontWeight: 700, backgroundColor: 'transparent', borderColor: C.divider, color: C.white }}
                          onClick={() => {
                            toast.success(`Sent shift briefing details to ${person.name}'s phone.`);
                          }}
                        >
                          Brief Shift
                        </Button>
                        <Button
                          size="xs"
                          style={{ height: 28, fontSize: 11, fontWeight: 700, backgroundColor: C.blue, color: '#fff' }}
                          onClick={() => {
                            toast.success(`Task assigned. Cleaning ticket generated for ${person.name}.`);
                          }}
                        >
                          Assign Task
                        </Button>

                        {/* Options Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger style={{ height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${C.divider}`, backgroundColor: 'transparent', color: C.muted, cursor: 'pointer' }}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ backgroundColor: C.card, borderColor: C.border, width: 160 }}>
                            <DropdownMenuItem 
                              onClick={() => setViewingStaff(person)}
                              style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Printer className="h-3.5 w-3.5 mr-2" />
                              View / Print
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openEditModal(person)}
                              style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Edit className="h-3.5 w-3.5 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator style={{ backgroundColor: C.divider }} />
                            <DropdownMenuItem 
                              onClick={() => setResigningStaff(person)}
                              style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: C.red }}
                            >
                              <UserMinus className="h-3.5 w-3.5 mr-2" />
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
      </div>

      {/* 1. View / Print Dialog Profile */}
      <Dialog open={!!viewingStaff} onOpenChange={(open) => !open && setViewingStaff(null)}>
        <DialogContent className="max-w-md border rounded-[20px] p-6 shadow-2xl" style={{ backgroundColor: C.card, borderColor: C.border }}>
          {viewingStaff && (
            <div className="space-y-6">
              <DialogHeader className="border-b pb-4" style={{ borderColor: C.divider }}>
                <div className="flex items-center space-x-3">
                  <span className="h-12 w-12 rounded-full border flex items-center justify-center text-sm font-black uppercase shadow-2xs" style={{ borderColor: C.divider, backgroundColor: 'rgba(255,255,255,0.03)', color: C.white }}>
                    {viewingStaff.initials}
                  </span>
                  <div>
                    <DialogTitle style={{ fontSize: 18, fontWeight: 900, color: C.white, margin: 0 }}>{viewingStaff.name}</DialogTitle>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{viewingStaff.role}</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Summary Details sheet */}
              <div id="printable-brief-card" className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3.5 border p-4 rounded-[12px]" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: C.divider }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Weekly Performance</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.white, display: 'block', marginTop: 4 }}>
                      {viewingStaff.roomsCleaned} Rooms Cleaned
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Credits Earned</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.cyan, display: 'block', marginTop: 4 }}>
                      {viewingStaff.creditsEarned} points (cr)
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4" style={{ borderColor: C.divider }}>
                  <div className="flex justify-between items-center py-1">
                    <span style={{ color: C.muted, fontWeight: 700 }}>Status Badge:</span>
                    <span style={{ color: C.white, fontWeight: 800 }}>{viewingStaff.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span style={{ color: C.muted, fontWeight: 700 }}>Email address:</span>
                    <span style={{ color: C.white, fontWeight: 800 }}>{viewingStaff.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span style={{ color: C.muted, fontWeight: 700 }}>Phone contact:</span>
                    <span style={{ color: C.white, fontWeight: 800 }}>{viewingStaff.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span style={{ color: C.muted, fontWeight: 700 }}>Member Rating:</span>
                    <span style={{ color: C.white, fontWeight: 800 }} className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {viewingStaff.rating} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span style={{ color: C.muted, fontWeight: 700 }}>Registration Date:</span>
                    <span style={{ color: C.white, fontWeight: 800 }}>{viewingStaff.joinedDate ? formatCaliforniaDate(viewingStaff.joinedDate) : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2 pt-4 border-t" style={{ borderColor: C.divider }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: 'transparent', borderColor: C.divider, color: C.white, height: 36 }}
                  onClick={() => setViewingStaff(null)}
                >
                  Close View
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs font-bold gap-1.5 cursor-pointer"
                  style={{ backgroundColor: C.blue, color: '#fff', height: 36 }}
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
        <DialogContent className="max-w-md border rounded-[20px] p-6 shadow-2xl" style={{ backgroundColor: C.card, borderColor: C.border }}>
          <DialogHeader className="border-b pb-4" style={{ borderColor: C.divider }}>
            <DialogTitle className="text-base font-bold flex items-center gap-2" style={{ color: C.white, margin: 0, fontSize: 18 }}>
              <Edit className="h-5 w-5" style={{ color: C.cyan }} />
              Edit Housekeeper Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
              <Input
                required
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.divider, color: C.white, fontSize: 13 }}
              />
            </div>

            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Operational Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full h-9 rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.divider, color: C.white, fontSize: 13 }}
              >
                <option style={{ color: '#000' }} value="Housekeeper">Housekeeper</option>
                <option style={{ color: '#000' }} value="Lead Housekeeper">Lead Housekeeper</option>
                <option style={{ color: '#000' }} value="Assistant Housekeeper">Assistant Housekeeper</option>
                <option style={{ color: '#000' }} value="Head Housekeeper">Head Housekeeper</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duty Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-9 rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.divider, color: C.white, fontSize: 13 }}
              >
                <option style={{ color: '#000' }} value="On Duty">On Duty</option>
                <option style={{ color: '#000' }} value="Rest Day">Rest Day</option>
                <option style={{ color: '#000' }} value="On Break">On Break</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address *</label>
              <Input
                required
                type="email"
                placeholder="Email Address"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.divider, color: C.white, fontSize: 13 }}
              />
            </div>

            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
              <Input
                required
                placeholder="Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.divider, color: C.white, fontSize: 13 }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: C.divider }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold cursor-pointer"
                style={{ backgroundColor: 'transparent', borderColor: C.divider, color: C.white, height: 36 }}
                onClick={() => setEditingStaff(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-bold cursor-pointer" style={{ backgroundColor: C.blue, color: '#fff', height: 36 }}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Confirm Resignation Dialog */}
      <Dialog open={!!resigningStaff} onOpenChange={(open) => !open && setResigningStaff(null)}>
        <DialogContent className="max-w-sm border rounded-[20px] p-6 shadow-2xl" style={{ backgroundColor: C.card, borderColor: C.border }}>
          {resigningStaff && (
            <div className="space-y-4">
              <DialogHeader className="pb-4 border-b" style={{ borderColor: C.divider }}>
                <DialogTitle style={{ fontSize: 18, fontWeight: 800, color: C.red, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <UserMinus className="h-5 w-5" />
                  Confirm Resignation
                </DialogTitle>
              </DialogHeader>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0, marginTop: 16 }}>
                Are you sure you want to resign <span style={{ fontWeight: 800, color: C.white }}>{resigningStaff.name}</span>? This action is permanent and will remove them from the active housekeeper scheduling pool and directory.
              </p>
              <div className="flex gap-2 pt-4 border-t justify-end" style={{ borderColor: C.divider }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: 'transparent', borderColor: C.divider, color: C.white, height: 36 }}
                  onClick={() => setResigningStaff(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: C.red, color: '#fff', height: 36 }}
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
