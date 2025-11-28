import { Badge } from '@/components/ui/badge'

export type SizeSummaryStats = {
  total: number
  inUse: number
  futureUse: number
  retired: number
  sold: number
  givenAway: number
}

export type SizeSummarySection = {
  title: string
  sizeLabel: string
  stats: SizeSummaryStats
  helperText?: string
}

export type BelowMinimumEntry = {
  id: string
  categoryLabel: string
  subcategoryLabel: string
  required: number
  available: number
}

export type ChildSizeSummaryData = {
  current?: SizeSummarySection
  secondary?: SizeSummarySection
  smaller?: SizeSummarySection
  future?: SizeSummarySection
  belowMinimum: BelowMinimumEntry[]
  hasSizeSelection: boolean
}

interface ChildSizeSummaryProps {
  summary: ChildSizeSummaryData
}

export default function ChildSizeSummary({ summary }: ChildSizeSummaryProps) {
  const sections = [summary.current, summary.secondary, summary.smaller, summary.future].filter(
    Boolean
  ) as SizeSummarySection[]

  return (
    <div className="space-y-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Resumo por tamanho</h2>
            <p className="text-sm text-gray-500">
              Visão geral das peças por tamanho atual e tamanhos relacionados.
            </p>
          </div>
        </div>
        {sections.length === 0 ? (
          <p className="text-sm text-gray-500">
            Selecione o tamanho atual desta criança para consultar o resumo.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section) => (
              <div key={section.title} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm uppercase text-gray-500">{section.title}</p>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {section.sizeLabel}
                    </h3>
                  </div>
                  <Badge variant="secondary">{section.stats.total} peças</Badge>
                </div>
                {section.helperText && (
                  <p className="text-xs text-gray-500 mb-2">{section.helperText}</p>
                )}
                <dl className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <dt className="text-gray-500">Em uso</dt>
                    <dd className="font-semibold text-gray-900">{section.stats.inUse}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Uso futuro</dt>
                    <dd className="font-semibold text-gray-900">{section.stats.futureUse}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Retirado</dt>
                    <dd className="font-semibold text-gray-900">{section.stats.retired}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Vendido</dt>
                    <dd className="font-semibold text-gray-900">{section.stats.sold}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Oferecido</dt>
                    <dd className="font-semibold text-gray-900">{section.stats.givenAway}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Categorias abaixo do mínimo</h3>
        {summary.belowMinimum.length === 0 ? (
          <p className="text-sm text-gray-500">
            Sem alertas para os tamanhos selecionados.
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.belowMinimum.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">{entry.categoryLabel}</p>
                  <p className="text-sm text-gray-600">{entry.subcategoryLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {entry.available}/{entry.required} peças
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    Faltam {entry.required - entry.available}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

