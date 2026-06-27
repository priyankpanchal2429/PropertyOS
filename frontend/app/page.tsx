'use client';

import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isLoading } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Initializing PropertyOS...
        </p>
      </div>
    </div>
  );
}
