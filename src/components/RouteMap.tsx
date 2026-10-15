import React from 'react';
import { ZoneId, ZONES, driveMinutes, formatMinutes, zoneById } from '../services/route';

/* ---------------------------------------------------------------
   A schematic of Khao Yai's zones, not a map: each zone is one
   point, joined by the roads people actually drive between them.
   The selected day is drawn over it.
   --------------------------------------------------------------- */

const W = 520;
const H = 300;

/**
 * Hand-placed, keeping each zone's real compass direction from its
 * neighbours but spreading the cluster around Thanarat and Mu Si so the
 * names can be read. Drive times come from the real coordinates.
 */
const POSITION: Record<Exclude<ZoneId, 'bkk'>, { x: number; y: number }> = {
  muaklek: { x: 78, y: 92 },
  pakchong: { x: 232, y: 48 },
  thanarat: { x: 196, y: 160 },
  musi: { x: 330, y: 132 },
  park: { x: 176, y: 252 },
  wangnamkhiao: { x: 452, y: 214 },
};

const project = (id: Exclude<ZoneId, 'bkk'>) => POSITION[id];

/** Bangkok sits far off to the south-west; it enters from the left edge. */
const BKK_ENTRY = { x: 0, y: 206 };
const pointOf = (id: ZoneId) => (id === 'bkk' ? BKK_ENTRY : project(id));

const ROADS: [Exclude<ZoneId, 'bkk'>, Exclude<ZoneId, 'bkk'>][] = [
  ['muaklek', 'pakchong'],
  ['pakchong', 'thanarat'],
  ['pakchong', 'musi'],
  ['thanarat', 'musi'],
  ['thanarat', 'park'],
  ['musi', 'wangnamkhiao'],
];

const LABEL: Record<Exclude<ZoneId, 'bkk'>, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
  muaklek: { dx: 0, dy: -30, anchor: 'middle' },
  pakchong: { dx: 18, dy: 4, anchor: 'start' },
  musi: { dx: 18, dy: 4, anchor: 'start' },
  thanarat: { dx: -18, dy: 4, anchor: 'end' },
  park: { dx: 18, dy: 4, anchor: 'start' },
  wangnamkhiao: { dx: 0, dy: 28, anchor: 'middle' },
};

interface RouteMapProps {
  /** Zones in the order the selected day visits them. */
  path: ZoneId[];
  /** How many of the day's stops fall in each zone. */
  stopCounts: Partial<Record<ZoneId, number>>;
  stayZone?: ZoneId | null;
  /** Changes whenever the drawn day changes, so the line is drawn afresh. */
  pathKey: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({ path, stopCounts, stayZone, pathKey }) => {
  const zones = ZONES.filter((z) => z.id !== 'bkk');
  const points = path.map(pointOf);
  const fromBkk = formatMinutes(driveMinutes('bkk', 'muaklek'));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          path.length
            ? `เส้นทางของวันนี้ ผ่าน ${path.map((id) => zoneById(id).name).join(' แล้วไป ')}`
            : 'แผนผังโซนของเขาใหญ่และเวลาขับรถระหว่างโซน'
        }
      >
        {/* The road in from Bangkok */}
        <line
          x1={BKK_ENTRY.x}
          y1={BKK_ENTRY.y}
          x2={project('muaklek').x}
          y2={project('muaklek').y}
          stroke="var(--color-mist-deep)"
          strokeWidth={1.5}
          strokeDasharray="3 5"
        />
        <text x={6} y={H - 10} fontSize={12} fill="var(--color-stone)" className="rm-small">
          จากกรุงเทพฯ ≈ {fromBkk}
        </text>

        {ROADS.map(([a, b]) => {
          const p = project(a);
          const q = project(b);
          const minutes = driveMinutes(a, b);
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke="var(--color-mist-deep)"
                strokeWidth={1.5}
                strokeDasharray="3 5"
              />
              {minutes >= 20 && (
                <text
                  x={(p.x + q.x) / 2}
                  y={(p.y + q.y) / 2 + 4}
                  fontSize={11}
                  textAnchor="middle"
                  className="rm-small"
                  fill="var(--color-stone)"
                  stroke="var(--color-mist)"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {formatMinutes(minutes)}
                </text>
              )}
            </g>
          );
        })}

        {points.length > 1 && (
          <polyline
            key={pathKey}
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--color-brass)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className="route-draw"
          />
        )}

        {zones.map((zone) => {
          const id = zone.id as Exclude<ZoneId, 'bkk'>;
          const { x, y } = project(id);
          const count = stopCounts[zone.id] ?? 0;
          const label = LABEL[id];
          const isStay = stayZone === zone.id;
          return (
            <g key={zone.id}>
              {isStay && (
                <circle cx={x} cy={y} r={15} fill="none" stroke="var(--color-brass)" strokeWidth={1.5} />
              )}
              {count > 0 ? (
                <>
                  <circle cx={x} cy={y} r={10} fill="var(--color-ink)" />
                  <text
                    x={x}
                    y={y + 4}
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    fill="var(--color-paper)"
                  >
                    {count}
                  </text>
                </>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="var(--color-paper)"
                  stroke="var(--color-stone)"
                  strokeWidth={1.5}
                />
              )}
              <text
                x={x + label.dx}
                y={y + label.dy}
                fontSize={13}
                className="rm-name"
                fontWeight={count > 0 ? 600 : 500}
                textAnchor={label.anchor}
                fill="var(--color-ink)"
              >
                {zone.name}
              </text>
              <text
                x={x + label.dx}
                y={y + label.dy + 15}
                fontSize={11}
                textAnchor={label.anchor}
                fill="var(--color-stone)"
                className="max-sm:hidden"
              >
                {zone.note}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-fine text-stone">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ink" aria-hidden="true" />
          จุดแวะของวันนี้
        </span>
        {stayZone && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-brass" aria-hidden="true" />
            ที่พัก
          </span>
        )}
        <span>เวลาขับโดยประมาณ ไม่รวมรถติด</span>
      </figcaption>
    </figure>
  );
};
