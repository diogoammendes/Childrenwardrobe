'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import AppConfigDialog from './app-config-dialog'

export default function AppConfigSection({
  initialConfig,
}: {
  initialConfig?: Record<string, string>
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurações</h2>
            <p className="text-gray-600">Gerir configurações da aplicação</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Nome da Aplicação:</span>
            <span className="text-sm text-gray-900 font-semibold">
              {initialConfig?.app_name || 'Children Wardrobe'}
            </span>
          </div>
        </div>
      </div>

      <AppConfigDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialConfig={initialConfig}
      />
    </>
  )
}




