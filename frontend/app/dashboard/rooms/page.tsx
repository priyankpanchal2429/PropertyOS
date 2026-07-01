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
  Info,
  SlidersHorizontal,
  PenTool,
  Minus,
  Plus,
  Maximize2,
  TreePine,
  Briefcase,
  Archive,
  Waves,
  Paintbrush,
  Zap,
  Coffee,
  Warehouse,
  MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Room {
  number: string;
  type: RoomType;
  floor: number;
}

type RoomType = '1 King Bed' | '1 Queen Bed' | '2 Queen Beds' | '1 King ADA';

const ROOM_TYPES: RoomType[] = [
  '1 King Bed',
  '1 Queen Bed',
  '2 Queen Beds',
  '1 King ADA'
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

// Color palette mapping exactly to reference image
const ROOM_COLORS: Record<RoomType, { bg: string; border: string; text: string; hex: string }> = {
  '1 King Bed': {
    bg: 'bg-blue-600 dark:bg-blue-600',
    border: 'border-blue-700',
    text: 'text-white',
    hex: '#2563eb'
  },
  '1 Queen Bed': {
    bg: 'bg-cyan-500 dark:bg-cyan-500',
    border: 'border-cyan-600',
    text: 'text-white',
    hex: '#06b6d4'
  },
  '2 Queen Beds': {
    bg: 'bg-orange-500 dark:bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
    hex: '#f97316'
  },
  '1 King ADA': {
    bg: 'bg-purple-600 dark:bg-purple-600',
    border: 'border-purple-700',
    text: 'text-white',
    hex: '#9333ea'
  }
};

const LEGEND_ITEMS = [
  { name: '1 King Bed', color: '#2563eb' },
  { name: '1 Queen Bed', color: '#06b6d4' },
  { name: '2 Queen Beds', color: '#f97316' },
  { name: '1 King ADA', color: '#9333ea' },
  { name: 'Facility / Area', color: '#4b5563' }
];

export default function RoomsLayoutPage() {
  const [activeTab, setActiveTab] = useState<'building' | 'list'>('building');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Expanded Floors State
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({
    'PARKING X12': true,
    'PARKING X10-1': false,
    'PARKING X10-2': false
  });

  const toggleFloorExpand = (key: string) => {
    setExpandedFloors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Find room details helper
  const getRoom = (number: string): Room | undefined => {
    return ROOM_DATA.find(r => r.number === number);
  };

  // Check if room matches active search/filter
  const isMatch = (number: string): boolean => {
    const room = getRoom(number);
    if (!room) return true; // facility
    const matchesSearch = searchQuery === '' || room.number.includes(searchQuery.trim());
    const matchesType = selectedType === 'All' || room.type === selectedType;
    return matchesSearch && matchesType;
  };

  // Dynamically calculate counts
  const floorCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0 };
    ROOM_DATA.forEach(room => {
      counts[room.floor]++;
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

  // Render a room cell or facility block
  const renderCell = (id: string, customLabel?: string) => {
    const room = getRoom(id);
    const matched = isMatch(id);
    const opacityStyle = matched ? 'opacity-100 scale-100' : 'opacity-20 scale-95';

    if (room) {
      const color = ROOM_COLORS[room.type];
      return (
        <div
          key={id}
          className={`relative group h-12 w-14 border ${color.bg} ${color.border} ${color.text} flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-all duration-300 rounded-[4px] shadow-sm ${opacityStyle}`}
        >
          {room.number}

          {/* Hover Popover Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col z-30 w-52 p-3 rounded-2xl border bg-black/90 dark:bg-black/95 text-white shadow-xl border-zinc-800 gap-2 transition-all duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <span className="text-xs font-black">Room {room.number}</span>
              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                Floor {room.floor}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-cyan-400">{room.type}</span>
            </div>

            <div className="text-[9px] text-zinc-400 leading-relaxed border-t border-zinc-800 pt-1.5">
              PropertyOS Master layout configuration for hotel operations.
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90" />
          </div>
        </div>
      );
    }

    // Facility area
    return (
      <div
        key={id}
        className={`h-12 w-14 border border-zinc-700 bg-zinc-600 dark:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-[9px] uppercase tracking-wider text-center px-1 rounded-[4px] shadow-sm transition-all duration-300 ${opacityStyle}`}
      >
        {customLabel || id.replace('_', ' ')}
      </div>
    );
  };

  // Decorative Stairs Block
  const renderStairs = () => (
    <div className="flex flex-col justify-between w-6 h-12 border border-zinc-800 bg-zinc-900/40 rounded-[2px] p-0.5 opacity-60">
      <div className="h-[2px] bg-zinc-700 w-full" />
      <div className="h-[2px] bg-zinc-700 w-full" />
      <div className="h-[2px] bg-zinc-700 w-full" />
      <div className="h-[2px] bg-zinc-700 w-full" />
      <div className="h-[2px] bg-zinc-700 w-full" />
    </div>
  );

  // Decorative Hedge Row
  const renderHedges = () => (
    <div className="flex gap-2 justify-center py-2 text-emerald-800/40 dark:text-emerald-500/20 select-none">
      {Array.from({ length: 28 }).map((_, i) => (
        <TreePine key={i} className="h-4 w-4" />
      ))}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-8 space-y-6">
      
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        
        {/* Toggle tabs */}
        <div className="bg-muted/40 p-1 rounded-xl flex border border-[var(--border)] self-start">
          <button
            onClick={() => setActiveTab('building')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
              activeTab === 'building'
                ? 'bg-background text-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Building View
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
              activeTab === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            List View
          </button>
        </div>

        {/* Search, Filter, Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Room Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] w-full"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as RoomType | 'All')}
              className="pl-8 pr-3 h-9 rounded-xl text-xs bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] font-bold cursor-pointer outline-none appearance-none min-w-[150px]"
            >
              <option value="All">All Room Types</option>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Edit Layout Button */}
          <button className="h-9 px-4 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors border-none cursor-pointer">
            <PenTool className="h-3.5 w-3.5" />
            Edit Layout
          </button>

        </div>
      </div>

      {/* CORE LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT PANEL: Building & Areas Navigation */}
        <div className="rounded-2xl border bg-[var(--card)] border-[var(--border)] p-4 shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Building & Areas</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select a building or area to view rooms.</p>
          </div>

          <div className="space-y-4">
            
            {/* Area block: PARKING X13 */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <MapPin className="h-3.5 w-3.5" />
              PARKING X13
            </div>

            {/* Building / Floor tree */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider block px-2 mb-2">Building / Floor</span>
              
              {/* Parking X12 active tree */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleFloorExpand('PARKING X12')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-muted/30 transition-colors border-none bg-transparent cursor-pointer text-left text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    {expandedFloors['PARKING X12'] ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>PARKING X12</span>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground">31 Rooms</span>
                </button>

                {expandedFloors['PARKING X12'] && (
                  <div className="pl-6 space-y-0.5">
                    <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 border-none cursor-pointer text-left relative">
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        Floor 2
                      </span>
                      <span className="text-[10px] font-bold">15 Rooms</span>
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </button>
                    <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted/30 text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer text-left">
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        Floor 1
                      </span>
                      <span className="text-[10px] font-bold">16 Rooms</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Parking X10-1 tree */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleFloorExpand('PARKING X10-1')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-muted/30 transition-colors border-none bg-transparent cursor-pointer text-left text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    {expandedFloors['PARKING X10-1'] ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>PARKING X10</span>
                  </div>
                  <span className="text-[9px] font-bold">13 Rooms</span>
                </button>
              </div>

              {/* Parking X10-2 tree */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleFloorExpand('PARKING X10-2')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-muted/30 transition-colors border-none bg-transparent cursor-pointer text-left text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    {expandedFloors['PARKING X10-2'] ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>PARKING X10</span>
                  </div>
                  <span className="text-[9px] font-bold">12 Rooms</span>
                </button>
              </div>

            </div>

            {/* Direct Area quick links */}
            <div className="space-y-0.5 border-t border-[var(--border)] pt-3">
              {[
                { name: 'Lobby', icon: Warehouse },
                { name: 'Back Office', icon: Briefcase },
                { name: 'Storage', icon: Archive },
                { name: 'Laundry Room', icon: Waves },
                { name: 'Paint Storage', icon: Paintbrush },
                { name: 'Electrical Room', icon: Zap },
                { name: 'Guest Laundry', icon: Waves },
                { name: 'Vending Machines', icon: Coffee }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all cursor-pointer"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.name}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Building View or List View */}
        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'building' ? (
            /* BUILDING VIEW: Custom Blueprint Map */
            <div className="rounded-2xl border bg-black dark:bg-[#09090b] border-zinc-800 p-6 space-y-8 relative overflow-hidden shadow-lg select-none">
              
              {/* LEGEND BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-[10px] font-bold text-zinc-300">
                <div className="flex flex-wrap items-center gap-4">
                  {LEGEND_ITEMS.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 hover:text-white transition-colors border-none bg-transparent cursor-pointer text-[10px] font-bold text-zinc-400">
                  <Info className="h-3.5 w-3.5" />
                  View Legend
                </button>
              </div>

              {/* MAP BODY */}
              <div className="space-y-12 overflow-x-auto pb-4">
                
                {/* 1. TOP WING (Del Monte Blvd) */}
                <div className="min-w-[900px] space-y-2">
                  {/* Street top */}
                  <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">DEL MONTE BLVD</div>
                  {renderHedges()}

                  <div className="flex items-start gap-4">
                    {/* Parking left label */}
                    <div className="flex flex-col items-center gap-1.5 mt-2 text-zinc-500 text-[10px] font-black w-20 text-center">
                      <span>PARKING X12</span>
                      {renderStairs()}
                    </div>

                    {/* Rooms Building Block */}
                    <div className="border-4 border-zinc-800 rounded-lg p-1.5 bg-zinc-950 flex flex-col gap-1 shadow-2xl relative">
                      {/* Row 1 (Floor 2 rooms) */}
                      <div className="flex gap-1">
                        {['200', '201', '202', '203'].map(num => renderCell(num))}
                        {renderCell('ELEC_ROOM', 'Elec Room')}
                        {['104', '105', '106', '107', '108', '204', '205', '206', '207', '208'].map(num => renderCell(num))}
                        {renderCell('STORAGE_1', 'Storage')}
                        {renderCell('STORAGE_2', 'Storage')}
                      </div>

                      {/* Row 2 (Floor 1 rooms, offset layout) */}
                      <div className="flex gap-1">
                        {['100', '101', '102', '103'].map(num => renderCell(num))}
                        {/* Empty spacing for matching architectural blueprint offset */}
                        <div className="h-12 w-14 bg-transparent border border-transparent" />
                        {['109', '110', '111', '112', '113', '114', '115', '210', '211', '212'].map(num => renderCell(num))}
                        <div className="h-12 w-14 bg-transparent border border-transparent" />
                        <div className="h-12 w-14 bg-transparent border border-transparent" />
                      </div>
                    </div>

                    {/* Right side stairs */}
                    <div className="mt-2">
                      {renderStairs()}
                    </div>
                  </div>
                </div>

                {/* 2. MIDDLE WING (Parking X10) */}
                <div className="min-w-[900px] flex items-center justify-center">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">PARKING X10</div>
                    
                    <div className="flex items-start gap-4">
                      {/* Left Stairs */}
                      <div className="flex flex-col items-center gap-1.5 text-zinc-500 text-[10px] font-black w-24 text-center">
                        <span>PARKING X12</span>
                        {renderStairs()}
                      </div>

                      {/* Rooms Building Block */}
                      <div className="border-4 border-zinc-800 rounded-lg p-1.5 bg-zinc-950 flex flex-col gap-1 shadow-2xl">
                        {/* Row 1 (offset) */}
                        <div className="flex gap-1">
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                          {['230', '228', '118', '117', '116'].map(num => renderCell(num))}
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                          <div className="h-12 w-14 bg-transparent border border-transparent" />
                        </div>

                        {/* Row 2 */}
                        <div className="flex gap-1">
                          {['229', '226', '224', '222', '220'].map(num => renderCell(num))}
                          {renderCell('LAUNDRY', 'Laundry')}
                          {['219', '218', '217', '216'].map(num => renderCell(num))}
                          {renderCell('PAINT_STORAGE', 'Paint Storage')}
                        </div>
                      </div>

                      {/* Right stairs */}
                      <div>
                        {renderStairs()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM WING (Fremont Blvd) */}
                <div className="min-w-[900px] space-y-2">
                  <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">PARKING X10</div>
                  
                  <div className="flex items-start gap-4">
                    {/* Parking left label */}
                    <div className="flex flex-col items-center gap-1.5 mt-2 text-zinc-500 text-[10px] font-black w-20 text-center">
                      <span>PARKING X13</span>
                    </div>

                    {/* Rooms Building Block with custom lobby side */}
                    <div className="border-4 border-zinc-800 rounded-lg p-1.5 bg-zinc-950 flex gap-2 shadow-2xl relative">
                      
                      {/* Left Lobby Block (Tan Theme) */}
                      <div className="flex flex-col gap-1 w-44">
                        <div className="flex gap-1">
                          <div className="h-12 flex-1 border border-amber-800/40 bg-amber-900/10 text-amber-500 flex items-center justify-center font-bold text-[9px] uppercase tracking-wider rounded-[4px] shadow-sm">Storage</div>
                          <div className="h-12 flex-[1.5] border border-amber-800/40 bg-amber-900/10 text-amber-500 flex flex-col justify-center items-center font-bold text-[9px] uppercase tracking-wider rounded-[4px] shadow-sm gap-0.5">
                            <Briefcase className="h-3 w-3" />
                            Back Office
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="h-12 flex-1 border border-amber-800/40 bg-amber-900/10 text-amber-500 flex items-center justify-center font-bold text-[9px] uppercase tracking-wider rounded-[4px] shadow-sm">Vending</div>
                        </div>
                        <div className="h-12 border border-amber-800/40 bg-amber-900/20 text-amber-400 flex items-center justify-center font-black text-xs uppercase tracking-widest rounded-[4px] shadow-sm">Lobby</div>
                      </div>

                      {/* Right rooms rows */}
                      <div className="flex flex-col gap-1">
                        {/* Row 1 */}
                        <div className="flex gap-1">
                          {['227', '225', '223', '221'].map(num => renderCell(num))}
                        </div>
                        {/* Row 2 */}
                        <div className="flex gap-1">
                          {['224', '222', '220', '226', '219', '215', '213', '211', '209'].map(num => renderCell(num))}
                          {renderCell('RESTROOMS', '🚻')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Street bottom */}
                  {renderHedges()}
                  <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">FREMONT BLVD</div>
                </div>

              </div>

              {/* DETAILS FOOTER CONSOLE BAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[10px] font-black tracking-wider text-zinc-400">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-8">
                  <div>OFFICE HOURS: <span className="text-white">9 AM - 9 PM</span></div>
                  <div>CHECK IN: <span className="text-white">3 PM</span></div>
                  <div>WIFI: <span className="text-cyan-400">BAY BREEZE INN</span></div>
                  <div>NIGHT WINDOW: <span className="text-white">UNTIL 11 PM</span></div>
                  <div>CHECK OUT: <span className="text-white">11 AM</span></div>
                  <div>PASSWORD: <span className="text-cyan-400">hotel007</span></div>
                </div>

                {/* Map scaling controls */}
                <div className="flex items-center gap-4 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs text-white">
                    <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1 hover:bg-zinc-800 rounded border-none bg-transparent cursor-pointer text-white">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 min-w-[36px] text-center font-bold">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1 hover:bg-zinc-800 rounded border-none bg-transparent cursor-pointer text-white">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-white transition-colors cursor-pointer text-zinc-400">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* LIST VIEW: Compact tactile keycap buttons grid */
            <div className="space-y-6">
              {[1, 2].map((floorNum) => {
                // Filter rooms by floor based on search/filter matching
                const floorRooms = ROOM_DATA.filter(room => {
                  if (room.floor !== floorNum) return false;
                  const matchesSearch = searchQuery === '' || room.number.includes(searchQuery.trim());
                  const matchesType = selectedType === 'All' || room.type === selectedType;
                  return matchesSearch && matchesType;
                });

                floorRooms.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
                
                return (
                  <div key={floorNum} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Floor {floorNum}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-full">
                        {floorRooms.length} Tiles
                      </span>
                    </div>

                    {floorRooms.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No matching rooms found on Floor {floorNum}.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {floorRooms.map((room) => {
                          const colors = ROOM_COLORS[room.type];
                          return (
                            <div
                              key={room.number}
                              className="relative group w-20 h-16 rounded-2xl border bg-[var(--card)] border-[var(--border)] hover:border-foreground/30 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm animate-in fade-in zoom-in-95 duration-150"
                            >
                              <span className="text-xs font-black text-foreground tracking-tight">
                                {room.number}
                              </span>

                              <div className="flex flex-col items-center justify-center">
                                {getRoomIcon(room.type, colors.hex)}
                                {room.type === '2 Queen Beds' && (
                                  <span className="text-[7px] font-black text-purple-500 uppercase tracking-tight leading-none mt-1">2 Queen Beds</span>
                                )}
                              </div>

                              {/* Hover Tooltip Popover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col z-30 w-52 p-3 rounded-2xl border bg-black/95 text-white shadow-xl border-zinc-800 gap-2 transition-all duration-150">
                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
                                  <span className="text-xs font-black">Room {room.number}</span>
                                  <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                                    Floor {room.floor}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold text-cyan-400">{room.type}</span>
                                </div>

                                <div className="text-[9px] text-zinc-400 leading-relaxed border-t border-zinc-850 pt-1.5">
                                  PropertyOS Master layout configuration for hotel operations.
                                </div>

                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/95" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
