'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  const sections = [summary.current, summary.secondary, summary.smaller, summary.future].filter(
    Boolean
  ) as SizeSummarySection[]

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle)
      } else {
        newSet.add(sectionTitle)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 break-words">
              Resumo por tamanho
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Visão geral das peças por tamanho atual e tamanhos relacionados.
            </p>
          </div>
        </div>
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              Selecione o tamanho atual desta criança para consultar o resumo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {sections.map((section) => {
              const isExpanded = expandedSections.has(section.title)
              return (
                <div 
                  key={section.title} 
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200"
                >
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full p-4 sm:p-5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">{section.title}</p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 break-words">
                          {section.sizeLabel}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold">
                          {section.stats.total} peças
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      {section.helperText && (
                        <p className="text-xs text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg break-words">{section.helperText}</p>
                      )}
                      <dl className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <dt className="text-xs text-gray-600 mb-1">Em uso</dt>
                          <dd className="text-xl sm:text-2xl font-bold text-green-700">{section.stats.inUse}</dd>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <dt className="text-xs text-gray-600 mb-1">Uso futuro</dt>
                          <dd className="text-xl sm:text-2xl font-bold text-blue-700">{section.stats.futureUse}</dd>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <dt className="text-xs text-gray-600 mb-1">Retirado</dt>
                          <dd className="text-xl sm:text-2xl font-bold text-gray-700">{section.stats.retired}</dd>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                          <dt className="text-xs text-gray-600 mb-1">Vendido</dt>
                          <dd className="text-xl sm:text-2xl font-bold text-yellow-700">{section.stats.sold}</dd>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 col-span-2">
                          <dt className="text-xs text-gray-600 mb-1">Oferecido</dt>
                          <dd className="text-xl sm:text-2xl font-bold text-orange-700">{section.stats.givenAway}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-red-100 rounded-lg mr-3 flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">Categorias abaixo do mínimo</h3>
        </div>
        {summary.belowMinimum.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              Sem alertas para os tamanhos selecionados.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {summary.belowMinimum.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-red-200 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 text-sm sm:text-base break-words">{entry.categoryLabel}</p>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{entry.subcategoryLabel}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">
                    {entry.available}/{entry.required} peças
                  </p>
                  <p className="text-xs sm:text-sm text-red-700 font-bold">
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

