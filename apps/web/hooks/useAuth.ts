'use client'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  const router = useRouter()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      toast.success('Welcome back!')
      router.push('/')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Login failed')
    },
  })
}

export function useRegister() {
  const register = useAuthStore((s) => s.register)
  const router = useRouter()

  return useMutation({
    mutationFn: (data: {
      firstName: string
      lastName: string
      email: string
      password: string
    }) => register(data),
    onSuccess: () => {
      toast.success('Account created! Welcome to Apple+')
      router.push('/')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Registration failed')
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success('Signed out')
      router.push('/')
    },
  })
}
