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
      return {
        fill: '#2c1b12',
        stroke: '#c68b59',
        text: '#ffffff',
        subText: '#e5dacb',
        chairFill: '#5c3d2e',
        chairStroke: '#c68b59',
        badgeBg: '#c68b59',
        badgeText: '#1e1610',
      };
    }
    switch (status) {
      case 'AVAILABLE':
        return {
          fill: '#ffffff',
          stroke: '#059669',
          text: '#064e3b',
          subText: '#059669',
          chairFill: '#d1fae5',
          chairStroke: '#10b981',
          badgeBg: '#059669',
          badgeText: '#ffffff',
        };
      case 'HELD':
        return {
          fill: '#fffbeb',
          stroke: '#d97706',
          text: '#78350f',
          subText: '#b45309',
          chairFill: '#fef3c7',
          chairStroke: '#f59e0b',
          badgeBg: '#d97706',
          badgeText: '#ffffff',
        };
      case 'BOOKED':
      case 'OCCUPIED':
        return {
          fill: '#fff1f2',
          stroke: '#e11d48',
          text: '#881337',
          subText: '#be123c',
          chairFill: '#ffe4e6',
          chairStroke: '#f43f5e',
          badgeBg: '#e11d48',
          badgeText: '#ffffff',
        };
      case 'UNAVAILABLE':
      default:
        return {
          fill: '#f1f5f9',
          stroke: '#94a3b8',
          text: '#475569',
          subText: '#64748b',
          chairFill: '#e2e8f0',
          chairStroke: '#cbd5e1',
          badgeBg: '#94a3b8',
          badgeText: '#ffffff',
        };
    }
  };

  const isTableFilteredOut = (t: Table) => {
    if (selectedSeats !== 'all' && t.seats !== selectedSeats) return true;
    if (selectedZone !== 'all' && t.zone.toLowerCase() !== selectedZone.toLowerCase()) return true;
    return false;
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-surface px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-primary-dark sm:text-base">
            {lang === 'en' ? 'Interactive Shop Floor Plan' : 'ইন্টারেক্টিভ শপ ফ্লোর প্ল্যান'}
          </h2>
          <p className="text-[11px] text-muted">
            {lang === 'en'
              ? 'Select any green table to inspect details & pre-order'
              : 'বিস্তারিত দেখতে ও প্রি-অর্ডার করতে যেকোনো সবুজ টেবিল নির্বাচন করুন'}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-background/80 p-1">
          <button
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary-dark transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOutIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 text-[11px] font-bold text-muted hover:text-primary-dark cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.25).toFixed(2)))}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary-dark transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomInIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-auto bg-[#f7f3ed] p-3 sm:p-5 scrollbar-thin">
        <div
          className="mx-auto transition-transform duration-200 origin-top"
          style={{ width: `${zoom * 100}%`, maxWidth: `${zoom * 820}px` }}
        >
          <svg viewBox="0 0 620 540" className="w-full h-auto select-none drop-shadow-xs" onMouseLeave={() => setHoveredTable(null)}>
            <defs>
              <pattern id="floorGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#efe6da" strokeWidth="0.8" />
              </pattern>
              <pattern id="patioWood" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#f1e7da" />
                <path d="M 0 0 L 16 0 M 0 8 L 16 8" stroke="#e4d4c0" strokeWidth="1" />
              </pattern>
              <linearGradient id="sunWash" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#fefdfb" stopOpacity="0" />
              </linearGradient>
              <filter id="tableShadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2c1b12" floodOpacity="0.08" />
              </filter>
              <filter id="selectedGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#c68b59" floodOpacity="0.55" />
              </filter>
            </defs>

            <rect x="24" y="24" width="572" height="366" rx="10" fill="#fcfaf7" />
            <rect x="24" y="24" width="572" height="366" rx="10" fill="url(#floorGrid)" />
            <rect x="28" y="26" width="520" height="80" fill="url(#sunWash)" />
            <rect x="24" y="390" width="346" height="126" rx="8" fill="url(#patioWood)" />
            <rect x="370" y="390" width="226" height="126" rx="8" fill="#f5ede2" />
            <rect x="24" y="24" width="572" height="492" rx="10" fill="none" stroke="#3c2a1e" strokeWidth="4" />

            <g>
              <line x1="50" y1="24" x2="540" y2="24" stroke="#bae6fd" strokeWidth="5" />
              <line x1="50" y1="24" x2="540" y2="24" stroke="#0284c7" strokeWidth="1" strokeDasharray="36, 4" />
              <text x="295" y="15" textAnchor="middle" fill="#78685a" fontSize="8" fontWeight="700" letterSpacing="1.6">
                STREET-FACING GLASS WINDOWS
              </text>
            </g>

            <line x1="24" y1="390" x2="370" y2="390" stroke="#78685a" strokeWidth="2.5" />
            <line x1="196" y1="390" x2="236" y2="390" stroke="#38bdf8" strokeWidth="4" />
            <rect x="196" y="384" width="40" height="12" rx="4" fill="#fcfaf7" stroke="#d5c4b1" strokeWidth="1" />
            <text x="216" y="393" textAnchor="middle" fill="#5c3d2e" fontSize="6.5" fontWeight="700" letterSpacing="0.6">DOOR</text>

            <text x="42" y="45" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">WINDOW LOUNGE</text>
            <text x="462" y="45" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">QUIET STUDY</text>
            <text x="42" y="149" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">MAIN ROASTERY HALL</text>
            <text x="42" y="270" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">FAMILY &amp; GROUP BOOTHS</text>
            <text x="62" y="508" fill="#8c7864" fontSize="8.5" fontWeight="700" letterSpacing="1.4">GARDEN TERRACE (OUTDOOR)</text>

            <g transform="translate(385, 402)">
              <rect x="0" y="0" width="192" height="68" rx="8" fill="#3c2a1e" filter="url(#tableShadow)" />
              <rect x="4" y="4" width="184" height="60" rx="6" fill="#5c3d2e" />
              <g transform="translate(14, 12)">
                <rect x="0" y="0" width="38" height="24" rx="4" fill="#1e1610" stroke="#c68b59" strokeWidth="1" />
                <circle cx="11" cy="9" r="3" fill="#c68b59" />
                <circle cx="27" cy="9" r="3" fill="#c68b59" />
                <rect x="7" y="16" width="24" height="4" rx="1" fill="#78685a" />
              </g>
              <g transform="translate(64, 12)">
                <rect x="0" y="0" width="54" height="24" rx="4" fill="#f6f2ec" stroke="#c68b59" strokeWidth="1" />
                <circle cx="14" cy="12" r="4" fill="#c68b59" opacity="0.8" />
                <circle cx="27" cy="12" r="4" fill="#92400e" opacity="0.7" />
                <circle cx="40" cy="12" r="4" fill="#d97706" opacity="0.7" />
              </g>
              <g transform="translate(130, 12)">
                <rect x="0" y="0" width="44" height="24" rx="4" fill="#2c1b12" stroke="#78685a" strokeWidth="1" />
                <rect x="8" y="6" width="28" height="12" rx="2" fill="#c68b59" opacity="0.9" />
              </g>
              <text x="96" y="53" textAnchor="middle" fill="#f6f2ec" fontSize="8" fontWeight="700" letterSpacing="1.5">
                BARISTA &amp; PICKUP BAR
              </text>
            </g>

            <g transform="translate(496, 480)">
              <path d="M 0 36 A 36 36 0 0 1 36 0" fill="none" stroke="#c68b59" strokeWidth="1.5" strokeDasharray="3,3" />
              <line x1="0" y1="36" x2="36" y2="0" stroke="#2c1b12" strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="36" r="3" fill="#2c1b12" />
              <text x="58" y="25" textAnchor="middle" fill="#2c1b12" fontSize="8" fontWeight="800" letterSpacing="1">ENTRANCE</text>
            </g>

            <g transform="translate(556, 338)">
              <rect x="0" y="0" width="32" height="40" rx="5" fill="#efe7db" stroke="#d5c4b1" strokeWidth="1.2" />
              <circle cx="16" cy="14" r="4" fill="none" stroke="#5c3d2e" strokeWidth="1.4" />
              <path d="M 10 25 C 10 20, 22 20, 22 25" fill="none" stroke="#5c3d2e" strokeWidth="1.4" />
              <text x="16" y="35" textAnchor="middle" fill="#5c3d2e" fontSize="6.5" fontWeight="700">WC</text>
            </g>

            {[
              { x: 42, y: 408 },
              { x: 350, y: 408 },
              { x: 42, y: 504 },
              { x: 572, y: 44 },
            ].map((plant, idx) => (
              <g key={idx} transform={`translate(${plant.x}, ${plant.y})`}>
                <circle cx="0" cy="0" r="10" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.2" />
                <path d="M 0 -6 Q 4 -2 0 2 Q -4 -2 0 -6" fill="#15803d" />
                <path d="M -6 0 Q -2 4 2 0 Q -2 -4 -6 0" fill="#16a34a" />
                <path d="M 6 0 Q 2 4 -2 0 Q 2 -4 6 0" fill="#22c55e" />
                <circle cx="0" cy="0" r="2.2" fill="#5c3d2e" />
              </g>
            ))}

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
                  className={`cursor-pointer transition-opacity duration-200 ${isFiltered ? 'opacity-20' : 'opacity-100'}`}
                  onClick={() => onSelectTable(table)}
                  onMouseEnter={() => setHoveredTable(table)}
                  onMouseLeave={() => setHoveredTable(null)}
                  filter={isSelected ? 'url(#selectedGlow)' : 'url(#tableShadow)'}
                >
                  {isSelected &&
                    (isCircle ? (
                      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#c68b59" strokeWidth="2" strokeDasharray="6,4" />
                    ) : (
                      <rect x={table.x - 6} y={table.y - 6} width={w + 12} height={h + 12} rx="16" fill="none" stroke="#c68b59" strokeWidth="2" strokeDasharray="6,4" />
                    ))}

                  {table.seats === 2 && (
                    <>
                      <rect x={cx - (isCircle ? r + 15 : w / 2 + 15)} y={cy - 10} width="10" height="20" rx="4" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={cx + (isCircle ? r + 5 : w / 2 + 5)} y={cy - 10} width="10" height="20" rx="4" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                    </>
                  )}

                  {table.seats === 4 && (
                    <>
                      <rect x={cx - 26} y={table.y - 13} width="20" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={cx + 6} y={table.y - 13} width="20" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={cx - 26} y={table.y + h + 4} width="20" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={cx + 6} y={table.y + h + 4} width="20" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                    </>
                  )}

                  {table.seats >= 6 && (
                    <>
                      <rect x={table.x + 12} y={table.y - 13} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={table.x + 58} y={table.y - 13} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={table.x + 104} y={table.y - 13} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={table.x + 12} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={table.x + 58} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                      <rect x={table.x + 104} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={colors.chairFill} stroke={colors.chairStroke} strokeWidth="1.5" />
                    </>
                  )}

                  {isCircle ? (
                    <circle cx={cx} cy={cy} r={r} fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected || isHovered ? 3 : 2} />
                  ) : (
                    <rect x={table.x} y={table.y} width={w} height={h} rx="12" fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected || isHovered ? 3 : 2} />
                  )}

                  <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fill={colors.text} fontSize={table.seats >= 6 ? '15' : '13'} fontWeight="800" letterSpacing="0.3">
                    {table.code}
                  </text>

                  <rect x={cx - 18} y={cy + 6} width="36" height="15" rx="7.5" fill={colors.badgeBg} opacity={isSelected ? 1 : 0.14} />
                  <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? colors.badgeText : colors.subText} fontSize="9" fontWeight="700">
                    {table.seats} {lang === 'en' ? 'Seats' : 'সিট'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {hoveredTable && (
          <div className="pointer-events-none fixed bottom-20 left-6 z-30 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-dark text-accent font-extrabold text-sm">{hoveredTable.code}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary-dark">
                  {hoveredTable.zone} {lang === 'en' ? 'Zone' : 'জোন'} • {hoveredTable.seats} {lang === 'en' ? 'Guests' : 'অতিথি'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    hoveredTable.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : hoveredTable.status === 'HELD'
                      ? 'bg-amber-100 text-amber-800'
                      : hoveredTable.status === 'BOOKED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {hoveredTable.status || 'AVAILABLE'}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {lang === 'en' ? 'Click to browse menu & reserve' : 'মেনু দেখতে ও রিজার্ভ করতে ক্লিক করুন'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
