'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Package,
  Clock,
  Building,
  Key,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
    { name: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { name: 'Staff', icon: Users, href: '#' },
    { name: 'Payroll', icon: Banknote, href: '#' },
    { name: 'Inventory', icon: Package, href: '#' },
    { name: 'Timesheets', icon: Clock, href: '#' },
    { name: 'Properties', icon: Building, href: '#' },
    { name: 'Rooms', icon: Key, href: '#' },
    { name: 'Maintenance', icon: Wrench, href: '#' },
    { name: 'Reports', icon: BarChart3, href: '#' },
    { name: 'Settings', icon: Settings, href: '#' },
  ];

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileOpen(false);
    if (tabName !== 'Dashboard') {
      toast.info(`${tabName} module is a placeholder in Phase 1.`);
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
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar border-border transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate">
                PropertyOS
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-md border text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-all group focus:outline-none focus:ring-1 focus:ring-primary/20
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors
                    ${isCollapsed ? 'mr-0' : 'mr-3'}
                    ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}
                  `}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t bg-muted/10">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-1 focus:ring-destructive/20`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300
          ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}
        `}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6">
          {/* Mobile hamburger menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground border"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation drawer"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb section */}
            <div className="hidden sm:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">PropertyOS</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative w-40 sm:w-60 md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search rooms, guest, status..."
                className="pl-9 h-9 bg-muted/40 border-muted focus-visible:ring-primary w-full"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Dark Mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground border rounded-md"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle visual theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 text-muted-foreground hover:text-foreground border rounded-md flex items-center justify-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 bg-card border shadow-lg rounded-xl">
                <div className="text-xs font-bold px-2 py-1.5 flex justify-between items-center border-b pb-2 mb-1">
                  <span>Operational Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer focus:outline-none"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className={`text-xs p-2.5 rounded-lg flex flex-col items-start gap-1 cursor-pointer focus:bg-muted ${
                          !notif.read ? 'bg-primary/5 font-semibold' : 'opacity-70'
                        }`}
                        onClick={() => markRead(notif.id)}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                            notif.type === 'success' ? 'text-emerald-500' :
                            notif.type === 'alert' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            {notif.category}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium">{notif.time}</span>
                        </div>
                        <p className="text-foreground text-left text-[11px] leading-tight font-medium mt-0.5">{notif.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full border bg-transparent hover:bg-muted flex items-center justify-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs uppercase">
                    {user?.name ? user.name.slice(0, 2) : 'AD'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user?.name || 'Administrator'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'admin@propertyos.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                  Role: <span className="ml-1 font-semibold text-primary">{user?.role || 'Admin'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTabClick('Settings')}
                  className="cursor-pointer text-xs"
                >
                  Manage Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer text-xs font-semibold">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {activeTab === 'Dashboard' ? (
            children
          ) : (
            <div className="flex h-[60vh] flex-col items-center justify-center border border-dashed rounded-lg p-8 text-center bg-card">
              <Building className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-lg font-bold">{activeTab} Module</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                This feature is currently under construction and will be fully integrated during Phase 2 development.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
