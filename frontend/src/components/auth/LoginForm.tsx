'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/utils';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
      router.push('/chat');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al iniciar sesion'));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md border-border/80 bg-black/45 text-foreground shadow-2xl shadow-purple-950/30 backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-center text-3xl font-bold tracking-normal">
          Iniciar sesion
        </CardTitle>
        <CardDescription className="text-center text-base text-muted-foreground">
          Inicia sesion para acceder a tu asistente de soporte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalido',
                },
              })}
              className={`border-white/10 bg-black/30 text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-500 ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email ? (
              <p className="flex items-center gap-1 text-sm text-red-300">
                <AlertCircle className="size-4" />
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              Contrasena
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contrasena"
                {...register('password', {
                  required: 'La contrasena es obligatoria',
                  minLength: {
                    value: 6,
                    message: 'La contrasena debe tener al menos 6 caracteres',
                  },
                })}
                className={`border-white/10 bg-black/30 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-500 ${
                  errors.password ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-full items-center px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="flex items-center gap-1 text-sm text-red-300">
                <AlertCircle className="size-4" />
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
              <p className="flex items-center gap-2 text-sm text-red-200">
                <AlertCircle className="size-4" />
                {error}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] hover:shadow-purple-500/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
            Registrate aqui
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
