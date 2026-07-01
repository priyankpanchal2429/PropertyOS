'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Building2, 
  ChevronDown, 
  ChevronRight,
  Bed,
  BedDouble,
  Accessibility,
  Layers,
  Sparkles,
  Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Room {
  number: string;
  type: RoomType;
  floor: number;
}

type RoomType = '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds';

const ROOM_TYPES: RoomType[] = [
  '1 Queen Bed',
  '1 King Bed',
  '1 King ADA',
  '2 Queen Beds'
];

const ROOM_DATA: Room[] = [
  // 1 Queen Bed
  { number: '116', type: '1 Queen Bed', floor: 1 },
  { number: '118', type: '1 Queen Bed', floor: 1 },
  { number: '221', type: '1 Queen Bed', floor: 2 },

  // 1 King Bed
  { number: '102', type: '1 King Bed', floor: 1 },
  { number: '103', type: '1 King Bed', floor: 1 },
  { number: '108', type: '1 King Bed', floor: 1 },
  { number: '114', type: '1 King Bed', floor: 1 },
  { number: '200', type: '1 King Bed', floor: 2 },
  { number: '201', type: '1 King Bed', floor: 2 },
  { number: '202', type: '1 King Bed', floor: 2 },
  { number: '203', type: '1 King Bed', floor: 2 },
  { number: '204', type: '1 King Bed', floor: 2 },
  { number: '205', type: '1 King Bed', floor: 2 },
  { number: '213', type: '1 King Bed', floor: 2 },
  { number: '214', type: '1 King Bed', floor: 2 },
  { number: '216', type: '1 King Bed', floor: 2 },
  { number: '217', type: '1 King Bed', floor: 2 },
  { number: '218', type: '1 King Bed', floor: 2 },
  { number: '220', type: '1 King Bed', floor: 2 },
  { number: '223', type: '1 King Bed', floor: 2 },
  { number: '224', type: '1 King Bed', floor: 2 },
  { number: '228', type: '1 King Bed', floor: 2 },
  { number: '229', type: '1 King Bed', floor: 2 },
  { number: '230', type: '1 King Bed', floor: 2 },

  // 1 King ADA
  { number: '104', type: '1 King ADA', floor: 1 },
  { number: '105', type: '1 King ADA', floor: 1 },

  // 2 Queen Beds
  { number: '100', type: '2 Queen Beds', floor: 1 },
  { number: '101', type: '2 Queen Beds', floor: 1 },
  { number: '106', type: '2 Queen Beds', floor: 1 },
  { number: '107', type: '2 Queen Beds', floor: 1 },
  { number: '109', type: '2 Queen Beds', floor: 1 },
  { number: '110', type: '2 Queen Beds', floor: 1 },
  { number: '111', type: '2 Queen Beds', floor: 1 },
  { number: '112', type: '2 Queen Beds', floor: 1 },
  { number: '113', type: '2 Queen Beds', floor: 1 },
  { number: '115', type: '2 Queen Beds', floor: 1 },
  { number: '117', type: '2 Queen Beds', floor: 1 },
  { number: '206', type: '2 Queen Beds', floor: 2 },
  { number: '207', type: '2 Queen Beds', floor: 2 },
  { number: '208', type: '2 Queen Beds', floor: 2 },
  { number: '209', type: '2 Queen Beds', floor: 2 },
  { number: '210', type: '2 Queen Beds', floor: 2 },
  { number: '211', type: '2 Queen Beds', floor: 2 },
  { number: '212', type: '2 Queen Beds', floor: 2 },
  { number: '215', type: '2 Queen Beds', floor: 2 },
  { number: '219', type: '2 Queen Beds', floor: 2 },
  { number: '222', type: '2 Queen Beds', floor: 2 },
  { number: '225', type: '2 Queen Beds', floor: 2 },
  { number: '226', type: '2 Queen Beds', floor: 2 },
  { number: '227', type: '2 Queen Beds', floor: 2 }
];

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

export default function RoomsLayoutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({
    1: false,
    2: false
  });

  const toggleFloor = (floorNum: number) => {
    setCollapsedFloors(prev => ({
      ...prev,
      [floorNum]: !prev[floorNum]
    }));
  };

  const roomsByFloor = useMemo(() => {
    const filtered = ROOM_DATA.filter(room => {
      const matchesSearch = room.number.includes(searchQuery.trim());
      const matchesType = selectedType === 'All' || room.type === selectedType;
      return matchesSearch && matchesType;
    });

    const groups: Record<number, Room[]> = {};
    filtered.forEach(room => {
      if (!groups[room.floor]) {
        groups[room.floor] = [];
      }
      groups[room.floor].push(room);
    });

    Object.keys(groups).forEach(floorKey => {
      const fNum = Number(floorKey);
      groups[fNum].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    });

    return groups;
  }, [searchQuery, selectedType]);

  const floorCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0 };
    ROOM_DATA.forEach(room => {
      counts[room.floor]++;
    });
    return counts;
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Record<RoomType, number> = {
      '1 Queen Bed': 0,
      '1 King Bed': 0,
      '1 King ADA': 0,
      '2 Queen Beds': 0
    };
    ROOM_DATA.forEach(room => {
      counts[room.type]++;
    });
    return counts;
  }, []);

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
            {[1, 2].map((floorNum) => {
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
                        <div className="flex flex-wrap gap-3">
                          {floorRooms.map((room) => {
                            const colors = ROOM_TYPE_COLORS[room.type];
                            return (
                              <div
                                key={room.number}
                                className="relative group w-20 h-16 rounded-2xl border bg-[var(--card)] border-[var(--border)] hover:border-foreground/30 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                              >
                                {/* Compact Room Number */}
                                <span className="text-xs font-black text-foreground tracking-tight">
                                  {room.number}
                                </span>

                                {/* Bed Icon directly in room card */}
                                <div className="flex flex-col items-center justify-center">
                                  {getRoomIcon(room.type, colors.rawColor)}
                                  <span 
                                    className="text-[7px] font-black uppercase tracking-tight leading-none mt-1"
                                    style={{ color: colors.rawColor }}
                                  >
                                    {room.type}
                                  </span>
                                </div>

                                {/* Out-of-the-box Tactile Tooltip Popover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col z-30 w-52 p-3 rounded-2xl border bg-[var(--card)] text-[var(--foreground)] shadow-xl border-[var(--border)] gap-2 transition-all duration-150">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                                    <span className="text-xs font-black">Room {room.number}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded">
                                      Floor {room.floor}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                                      {getRoomIcon(room.type, colors.rawColor)}
                                    </div>
                                    <span className="text-[10px] font-extrabold text-foreground">{room.type}</span>
                                  </div>

                                  <div className="text-[9px] text-muted-foreground leading-relaxed border-t border-[var(--border)] pt-1.5">
                                    PropertyOS Master layout configuration for hotel operations.
                                  </div>

                                  {/* Tooltip Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]" style={{ borderTopColor: 'var(--border)' }} />
                                </div>
                              </div>
                            );
                          })}
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
