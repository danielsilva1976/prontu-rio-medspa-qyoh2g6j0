import React, { useState, useRef } from 'react'
import { MapPin, ArrowUpRight, Eraser, Trash2, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type PointMark = { id: string; x: number; y: number; units: string }
export type VectorMark = { id: string; startX: number; startY: number; endX: number; endY: number }
export type LineMark = { id: string; startX: number; startY: number; endX: number; endY: number }

const DIAGRAMS: Record<string, React.ReactNode> = {
  Face: (
    <>
      {/* Neck */}
      <path
        d="M 180 400 L 150 500 M 320 400 L 350 500"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Face Contour - High detail & realistic structure */}
      <path
        d="M 250 30 C 190 30 150 50 135 100 C 120 140 125 180 130 210 C 135 240 145 260 150 280 C 155 310 170 340 190 370 C 210 400 230 430 250 430 C 270 430 290 400 310 370 C 330 340 345 310 350 280 C 355 260 365 240 370 210 C 375 180 380 140 365 100 C 350 50 310 30 250 30 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ears */}
      <path
        d="M 130 200 C 100 190 95 240 110 260 C 120 270 135 270 145 260"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 370 200 C 400 190 405 240 390 260 C 380 270 365 270 355 260"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Hairline */}
      <path
        d="M 135 100 C 180 60 320 60 365 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* Eyebrows */}
      <path
        d="M 150 170 Q 185 160 215 175"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 350 170 Q 315 160 285 175"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <path
        d="M 155 205 Q 185 190 210 205 Q 185 215 155 205"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="182" cy="205" r="5" fill="currentColor" />
      <path
        d="M 345 205 Q 315 190 290 205 Q 315 215 345 205"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="318" cy="205" r="5" fill="currentColor" />
      {/* Nose */}
      <path
        d="M 235 200 C 245 240 245 270 235 295"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M 265 200 C 255 240 255 270 265 295"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M 235 295 C 235 310 265 310 265 295"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 220 290 Q 225 300 235 295"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 280 290 Q 275 300 265 295"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Lips */}
      <path
        d="M 200 345 Q 250 330 300 345"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 200 345 Q 250 355 300 345"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 205 350 Q 250 375 295 350"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Chin crease */}
      <path
        d="M 230 400 Q 250 410 270 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Topographical aesthetic lines */}
      <path
        d="M 220 290 Q 200 330 185 360"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 280 290 Q 300 330 315 360"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 195 365 Q 185 390 180 410"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 305 365 Q 315 390 320 410"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 155 220 Q 180 240 210 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 345 220 Q 320 240 290 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 170 120 Q 250 140 330 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      {/* Cheekbone highlights */}
      <path
        d="M 140 240 Q 170 260 200 255"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
      <path
        d="M 360 240 Q 330 260 300 255"
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
      {/* Flexed Arm Outline */}
      <path
        d="M 100 350 C 200 370 300 380 350 360 C 380 370 400 350 390 300 C 380 250 390 150 370 100 C 360 50 320 50 310 100 C 300 150 290 200 300 250 C 280 230 250 210 200 210 C 150 210 120 230 100 250 M 100 250 Q 140 300 100 350"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bicep Definition */}
      <path
        d="M 200 210 C 230 260 280 270 300 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Tricep Definition */}
      <path
        d="M 150 360 C 200 330 300 330 350 360"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Elbow Crease */}
      <path
        d="M 295 260 Q 320 270 340 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Forearm Brachioradialis */}
      <path
        d="M 310 230 C 330 230 350 180 340 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* Deltoid insertion */}
      <path
        d="M 140 215 C 160 250 150 290 120 310"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* Wrist crease */}
      <path
        d="M 315 105 Q 340 115 365 105"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
  photo?: string
  points: PointMark[]
  vectors: VectorMark[]
  lines: LineMark[]
  isSigned: boolean
  onChange: (p: PointMark[], v: VectorMark[], l: LineMark[]) => void
}

export default function ApplicationMarker({
  area,
  photo,
  points = [],
  vectors = [],
  lines = [],
  onChange,
  isSigned,
}: Props) {
  const [tool, setTool] = useState<'point' | 'vector' | 'line' | 'erase'>('point')
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

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isSigned) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = getCoords(e)
    if (tool === 'point') {
      onChange(
        [...(points || []), { id: Math.random().toString(36).slice(2), x, y, units: '' }],
        vectors || [],
        lines || [],
      )
    } else if (tool === 'vector' || tool === 'line') {
      setDrawV({ sX: x, sY: y, eX: x, eY: y })
    } else if (tool === 'erase') {
      eraseNearest(x, y)
    }
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isSigned || !drawV || (tool !== 'vector' && tool !== 'line')) return
    const { x, y } = getCoords(e)
    setDrawV({ ...drawV, eX: x, eY: y })
  }

  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isSigned || !drawV) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {
      // ignore
    }
    if ((tool === 'vector' || tool === 'line') && drawV) {
      if (Math.hypot(drawV.eX - drawV.sX, drawV.eY - drawV.sY) > 5) {
        if (tool === 'vector') {
          onChange(
            points || [],
            [
              ...(vectors || []),
              {
                id: Math.random().toString(36).slice(2),
                startX: drawV.sX,
                startY: drawV.sY,
                endX: drawV.eX,
                endY: drawV.eY,
              },
            ],
            lines || [],
          )
        } else {
          onChange(points || [], vectors || [], [
            ...(lines || []),
            {
              id: Math.random().toString(36).slice(2),
              startX: drawV.sX,
              startY: drawV.sY,
              endX: drawV.eX,
              endY: drawV.eY,
            },
          ])
        }
      }
    }
    setDrawV(null)
  }

  const checkLineIntersection = (
    x: number,
    y: number,
    v: { startX: number; startY: number; endX: number; endY: number },
  ) => {
    const l2 = (v.endX - v.startX) ** 2 + (v.endY - v.startY) ** 2
    if (l2 === 0) return Math.hypot(x - v.startX, y - v.startY) < 15
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
      ) < 15
    )
  }

  const eraseNearest = (x: number, y: number) => {
    const safePoints = points || []
    const safeVectors = vectors || []
    const safeLines = lines || []

    const pt = safePoints.find((p) => Math.hypot(p.x - x, p.y - y) < 15)
    if (pt) {
      return onChange(
        safePoints.filter((p) => p.id !== pt.id),
        safeVectors,
        safeLines,
      )
    }

    const vec = safeVectors.find((v) => checkLineIntersection(x, y, v))
    if (vec) {
      return onChange(
        safePoints,
        safeVectors.filter((v) => v.id !== vec.id),
        safeLines,
      )
    }

    const lin = safeLines.find((l) => checkLineIntersection(x, y, l))
    if (lin) {
      return onChange(
        safePoints,
        safeVectors,
        safeLines.filter((l) => l.id !== lin.id),
      )
    }
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
            value="line"
            className="gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Minus className="h-4 w-4 rotate-45" />
            <span className="text-xs font-medium">Linha</span>
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
            onClick={() => onChange([], [], [])}
            className="text-destructive h-8 px-3 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Limpar
          </Button>
        )}
      </div>
      <div className="relative aspect-square w-full max-w-2xl mx-auto border border-border/60 bg-white rounded-xl shadow-inner touch-none select-none overflow-hidden">
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
            <marker
              id="arr"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
            </marker>
            {photo && (
              <clipPath id="photo-clip">
                <rect width="500" height="500" rx="0" />
              </clipPath>
            )}
          </defs>

          {photo ? (
            <image
              href={photo}
              width="500"
              height="500"
              preserveAspectRatio="xMidYMid meet"
              clipPath="url(#photo-clip)"
              opacity={0.9}
            />
          ) : (
            DIAGRAMS[area]
          )}

          {(lines || []).map((l) => (
            <line
              key={l.id}
              x1={l.startX}
              y1={l.startY}
              x2={l.endX}
              y2={l.endY}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}

          {(vectors || []).map((v) => (
            <line
              key={v.id}
              x1={v.startX}
              y1={v.startY}
              x2={v.endX}
              y2={v.endY}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
              strokeLinecap="round"
            />
          ))}

          {drawV && tool === 'vector' && (
            <line
              x1={drawV.sX}
              y1={drawV.sY}
              x2={drawV.eX}
              y2={drawV.eY}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
              opacity={0.5}
              strokeLinecap="round"
            />
          )}

          {drawV && tool === 'line' && (
            <line
              x1={drawV.sX}
              y1={drawV.sY}
              x2={drawV.eX}
              y2={drawV.eY}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              opacity={0.5}
              strokeLinecap="round"
            />
          )}

          {(points || []).map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
          ))}
        </svg>
        {(points || []).map((p) => (
          <div
            key={p.id}
            style={{ left: `${(p.x / 500) * 100}%`, top: `${(p.y / 500) * 100}%` }}
            className="absolute -translate-x-1/2 -translate-y-6 z-10"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              value={p.units}
              onChange={(e) =>
                onChange(
                  (points || []).map((pt) =>
                    pt.id === p.id ? { ...pt, units: e.target.value } : pt,
                  ),
                  vectors || [],
                  lines || [],
                )
              }
              disabled={isSigned}
              className="w-12 h-6 text-xs font-bold text-center text-primary border-none bg-transparent shadow-none focus:outline-none focus:ring-0 placeholder:text-primary/50 transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
              placeholder="Un"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
