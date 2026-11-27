'use client';

import React, { useEffect, useRef, useState } from 'react';
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

// Collision-free layout. Chairs sit above/below tables only, so every table has >= 30px clearance.
const LAYOUT: Record<string, { x: number; y: number; width?: number; height?: number }> = {
  T01: { x: 44, y: 66 }, T02: { x: 144, y: 66 }, T03: { x: 244, y: 66 },
  T07: { x: 360, y: 62 }, T14: { x: 480, y: 66 },
  T04: { x: 44, y: 186 }, T05: { x: 174, y: 186 }, T06: { x: 304, y: 186 }, T13: { x: 434, y: 186 },
  T08: { x: 44, y: 308, width: 140, height: 64 }, T09: { x: 214, y: 308, width: 140, height: 64 }, T15: { x: 384, y: 308, width: 140, height: 64 },
  T10: { x: 56, y: 412 }, T11: { x: 140, y: 412 }, T12: { x: 240, y: 406 },
};

const chairColors = (status: string, selected: boolean) => {
  if (selected) return { fill: '#5c3d2e', stroke: '#c68b59' };
  if (status === 'BOOKED' || status === 'OCCUPIED') return { fill: '#fde2e4', stroke: '#f4a3ad' };
  if (status === 'HELD') return { fill: '#fef0d0', stroke: '#f2c36b' };
  if (status === 'UNAVAILABLE') return { fill: '#e8edf2', stroke: '#c5ced8' };
  return { fill: '#f3e8d8', stroke: '#d9c3a3' };
};

export default function FloorPlan({
  tables,
  selectedTable,
  onSelectTable,
  selectedSeats,
  selectedZone,
  lang,
}: FloorPlanProps) {
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const BASE_W = 620;
  const BASE_H = 540;
  const [view, setView] = useState({ z: 1, cx: BASE_W / 2, cy: BASE_H / 2 });
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, x: 0, y: 0 });

  const clampView = (z: number, cx: number, cy: number) => {
    const vw = BASE_W / z;
    const vh = BASE_H / z;
    return {
      z,
      cx: Math.min(BASE_W - vw / 2, Math.max(vw / 2, cx)),
      cy: Math.min(BASE_H - vh / 2, Math.max(vh / 2, cy)),
    };
  };
  const zoomBy = (delta: number) =>
    setView((v) => clampView(Math.min(3, Math.max(1, +(v.z + delta).toFixed(2))), v.cx, v.cy));
  const resetView = () => setView({ z: 1, cx: BASE_W / 2, cy: BASE_H / 2 });

  // Ctrl/Cmd + wheel zooms the map without hijacking normal page scroll
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 0.25 : -0.25);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (view.z === 1) return;
    drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || !frameRef.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const scale = BASE_W / view.z / frameRef.current.clientWidth;
    d.x = e.clientX;
    d.y = e.clientY;
    setView((v) => clampView(v.z, v.cx - dx * scale, v.cy - dy * scale));
  };
  const endDrag = () => {
    drag.current.active = false;
    setDragging(false);
    setTimeout(() => (drag.current.moved = false), 0);
  };

  const vw = BASE_W / view.z;
  const vh = BASE_H / view.z;
  const viewBox = `${view.cx - vw / 2} ${view.cy - vh / 2} ${vw} ${vh}`;

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

  const en = lang === 'en';
  const ctl = 'flex h-9 w-9 items-center justify-center rounded-xl text-primary-dark transition hover:bg-[#f3e9dd] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-[#e8dccb] bg-white shadow-[0_10px_40px_-20px_rgba(60,42,30,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl font-semibold text-primary-dark">{en ? 'Shop floor plan' : 'শপ ফ্লোর প্ল্যান'}</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{en ? 'Tap a green table to see its menu and reserve it' : 'সবুজ টেবিলে ট্যাপ করে মেনু দেখুন ও বুক করুন'}</p>
        </div>
      </div>

      {/* Map frame: fixed size, content zooms and pans inside it */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onClickCapture={(e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); } }}
          style={{ touchAction: view.z > 1 ? 'none' : 'pan-y' }}
          className={`relative aspect-[620/540] w-full overflow-hidden rounded-2xl border border-[#efe5d6] bg-[radial-gradient(ellipse_at_center,#fbf8f3,#f1e8db)] ${view.z > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        >
          {/* Floating zoom controls */}
          <div className="absolute right-3 top-3 z-20 flex flex-col items-center gap-0.5 rounded-2xl border border-[#e8dccb] bg-white/90 p-1 shadow-lg backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => zoomBy(0.5)} disabled={view.z >= 3} className={ctl} title="Zoom in"><ZoomInIcon className="h-4 w-4" /></button>
            <span className="text-[10px] font-bold text-muted">{Math.round(view.z * 100)}%</span>
            <button onClick={() => zoomBy(-0.5)} disabled={view.z <= 1} className={ctl} title="Zoom out"><ZoomOutIcon className="h-4 w-4" /></button>
            <button onClick={resetView} disabled={view.z === 1} className={`${ctl} text-[10px] font-bold`} title="Fit to screen">FIT</button>
          </div>

          {/* Hint chip */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-[#2c1b12]/85 px-3 py-1.5 text-[10px] font-semibold text-[#e9c49a] backdrop-blur">
            {view.z > 1 ? (en ? 'Drag to move the map' : 'ম্যাপ সরাতে ড্র্যাগ করুন') : (en ? 'Use + to zoom in' : 'জুম করতে + চাপুন')}
          </div>

                    <div className="absolute left-4 bottom-4 z-10 flex flex-wrap gap-2 rounded-xl bg-white/90 backdrop-blur px-3 py-2 border border-[#e8dccb] shadow-sm text-[11px] font-semibold text-primary-dark pointer-events-none">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Available</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Held</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>Booked</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>Unavailable</span>
          </div>
<svg
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full select-none"
            onMouseLeave={() => setHoveredTable(null)}
          >
            <defs>
              {/* Subtle architectural floor grid */}
              <pattern id="floorGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#efe6da" strokeWidth="0.8" />
              </pattern>

              {/* Outdoor wooden deck planks */}
              <pattern id="patioWood" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#f1e7da" />
                <path d="M 0 0 L 16 0 M 0 8 L 16 8" stroke="#e4d4c0" strokeWidth="1" />
              </pattern>

              {/* Sunlight window wash */}
              <linearGradient id="sunWash" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#fefdfb" stopOpacity="0" />
              </linearGradient>

              {/* Table soft elevation shadow */}
              <filter id="tableShadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2c1b12" floodOpacity="0.08" />
              </filter>

              {/* Selected table glow */}
              <filter id="selectedGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#c68b59" floodOpacity="0.55" />
              </filter>
            </defs>

            {/* === 1. FLOORING & ZONES === */}
            {/* Main Indoor Floor */}
            <rect x="24" y="24" width="572" height="366" rx="10" fill="#fcfaf7" />
            <rect x="24" y="24" width="572" height="366" rx="10" fill="url(#floorGrid)" />

            {/* Sunlight wash near top windows */}
            <rect x="28" y="26" width="520" height="80" fill="url(#sunWash)" />

            {/* Outdoor Terrace Deck */}
            <rect x="24" y="390" width="346" height="126" rx="8" fill="url(#patioWood)" />

            {/* Barista & Service Area Floor */}
            <rect x="370" y="390" width="226" height="126" rx="8" fill="#f5ede2" />

            {/* === 2. ARCHITECTURAL WALLS & DOORS === */}
            {/* Outer Structural Wall */}
            <rect x="24" y="24" width="572" height="492" rx="10" fill="none" stroke="#3c2a1e" strokeWidth="4" />

            {/* Top Glass Windows */}
            <g>
              <line x1="50" y1="24" x2="540" y2="24" stroke="#bae6fd" strokeWidth="5" />
              <line x1="50" y1="24" x2="540" y2="24" stroke="#0284c7" strokeWidth="1" strokeDasharray="36, 4" />
              <text x="295" y="15" textAnchor="middle" fill="#78685a" fontSize="8" fontWeight="700" letterSpacing="1.6">
                STREET-FACING GLASS WINDOWS
              </text>
            </g>

            {/* Patio Glass Partition & Sliding Door */}
            <line x1="24" y1="390" x2="370" y2="390" stroke="#78685a" strokeWidth="2.5" />
            <line x1="180" y1="390" x2="220" y2="390" stroke="#38bdf8" strokeWidth="4" />
            <rect x="180" y="384" width="40" height="12" rx="4" fill="#fcfaf7" stroke="#d5c4b1" strokeWidth="1" />
            <text x="200" y="393" textAnchor="middle" fill="#5c3d2e" fontSize="6.5" fontWeight="700" letterSpacing="0.6">
              DOOR
            </text>

            {/* Zone Divider Subtle Lines & Architectural Labels */}
            <text x="42" y="45" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">
              WINDOW LOUNGE
            </text>
            <text x="462" y="45" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">
              QUIET STUDY
            </text>
            <text x="42" y="166" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">
              MAIN ROASTERY HALL
            </text>
            <text x="42" y="294" fill="#b8a898" fontSize="8.5" fontWeight="700" letterSpacing="1.4">
              FAMILY &amp; GROUP BOOTHS
            </text>
            <text x="62" y="508" fill="#8c7864" fontSize="8.5" fontWeight="700" letterSpacing="1.4">
              GARDEN TERRACE (OUTDOOR)
            </text>

            {/* === 3. BARISTA & ESPRESSO COUNTER (Clean Vector) === */}
            <g transform="translate(385, 402)">
              {/* Counter Base */}
              <rect x="0" y="0" width="192" height="68" rx="8" fill="#3c2a1e" filter="url(#tableShadow)" />
              <rect x="4" y="4" width="184" height="60" rx="6" fill="#5c3d2e" />

              {/* Espresso Machine Vector */}
              <g transform="translate(14, 12)">
                <rect x="0" y="0" width="38" height="24" rx="4" fill="#1e1610" stroke="#c68b59" strokeWidth="1" />
                <circle cx="11" cy="9" r="3" fill="#c68b59" />
                <circle cx="27" cy="9" r="3" fill="#c68b59" />
                <rect x="7" y="16" width="24" height="4" rx="1" fill="#78685a" />
              </g>

              {/* Pastry Glass Display */}
              <g transform="translate(64, 12)">
                <rect x="0" y="0" width="54" height="24" rx="4" fill="#f6f2ec" stroke="#c68b59" strokeWidth="1" />
                <circle cx="14" cy="12" r="4" fill="#c68b59" opacity="0.8" />
                <circle cx="27" cy="12" r="4" fill="#92400e" opacity="0.7" />
                <circle cx="40" cy="12" r="4" fill="#d97706" opacity="0.7" />
              </g>

              {/* POS / Pickup Station */}
              <g transform="translate(130, 12)">
                <rect x="0" y="0" width="44" height="24" rx="4" fill="#2c1b12" stroke="#78685a" strokeWidth="1" />
                <rect x="8" y="6" width="28" height="12" rx="2" fill="#c68b59" opacity="0.9" />
              </g>

              <text x="96" y="53" textAnchor="middle" fill="#f6f2ec" fontSize="8" fontWeight="700" letterSpacing="1.5">
                BARISTA &amp; PICKUP BAR
              </text>
            </g>

            {/* === 4. ENTRANCE DOOR (Architectural Swing) === */}
            <g transform="translate(496, 480)">
              <path d="M 0 36 A 36 36 0 0 1 36 0" fill="none" stroke="#c68b59" strokeWidth="1.5" strokeDasharray="3,3" />
              <line x1="0" y1="36" x2="36" y2="0" stroke="#2c1b12" strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="36" r="3" fill="#2c1b12" />
              <text x="58" y="25" textAnchor="middle" fill="#2c1b12" fontSize="8" fontWeight="800" letterSpacing="1">
                ENTRANCE
              </text>
            </g>

            {/* === 5. RESTROOM === */}
            <g transform="translate(556, 338)">
              <rect x="0" y="0" width="32" height="40" rx="5" fill="#efe7db" stroke="#d5c4b1" strokeWidth="1.2" />
              <circle cx="16" cy="14" r="4" fill="none" stroke="#5c3d2e" strokeWidth="1.4" />
              <path d="M 10 25 C 10 20, 22 20, 22 25" fill="none" stroke="#5c3d2e" strokeWidth="1.4" />
              <text x="16" y="35" textAnchor="middle" fill="#5c3d2e" fontSize="6.5" fontWeight="700">WC</text>
            </g>

            {/* === 6. VECTOR POTTED PLANTS === */}
            {[
              { x: 42, y: 408 },
              { x: 358, y: 408 },
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

            {/* === 7. INTERACTIVE TABLES === */}
            {tables.map((rawTable) => {
              const table = { ...rawTable, ...(LAYOUT[rawTable.code] || {}) };
              const isSelected = selectedTable?.id === table.id;
              const isHovered = hoveredTable?.id === table.id;
              const isFiltered = isTableFilteredOut(table);
              const status = table.status || 'AVAILABLE';
              const colors = getStatusColors(status, isSelected);
              const chair = chairColors(status, isSelected);

              const isCircle = table.shape === 'circle';
              const w = table.width || (isCircle ? 70 : 100);
              const h = table.height || (isCircle ? 70 : 80);
              const cx = table.x + w / 2;
              const cy = table.y + h / 2;
              const r = w / 2;

              return (
                <g
                  key={table.id}
                  className={`cursor-pointer transition-opacity duration-200 ${
                    isFiltered ? 'opacity-20' : 'opacity-100'
                  }`}
                  onClick={() => onSelectTable(table)}
                  onMouseEnter={() => setHoveredTable(table)}
                  onMouseLeave={() => setHoveredTable(null)}
                  filter={isSelected ? 'url(#selectedGlow)' : 'url(#tableShadow)'}
                  style={{ transform: isHovered && !isFiltered ? 'translateY(-2px)' : 'none', transition: 'transform 150ms ease, opacity 200ms ease' }}
                >
                  {/* Selection Pulse Halo */}
                  {isSelected && (
                    isCircle ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 8}
                        fill="none"
                        stroke="#c68b59"
                        strokeWidth="2"
                        strokeDasharray="6,4"
                      />
                    ) : (
                      <rect
                        x={table.x - 6}
                        y={table.y - 6}
                        width={w + 12}
                        height={h + 12}
                        rx="16"
                        fill="none"
                        stroke="#c68b59"
                        strokeWidth="2"
                        strokeDasharray="6,4"
                      />
                    )
                  )}

                  {/* Chairs */}
                  {table.seats === 2 && (
                    <>
                      <rect x={cx - 10} y={table.y - 13} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={cx - 10} y={table.y + h + 4} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                    </>
                  )}

                  {table.seats === 4 && (
                    <>
                      <rect x={cx - 26} y={table.y - 13} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={cx + 6} y={table.y - 13} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={cx - 26} y={table.y + h + 4} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={cx + 6} y={table.y + h + 4} width="20" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                    </>
                  )}

                  {table.seats >= 6 && (
                    <>
                      <rect x={table.x + 12} y={table.y - 13} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={table.x + 58} y={table.y - 13} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={table.x + 104} y={table.y - 13} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={table.x + 12} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={table.x + 58} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                      <rect x={table.x + 104} y={table.y + h + 4} width="24" height="9" rx="3.5" fill={chair.fill} stroke={chair.stroke} strokeWidth="1.5" />
                    </>
                  )}

                  {/* Table Surface */}
                  {isCircle ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected || isHovered ? 3 : 2}
                    />
                  ) : (
                    <rect
                      x={table.x}
                      y={table.y}
                      width={w}
                      height={h}
                      rx="12"
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected || isHovered ? 3 : 2}
                    />
                  )}

                  {/* Status dot */}
                  <circle cx={isCircle ? cx + r * 0.62 : table.x + w - 14} cy={isCircle ? cy - r * 0.62 : table.y + 14} r="4.5" fill={colors.stroke} stroke="#ffffff" strokeWidth="1.5" />

                  {/* Table Code */}
                  <text
                    x={cx}
                    y={cy - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={colors.text}
                    fontSize={table.seats >= 6 ? '15' : '13'}
                    fontWeight="800"
                    letterSpacing="0.3"
                  >
                    {table.code}
                  </text>

                  {/* Seat Capacity Pill */}
                  <rect
                    x={cx - 18}
                    y={cy + 6}
                    width="36"
                    height="15"
                    rx="7.5"
                    fill={colors.badgeBg}
                    opacity={isSelected ? 1 : 0.14}
                  />
                  <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? colors.badgeText : colors.subText}
                    fontSize="9"
                    fontWeight="700"
                  >
                    {table.seats} {lang === 'en' ? 'Seats' : 'সিট'}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover card, anchored inside the map frame */}
          {hoveredTable && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden items-center gap-3 rounded-2xl border border-[#e8dccb] bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-dark text-sm font-extrabold text-accent">{hoveredTable.code}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-dark">{hoveredTable.zone} • {hoveredTable.seats} {en ? 'guests' : 'জন'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${hoveredTable.status === 'HELD' ? 'bg-amber-100 text-amber-800' : hoveredTable.status === 'BOOKED' || hoveredTable.status === 'OCCUPIED' ? 'bg-rose-100 text-rose-800' : hoveredTable.status === 'UNAVAILABLE' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    {hoveredTable.status || 'AVAILABLE'}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{en ? 'Click to browse the menu & reserve' : 'মেনু ও বুকিংয়ের জন্য ক্লিক করুন'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
