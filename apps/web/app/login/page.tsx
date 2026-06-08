'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLogin } from '@/hooks/useAuth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-ap-black">Apple+</Link>
          <h1 className="mt-4 text-2xl font-bold text-ap-black">Sign In</h1>
          <p className="mt-1 text-sm text-ap-text2">Welcome back! Sign in to your account.</p>
        </div>

        <div className="rounded-3xl border border-ap-gray2 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ap-black mb-1.5">
                Email address
              </label>
              <input
                id="email"
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
              <label htmlFor="password" className="block text-sm font-medium text-ap-black mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
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
              <div className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {login.error && (
              <p className="text-sm text-red-500">{(login.error as Error).message}</p>
            )}

            <Button type="submit" isLoading={login.isPending} className="w-full mt-2" size="lg">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ap-text2">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
