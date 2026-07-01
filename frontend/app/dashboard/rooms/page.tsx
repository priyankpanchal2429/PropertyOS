'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Bed,
  BedDouble,
  Accessibility
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';

interface Room {
  number: string;
  type: RoomType;
  status: RoomStatus;
  assignedHousekeeper?: string;
}

type RoomType = '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds';
type RoomStatus = 'Vacant' | 'Dirty / Checkout' | 'Overstay';

const ROOM_TYPES: RoomType[] = [
  '1 Queen Bed',
  '1 King Bed',
  '1 King ADA',
  '2 Queen Beds'
];

const ROOM_STATUSES: RoomStatus[] = [
  'Vacant',
  'Dirty / Checkout',
  'Overstay'
];

const ROOM_STATUS_COLORS: Record<RoomStatus, { bg: string; text: string; border: string; borderActive: string; hex: string }> = {
  'Vacant': { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', borderActive: 'border-green-500/50', hex: '#22C55E' },
  'Dirty / Checkout': { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', borderActive: 'border-red-500/50', hex: '#EF4444' },
  'Overstay': { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', borderActive: 'border-blue-500/50', hex: '#3B82F6' },
};

const ROOM_TYPE_COLORS: Record<RoomType, { bg: string; text: string; rawColor: string; glow: string }> = {
  '1 Queen Bed': {
    bg: 'bg-blue-500/5 dark:bg-blue-950/20',
    text: 'text-blue-500 dark:text-blue-400',
    rawColor: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  '1 King Bed': {
    bg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    text: 'text-emerald-500 dark:text-emerald-400',
    rawColor: '#10b981',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  '1 King ADA': {
    bg: 'bg-amber-500/5 dark:bg-amber-950/20',
    text: 'text-amber-500 dark:text-amber-400',
    rawColor: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
  '2 Queen Beds': {
    bg: 'bg-purple-500/5 dark:bg-purple-950/20',
    text: 'text-purple-500 dark:text-purple-400',
    rawColor: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.15)'
  }
};

const STAFF_COLORS: Record<string, string> = {
  'Ramona': '#E64C4C',
  'Tania': '#E88916',
  'Gladys': '#32C766',
  'Zuli': '#17B6C7',
  'Eucaria': '#2857DA',
  'Jeimi': '#74AAD9',
};

const getHousekeeperColor = (name: string) => {
  return STAFF_COLORS[name] || '#6B7280';
};

const getHousekeeperInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const getRoomIcon = (type: RoomType, color: string) => {
  switch (type) {
    case '1 Queen Bed':
      return <Bed className="h-4 w-4" style={{ color }} />;
    case '2 Queen Beds':
      return (
        <div className="flex gap-0.5 items-center">
          <Bed className="h-3.5 w-3.5" style={{ color }} />
          <Bed className="h-3.5 w-3.5 -ml-1" style={{ color }} />
        </div>
      );
    case '1 King Bed':
      return <BedDouble className="h-4.5 w-4.5" style={{ color }} />;
    case '1 King ADA':
      return (
        <div className="flex items-center gap-1">
          <BedDouble className="h-4 w-4" style={{ color }} />
          <Accessibility className="h-3.5 w-3.5 text-amber-500" />
        </div>
      );
  }
};

function RoomCard({ 
  room, 
  onStatusChange, 
  onHousekeeperChange,
  activeHousekeepers 
}: { 
  room: Room; 
  onStatusChange: (number: string, status: RoomStatus) => void;
  onHousekeeperChange: (number: string, housekeeper: string) => void;
  activeHousekeepers: { name: string }[];
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHousekeeperOpen, setIsHousekeeperOpen] = useState(false);
  const [hkSearch, setHkSearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const housekeeperRef = useRef<HTMLDivElement>(null);
  
  const typeColors = ROOM_TYPE_COLORS[room.type];
  const statusColors = ROOM_STATUS_COLORS[room.status] || ROOM_STATUS_COLORS['Vacant'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (housekeeperRef.current && !housekeeperRef.current.contains(event.target as Node)) {
        setIsHousekeeperOpen(false);
        setHkSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusSelect = (status: RoomStatus) => {
    onStatusChange(room.number, status);
    setIsDropdownOpen(false);
  };

  const handleHousekeeperSelect = (name: string) => {
    onHousekeeperChange(room.number, name);
    setIsHousekeeperOpen(false);
    setHkSearch('');
  };

  const filteredHks = useMemo(() => {
    return activeHousekeepers.filter(hk => 
      hk.name.toLowerCase().includes(hkSearch.toLowerCase())
    );
  }, [activeHousekeepers, hkSearch]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsHousekeeperOpen(false); }}
        className={`relative w-28 h-28 rounded-2xl border ${statusColors.border} ${statusColors.bg} flex flex-col items-center justify-between p-3 cursor-pointer shadow-sm transition-all hover:shadow-md`}
      >
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <div className={`h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: statusColors.hex }}></div>
        </div>

        {/* Room Number & Bed Config */}
        <div className="flex flex-col items-center gap-0.5 w-full mt-1">
          <span className={`text-base font-black tracking-tight ${statusColors.text}`}>
            {room.number}
          </span>
          <div className="flex items-center gap-1 justify-center h-4">
            {getRoomIcon(room.type, typeColors.rawColor)}
            <span 
              className="text-[8px] font-black uppercase tracking-tight leading-none"
              style={{ color: typeColors.rawColor }}
            >
              {room.type}
            </span>
          </div>
        </div>

        {/* Housekeeper Assignment Pill */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsHousekeeperOpen(!isHousekeeperOpen);
          }}
          className="w-full px-1.5 py-1 rounded-lg bg-black/10 dark:bg-white/5 border border-[var(--border)] hover:bg-black/20 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer overflow-hidden"
        >
          {room.assignedHousekeeper ? (
            <>
              <div 
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
                style={{ backgroundColor: getHousekeeperColor(room.assignedHousekeeper) }}
              >
                {getHousekeeperInitials(room.assignedHousekeeper)}
              </div>
              <span className="text-[8px] font-black text-foreground truncate max-w-[55px] leading-none">
                {room.assignedHousekeeper}
              </span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-[7px] text-muted-foreground font-bold">+</span>
              </div>
              <span className="text-[8px] font-bold text-muted-foreground leading-none">
                Unassigned
              </span>
            </>
          )}
        </div>

      </div>{/* end inner card div */}

      {/* Housekeeper Dropdown — renders ABOVE the card */}
      {isHousekeeperOpen && (
        <div 
          ref={housekeeperRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-[200] bottom-full mb-2 w-44 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-2 flex flex-col gap-1.5 left-1/2 -translate-x-1/2"
        >
          <input
            type="text"
            placeholder="Search..."
            value={hkSearch}
            onChange={(e) => setHkSearch(e.target.value)}
            className="w-full px-2 py-1 text-[10px] rounded-md bg-muted/50 border border-[var(--border)] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="max-h-32 overflow-y-auto flex flex-col gap-0.5">
            <button
              onClick={() => handleHousekeeperSelect('')}
              className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-left hover:bg-muted/50 rounded transition-colors text-muted-foreground"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold">×</div>
              Unassign
            </button>
            {filteredHks.map((hk) => {
              const color = getHousekeeperColor(hk.name);
              return (
                <button
                  key={hk.name}
                  onClick={() => handleHousekeeperSelect(hk.name)}
                  className="flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-left hover:bg-muted/50 rounded transition-colors text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-black text-white"
                      style={{ backgroundColor: color }}
                    >
                      {getHousekeeperInitials(hk.name)}
                    </div>
                    <span>{hk.name}</span>
                  </div>
                  {room.assignedHousekeeper === hk.name && (
                    <span className="text-[8px] text-green-500 font-bold">✓</span>
                  )}
                </button>
              );
            })}
            {filteredHks.length === 0 && (
              <span className="text-[9px] text-muted-foreground p-1 text-center">No staff found</span>
            )}
          </div>
        </div>
      )}

      {/* Room Status Dropdown — renders BELOW the card */}
      {isDropdownOpen && (
        <div className="absolute z-[200] top-full mt-1 w-36 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden flex flex-col left-1/2 -translate-x-1/2">
          {ROOM_STATUSES.map((status) => {
            const sc = ROOM_STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold text-left hover:bg-muted/50 transition-colors ${
                  room.status === status ? sc.text : 'text-foreground'
                }`}
              >
                <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: sc.hex }}></div>
                {status}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoomsLayoutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({
    1: false,
    2: false
  });
  const [activeHousekeepers, setActiveHousekeepers] = useState<{ name: string }[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('propertyos_staff');
      if (stored) {
        const staff = JSON.parse(stored);
        const housekeepers = staff
          .filter((s: any) => s.status !== 'Resigned')
          .map((s: any) => ({ name: s.name }));

        if (housekeepers.length > 0) {
          setActiveHousekeepers(housekeepers);
          return;
        }
      }
      
      // Fallback seed list
      setActiveHousekeepers([
        { name: 'Ramona' },
        { name: 'Tania' },
        { name: 'Gladys' },
        { name: 'Zuli' },
        { name: 'Eucaria' },
        { name: 'Jeimi' }
      ]);
    } catch (e) {
      setActiveHousekeepers([
        { name: 'Ramona' },
        { name: 'Tania' },
        { name: 'Gladys' },
        { name: 'Zuli' },
        { name: 'Eucaria' },
        { name: 'Jeimi' }
      ]);
    }
  }, []);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ number, status, assignedHousekeeper }: { number: string; status?: RoomStatus; assignedHousekeeper?: string }) => {
      const res = await apiClient.patch(`/dashboard/rooms/${number}/status`, {
        status,
        assignedHousekeeper
      });
      return res.data;
    },
    onMutate: async ({ number, status, assignedHousekeeper }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboardStats'] });
      const previousStats = queryClient.getQueryData(['dashboardStats']);
      queryClient.setQueryData(['dashboardStats'], (old: any) => {
        if (!old?.data?.rooms) return old;
        return {
          ...old,
          data: {
            ...old.data,
            rooms: old.data.rooms.map((r: Room) => {
              if (r.number !== number) return r;
              const updated = { ...r };
              if (status !== undefined) updated.status = status;
              if (assignedHousekeeper !== undefined) updated.assignedHousekeeper = assignedHousekeeper;
              return updated;
            })
          }
        };
      });
      return { previousStats };
    },
    onError: (err, newRoom, context) => {
      queryClient.setQueryData(['dashboardStats'], context?.previousStats);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const rooms: Room[] = statsData?.data?.rooms || [];

  const toggleFloor = (floorNum: number) => {
    setCollapsedFloors(prev => ({
      ...prev,
      [floorNum]: !prev[floorNum]
    }));
  };

  const roomsByFloor = useMemo(() => {
    const filtered = rooms.filter(room => {
      const matchesSearch = room.number.includes(searchQuery.trim());
      const matchesType = selectedType === 'All' || room.type === selectedType;
      return matchesSearch && matchesType;
    });

    const groups: Record<number, Room[]> = {};
    filtered.forEach(room => {
      const floorStr = room.number.charAt(0);
      const floorNum = parseInt(floorStr, 10);
      if (!isNaN(floorNum)) {
        if (!groups[floorNum]) groups[floorNum] = [];
        groups[floorNum].push(room);
      }
    });

    Object.keys(groups).forEach(floorKey => {
      const fNum = Number(floorKey);
      groups[fNum].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    });

    return groups;
  }, [searchQuery, selectedType, rooms]);

  const typeCounts = useMemo(() => {
    const counts: Record<RoomType, number> = {
      '1 Queen Bed': 0,
      '1 King Bed': 0,
      '1 King ADA': 0,
      '2 Queen Beds': 0
    };
    rooms.forEach(room => {
      if (counts[room.type] !== undefined) {
        counts[room.type]++;
      }
    });
    return counts;
  }, [rooms]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading rooms...</div>;
  }

  const floors = Object.keys(roomsByFloor).map(Number).sort();

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-8 space-y-8">
      
      {/* PAGE HEADER */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Rooms & Building</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Control console grid mapping physical rooms and floor structures.</p>
      </div>

      {/* METRICS STATS HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROOM_TYPES.map((type) => {
          const colors = ROOM_TYPE_COLORS[type];
          return (
            <div 
              key={type}
              className="rounded-2xl p-4 border bg-[var(--card)] border-[var(--border)] flex items-center justify-between shadow-sm relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{type}</span>
                <span className="text-xl font-black text-foreground block mt-1">
                  {typeCounts[type]} <span className="text-xs font-semibold text-muted-foreground">Rooms</span>
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                {getRoomIcon(type, colors.rawColor)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ROOM LAYOUT PANEL */}
      <div className="space-y-6">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] w-full"
              />
            </div>

            {/* Apple Segmented Filter */}
            <div className="bg-muted/40 p-1 rounded-xl flex flex-wrap gap-0.5 border border-[var(--border)]">
              <button
                onClick={() => setSelectedType('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
                  selectedType === 'All'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {ROOM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
                    selectedType === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* ROOM GRID GROUPED BY FLOOR */}
          <div className="space-y-8">
            {floors.map((floorNum) => {
              const floorRooms = roomsByFloor[floorNum] || [];
              const isCollapsed = collapsedFloors[floorNum];
              
              return (
                <div key={floorNum} className="space-y-4">
                  {/* Floor Header Bar */}
                  <button
                    onClick={() => toggleFloor(floorNum)}
                    className="w-full flex items-center justify-between pb-2 border-b border-[var(--border)] cursor-pointer text-left bg-transparent border-none p-0"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Floor {floorNum}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-full">
                        {floorRooms.length} Tiles
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <>
                      {floorRooms.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                          No matching rooms found on Floor {floorNum}.
                        </div>
                      ) : (
                        // Ultra-compact Control Deck Grid of keycap buttons
                        <div className="flex flex-wrap gap-3 pb-8">
                          {floorRooms.map((room) => (
                            <RoomCard 
                              key={room.number} 
                              room={room} 
                              activeHousekeepers={activeHousekeepers}
                              onStatusChange={(number, status) => updateRoomMutation.mutate({ number, status })}
                              onHousekeeperChange={(number, housekeeper) => updateRoomMutation.mutate({ number, assignedHousekeeper: housekeeper })}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

      </div>

    </div>
  );
}
