import { getServerSession } from '@/lib/auth'
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

export default async function ChildPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  const child = await prisma.child.findUnique({
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
  const sizeOptions = await prisma.sizeOption.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  const sizeLabelMap = new Map(sizeOptions.map((option) => [option.id, option.label]))
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

  if (!child) {
    redirect('/dashboard')
  }

  // Verificar se o utilizador tem acesso a esta criança
  if (session.user.role === 'PARENT') {
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
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>
        <div className="flex justify-between items-start mb-6">
          <div className="flex space-x-4">
            {child.photo && (
              <div className="flex-shrink-0">
                <img
                  src={child.photo}
                  alt={child.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{child.name}</h1>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Idade:</span> {age} anos</p>
                <p><span className="font-medium">Género:</span> {child.gender}</p>
                <p><span className="font-medium">Data de nascimento:</span> {new Date(child.birthDate).toLocaleDateString('pt-PT')}</p>
                {child.height && <p><span className="font-medium">Altura:</span> {child.height} cm</p>}
                {child.weight && <p><span className="font-medium">Peso:</span> {child.weight} kg</p>}
                {child.shoeSize && <p><span className="font-medium">Tamanho de sapato:</span> {child.shoeSize}</p>}
                {currentSizeLabel && (
                  <p><span className="font-medium">Tamanho atual:</span> {currentSizeLabel}</p>
                )}
                {secondarySizeLabel && (
                  <p><span className="font-medium">Tamanho adicional:</span> {secondarySizeLabel}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {isOwner && <ShareChildButton childId={child.id} />}
            <UpdateChildForm child={child} sizeOptions={sizeOptions} />
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

