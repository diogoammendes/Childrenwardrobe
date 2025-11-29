import { prisma } from '@/lib/prisma'

export default async function AppName() {
  const config = await prisma.appConfig.findUnique({
    where: { key: 'app_name' },
  })

  return config?.value || 'Children Wardrobe'
}

