import type { Metadata } from 'next'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Créer un compte | Savly',
  description: 'Créez votre compte Savly et démarrez votre essai gratuit.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <SignupForm />
      </div>
    </div>
  )
}
