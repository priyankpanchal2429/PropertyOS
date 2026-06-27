'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from 'next-themes';
import { Eye, EyeOff, Loader2, Moon, Sun, ShieldAlert, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, { message: 'Username or Email must be at least 3 characters' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(data.usernameOrEmail, data.password);
      toast.success('Successfully logged in!');
    } catch (err: any) {
      setErrorMsg(err);
      toast.error(err || 'Failed to authenticate');
    } finally {
      setIsSubmitting(false);
    }
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
            Sign in to manage your hotel operations
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center space-x-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20" role="alert">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Username/Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="usernameOrEmail"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Username or Email
                </label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="e.g. Teju001 or admin@propertyos.com"
                  autoComplete="username"
                  className="focus-visible:ring-primary"
                  aria-invalid={!!errors.usernameOrEmail}
                  {...register('usernameOrEmail')}
                />
                {errors.usernameOrEmail && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.usernameOrEmail.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info('Please contact your administrator to reset password.');
                    }}
                    className="text-xs font-medium text-primary hover:underline focus:outline-none focus:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="pr-10 focus-visible:ring-primary"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-background border cursor-pointer"
                  {...register('rememberMe')}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                >
                  Remember my session on this device
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center font-medium bg-primary text-primary-foreground hover:bg-primary/95 transition-colors mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Identity...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create request
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
