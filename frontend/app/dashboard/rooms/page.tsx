'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Building2, 
  Bed, 
  BedDouble, 
  Accessibility, 
  Phone, 
  MapPin, 
  Globe, 
  Mail, 
  Clock, 
  Wifi, 
  Info,
  Coffee
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

// Room type color coding (used for bed icons inside room tiles)
const ROOM_TYPE_COLOR: Record<RoomType, string> = {
  '1 Queen Bed': '#3b82f6',   // Blue
  '1 King Bed': '#10b981',    // Emerald
  '1 King ADA': '#f59e0b',    // Amber
  '2 Queen Beds': '#8b5cf6'   // Purple
};

export default function PropertyMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');

  // Helper to find room data
  const getRoom = (num: string): Room | undefined => {
    return ROOM_DATA.find(r => r.number === num);
  };

  // Helper to determine if a room matches active search/filter
  const getRoomMatchState = (num: string) => {
    const r = getRoom(num);
    if (!r) return 'inactive';

    const matchesSearch = searchQuery.trim() === '' || r.number.includes(searchQuery.trim());
    const matchesFilter = selectedType === 'All' || r.type === selectedType;

    if (searchQuery.trim() !== '' || selectedType !== 'All') {
      return matchesSearch && matchesFilter ? 'highlighted' : 'dimmed';
    }
    return 'normal';
  };

  // Render a single room tile component
  const RoomTile = ({ number }: { number: string }) => {
    const room = getRoom(number);
    if (!room) return null;

    const matchState = getRoomMatchState(number);
    const isFirstFloor = room.floor === 1;
    const iconColor = ROOM_TYPE_COLOR[room.type];

    // Style classes based on Floor (matching diagram legend)
    // First Floor: Dark Blue. Second Floor: Light Blue.
    const floorBgClass = isFirstFloor 
      ? 'bg-blue-600 border-blue-800 text-white dark:bg-blue-900 dark:border-blue-950' 
      : 'bg-sky-400 border-sky-500 text-slate-900 dark:bg-sky-800 dark:border-sky-950 dark:text-slate-100';

    const opacityStyle = matchState === 'dimmed' ? 'opacity-20' : 'opacity-100';
    const borderPulse = matchState === 'highlighted' ? 'border-foreground border-[3px] scale-[1.04] ring-2 ring-cyan-500 shadow-lg z-20' : 'border-[var(--border)]';

    return (
      <div 
        className={`relative group w-12 h-12 rounded-lg border flex flex-col items-center justify-between py-1 transition-all duration-200 cursor-pointer shadow-sm ${floorBgClass} ${opacityStyle} ${borderPulse}`}
      >
        <span className="text-[10px] font-black tracking-tight leading-none">
          {room.number}
        </span>

        {/* Small bedding icon inside the card */}
        <div className="flex-1 flex items-center justify-center">
          {room.type === '2 Queen Beds' ? (
            <div className="flex gap-0.5 items-center">
              <Bed className="h-3 w-3" style={{ color: iconColor }} />
              <Bed className="h-3 w-3 -ml-1" style={{ color: iconColor }} />
            </div>
          ) : room.type === '1 King ADA' ? (
            <div className="flex items-center gap-0.5">
              <BedDouble className="h-3 w-3" style={{ color: iconColor }} />
              <Accessibility className="h-2.5 w-2.5 text-amber-500" />
            </div>
          ) : room.type === '1 King Bed' ? (
            <BedDouble className="h-3 w-3" style={{ color: iconColor }} />
          ) : (
            <Bed className="h-3 w-3" style={{ color: iconColor }} />
          )}
        </div>

        {/* Dynamic Hover Tooltip Popover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col z-30 w-52 p-3 rounded-2xl border bg-[var(--card)] text-[var(--foreground)] shadow-xl border-[var(--border)] gap-2 transition-all duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
            <span className="text-xs font-black">Room {room.number}</span>
            <span className="text-[9px] font-bold text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded">
              Floor {room.floor}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-muted/50">
              {room.type === '1 King ADA' ? <Accessibility className="h-3.5 w-3.5" /> : <BedDouble className="h-3.5 w-3.5" />}
            </div>
            <span className="text-[10px] font-extrabold text-foreground">{room.type}</span>
          </div>

          <div className="text-[9px] text-muted-foreground leading-normal border-t border-[var(--border)] pt-1">
            Bay Breeze Inn property capacity map. Double clean credits apply.
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px]" style={{ borderTopColor: 'var(--border)' }} />
        </div>
      </div>
    );
  };

  // Render staircase tile
  const Staircase = ({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) => {
    return (
      <div 
        className={`bg-muted/10 border border-[var(--border)] rounded flex items-center justify-center p-0.5 ${
          direction === 'horizontal' ? 'w-10 h-12' : 'w-12 h-10'
        }`}
      >
        <div className={`flex ${direction === 'horizontal' ? 'flex-col' : 'flex-row'} w-full h-full justify-between`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`bg-muted/20 ${
                direction === 'horizontal' ? 'w-full h-[2px]' : 'h-full w-[2px]'
              }`} 
            />
          ))}
        </div>
      </div>
    );
  };

  // Render non-room utility blocks
  const UtilityBlock = ({ label, className = '' }: { label: string; className?: string }) => {
    return (
      <div 
        className={`bg-muted/10 border border-[var(--border)] rounded-lg flex items-center justify-center p-1 text-center select-none ${className}`}
      >
        <span className="text-[8px] font-black text-muted-foreground uppercase leading-none tracking-tight break-all">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-8 space-y-8">
      
      {/* PAGE HEADER */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Rooms & Building</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Physical property blueprint layout map of the Bay Breeze Inn.</p>
      </div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* LEFT AREA: Visual Map Plan */}
        <div className="xl:col-span-3 space-y-8 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-[var(--border)] overflow-x-auto min-w-[760px]">
          
          {/* DEL MONTE BLVD ROAD (TOP) */}
          <div className="relative h-12 bg-slate-200 dark:bg-slate-900 border-y border-[var(--border)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-muted-foreground/30 h-0" />
            <span className="text-xs font-black tracking-widest text-muted-foreground z-10">DEL MONTE BLVD</span>
            {/* Tree borders */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 flex justify-around opacity-40">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              ))}
            </div>
          </div>

          {/* TOP WING BUILDING STRUCTURE */}
          <div className="flex items-start gap-4">
            
            {/* Left Corner Vertical Column (Rooms 203/103 down to 200/100) */}
            <div className="flex flex-col gap-1 items-end">
              {/* Row 203 & 103 */}
              <div className="flex gap-1">
                <RoomTile number="203" />
                <RoomTile number="103" />
              </div>
              {/* Row 202 & 102 */}
              <div className="flex gap-1">
                <RoomTile number="202" />
                <RoomTile number="102" />
              </div>
              {/* Row 201 & 101 */}
              <div className="flex gap-1">
                <RoomTile number="201" />
                <RoomTile number="101" />
              </div>
              {/* Row 200 & 100 */}
              <div className="flex gap-1">
                <RoomTile number="200" />
                <RoomTile number="100" />
              </div>
              
              {/* Umbrella Patio tables underneath */}
              <div className="flex gap-2 p-1.5 mt-2 justify-center w-full border border-dashed rounded-lg opacity-80 bg-amber-500/5">
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Patio Seating</span>
              </div>
            </div>

            {/* Right Horizontal Block */}
            <div className="flex-1 flex flex-col gap-1">
              {/* Row 1 (Floor 2 rooms) */}
              <div className="flex gap-1">
                <UtilityBlock label="STORAGE" className="w-8 h-12" />
                {['204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215'].map(num => (
                  <RoomTile key={num} number={num} />
                ))}
                <UtilityBlock label="STORAGE" className="w-8 h-12" />
              </div>

              {/* Row 2 (Floor 1 rooms) */}
              <div className="flex gap-1">
                <UtilityBlock label="ELEC" className="w-8 h-12" />
                <Staircase direction="horizontal" />
                {['104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115'].map(num => (
                  <RoomTile key={num} number={num} />
                ))}
                <UtilityBlock label="STORAGE" className="w-8 h-12" />
                <Staircase direction="horizontal" />
              </div>
            </div>

          </div>

          {/* PARKING AREA X17 */}
          <div className="h-16 border-y border-dashed border-[var(--border)] bg-muted/5 flex items-center justify-between px-12 relative">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">PARKING X17</span>
            {/* Vertical parking line dividers */}
            <div className="absolute inset-y-0 inset-x-20 flex justify-between pointer-events-none opacity-20">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-px h-full border-r border-dashed border-foreground" />
              ))}
            </div>
          </div>

          {/* MIDDLE WING BUILDING STRUCTURE */}
          <div className="flex flex-col gap-1 pl-28">
            
            {/* Top row (118, 117, 116, LAUNDRY) */}
            <div className="flex gap-1">
              {/* Staircase aligning with the left edge of 118 */}
              <Staircase direction="horizontal" />
              <RoomTile number="118" />
              <RoomTile number="117" />
              <RoomTile number="116" />
              <UtilityBlock label="LAUNDRY ROOM" className="w-24 h-12 bg-amber-500/5 text-amber-500 border-amber-500/20" />
            </div>

            {/* Bottom row (230, 228, 226, 224, 222, 220, 219, 218, 217, 216, Maintenance) */}
            <div className="flex gap-1">
              {/* Left staircase */}
              <Staircase direction="horizontal" />
              {['230', '228', '226', '224', '222', '220', '219', '218', '217', '216'].map(num => (
                <RoomTile key={num} number={num} />
              ))}
              <UtilityBlock label="MAINTENANCE" className="w-12 h-12" />
            </div>

          </div>

          {/* PARKING AREA X10 */}
          <div className="h-16 border-y border-dashed border-[var(--border)] bg-muted/5 flex items-center justify-between px-12 relative">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">PARKING X10</span>
            <div className="absolute inset-y-0 inset-x-20 flex justify-between pointer-events-none opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-px h-full border-r border-dashed border-foreground" />
              ))}
            </div>
          </div>

          {/* BOTTOM WING BUILDING STRUCTURE */}
          <div className="flex gap-1 pl-28 items-start">
            
            <div className="flex flex-col gap-1">
              {/* Row 1 (Storage, Back Office, Rooms, Stair, Paint) */}
              <div className="flex gap-1">
                <UtilityBlock label="STORE" className="w-8 h-12" />
                <UtilityBlock label="BACK OFFICE" className="w-20 h-12" />
                {['229', '227', '225', '223', '221'].map(num => (
                  <RoomTile key={num} number={num} />
                ))}
                <Staircase direction="horizontal" />
                <UtilityBlock label="PAINT STORE" className="w-16 h-12" />
              </div>

              {/* Row 2 (Lobby underneath Storage and Back Office) */}
              <div className="flex gap-1">
                <div className="w-28 h-12 rounded-lg border border-amber-500/20 bg-amber-500/10 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-black tracking-wide text-amber-600 dark:text-amber-400">LOBBY</span>
                  <span className="text-[8px] text-amber-500 font-bold uppercase mt-0.5">Front Desk</span>
                </div>
              </div>
            </div>

          </div>

          {/* ROAD PARKING X13 (LEFT SIDEWAY BANNER) */}
          <div className="h-12 border-y border-[var(--border)] bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground">PARKING X13</span>
          </div>

          {/* FREMONT BLVD ROAD (BOTTOM) */}
          <div className="relative h-12 bg-slate-200 dark:bg-slate-900 border-y border-[var(--border)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-muted-foreground/30 h-0" />
            <span className="text-xs font-black tracking-widest text-muted-foreground z-10">FREMONT BLVD</span>
            {/* Tree borders */}
            <div className="absolute top-0 inset-x-0 h-1.5 flex justify-around opacity-40">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Front Desk Controls & Details */}
        <div className="space-y-6">
          
          {/* SEARCH & FILTERS */}
          <div className="rounded-2xl p-5 border bg-[var(--card)] border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <Search className="h-4 w-4 text-cyan-500" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Search Map</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Type room number (e.g. 105)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Filter by Room Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as RoomType | 'All')}
                className="w-full h-9 rounded-xl border px-3 text-xs bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] outline-none cursor-pointer"
              >
                <option value="All">All Room Types</option>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FRONT DESK PROPERTY INFO */}
          <div className="rounded-2xl p-5 border bg-[var(--card)] border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <Info className="h-4 w-4 text-cyan-500" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Front Desk Board</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Office Hours
                </span>
                <span className="font-extrabold text-foreground">9 AM - 9 PM</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-muted-foreground font-semibold">Night Window</span>
                <span className="font-extrabold text-foreground">Until 11 PM</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-muted-foreground font-semibold">Check-In</span>
                <span className="font-extrabold text-foreground">3:00 PM</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-muted-foreground font-semibold">Check-Out</span>
                <span className="font-extrabold text-foreground">11:00 AM</span>
              </div>

              <div className="py-2 bg-muted/20 rounded-xl px-3 space-y-1.5 border">
                <div className="flex items-center gap-1.5 text-cyan-500">
                  <Wifi className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Property Wifi</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <div><span className="text-muted-foreground font-semibold">WIFI:</span> <span className="font-extrabold text-foreground">BAY BREEZE</span></div>
                  <div><span className="text-muted-foreground font-semibold">PASSWORD:</span> <span className="font-extrabold text-foreground bg-amber-500/25 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">hotel007</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* MAP LEGEND */}
          <div className="rounded-2xl p-5 border bg-[var(--card)] border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Map Legend</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded bg-blue-600 border border-blue-800" />
                <span className="font-semibold text-muted-foreground">First Floor Rooms</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded bg-sky-400 border border-sky-500" />
                <span className="font-semibold text-muted-foreground">Second Floor Rooms</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20" />
                <span className="font-semibold text-muted-foreground">Public Spaces</span>
              </div>
            </div>
          </div>

          {/* PROPERTY CONTACT FOOTER */}
          <div className="rounded-2xl p-5 border bg-[var(--card)] border-[var(--border)] shadow-sm space-y-3 text-xs leading-normal">
            <div className="font-extrabold text-foreground flex items-center gap-2 pb-1 border-b">
              <Building2 className="h-4 w-4 text-cyan-500" />
              Bay Breeze Inn
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>2049 Fremont Blvd, Seaside, CA 93955</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>(831) 899-7111</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>info@baybreezeinn.com</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>baybreezeinn.com</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
