'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    // Signup registration is disabled for now as requested
    toast.success('Registration request sent! Our administration team will review your application.');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Top Corner Controls */}
      <div className="absolute right-4 top-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-full h-9 w-9"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            PropertyOS
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Request an organization tenant setup
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Create account</CardTitle>
            <CardDescription>
              Submit an application for your property management staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. johndoe"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.username}
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create strong password"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center font-medium bg-primary text-primary-foreground hover:bg-primary/95 transition-colors mt-2"
              >
                Submit Access Request
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Already have an organization?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
