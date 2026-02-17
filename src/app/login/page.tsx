import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-foreground/10 bg-background p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            SAV IA
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Connectez-vous ou créez un compte
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
