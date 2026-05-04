'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthShell eyebrow="Tu asistente de soporte inteligente">
      <LoginForm />
    </AuthShell>
  );
}
