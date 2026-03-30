'use client'

import { useState } from 'react'

export type OrbitalNode = {
  id: string
  name: string
  emoji: string
  color: string
  category: string
  status?: string
  income?: number
  goal?: number
}

interface Props {
  satellites: OrbitalNode[]
}

const SIZE = 300
const RADIUS = 112
const CENTER = SIZE / 2
const NODE_SIZE = 72

export default function RadialOrbitalTimeline({ satellites }: Props) {
  const [active, setActive] = useState<string | null>(null)

  const activeNode = satellites.find(n => n.id === active)

  function toggle(id: string) {
    setActive(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Diagram */}
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        {/* SVG: ring + connection lines */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0 pointer-events-none">
          {/* Orbital ring */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Lines from center to each satellite */}
          {satellites.map((node, i) => {
            const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2
            const x = CENTER + RADIUS * Math.cos(angle)
            const y = CENTER + RADIUS * Math.sin(angle)
            const isActive = active === node.id
            return (
              <line key={node.id}
                x1={CENTER} y1={CENTER}
                x2={x} y2={y}
                stroke={isActive ? node.color : 'rgba(255,255,255,0.07)'}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={isActive ? 'none' : '5 5'}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
            )
          })}
        </svg>

        {/* Center hub: Familjens Arkiv */}
        <div className="absolute rounded-full flex flex-col items-center justify-center select-none"
          style={{
            width: 92, height: 92,
            left: CENTER - 46, top: CENTER - 46,
            background: 'linear-gradient(135deg, #818CF8 0%, #60A5FA 50%, #34D399 100%)',
            boxShadow: '0 0 48px rgba(129,140,248,0.45), 0 0 96px rgba(129,140,248,0.12)',
          }}>
          <span className="text-2xl leading-none">🏠</span>
          <span className="text-[8px] font-bold tracking-[0.12em] mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
            ARKIV
          </span>
        </div>

        {/* Satellite nodes */}
        {satellites.map((node, i) => {
          const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2
          const x = CENTER + RADIUS * Math.cos(angle)
          const y = CENTER + RADIUS * Math.sin(angle)
          const isActive = active === node.id
          const pct = node.goal && node.goal > 0 ? Math.min(100, ((node.income || 0) / node.goal) * 100) : 0

          return (
            <button key={node.id}
              onClick={() => toggle(node.id)}
              className="absolute flex flex-col items-center justify-center rounded-2xl transition-all duration-200"
              style={{
                width: NODE_SIZE, height: NODE_SIZE,
                left: x - NODE_SIZE / 2, top: y - NODE_SIZE / 2,
                background: isActive ? `${node.color}1A` : '#1A1A1A',
                border: `1.5px solid ${isActive ? node.color : 'rgba(255,255,255,0.09)'}`,
                boxShadow: isActive ? `0 0 24px ${node.color}35` : 'none',
              }}>
              <span className="text-xl leading-none">{node.emoji}</span>
              <span className="text-[8px] font-bold mt-1 leading-tight text-center px-1.5 line-clamp-1"
                style={{ color: isActive ? node.color : '#6B6B7B' }}>
                {node.name.split(/[\s/]/)[0]}
              </span>
              {/* Mini progress arc */}
              {pct > 0 && (
                <div className="absolute bottom-1.5 left-2 right-2 h-0.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: node.color }} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail panel for active node */}
      <div style={{ minHeight: 0, width: '100%' }}>
        {activeNode ? (
          <div className="rounded-2xl p-5 space-y-3 transition-all"
            style={{
              background: `${activeNode.color}0D`,
              border: `1px solid ${activeNode.color}2A`,
            }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${activeNode.color}18` }}>
                {activeNode.emoji}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base truncate" style={{ color: '#F0F0F5' }}>
                  {activeNode.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: activeNode.color }}>
                  {activeNode.category}
                </div>
              </div>
            </div>

            {activeNode.goal && activeNode.goal > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: '#A8A8B8' }}>
                  <span>{(activeNode.income || 0).toLocaleString('sv-SE')} kr intjänat</span>
                  <span>Mål: {activeNode.goal.toLocaleString('sv-SE')} kr</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, ((activeNode.income || 0) / activeNode.goal) * 100)}%`,
                      background: activeNode.color,
                    }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: '#6B6B7B' }}>
                  {Math.round(Math.min(100, ((activeNode.income || 0) / activeNode.goal) * 100))}% av månadsmålet
                </p>
              </div>
            )}

            {activeNode.status && (
              <p className="text-sm" style={{ color: '#A8A8B8' }}>{activeNode.status}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-center" style={{ color: '#3A3A4A' }}>
            Tryck på ett projekt för att se detaljer
          </p>
        )}
      </div>
    </div>
  )
}
