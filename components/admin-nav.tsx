'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, User, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/sizes', label: 'Tamanhos' },
]

export default function AdminNav({ user }: { user: { name?: string | null; email: string } }) {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/admin" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gray-800">Admin - Children Wardrobe</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.name || user.email}</span>
            </div>
            <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
        <div className="flex space-x-4 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium px-2 py-1 border-b-2 transition-colors',
                pathname === link.href
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

