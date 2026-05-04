'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/utils';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyDomain?: string;
}

const steps = [
  {
    title: 'Tus datos',
    description: 'Empieza con tu nombre y correo.',
    fields: ['firstName', 'lastName', 'email'] as const,
  },
  {
    title: 'Empresa',
    description: 'Conecta tu cuenta a tu negocio.',
    fields: ['companyName', 'companyDomain'] as const,
  },
  {
    title: 'Seguridad',
    description: 'Crea una contrasena segura.',
    fields: ['password', 'confirmPassword'] as const,
  },
];

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const currentStep = steps[step];
  const inputClass =
    'border-white/10 bg-black/30 text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-500';

  const goNext = async () => {
    const isValid = await trigger(currentStep.fields);
    if (isValid) {
      setStep((value) => Math.min(value + 1, steps.length - 1));
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        companyDomain: data.companyDomain,
      });
      router.push('/chat');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al registrarse'));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md border-border/80 bg-black/45 text-foreground shadow-2xl shadow-purple-950/30 backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-center text-3xl font-bold tracking-normal">
          {currentStep.title}
        </CardTitle>
        <CardDescription className="text-center text-base text-muted-foreground">
          {currentStep.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-2" aria-label={`Paso ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="firstName" error={errors.firstName?.message}>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    {...register('firstName', { required: 'El nombre es obligatorio' })}
                    className={`${inputClass} ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                </Field>

                <Field label="Apellido" htmlFor="lastName" error={errors.lastName?.message}>
                  <Input
                    id="lastName"
                    placeholder="Perez"
                    {...register('lastName', { required: 'El apellido es obligatorio' })}
                    className={`${inputClass} ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                </Field>
              </div>

              <Field label="Email" htmlFor="email" error={errors.email?.message}>
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
                  className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                />
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field label="Nombre de la empresa" htmlFor="companyName" error={errors.companyName?.message}>
                <Input
                  id="companyName"
                  placeholder="Mi Empresa S.A."
                  {...register('companyName', { required: 'El nombre de la empresa es obligatorio' })}
                  className={`${inputClass} ${errors.companyName ? 'border-red-500' : ''}`}
                />
              </Field>

              <Field label="Dominio de la empresa (opcional)" htmlFor="companyDomain">
                <Input
                  id="companyDomain"
                  placeholder="miempresa.com"
                  {...register('companyDomain')}
                  className={inputClass}
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label="Contrasena" htmlFor="password" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimo 6 caracteres"
                    {...register('password', {
                      required: 'La contrasena es obligatoria',
                      minLength: {
                        value: 6,
                        message: 'La contrasena debe tener al menos 6 caracteres',
                      },
                    })}
                    className={`${inputClass} pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
              </Field>

              <Field label="Confirmar contrasena" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contrasena"
                  {...register('confirmPassword', {
                    required: 'Confirma tu contrasena',
                    validate: (value, formValues) =>
                      value === formValues.password || 'Las contrasenas no coinciden',
                  })}
                  className={`${inputClass} ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
              </Field>
            </>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
              <p className="flex items-center gap-2 text-sm text-red-200">
                <AlertCircle className="size-4" />
                {error}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(value - 1, 0))}
                className="flex-1 rounded-lg border border-white/10 px-6 py-3 font-semibold text-foreground transition-all hover:bg-white/5"
              >
                Atras
              </button>
            ) : null}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] hover:shadow-purple-500/40 active:scale-[0.99]"
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] hover:shadow-purple-500/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Inicia sesion aqui
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-sm text-red-300">
          <AlertCircle className="size-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
