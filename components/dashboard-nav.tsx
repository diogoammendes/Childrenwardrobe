'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Home, LogOut, User, Shirt } from 'lucide-react'

export default function DashboardNav({ user, appName }: { user: { name?: string | null; email: string }; appName?: string }) {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
              {appName || 'Children Wardrobe'}
            </span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <User className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span className="font-medium truncate max-w-[120px]">{user.name || user.email}</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
              size="sm"
            >
              <LogOut className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

