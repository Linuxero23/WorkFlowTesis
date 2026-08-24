import { GraduationCap, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-text-primary lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-primary-dark px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute bottom-24 left-1/3 h-24 w-24 rounded-full border border-primary-light/30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-dark shadow-lg">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">PolyThesis</span>
        </div>

        <div className="relative z-10 max-w-xl pb-14">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">Acompañamiento académico</p>
          <h1 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">Tu trabajo de grado, con rumbo claro.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-200">Organiza tus etapas, entregas y conversaciones con tu tutor en un solo espacio institucional.</p>
          <div className="mt-9 flex items-center gap-3 text-sm text-slate-200">
            <ShieldCheck className="h-5 w-5 text-sky-200" aria-hidden="true" />
            <span>Acceso institucional seguro</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-300">Politécnico Grancolombiano · 2026</p>
      </section>

      <section className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-primary-dark">PolyThesis</p>
              <p className="text-xs text-text-muted">Seguimiento de trabajos de grado</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-primary">PolyThesis</p>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,59,92,0.08)] sm:p-8">{children}</div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            <span>Solo cuentas @poligran.edu.co</span>
          </div>
        </div>
      </section>
    </main>
  );
}