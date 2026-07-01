'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Tags,
  AppWindow,
  User,
  Users,
  ShoppingCart,
  Wallet,
  PieChart,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  Plus,
  MessageSquare,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  href: string;
  locked?: boolean;
}

const getInitials = (name: string | undefined): string => {
  if (!name) return 'SS';
  // Replace dots, hyphens, and other separator characters with spaces to support S.Sultana
  const cleanName = name.replace(/[.-]/g, ' ');
  const parts = cleanName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SS';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dynamically resolve active tab based on router pathname
  let activeTab = 'Overview';
  if (pathname.includes('/dashboard/staff')) activeTab = 'Staff';
  else if (pathname.includes('/dashboard/payroll')) activeTab = 'Payroll';

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      category: 'System',
      type: 'success',
      message: 'Hotel database initialized with 50 active rooms.',
      time: '1h ago',
      read: false,
    },
    {
      id: 2,
      category: 'Front Desk',
      type: 'info',
      message: 'Admin account (teju001) successfully logged in.',
      time: '10m ago',
      read: false,
    },
    {
      id: 3,
      category: 'Housekeeping',
      type: 'alert',
      message: 'Room 116 marked DIRTY (Checkout). Credits updated to 35.',
      time: '2m ago',
      read: false,
    },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propertyos_notifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing notifications from localStorage', e);
        }
      }
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('propertyos_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markRead = (id: number) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (typeof window !== 'undefined') {
        localStorage.setItem('propertyos_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSearch = (value: string) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('search-change'));
    }
  };

  const navigation: SidebarItem[] = [
    { name: 'Overview', icon: LayoutGrid, href: '/dashboard' },
    { name: 'Staff', icon: Users, href: '/dashboard/staff' },
    { name: 'Rooms & Building', icon: Building2, href: '/dashboard/rooms' },
    { name: 'Customer', icon: User, href: '#' },
    { name: 'Payroll', icon: ShoppingCart, href: '/dashboard/payroll' },
    { name: 'Cash flow', icon: Wallet, href: '#', locked: true },
    { name: 'Report', icon: PieChart, href: '#', locked: true },
  ];

  const handleTabClick = (item: SidebarItem) => {
    setIsMobileOpen(false);
    if (item.href === '#') {
      toast.info(`${item.name} module is a placeholder in Phase 1.`);
    } else {
      router.push(item.href);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
    } catch (err) {
      toast.error('Logout failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200 font-sans">
      {/* Top Navbar - Full Width spanning left to right edge */}
      <header className="sticky top-0 z-30 flex h-[80px] w-full bg-navbar border-b border-border flex-shrink-0">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between px-8 h-full">
          {/* Left Side: Brand Logo (aligned with sidebar) and Search Input (aligned with main content) */}
          <div className="flex items-center flex-1">
            <div className="flex items-center justify-center gap-3 w-[270px] flex-shrink-0">
              {/* Gradient S Ribbon Logo */}
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <defs>
                  <linearGradient id="logo-grad-header" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path d="M30 25 C 55 25, 70 25, 70 42 C 70 54, 30 56, 30 68 C 30 85, 45 85, 70 85" 
                  stroke="url(#logo-grad-header)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-extrabold text-[16px] tracking-tight text-foreground">PropertyOS</span>
            </div>

            {/* Gap to align search bar exactly with start of greeting text */}
            <div className="hidden lg:block w-8 flex-shrink-0" />

            {/* Mobile hamburger menu (hidden on desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground mr-2"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation drawer"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Input (Pill Shaped) */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-4 top-[14px] h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search here..."
                className="pl-11 bg-input w-full shadow-none text-foreground"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Right Side: Theme Toggle & Profile Dropdown */}
          <div className="flex items-center justify-end space-x-3.5">
            {/* Theme Toggle (Dark Mode) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-[42px] w-[42px] rounded-full bg-card/60 hover:bg-card border border-border text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative flex items-center space-x-2.5 rounded-full hover:bg-card/50 p-1 cursor-pointer focus:outline-none transition-colors ml-1">
                <Avatar className="h-9 w-9 border border-border">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name || 'User Profile'} />
                  )}
                  <AvatarFallback className="font-bold text-xs uppercase flex items-center justify-center h-full w-full"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                    {getInitials(user?.name || 'S.Sultana')}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-[16px] border border-border p-1.5 bg-popover text-popover-foreground" align="end">
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {user?.name || 'S.Sultana'}
                </div>
                <DropdownMenuSeparator className="bg-divider" />
                <DropdownMenuItem
                  onClick={() => {
                    const item = navigation.find((n) => n.name === 'Settings');
                    if (item) handleTabClick(item);
                  }}
                  className="cursor-pointer text-xs rounded-[8px] hover:bg-accent hover:text-accent-foreground text-foreground px-3 py-2"
                >
                  Manage Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-divider" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer text-xs font-semibold rounded-[8px] hover:bg-red-500/10 px-3 py-2">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Layout Container (Centered with max-width) */}
      <div className="w-full max-w-[1700px] flex flex-1 relative mx-auto px-8 gap-8">
        
        {/* Mobile Drawer Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar - Desktop Floating Card & Mobile Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-150
            w-[270px]
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:sticky lg:top-[104px] lg:h-[760px] lg:z-30 lg:translate-x-0 lg:flex-shrink-0
            lg:border lg:border-border lg:rounded-3xl lg:mt-6 border-r border-border
          `}
        >
          {/* Navigation Items */}
          <nav className="flex-1 space-y-3 px-4 py-6 overflow-y-auto flex flex-col">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleTabClick(item)}
                  className={`relative flex items-center h-[50px] rounded-full transition-all group focus:outline-none px-5 mx-2
                    ${
                      isActive
                        ? 'text-white bg-[#23262b] font-bold shadow-md'
                        : 'text-[#8d8d8d] hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.03] font-medium'
                    }
                  `}
                >
                  {item.name === 'Overview' ? (
                    <LayoutGrid 
                      className="h-[20px] w-[20px] flex-shrink-0 mr-4" 
                      strokeWidth={isActive ? 2.5 : 1.8} 
                      fill={isActive ? 'currentColor' : 'none'} 
                    />
                  ) : (
                    <Icon 
                      className="h-[20px] w-[20px] flex-shrink-0 mr-4" 
                      strokeWidth={isActive ? 2.5 : 1.8} 
                    />
                  )}
                  <span className="text-[15px]">{item.name}</span>
                  {item.locked && (
                    <Lock size={12} className="ml-auto text-[#8d8d8d]/50 group-hover:text-foreground/60 transition-all" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 w-full py-6 overflow-y-auto bg-background">
            {activeTab === 'Overview' || activeTab === 'Staff' ? (
              children
            ) : (
              <div className="flex h-[60vh] flex-col items-center justify-center border border-dashed border-card rounded-3xl p-8 text-center bg-card/30 mt-6">
                <Building2 className="h-10 w-10 text-muted-foreground mb-4" />
                <h2 className="text-lg font-bold">{activeTab} Module</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  This feature is currently under construction and will be fully integrated during Phase 2 development.
                </p>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
