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
    <nav className="bg-white/90 backdrop-blur-md shadow-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/admin" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Admin - Children Wardrobe
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <User className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{user.name || user.email}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
        <div className="flex space-x-1 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-semibold px-4 py-2 rounded-lg transition-all',
                pathname === link.href
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

