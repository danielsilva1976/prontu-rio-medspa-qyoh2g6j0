import React, { useState, useRef } from 'react'
import { MapPin, ArrowUpRight, Eraser, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type PointMark = { id: string; x: number; y: number; units: string }
export type VectorMark = { id: string; startX: number; startY: number; endX: number; endY: number }

const DIAGRAMS: Record<string, React.ReactNode> = {
  Face: (
    <>
      {/* Neck */}
      <path
        d="M 160 430 L 140 500 M 340 430 L 360 500"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Face Contour */}
      <path
        d="M 250 40 C 140 40 90 140 90 240 C 90 320 120 380 160 420 C 190 450 220 470 250 470 C 280 470 310 450 340 420 C 380 380 410 320 410 240 C 410 140 360 40 250 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hairline */}
      <path
        d="M 120 120 C 180 80 320 80 380 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* Eyebrows */}
      <path
        d="M 130 190 Q 170 170 210 185"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 370 190 Q 330 170 290 185"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <path
        d="M 140 220 Q 175 205 200 225 Q 175 235 140 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="170" cy="220" r="5" fill="currentColor" />
      <path
        d="M 360 220 Q 325 205 300 225 Q 325 235 360 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="330" cy="220" r="5" fill="currentColor" />
      {/* Nose Bridge & Tip */}
      <path
        d="M 230 220 C 240 240 240 280 235 310"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M 270 220 C 260 240 260 280 265 310"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M 235 320 C 235 335 265 335 265 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 215 315 Q 225 325 235 315"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 285 315 Q 275 325 265 315"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Lips */}
      <path
        d="M 190 380 Q 220 365 250 375 Q 280 365 310 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 190 380 Q 250 385 310 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 195 385 Q 250 415 305 385"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Chin crease */}
      <path
        d="M 230 435 Q 250 445 270 435"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Topographical lines for precise aesthetic mapping */}
      <path
        d="M 180 140 Q 250 160 320 140"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 220 315 Q 200 350 190 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 280 315 Q 300 350 310 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 170 240 Q 190 260 230 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 330 240 Q 310 260 270 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 180 400 Q 185 430 210 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 320 400 Q 315 430 290 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 110 330 Q 160 380 230 420"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 390 330 Q 340 380 270 420"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
    </>
  ),
  Pescoço: (
    <>
      <path
        d="M180 50 L180 180 C180 230 100 260 50 280 L50 400 M320 50 L320 180 C320 230 400 260 450 280 L450 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M220 130 Q250 150 280 130 M200 230 Q250 260 300 230 M130 350 Q250 390 370 350"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M250 160 L250 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 6"
      />
    </>
  ),
  Braço: (
    <>
      {/* Outer Profile of Arm (Shoulder -> Tricep -> Elbow -> Wrist) */}
      <path
        d="M 60 250 C 100 200 180 250 200 320 C 220 390 240 450 280 450 C 320 450 380 350 420 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Inner Profile (Armpit -> Bicep -> Inner Elbow -> Wrist) */}
      <path
        d="M 140 400 C 200 380 220 300 270 300 C 320 300 310 350 300 380 C 320 350 350 250 360 180"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Fist/Hand at top */}
      <path
        d="M 360 180 C 350 120 440 120 420 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Topographical / Muscle Definition Lines */}
      <path
        d="M 200 320 C 240 280 300 300 300 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M 280 450 C 300 400 350 320 360 280"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M 160 280 C 180 320 200 340 220 330"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 180 350 C 220 380 260 400 280 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 300 380 C 330 330 370 280 380 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
    </>
  ),
  Abdome: (
    <>
      <path
        d="M130 50 C140 150 110 300 140 450 M370 50 C360 150 390 300 360 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="250" cy="270" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M250 80 L250 240 M250 300 L250 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M180 120 Q250 150 320 120 M160 180 Q250 210 340 180 M150 350 Q250 380 350 350"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </>
  ),
  Coxas: (
    <>
      <path
        d="M100 50 C80 200 120 400 150 480 M240 50 C250 200 230 400 230 480 M260 50 C250 200 270 400 270 480 M400 50 C420 200 380 400 350 480"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M100 50 Q170 90 240 50 M260 50 Q330 90 400 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M170 150 Q200 180 240 130 M330 150 Q300 180 260 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </>
  ),
  Pernas: (
    <>
      <path
        d="M150 50 C110 200 100 350 120 450 M230 50 C250 200 200 350 180 450 M270 50 C250 200 300 350 320 450 M350 50 C390 200 400 350 380 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M150 50 Q190 70 230 50 M270 50 Q310 70 350 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M120 450 Q140 480 180 450 M380 450 Q360 480 320 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
}

type Props = {
  area: string
  points: PointMark[]
  vectors: VectorMark[]
  isSigned: boolean
  onChange: (p: PointMark[], v: VectorMark[]) => void
}

export default function ApplicationMarker({ area, points, vectors, onChange, isSigned }: Props) {
  const [tool, setTool] = useState<'point' | 'vector' | 'erase'>('point')
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawV, setDrawV] = useState<{ sX: number; sY: number; eX: number; eY: number } | null>(
    null,
  )

  const getCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 500,
      y: ((e.clientY - rect.top) / rect.height) * 500,
    }
  }

  const onDown = (e: React.PointerEvent) => {
    if (isSigned) return
    const { x, y } = getCoords(e)
    if (tool === 'point')
      onChange([...points, { id: Math.random().toString(36).slice(2), x, y, units: '' }], vectors)
    else if (tool === 'vector') setDrawV({ sX: x, sY: y, eX: x, eY: y })
    else eraseNearest(x, y)
  }

  const onMove = (e: React.PointerEvent) => {
    if (isSigned || !drawV || tool !== 'vector') return
    const { x, y } = getCoords(e)
    setDrawV({ ...drawV, eX: x, eY: y })
  }

  const onUp = () => {
    if (isSigned || tool !== 'vector' || !drawV) return
    if (Math.hypot(drawV.eX - drawV.sX, drawV.eY - drawV.sY) > 10) {
      onChange(points, [
        ...vectors,
        {
          id: Math.random().toString(36).slice(2),
          startX: drawV.sX,
          startY: drawV.sY,
          endX: drawV.eX,
          endY: drawV.eY,
        },
      ])
    }
    setDrawV(null)
  }

  const eraseNearest = (x: number, y: number) => {
    const pt = points.find((p) => Math.hypot(p.x - x, p.y - y) < 25)
    if (pt)
      return onChange(
        points.filter((p) => p.id !== pt.id),
        vectors,
      )
    const vec = vectors.find((v) => {
      const l2 = (v.endX - v.startX) ** 2 + (v.endY - v.startY) ** 2
      if (l2 === 0) return Math.hypot(x - v.startX, y - v.startY) < 25
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - v.startX) * (v.endX - v.startX) + (y - v.startY) * (v.endY - v.startY)) / l2,
        ),
      )
      return (
        Math.hypot(
          x - (v.startX + t * (v.endX - v.startX)),
          y - (v.startY + t * (v.endY - v.startY)),
        ) < 25
      )
    })
    if (vec)
      onChange(
        points,
        vectors.filter((v) => v.id !== vec.id),
      )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/50">
        <ToggleGroup
          type="single"
          value={tool}
          onValueChange={(v) => v && setTool(v as any)}
          disabled={isSigned}
        >
          <ToggleGroupItem
            value="point"
            className="gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-medium">Ponto</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="vector"
            className="gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs font-medium">Vetor</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="erase"
            className="gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Eraser className="h-4 w-4" />
            <span className="text-xs font-medium">Borracha</span>
          </ToggleGroupItem>
        </ToggleGroup>
        {!isSigned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([], [])}
            className="text-destructive h-8 px-3 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Limpar
          </Button>
        )}
      </div>
      <div className="relative aspect-square w-full max-w-lg mx-auto border border-border/60 bg-white rounded-xl shadow-inner touch-none select-none overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 500 500"
          className={`w-full h-full text-foreground/15 ${tool === 'point' ? 'cursor-crosshair' : tool === 'erase' ? 'cursor-no-drop' : 'cursor-default'}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--primary))" />
            </marker>
          </defs>
          {DIAGRAMS[area]}
          {vectors.map((v) => (
            <line
              key={v.id}
              x1={v.startX}
              y1={v.startY}
              x2={v.endX}
              y2={v.endY}
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              markerEnd="url(#arr)"
              strokeLinecap="round"
            />
          ))}
          {drawV && (
            <line
              x1={drawV.sX}
              y1={drawV.sY}
              x2={drawV.eX}
              y2={drawV.eY}
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              markerEnd="url(#arr)"
              opacity={0.5}
              strokeLinecap="round"
            />
          )}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="7"
              fill="hsl(var(--primary))"
              className="drop-shadow-sm"
            />
          ))}
        </svg>
        {points.map((p) => (
          <div
            key={p.id}
            style={{ left: `${(p.x / 500) * 100}%`, top: `${(p.y / 500) * 100}%` }}
            className="absolute -translate-x-1/2 -translate-y-9 z-10"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              value={p.units}
              onChange={(e) =>
                onChange(
                  points.map((pt) => (pt.id === p.id ? { ...pt, units: e.target.value } : pt)),
                  vectors,
                )
              }
              disabled={isSigned}
              className="w-10 h-6 text-[10px] font-bold text-center text-primary-foreground border-none bg-primary/90 rounded shadow focus:ring-2 focus:ring-primary focus:bg-primary placeholder:text-primary-foreground/50 transition-colors"
              placeholder="Un"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
