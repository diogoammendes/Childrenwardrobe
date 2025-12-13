'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import ShareChildDialog from '@/components/share-child-dialog'

export default function ShareChildButton({ childId }: { childId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Partilhar
      </Button>
      <ShareChildDialog
        childId={childId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}




