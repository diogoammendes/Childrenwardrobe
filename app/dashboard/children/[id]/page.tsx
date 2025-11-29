import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChildWardrobe from '@/components/child-wardrobe'
import UpdateChildForm from '@/components/update-child-form'
import ShareChildButton from '@/components/share-child-button'
import ChildSizeSummary, {
  ChildSizeSummaryData,
  SizeSummaryStats,
  BelowMinimumEntry,
} from '@/components/child-size-summary'
import { hasChildAccess } from '@/lib/child-access'
import { CLOTHING_CATEGORIES, getSubcategoryLabel, getCategoryLabel, type ClothingCategory } from '@/lib/clothing-categories'

export const dynamic = 'force-dynamic'

export default async function ChildPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  let child
  let sizeOptions = []
  
  try {
    child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        clothingItems: {
          orderBy: { createdAt: 'desc' },
          include: {
            sizeOption: true,
          },
        },
        categoryMinimums: {
          orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
        },
        currentSize: true,
        secondarySize: true,
      },
    })
    
    if (!child) {
      redirect('/dashboard')
    }

    sizeOptions = await prisma.sizeOption.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching child data:', error)
    redirect('/dashboard')
  }

  const sizeLabelMap = new Map(sizeOptions.map((option: { id: string; label: string }) => [option.id, option.label]))
  const currentSizeLabel =
    child.currentSize?.label || (child.currentSizeId ? sizeLabelMap.get(child.currentSizeId) : null)
  const secondarySizeLabel =
    child.secondarySize?.label ||
    (child.secondarySizeId ? sizeLabelMap.get(child.secondarySizeId) : null)

  const summary = buildChildSizeSummary({
    child,
    items: child.clothingItems,
    sizeOptions,
    categoryMinimums: child.categoryMinimums,
  })

  // Verificar se o utilizador tem acesso a esta criança
  if (!hasRole(session, 'ADMIN')) {
    const hasAccess = await hasChildAccess(session.user.id, params.id)
    if (!hasAccess) {
      redirect('/dashboard')
    }
  }
  
  const isOwner = child.parentId === session.user.id

  const age = Math.floor(
    (new Date().getTime() - new Date(child.birthDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  )

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 font-medium transition-colors group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para o dashboard
        </Link>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-32 relative">
            {child.photo && (
              <div className="absolute bottom-0 left-8 transform translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                  <img
                    src={child.photo}
                    alt={child.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-20 pb-6 px-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  {child.name}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Idade</p>
                    <p className="text-lg font-bold text-gray-800">{age} anos</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Género</p>
                    <p className="text-lg font-bold text-gray-800">{child.gender}</p>
                  </div>
                  {child.height && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Altura</p>
                      <p className="text-lg font-bold text-gray-800">{child.height} cm</p>
                    </div>
                  )}
                  {child.weight && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Peso</p>
                      <p className="text-lg font-bold text-gray-800">{child.weight} kg</p>
                    </div>
                  )}
                </div>
                {(currentSizeLabel || secondarySizeLabel) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {currentSizeLabel && (
                      <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tamanho atual: {currentSizeLabel}
                      </div>
                    )}
                    {secondarySizeLabel && (
                      <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Tamanho adicional: {secondarySizeLabel}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-6">
                {isOwner && <ShareChildButton childId={child.id} />}
                <UpdateChildForm child={child} sizeOptions={sizeOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChildSizeSummary summary={summary} />

      <ChildWardrobe 
        childId={child.id} 
        items={child.clothingItems}
        minimums={child.categoryMinimums}
        sizeOptions={sizeOptions}
      />
    </div>
  )
}

type BuildSummaryParams = {
  child: any
  items: any[]
  sizeOptions: Array<{ id: string; label: string; order: number | null }>
  categoryMinimums: any[]
}

function buildChildSizeSummary({
  child,
  items,
  sizeOptions,
  categoryMinimums,
}: BuildSummaryParams): ChildSizeSummaryData {
  const normalizedSizes = sizeOptions.map((option, index) => ({
    id: option.id,
    label: option.label,
    order: typeof option.order === 'number' ? option.order : index,
  }))

  const sizeMap = new Map(normalizedSizes.map((option) => [option.id, option]))
  const labelToId = new Map(
    normalizedSizes.map((option) => [option.label.toLowerCase(), option.id])
  )

  const classifiedItems = items.map((item) => ({
    item,
    sizeMeta: resolveSizeMeta(item, sizeMap, labelToId),
  }))

  const currentSizeId = child.currentSizeId || null
  const secondarySizeId = child.secondarySizeId || null
  const currentSizeLabel =
    child.currentSize?.label || (currentSizeId ? sizeMap.get(currentSizeId)?.label : null)
  const secondarySizeLabel =
    child.secondarySize?.label || (secondarySizeId ? sizeMap.get(secondarySizeId)?.label : null)

  const summary: ChildSizeSummaryData = {
    belowMinimum: [],
    hasSizeSelection: Boolean(currentSizeId),
  }

  if (currentSizeId) {
    const currentItems = classifiedItems
      .filter((entry) => entry.sizeMeta.id === currentSizeId)
      .map((entry) => entry.item)

    summary.current = {
      title: 'Tamanho atual',
      sizeLabel: currentSizeLabel || 'Selecionado',
      stats: calculateStats(currentItems),
    }
  }

  if (secondarySizeId) {
    const secondaryItems = classifiedItems
      .filter((entry) => entry.sizeMeta.id === secondarySizeId)
      .map((entry) => entry.item)

    summary.secondary = {
      title: 'Tamanho adicional',
      sizeLabel: secondarySizeLabel || 'Selecionado',
      stats: calculateStats(secondaryItems),
    }
  }

  if (currentSizeId) {
    const currentOrder = sizeMap.get(currentSizeId)?.order ?? null
    if (currentOrder !== null) {
      const smallerItems = classifiedItems
        .filter(
          (entry) =>
            entry.sizeMeta.order !== null && entry.sizeMeta.order < currentOrder
        )
        .map((entry) => entry.item)
      const futureItems = classifiedItems
        .filter(
          (entry) =>
            entry.sizeMeta.order !== null && entry.sizeMeta.order > currentOrder
        )
        .map((entry) => entry.item)

      summary.smaller = {
        title: 'Roupa pequena',
        sizeLabel: `Menor que ${currentSizeLabel || 'atual'}`,
        stats: calculateStats(smallerItems),
        helperText: 'Peças com tamanho inferior ao atual',
      }

      summary.future = {
        title: 'Roupa para futuro',
        sizeLabel: `Maior que ${currentSizeLabel || 'atual'}`,
        stats: calculateStats(futureItems),
        helperText: 'Peças que poderão ser usadas em breve',
      }
    }
  }

  const targetSizeIds = new Set<string>()
  if (currentSizeId) targetSizeIds.add(currentSizeId)
  if (secondarySizeId) targetSizeIds.add(secondarySizeId)

  if (targetSizeIds.size > 0) {
    const eligibleStatuses = new Set(['IN_USE', 'FUTURE_USE'])
    const excludedDispositions = new Set(['SOLD', 'GIVEN_AWAY'])
    const counts = new Map<string, number>()

    for (const entry of classifiedItems) {
      if (!entry.sizeMeta.id || !targetSizeIds.has(entry.sizeMeta.id)) continue
      if (!eligibleStatuses.has(entry.item.status)) continue
      if (excludedDispositions.has(entry.item.disposition)) continue
      const key = `${entry.item.category}__${entry.item.subcategory}`
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    summary.belowMinimum = categoryMinimums.reduce<BelowMinimumEntry[]>((acc, minimum) => {
      const key = `${minimum.category}__${minimum.subcategory}`
      const available = counts.get(key) || 0
      if (available < minimum.minimum) {
        const categoryLabel = getCategoryLabel(minimum.category as ClothingCategory)
        const subcategoryLabel =
          getSubcategoryLabel(minimum.category as ClothingCategory, minimum.subcategory) ||
          minimum.subcategory
        acc.push({
          id: minimum.id,
          categoryLabel,
          subcategoryLabel,
          required: minimum.minimum,
          available,
        })
      }
      return acc
    }, [])
  } else {
    summary.belowMinimum = []
  }

  return summary
}

function resolveSizeMeta(
  item: any,
  sizeMap: Map<string, { id: string; label: string; order: number }>,
  labelToId: Map<string, string>
) {
  if (item.sizeOption) {
    return {
      id: item.sizeOption.id,
      label: item.sizeOption.label,
      order:
        typeof item.sizeOption.order === 'number'
          ? item.sizeOption.order
          : sizeMap.get(item.sizeOption.id)?.order ?? null,
    }
  }

  if (item.sizeOptionId) {
    const option = sizeMap.get(item.sizeOptionId)
    if (option) {
      return {
        id: option.id,
        label: option.label,
        order: option.order,
      }
    }
  }

  if (item.size) {
    const matchId = labelToId.get(item.size.toLowerCase())
    if (matchId) {
      const option = sizeMap.get(matchId)
      return {
        id: matchId,
        label: option?.label || item.size,
        order: option?.order ?? null,
      }
    }

    return { id: null, label: item.size, order: null }
  }

  return { id: null, label: 'Sem tamanho', order: null }
}

function calculateStats(items: any[]): SizeSummaryStats {
  return items.reduce<SizeSummaryStats>(
    (acc, item) => {
      acc.total += 1
      if (item.status === 'IN_USE') acc.inUse += 1
      if (item.status === 'FUTURE_USE') acc.futureUse += 1
      if (item.status === 'RETIRED') acc.retired += 1
      if (item.disposition === 'SOLD') acc.sold += 1
      if (item.disposition === 'GIVEN_AWAY') acc.givenAway += 1
      return acc
    },
    { total: 0, inUse: 0, futureUse: 0, retired: 0, sold: 0, givenAway: 0 }
  )
}

