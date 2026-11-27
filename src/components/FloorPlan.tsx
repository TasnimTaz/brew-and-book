'use client';

import React, { useState } from 'react';
import { Table, TableStatus } from '@/types';
import { ZoomInIcon, ZoomOutIcon } from './Icons';

interface FloorPlanProps {
  tables: Table[];
  selectedTable: Table | null;
  onSelectTable: (table: Table) => void;
  selectedSeats: number | 'all';
  selectedZone: string;
  lang: 'en' | 'bn';
}

export default function FloorPlan({
  tables,
  selectedTable,
  onSelectTable,
  selectedSeats,
  selectedZone,
  lang,
}: FloorPlanProps) {
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  const getStatusColors = (status: TableStatus = 'AVAILABLE', isSelected: boolean) => {
    if (isSelected) {
      return { fill: '#241810', stroke: '#b07a4a', text: '#ffffff', subText: '#ddb892', chairFill: '#4a3428', chairStroke: '#b07a4a', badgeBg: '#b07a4a', badgeText: '#241810' };
    }
    switch (status) {
      case 'AVAILABLE':
        return { fill: '#ffffff', stroke: '#1f8a5b', text: '#14543a', subText: '#1f8a5b', chairFill: '#dcfce7', chairStroke: '#4ade80', badgeBg: '#1f8a5b', badgeText: '#ffffff' };
      case 'HELD':
        return { fill: '#fffdf5', stroke: '#c77700', text: '#78350f', subText: '#b45309', chairFill: '#fef3c7', chairStroke: '#fbbf24', badgeBg: '#c77700', badgeText: '#ffffff' };
      case 'BOOKED':
      case 'OCCUPIED':
        return { fill: '#fff8f8', stroke: '#d14545', text: '#7f1d1d', subText: '#b91c1c', chairFill: '#fee2e2', chairStroke: '#f87171', badgeBg: '#d14545', badgeText: '#ffffff' };
      case 'UNAVAILABLE':
      default:
        return { fill: '#f8fafc', stroke: '#94a3b8', text: '#475569', subText: '#64748b', chairFill: '#e2e8f0', chairStroke: '#cbd5e1', badgeBg: '#94a3b8', badgeText: '#ffffff' };
    }
  };

  const isTableFilteredOut = (t: Table) => {
    if (selectedSeats !== 'all' && t.seats !== selectedSeats) return true;
    if (selectedZone !== 'all' && t.zone.toLowerCase() !== selectedZone.toLowerCase()) return true;
    return false;
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border-light bg-surface shadow-[0_1px_3px_rgba(36,24,16,0.02),0_12px_32px_-12px_rgba(36,24,16,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-primary-dark">
            {lang === 'en' ? 'Floor Plan' : 'ফ্লোর প্ল্যান'}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {lang === 'en' ? 'Tap an available table to view menu & reserve' : 'মেনু দেখতে ও রিজার্ভ করতে একটি টেবিলে ট্যাপ করুন'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-background border border-border-light p-1">
          <button onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} className="rounded-lg p-2 text-muted hover:text-primary-dark hover:bg-surface transition-colors cursor-pointer" title="Zoom out">
            <ZoomOutIcon className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(1)} className="px-2 text-[11px] font-semibold text-muted hover:text-primary-dark cursor-pointer min-w-[48px]">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))} className="rounded-lg p-2 text-muted hover:text-primary-dark hover:bg-surface transition-colors cursor-pointer" title="Zoom in">
            <ZoomInIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-auto bg-[#fbf9f6] p-4 sm:p-6 scrollbar-thin">
        <div className="mx-auto transition-transform duration-200 origin-top" style={{ width: `${zoom * 100}%`, minWidth: '560px', maxWidth: `${zoom * 860}px` }}>
          <svg viewBox="0 0 620 540" className="w-full h-auto select-none" onMouseLeave={() => setHoveredTable(null)}>
            <defs>
              <pattern id="floorGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#efe8df" strokeWidth="0.8" />
              </pattern>
              <pattern id="patioWood" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="#f3ebe0" />
                <path d="M 0 12 L 12 0" stroke="#e6d8c8" strokeWidth="0.5" opacity="0.5" />
              </pattern>
              <linearGradient id="sunWash" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <filter id="tableShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#241810" floodOpacity="0.07" />
              </filter>
              <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#b07a4a" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Floor */}
            <rect x="24" y="24" width="572" height="366" rx="16" fill="#fffdfb" />
            <rect x="24" y="24" width="572" height="366" rx="16" fill="url(#floorGrid)" />
            <rect x="28" y="28" width="564" height="70" rx="12" fill="url(#sunWash)" />

            {/* Outdoor */}
            <rect x="24" y="390" width="346" height="126" rx="12" fill="url(#patioWood)" />

            {/* Bar area */}
            <rect x="370" y="390" width="226" height="126" rx="12" fill="#f7f1ea" />

            {/* Walls */}
            <rect x="24" y="24" width="572" height="492" rx="16" fill="none" stroke="#3d2c22" strokeWidth="5" />

            {/* Window */}
            <line x1="60" y1="24" x2="540" y2="24" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
            <text x="300" y="16" textAnchor="middle" fill="#9a8d82" fontSize="7" fontWeight="700" letterSpacing="1.5">WINDOW VIEW</text>

            {/* Patio door */}
            <line x1="24" y1="390" x2="370" y2="390" stroke="#c9b8a5" strokeWidth="2" />
            <line x1="140" y1="390" x2="240" y2="390" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" />
            <text x="190" y="384" textAnchor="middle" fill="#75675a" fontSize="6.5" fontWeight="600" letterSpacing="0.5">PATIO DOOR</text>

            {/* Labels */}
            <text x="44" y="52" fill="#c4b5a5" fontSize="8" fontWeight="700" letterSpacing="1.2">WINDOW LOUNGE</text>
            <text x="460" y="52" fill="#c4b5a5" fontSize="8" fontWeight="700" letterSpacing="1.2">QUIET CORNER</text>
            <text x="44" y="160" fill="#c4b5a5" fontSize="8" fontWeight="700" letterSpacing="1.2">MAIN HALL</text>
            <text x="44" y="280" fill="#c4b5a5" fontSize="8" fontWeight="700" letterSpacing="1.2">FAMILY AREA</text>
            <text x="44" y="504" fill="#a89888" fontSize="8" fontWeight="700" letterSpacing="1.2">OUTDOOR TERRACE</text>

            {/* Bar counter */}
            <g transform="translate(388, 405)">
              <rect x="0" y="0" width="190" height="64" rx="10" fill="#3d2c22" filter="url(#tableShadow)" />
              <rect x="4" y="4" width="182" height="56" rx="8" fill="#4a3428" />
              <rect x="14" y="14" width="34" height="20" rx="4" fill="#241810" stroke="#b07a4a" strokeWidth="0.8" />
              <circle cx="24" cy="24" r="3" fill="#b07a4a" />
              <circle cx="38" cy="24" r="3" fill="#b07a4a" />
              <rect x="60" y="14" width="50" height="20" rx="4" fill="#faf8f5" stroke="#ddb892" strokeWidth="0.8" />
              <circle cx="75" cy="24" r="4" fill="#ddb892" opacity="0.7" />
              <circle cx="95" cy="24" r="4" fill="#b07a4a" opacity="0.6" />
              <rect x="122" y="14" width="48" height="20" rx="4" fill="#241810" stroke="#75675a" strokeWidth="0.8" />
              <rect x="132" y="19" width="28" height="10" rx="2" fill="#b07a4a" opacity="0.8" />
              <text x="95" y="50" textAnchor="middle" fill="#efe7dc" fontSize="7.5" fontWeight="700" letterSpacing="1.2">BARISTA BAR</text>
            </g>

            {/* Entrance */}
            <g transform="translate(500, 486)">
              <path d="M 0 30 A 30 30 0 0 1 30 0" fill="none" stroke="#ddb892" strokeWidth="1.2" strokeDasharray="3,3" />
              <line x1="0" y1="30" x2="28" y2="2" stroke="#3d2c22" strokeWidth="2.5" strokeLinecap="round" />
              <text x="50" y="20" textAnchor="middle" fill="#75675a" fontSize="7" fontWeight="700" letterSpacing="0.8">ENTRANCE</text>
            </g>

            {/* Plants */}
            {[{ x: 40, y: 408 }, { x: 352, y: 408 }, { x: 40, y: 498 }, { x: 578, y: 46 }].map((p, i) => (
              <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                <circle cx="0" cy="0" r="9" fill="#ecfdf5" stroke="#86efac" strokeWidth="1" />
                <circle cx="0" cy="0" r="3" fill="#22c55e" opacity="0.6" />
              </g>
            ))}

            {/* Tables */}
            {tables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              const isHovered = hoveredTable?.id === table.id;
              const isFiltered = isTableFilteredOut(table);
              const status = table.status || 'AVAILABLE';
              const colors = getStatusColors(status, isSelected);
              const isCircle = table.shape === 'circle';
              const w = table.width || (isCircle ? 70 : 100);
              const h = table.height || (isCircle ? 70 : 80);
              const cx = table.x + w / 2;
              const cy = table.y + h / 2;
              const r = w / 2;

              return (
                <g
                  key={table.id}
                  className={`cursor-pointer transition-opacity duration-300 ${isFiltered ? 'opacity-20' : 'opacity-100'}`}
                  onClick={() => onSelectTable(table)}
                  onMouseEnter={() => setHoveredTable(table)}
                  onMouseLeave={() => setHoveredTable(null)}
                  filter={isSelected ? 'url(#selectedGlow)' : 'url(#tableShadow)'}
                >
                  {isSelected && (isCircle ? (
                    <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="#b07a4a" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.9" />
                  ) : (
                    <rect x={table.x - 5} y={table.y - 5} width={w + 10} height={h + 10} rx="16" fill="none" stroke="#b07a4a" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.9" />
                  ))}

                  {/* Chairs */}
                  {table.seats === 2 && (
                    <>
                      <rect x={cx - (isCircle ? r + 14 : w / 2 + 14)} y={cy - 9} width="9" height="18" rx="4" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={cx + (isCircle ? r + 5 : w / 2 + 5)} y={cy - 9} width="9" height="18" rx="4" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                    </>
                  )}
                  {table.seats === 4 && (
                    <>
                      <rect x={cx - 24} y={table.y - 12} width="18" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={cx + 6} y={table.y - 12} width="18" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={cx - 24} y={table.y + h + 4} width="18" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={cx + 6} y={table.y + h + 4} width="18" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                    </>
                  )}
                  {table.seats >= 6 && (
                    <>
                      <rect x={table.x + 10} y={table.y - 12} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={table.x + 59} y={table.y - 12} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={table.x + 108} y={table.y - 12} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={table.x + 10} y={table.y + h + 4} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={table.x + 59} y={table.y + h + 4} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                      <rect x={table.x + 108} y={table.y + h + 4} width="22" height="8" rx="3" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.2" />
                    </>
                  )}

                  {/* Surface */}
                  {isCircle ? (
                    <circle cx={cx} cy={cy} r={r} fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected || isHovered ? 2.5 : 2} />
                  ) : (
                    <rect x={table.x} y={table.y} width={w} height={h} rx="14" fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected || isHovered ? 2.5 : 2} />
                  )}

                  <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fill={colors.text} fontSize={table.seats >= 6 ? '14' : '13'} fontWeight="800" style={{ fontFamily: 'var(--font-noto-sans), system-ui' }}>
                    {table.code}
                  </text>
                  <rect x={cx - 16} y={cy + 6} width="32" height="14" rx="7" fill={colors.badgeBg} opacity={isSelected ? 1 : 0.12} />
                  <text x={cx} y={cy + 13.5} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? colors.badgeText : colors.subText} fontSize="8.5" fontWeight="700">
                    {table.seats}p
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {hoveredTable && (
          <div className="pointer-events-none absolute bottom-5 left-5 hidden sm:flex items-center gap-3 rounded-2xl border border-border-light bg-surface/95 px-4 py-3 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-dark text-accent-soft font-bold text-sm">
              {hoveredTable.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-dark">{hoveredTable.zone} · {hoveredTable.seats} {lang === 'en' ? 'guests' : 'জন'}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  hoveredTable.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700'
                  : hoveredTable.status === 'HELD' ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
                }`}>{hoveredTable.status || 'AVAILABLE'}</span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">{lang === 'en' ? 'Click to view menu & reserve' : 'মেনু দেখতে ক্লিক করুন'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
