'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartBar from '@/components/CartBar';
import { Hero, MenuShowcase, OurSpace, HowItWorks, SiteFooter } from '@/components/Landing';
import { MenuCategory, MenuItem, CartItem, Table, TimeSlot } from '@/types';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const selectedDate = useMemo(() => getToday(), []);
  const activeSlot = useMemo(() => slots.find(s => s.id === selectedSlotId) || null, [slots, selectedSlotId]);
  const availableCount = tables.filter(t => (t.status || 'AVAILABLE') === 'AVAILABLE').length;

  useEffect(() => {
    async function load() {
      try {
        const [slotsRes, menuRes] = await Promise.all([
          fetch('/api/slots').then(r => r.json()),
          fetch('/api/menu').then(r => r.json()),
        ]);
        if (slotsRes.slots?.length) { setSlots(slotsRes.slots); setSelectedSlotId(slotsRes.slots[0].id); }
        if (menuRes.categories) setCategories(menuRes.categories);
        if (menuRes.items) setMenuItems(menuRes.items);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedSlotId) return;
    const c = new AbortController();
    fetch(`/api/tables?date=${selectedDate}&slotId=${selectedSlotId}`, { signal: c.signal })
      .then(r => r.json()).then(d => { if (d.tables) setTables(d.tables); })
      .catch(e => { if ((e as Error).name !== 'AbortError') console.error(e); });
    return () => c.abort();
  }, [selectedDate, selectedSlotId]);

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const id = `${item.id}-`;
      const ex = prev.find(c => c.id === id);
      if (ex) return prev.map(c => c.id === id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id, menuItemId: item.id, name: item.name, nameBn: item.nameBn, priceBdt: item.priceBdt, quantity: 1 }];
    });
    setIsCartModalOpen(true);
  };

  const totalCartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const totalCartAmount = cart.reduce((s, c) => s + c.priceBdt * c.quantity, 0);

  return (
    <div className="min-h-screen bg-[#140d09] text-foreground flex flex-col">
      <Navbar lang={lang} onToggleLang={() => setLang(p => p === 'en' ? 'bn' : 'en')} cartCount={totalCartCount} cartTotal={totalCartAmount} onOpenCart={() => setIsCartModalOpen(true)} />
      <Hero lang={lang} tableCount={tables.length} itemCount={menuItems.length} availableCount={availableCount} previewTable={tables.find(t => (t.status || 'AVAILABLE') === 'AVAILABLE') || tables[0] || null} selectedDate={selectedDate} selectedSlotLabel={activeSlot?.label || ''} />
      <MenuShowcase lang={lang} categories={categories} items={menuItems} onAdd={handleAddToCart} />
      <OurSpace lang={lang} />
      <HowItWorks lang={lang} />
      <CartBar cart={cart} selectedTable={null} selectedDate={selectedDate} selectedSlot={activeSlot} onUpdateQty={(id,d)=>setCart(p=>p.map(c=>c.id===id?{...c,quantity:c.quantity+d}:c).filter(c=>c.quantity>0))} onRemoveItem={(id)=>setCart(p=>p.filter(c=>c.id!==id))} onClearCart={()=>{setCart([]); setIsCartModalOpen(false);}} lang={lang} isOpen={isCartModalOpen} onToggleOpen={()=>setIsCartModalOpen(p=>!p)} onCheckout={()=>{ router.push('/book'); }} />
      <SiteFooter lang={lang} />
    </div>
  );
}
