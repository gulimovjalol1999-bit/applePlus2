'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRegister } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    register.mutate({ firstName, lastName, email, password })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-ap-black">Apple+</Link>
          <h1 className="mt-4 text-2xl font-bold text-ap-black">Create Account</h1>
          <p className="mt-1 text-sm text-ap-text2">Join Apple Plus for the best deals.</p>
        </div>

        <div className="rounded-3xl border border-ap-gray2 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ap-black mb-1.5">First name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-3 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ap-black mb-1.5">Last name</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-3 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ap-black mb-1.5">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-3 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ap-black mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-3 pr-12 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ap-text3 hover:text-ap-black transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-ap-gray3 text-accent"
              />
              <span className="text-xs text-ap-text2 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {register.error && (
              <p className="text-sm text-red-500">{(register.error as Error).message}</p>
            )}

            <Button type="submit" isLoading={register.isPending} className="w-full mt-2" size="lg">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ap-text2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
