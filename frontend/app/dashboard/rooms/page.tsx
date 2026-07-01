'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoomsUnderConstructionPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      
      {/* Decorative Icon Container */}
      <div className="relative">
        {/* Subtle background glow effect (No shadow glow style, clean colored bg) */}
        <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl scale-125" />
        <div className="relative p-5 rounded-full border border-cyan-500/30 bg-card flex items-center justify-center">
          <Building2 className="h-10 w-10 text-cyan-500" />
          <Wrench className="h-5 w-5 text-purple-500 absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border" />
        </div>
      </div>

      {/* Under Construction Messaging */}
      <div className="space-y-2 max-w-md">
        <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
          Rooms & Building Module
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          This feature is currently under construction and will be fully integrated during Phase 2 development.
        </p>
      </div>

      {/* Navigation Button */}
      <Button 
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 h-9 text-xs font-semibold px-4 rounded-xl shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Button>

    </div>
  );
}
