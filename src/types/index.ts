export type TableStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OCCUPIED' | 'UNAVAILABLE';

export interface Table {
  id: number;
  code: string;
  seats: number;
  zone: string;
  x: number;
  y: number;
  shape: 'circle' | 'rect';
  width: number;
  height: number;
  photoUrl?: string | null;
  active: boolean;
  status?: TableStatus;
  activeBookingId?: number | null;
  bookingStatus?: string | null;
}

export interface TimeSlot {
  id: number;
  start: string;
  end: string;
  label: string;
  active: boolean;
}

export interface MenuCategory {
  id: number;
  name: string;
  nameBn?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  nameBn?: string | null;
  description?: string | null;
  priceBdt: number;
  imageUrl?: string | null;
  options?: {
    sizes?: string[];
    milk?: string[];
    sugar?: string[];
    spice?: string[];
    flavor?: string[];
    topping?: string[];
    addon?: string[];
    [key: string]: any;
  } | null;
  tags?: string[];
  available: boolean;
}

export interface CartItem {
  id: string; // unique item id + selected options hash
  menuItemId: number;
  name: string;
  nameBn?: string | null;
  priceBdt: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}
