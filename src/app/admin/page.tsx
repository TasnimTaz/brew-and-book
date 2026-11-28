'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, MenuCategory, MenuItem } from '@/types';
import {
  CheckIcon,
  CoffeeIcon,
  LayoutGridIcon,
  LogOutIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '@/components/Icons';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTable, setNewTable] = useState({ code:'', seats:2, zone:'Indoor', x:100, y:100, shape:'circle' as 'circle'|'rect', width:70, height:70, photoUrl:'' });

  // Dragging state for Floor Plan Editor
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemNameBn, setNewItemNameBn] = useState('');
  const [newItemCatId, setNewItemCatId] = useState<number>(1);
  const [newItemPrice, setNewItemPrice] = useState<number>(200);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemTags, setNewItemTags] = useState('hot, veg');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage((prev) => (prev === msg ? null : prev)), 2500);
  };

    const adminFetch = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 401) { router.push('/admin/login'); throw new Error('Session expired'); }
    return res;
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const authRes = await fetch('/api/admin/me');
      if (!authRes.ok) {
        router.push('/admin/login');
        return;
      }

      const [menuRes, tablesRes] = await Promise.all([
        adminFetch('/api/menu?all=true').then((r) => r.json()),
        adminFetch('/api/tables?all=true').then((r) => r.json()),
      ]);

      if (menuRes.categories && menuRes.items) {
        setCategories(menuRes.categories);
        setItems(menuRes.items);
        setNewItemCatId((prev) => (prev ? prev : (menuRes.categories[0]?.id ?? prev)));
      }
      if (tablesRes.tables) {
        setTables(tablesRes.tables);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    const updatedStatus = !item.available;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, available: updatedStatus } : i))
    );
    try {
      const res = await adminFetch(`/api/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: updatedStatus }),
      });
      if (!res.ok) throw new Error();
      notify(`${item.name} marked ${updatedStatus ? 'Available' : 'Sold Out'}`);
    } catch {
      loadData();
    }
  };

  const handleQuickEditPrice = async (item: MenuItem) => {
    const newPriceStr = prompt(`Enter new price for "${item.name}" (BDT):`, String(item.priceBdt));
    if (!newPriceStr) return;
    const newPrice = parseInt(newPriceStr, 10);
    if (isNaN(newPrice) || newPrice < 0) return;

    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, priceBdt: newPrice } : i)));
    try {
      await adminFetch(`/api/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceBdt: newPrice }),
      });
      notify(`Updated ${item.name} price to BDT ${newPrice}`);
    } catch {
      loadData();
    }
  };

  const handleDeleteItem = async (itemId: number, name: string) => {
    if (!confirm(`Delete "${name}" from menu?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await adminFetch(`/api/menu/items/${itemId}`, { method: 'DELETE' });
      notify(`Deleted ${name}`);
    } catch {
      loadData();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await adminFetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), nameBn: newCatNameBn.trim() || null, sortOrder: categories.length }),
      });
      if (!res.ok) throw new Error();
      setNewCatName('');
      setNewCatNameBn('');
      notify('Category added');
      loadData();
    } catch {
      alert('Failed to create category');
    }
  };

  const handleRenameCategory = async (cat: MenuCategory) => {
    const name = prompt('Category name (EN):', cat.name);
    if (!name) return;
    const nameBn = prompt('Category name (BN, optional):', cat.nameBn || '') ?? '';
    try {
      await adminFetch(`/api/menu/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), nameBn: nameBn.trim() || null }),
      });
      notify('Category updated');
      loadData();
    } catch {
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      const res = await adminFetch(`/api/menu/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      notify('Category deleted');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await adminFetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url as string;
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...newTable, code: newTable.code.trim().toUpperCase(), zone: newTable.zone.trim(), photoUrl: newTable.photoUrl || null,
      })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setIsAddTableOpen(false);
      setNewTable({ code:'', seats:2, zone:'Indoor', x:100, y:100, shape:'circle', width:70, height:70, photoUrl:'' });
      notify('Table added');
      loadData();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to add table'); }
  };

  const handleTablePatch = async (id: number, payload: Record<string, unknown>, msg: string) => {
    try {
      const res = await adminFetch(`/api/tables/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      notify(msg);
      loadData();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to update table'); }
  };

  const handleDeleteTable = async (table: Table) => {
    if (!confirm(`Deactivate table ${table.code}?`)) return;
    await handleTablePatch(table.id, { active: false }, `Table ${table.code} deactivated`);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = newItemTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await adminFetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: newItemCatId,
          name: newItemName,
          nameBn: newItemNameBn || null,
          description: newItemDesc || null,
          priceBdt: newItemPrice,
          imageUrl: newItemImageUrl || null,
          tags: tagsArray,
          available: true,
        }),
      });
      if (!res.ok) throw new Error();
      setIsAddItemOpen(false);
      setNewItemName('');
      setNewItemNameBn('');
      setNewItemDesc('');
      setNewItemImageUrl('');
      notify('New menu item added');
      loadData();
    } catch {
      alert('Error creating item');
    }
  };


  const handleSaveTableCoords = async (tableId: number, x: number, y: number, seats: number) => {
    try {
      const res = await adminFetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: Math.round(x), y: Math.round(y), seats }),
      });
      if (res.ok) {
        setEditingTable(null);
        notify('Table layout updated');
        loadData();
      }
    } catch {
      alert('Failed to save table');
    }
  };

  // Drag-and-drop SVG coordinate helpers
  const getSvgCoords = (e: React.PointerEvent<SVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = 620 / rect.width;
    const scaleY = 540 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDownTable = (e: React.PointerEvent<SVGGElement>, table: Table) => {
    e.stopPropagation();
    const pt = getSvgCoords(e);
    setDraggingId(table.id);
    setDragOffset({ dx: pt.x - table.x, dy: pt.y - table.y });
    setEditingTable(table);
  };

  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingId === null) return;
    const pt = getSvgCoords(e);
    const newX = Math.max(30, Math.min(540, Math.round((pt.x - dragOffset.dx) / 5) * 5));
    const newY = Math.max(30, Math.min(460, Math.round((pt.y - dragOffset.dy) / 5) * 5));

    setTables((prev) =>
      prev.map((t) => (t.id === draggingId ? { ...t, x: newX, y: newY } : t))
    );
    setEditingTable((prev) =>
      prev && prev.id === draggingId ? { ...prev, x: newX, y: newY } : prev
    );
  };

  const handlePointerUpSvg = async () => {
    if (draggingId === null) return;
    const moved = tables.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (moved) {
      await adminFetch(`/api/tables/${moved.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: moved.x, y: moved.y }),
      });
      notify(`Saved ${moved.code} position (${moved.x}, ${moved.y})`);
    }
  };

  const filteredMenuItems = items.filter((item) => {
    if (selectedCategoryFilter === 'all') return true;
    return item.categoryId === selectedCategoryFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted">Loading staff console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-dark text-accent shadow-xs">
              <CoffeeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-primary-dark">Brew &amp; Book Staff</span>
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-primary">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-muted">Menu Inventory &amp; Floor Plan Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-primary-dark hover:bg-surface-alt/60 transition-colors"
            >
              Live Floor Plan
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-border p-2 text-xs font-semibold text-muted hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {statusMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-dark px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
          <CheckIcon className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
            <div className="text-2xl font-extrabold text-primary-dark">{items.length}</div>
            <div className="text-xs font-medium text-muted mt-0.5">Total Menu Items</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
            <div className="text-2xl font-extrabold text-emerald-600">
              {items.filter((i) => i.available).length}
            </div>
            <div className="text-xs font-medium text-muted mt-0.5">In Stock</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
            <div className="text-2xl font-extrabold text-rose-600">
              {items.filter((i) => !i.available).length}
            </div>
            <div className="text-xs font-medium text-muted mt-0.5">Sold Out</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
            <div className="text-2xl font-extrabold text-primary">
              {tables.filter((t) => t.active).length} / {tables.length}
            </div>
            <div className="text-xs font-medium text-muted mt-0.5">Active Tables</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'border-primary-dark text-primary-dark'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <CoffeeIcon className="h-4 w-4" />
            <span>Menu &amp; Pricing</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tables'
                ? 'border-primary-dark text-primary-dark'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <LayoutGridIcon className="h-4 w-4" />
            <span>Interactive Floor Plan Editor</span>
          </button>
        </div>

        {/* TAB 1: MENU */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-primary-dark text-white'
                      : 'border border-border bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  All ({items.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                      selectedCategoryFilter === c.id
                        ? 'bg-primary-dark text-white'
                        : 'border border-border bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    {c.name} ({items.filter((i) => i.categoryId === c.id).length})
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddItemOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary-dark px-4 py-2 text-xs font-bold text-white hover:bg-primary transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4 text-accent" />
                <span>Add Menu Item</span>
              </button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-primary-dark">Categories</h3>
                  <p className="text-[11px] text-muted">Create, rename, or delete menu categories.</p>
                </div>
              </div>
              <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-2">
                <input value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder="Category name (EN)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <input value={newCatNameBn} onChange={(e)=>setNewCatNameBn(e.target.value)} placeholder="Name (BN, optional)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <button type="submit" className="rounded-xl bg-primary-dark px-4 py-2 text-xs font-bold text-white hover:bg-primary cursor-pointer">Add Category</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {categories.map((c)=>(
                  <div key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
                    <span className="font-semibold text-primary-dark">{c.name}</span>
                    {c.nameBn && <span className="text-muted">({c.nameBn})</span>}
                    <button onClick={()=>handleRenameCategory(c)} className="ml-1 text-muted hover:text-primary-dark cursor-pointer">Edit</button>
                    <button onClick={()=>handleDeleteCategory(c)} className="text-muted hover:text-rose-600 cursor-pointer">Delete</button>
                  </div>
                ))}
              </div>
            </div>



            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-background/60 font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5">Item</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Availability</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMenuItems.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    return (
                      <tr key={item.id} className="hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-surface-alt border border-border" />
                            )}
                            <div>
                              <div className="font-bold text-primary-dark text-sm">{item.name}</div>
                              {item.nameBn && <div className="text-xs text-muted">{item.nameBn}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-muted">{cat?.name || '—'}</td>
                        <td className="px-4 py-3.5 font-extrabold text-primary-dark text-sm">
                          BDT {item.priceBdt}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              item.available
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 hover:bg-rose-100'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.available ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                            {item.available ? 'Available' : 'Sold Out'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleQuickEditPrice(item)}
                            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-primary-dark hover:bg-surface-alt/50 transition-colors cursor-pointer"
                          >
                            Edit Price
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="rounded-lg p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TABLES */}
        {activeTab === 'tables' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center gap-3">
              <div><h3 className="font-bold text-base text-primary-dark">Table Management</h3><p className="text-xs text-muted">Add, edit, activate/deactivate tables and reposition on floor plan.</p></div>
              <button onClick={()=>setIsAddTableOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-primary-dark px-4 py-2 text-xs font-bold text-white hover:bg-primary cursor-pointer"><PlusIcon className="h-4 w-4 text-accent"/>Add Table</button>
            </div>
            <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div><h3 className="font-bold text-base text-primary-dark">Drag-and-Drop Floor Plan Editor</h3><p className="text-xs text-muted">Drag any table on the canvas to reposition it ? changes auto-save to the database.</p></div>
                {editingTable && <span className="rounded-xl bg-primary-dark px-3 py-1.5 text-xs font-bold text-white">Selected: {editingTable.code} (x:{editingTable.x}, y:{editingTable.y})</span>}
              </div>
              <div className="relative mx-auto w-full max-w-3xl overflow-x-auto rounded-xl border border-border bg-[#f7f3ed] p-2">
                <svg
                  ref={svgRef}
                  viewBox="0 0 620 540"
                  className="w-full h-auto min-w-[500px] select-none touch-none"
                  onPointerMove={handlePointerMoveSvg}
                  onPointerUp={handlePointerUpSvg}
                  onPointerLeave={handlePointerUpSvg}
                >
                  <rect x="24" y="24" width="572" height="366" rx="10" fill="#fcfaf7" stroke="#3c2a1e" strokeWidth="3" />
                  <rect x="24" y="390" width="346" height="126" rx="8" fill="#f1e7da" stroke="#3c2a1e" strokeWidth="3" />
                  <rect x="370" y="390" width="226" height="126" rx="8" fill="#f5ede2" stroke="#3c2a1e" strokeWidth="3" />
                  <rect x="385" y="402" width="192" height="68" rx="8" fill="#5c3d2e" />
                  <text x="481" y="440" textAnchor="middle" fill="#f6f2ec" fontSize="9" fontWeight="700" letterSpacing="1">
                    BARISTA COUNTER
                  </text>

                  {tables.map((t) => {
                    const isCircle = t.shape === 'circle';
                    const w = t.width || 80;
                    const h = t.height || 80;
                    const cx = t.x + w / 2;
                    const cy = t.y + h / 2;
                    const isSelected = editingTable?.id === t.id;

                    return (
                      <g
                        key={t.id}
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(e) => handlePointerDownTable(e, t)}
                      >
                        {isCircle ? (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={w / 2}
                            fill={isSelected ? '#2c1b12' : t.active ? '#ffffff' : '#f1f5f9'}
                            stroke={isSelected ? '#c68b59' : t.active ? '#059669' : '#94a3b8'}
                            strokeWidth={isSelected ? '3' : '2'}
                          />
                        ) : (
                          <rect
                            x={t.x}
                            y={t.y}
                            width={w}
                            height={h}
                            rx="10"
                            fill={isSelected ? '#2c1b12' : t.active ? '#ffffff' : '#f1f5f9'}
                            stroke={isSelected ? '#c68b59' : t.active ? '#059669' : '#94a3b8'}
                            strokeWidth={isSelected ? '3' : '2'}
                          />
                        )}
                        <text
                          x={cx}
                          y={cy - 3}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={isSelected ? '#ffffff' : t.active ? '#064e3b' : '#64748b'}
                          fontSize="12"
                          fontWeight="800"
                        >
                          {t.code}
                        </text>
                        <text
                          x={cx}
                          y={cy + 11}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={isSelected ? '#e5dacb' : '#059669'}
                          fontSize="9"
                          fontWeight="600"
                        >
                          {t.seats}p • {t.zone}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {editingTable && (
              <div className="rounded-2xl border border-primary/25 bg-surface p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-primary-dark">
                      Fine-tune Table {editingTable.code}
                    </h4>
                    <p className="text-xs text-muted">
                      Zone: {editingTable.zone} • Shape: {editingTable.shape}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingTable(null)}
                    className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-muted">X (px)</label>
                    <input
                      type="number"
                      value={editingTable.x}
                      onChange={(e) =>
                        setEditingTable({ ...editingTable, x: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-muted">Y (px)</label>
                    <input
                      type="number"
                      value={editingTable.y}
                      onChange={(e) =>
                        setEditingTable({ ...editingTable, y: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-muted">Seats</label>
                    <input
                      type="number"
                      value={editingTable.seats}
                      onChange={(e) =>
                        setEditingTable({
                          ...editingTable,
                          seats: parseInt(e.target.value, 10) || 2,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() =>
                        handleSaveTableCoords(
                          editingTable.id,
                          editingTable.x,
                          editingTable.y,
                          editingTable.seats
                        )
                      }
                      className="w-full rounded-xl bg-primary-dark py-2 text-xs font-bold text-white hover:bg-primary cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

                        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-xs">

              <table className="w-full text-left text-xs">

                <thead className="border-b border-border bg-background/60 font-bold uppercase tracking-wider text-muted">

                  <tr><th className="px-4 py-3.5">Table</th><th className="px-4 py-3.5">Zone</th><th className="px-4 py-3.5">Seats</th><th className="px-4 py-3.5">Shape</th><th className="px-4 py-3.5">Pos</th><th className="px-4 py-3.5">Active</th><th className="px-4 py-3.5 text-right">Actions</th></tr>

                </thead>

                <tbody className="divide-y divide-border/60">

                  {tables.map((t) => (

                    <tr key={t.id} className="hover:bg-background/40">

                      <td className="px-4 py-3 font-bold text-primary-dark"><div className="flex items-center gap-2">{t.photoUrl ? <img src={t.photoUrl} alt={t.code} className="h-8 w-8 rounded object-cover border" /> : <div className="h-8 w-8 rounded bg-surface-alt border" />}{t.code}</div></td>

                      <td className="px-4 py-3 text-muted">{t.zone}</td>

                      <td className="px-4 py-3 text-muted">{t.seats}</td>

                      <td className="px-4 py-3 text-muted">{t.shape}</td>

                      <td className="px-4 py-3 font-mono text-muted">{t.x},{t.y}</td>

                      <td className="px-4 py-3"><button onClick={()=>handleTablePatch(t.id,{active:!t.active},`${t.code} ${!t.active?'activated':'deactivated'}`)} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${t.active?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20':'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'}`}>{t.active?'Yes':'No'}</button></td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">

                        <button onClick={()=>{const code=prompt('Code',t.code); if(!code) return; const seats=Number(prompt('Seats',String(t.seats))||t.seats); const zone=prompt('Zone',t.zone)||t.zone; handleTablePatch(t.id,{code:code.toUpperCase(),seats,zone},`Updated ${code}`);}} className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-alt/50 cursor-pointer">Edit</button>

                        <button onClick={()=>handleDeleteTable(t)} className="rounded-lg p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"><TrashIcon className="h-4 w-4"/></button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}
            {isAddTableOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-4"><h3 className="font-display text-xl font-bold text-primary-dark">Add Table</h3><button onClick={()=>setIsAddTableOpen(false)} className="rounded-lg p-1.5 text-muted hover:text-foreground cursor-pointer"><XIcon className="h-5 w-5"/></button></div>

            <form onSubmit={handleCreateTable} className="space-y-3 text-sm">

              <div className="grid grid-cols-2 gap-3">

                <input required placeholder="Code (T16)" value={newTable.code} onChange={e=>setNewTable({...newTable,code:e.target.value})} className="rounded-xl border border-border bg-background px-3 py-2.5" />

                <input required type="number" min={1} placeholder="Seats" value={newTable.seats} onChange={e=>setNewTable({...newTable,seats:Number(e.target.value)})} className="rounded-xl border border-border bg-background px-3 py-2.5" />

                <input required placeholder="Zone" value={newTable.zone} onChange={e=>setNewTable({...newTable,zone:e.target.value})} className="rounded-xl border border-border bg-background px-3 py-2.5" />

                <select value={newTable.shape} onChange={e=>{const shape=e.target.value as 'circle'|'rect'; setNewTable({...newTable,shape, ...(shape==='circle'?{width:70,height:70}:{width:100,height:80})});}} className="rounded-xl border border-border bg-background px-3 py-2.5"><option value="circle">circle</option><option value="rect">rect</option></select>

                <input type="number" placeholder="X" value={newTable.x} onChange={e=>setNewTable({...newTable,x:Number(e.target.value)})} className="rounded-xl border border-border bg-background px-3 py-2.5" />

                <input type="number" placeholder="Y" value={newTable.y} onChange={e=>setNewTable({...newTable,y:Number(e.target.value)})} className="rounded-xl border border-border bg-background px-3 py-2.5" />

              </div>

              <input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0]; if(!f) return; try{setNewTable({...newTable,photoUrl:await uploadImage(f)}); notify('Image uploaded');}catch(err){alert(err instanceof Error?err.message:'Upload failed');}}} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />

              <input placeholder="Photo URL (optional)" value={newTable.photoUrl} onChange={e=>setNewTable({...newTable,photoUrl:e.target.value})} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              {newTable.photoUrl && <img src={newTable.photoUrl} alt="Table" className="h-20 w-20 rounded-lg object-cover border" />}

              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setIsAddTableOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 font-semibold cursor-pointer">Cancel</button><button type="submit" className="flex-1 rounded-xl bg-primary-dark text-white py-2.5 font-bold cursor-pointer">Create Table</button></div>

            </form>

          </div>

        </div>

      )}

      {isAddItemOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-4"><h3 className="font-display text-xl font-bold text-primary-dark">Add Menu Item</h3><button onClick={()=>setIsAddItemOpen(false)} className="rounded-lg p-1.5 text-muted hover:text-foreground cursor-pointer"><XIcon className="h-5 w-5"/></button></div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-sm">

              <input required placeholder="Name (EN)" value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              <input placeholder="Name (BN)" value={newItemNameBn} onChange={e=>setNewItemNameBn(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              <select value={newItemCatId} onChange={e=>setNewItemCatId(Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>

              <input required type="number" min={0} placeholder="Price BDT" value={newItemPrice} onChange={e=>setNewItemPrice(Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              <textarea placeholder="Description" value={newItemDesc} onChange={e=>setNewItemDesc(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" rows={2} />

              <input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0]; if(!f) return; try{setNewItemImageUrl(await uploadImage(f)); notify('Image uploaded');}catch(err){alert(err instanceof Error?err.message:'Upload failed');}}} className="w-full rounded-xl border border-border bg-background px-3 py-2" />

              <input placeholder="Image URL (optional)" value={newItemImageUrl} onChange={e=>setNewItemImageUrl(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              {newItemImageUrl && <img src={newItemImageUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />}

              <input placeholder="Tags (comma-separated)" value={newItemTags} onChange={e=>setNewItemTags(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />

              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setIsAddItemOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 font-semibold cursor-pointer">Cancel</button><button type="submit" className="flex-1 rounded-xl bg-primary-dark text-white py-2.5 font-bold cursor-pointer">Add Item</button></div>

            </form>

          </div>

        </div>

      )}

</main>
    </div>
  );
}
