import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const tables = [
  { code: 'T01', seats: 2, zone: 'Window', x: 60, y: 60, shape: 'circle', width: 70, height: 70 },
  { code: 'T02', seats: 2, zone: 'Window', x: 160, y: 60, shape: 'circle', width: 70, height: 70 },
  { code: 'T03', seats: 2, zone: 'Window', x: 260, y: 60, shape: 'circle', width: 70, height: 70 },
  { code: 'T04', seats: 4, zone: 'Center', x: 60, y: 170, shape: 'rect', width: 100, height: 80 },
  { code: 'T05', seats: 4, zone: 'Center', x: 190, y: 170, shape: 'rect', width: 100, height: 80 },
  { code: 'T06', seats: 4, zone: 'Center', x: 320, y: 170, shape: 'rect', width: 100, height: 80 },
  { code: 'T07', seats: 4, zone: 'Window', x: 360, y: 60, shape: 'rect', width: 100, height: 80 },
  { code: 'T08', seats: 6, zone: 'Family', x: 60, y: 290, shape: 'rect', width: 140, height: 90 },
  { code: 'T09', seats: 6, zone: 'Family', x: 230, y: 290, shape: 'rect', width: 140, height: 90 },
  { code: 'T10', seats: 2, zone: 'Outdoor', x: 60, y: 420, shape: 'circle', width: 70, height: 70 },
  { code: 'T11', seats: 2, zone: 'Outdoor', x: 160, y: 420, shape: 'circle', width: 70, height: 70 },
  { code: 'T12', seats: 4, zone: 'Outdoor', x: 260, y: 410, shape: 'rect', width: 100, height: 80 },
  { code: 'T13', seats: 4, zone: 'Quiet', x: 450, y: 170, shape: 'rect', width: 100, height: 80 },
  { code: 'T14', seats: 2, zone: 'Quiet', x: 470, y: 60, shape: 'circle', width: 70, height: 70 },
  { code: 'T15', seats: 6, zone: 'Family', x: 400, y: 290, shape: 'rect', width: 140, height: 90 },
];

const timeSlots = [
  { start: '08:00', end: '09:30', label: '8:00 AM - 9:30 AM' },
  { start: '09:30', end: '11:00', label: '9:30 AM - 11:00 AM' },
  { start: '11:00', end: '12:30', label: '11:00 AM - 12:30 PM' },
  { start: '12:30', end: '14:00', label: '12:30 PM - 2:00 PM' },
  { start: '14:00', end: '15:30', label: '2:00 PM - 3:30 PM' },
  { start: '15:30', end: '17:00', label: '3:30 PM - 5:00 PM' },
  { start: '17:00', end: '18:30', label: '5:00 PM - 6:30 PM' },
  { start: '18:30', end: '20:00', label: '6:30 PM - 8:00 PM' },
  { start: '20:00', end: '21:30', label: '8:00 PM - 9:30 PM' },
];

const categories = [
  { name: 'Coffee', nameBn: 'কফি', sortOrder: 1 },
  { name: 'Tea & Drinks', nameBn: 'চা ও পানীয়', sortOrder: 2 },
  { name: 'Snacks', nameBn: 'স্ন্যাকস', sortOrder: 3 },
  { name: 'Desserts', nameBn: 'ডেজার্ট', sortOrder: 4 },
  { name: 'Breakfast', nameBn: 'নাস্তা', sortOrder: 5 },
];

const items = [
  { category: 'Coffee', name: 'Espresso', nameBn: 'এসপ্রেসো', priceBdt: 180, tags: ['hot'], options: { sizes: ['Single', 'Double'] } },
  { category: 'Coffee', name: 'Cappuccino', nameBn: 'ক্যাপুচিনো', priceBdt: 280, tags: ['hot'], options: { sizes: ['Regular', 'Large'], milk: ['Regular', 'Oat', 'Soy'] } },
  { category: 'Coffee', name: 'Caffe Latte', nameBn: 'ক্যাফে ল্যাটে', priceBdt: 300, tags: ['hot'], options: { sizes: ['Regular', 'Large'], milk: ['Regular', 'Oat', 'Soy'] } },
  { category: 'Coffee', name: 'Americano', nameBn: 'আমেরিকানো', priceBdt: 220, tags: ['hot'], options: { sizes: ['Regular', 'Large'] } },
  { category: 'Coffee', name: 'Mocha', nameBn: 'মোকা', priceBdt: 350, tags: ['hot'], options: { sizes: ['Regular', 'Large'] } },
  { category: 'Coffee', name: 'Iced Latte', nameBn: 'আইসড ল্যাটে', priceBdt: 320, tags: ['cold'], options: { sizes: ['Regular', 'Large'], milk: ['Regular', 'Oat'] } },
  { category: 'Tea & Drinks', name: 'Masala Chai', nameBn: 'মসলা চা', priceBdt: 120, tags: ['hot'], options: { sugar: ['No sugar', 'Less', 'Regular'] } },
  { category: 'Tea & Drinks', name: 'Green Tea', nameBn: 'গ্রিন টি', priceBdt: 150, tags: ['hot'], options: {} },
  { category: 'Tea & Drinks', name: 'Lemon Mint Cooler', nameBn: 'লেমন মিন্ট কুলার', priceBdt: 200, tags: ['cold', 'veg'], options: {} },
  { category: 'Tea & Drinks', name: 'Chocolate Milkshake', nameBn: 'চকলেট মিল্কশেক', priceBdt: 280, tags: ['cold'], options: {} },
  { category: 'Tea & Drinks', name: 'Mango Smoothie', nameBn: 'আমের স্মুদি', priceBdt: 300, tags: ['cold', 'seasonal'], options: {} },
  { category: 'Snacks', name: 'Chicken Sandwich', nameBn: 'চিকেন স্যান্ডউইচ', priceBdt: 320, tags: ['non-veg'], options: { spice: ['Mild', 'Medium'] } },
  { category: 'Snacks', name: 'Veg Club Sandwich', nameBn: 'ভেজ ক্লাব স্যান্ডউইচ', priceBdt: 280, tags: ['veg'], options: {} },
  { category: 'Snacks', name: 'French Fries', nameBn: 'ফ্রেঞ্চ ফ্রাই', priceBdt: 180, tags: ['veg'], options: { size: ['Regular', 'Large'] } },
  { category: 'Snacks', name: 'Chicken Wings (6pc)', nameBn: 'চিকেন উইংস (৬ পিস)', priceBdt: 380, tags: ['non-veg'], options: { sauce: ['BBQ', 'Spicy', 'Honey Garlic'] } },
  { category: 'Snacks', name: 'Spring Roll', nameBn: 'স্প্রিং রোল', priceBdt: 220, tags: ['veg'], options: {} },
  { category: 'Desserts', name: 'Chocolate Brownie', nameBn: 'চকলেট ব্রাউনি', priceBdt: 250, tags: ['veg'], options: { addon: ['None', 'Ice cream +BDT 80'] } },
  { category: 'Desserts', name: 'Cheesecake Slice', nameBn: 'চিজকেক স্লাইস', priceBdt: 350, tags: ['veg'], options: {} },
  { category: 'Desserts', name: 'Red Velvet Pastry', nameBn: 'রেড ভেলভেট পেস্ট্রি', priceBdt: 280, tags: ['veg'], options: {} },
  { category: 'Desserts', name: 'Ice Cream (2 scoops)', nameBn: 'আইসক্রিম (২ স্কুপ)', priceBdt: 200, tags: ['veg'], options: { flavor: ['Vanilla', 'Chocolate', 'Strawberry'] } },
  { category: 'Breakfast', name: 'Eggs & Toast', nameBn: 'ডিম ও টোস্ট', priceBdt: 220, tags: ['non-veg'], options: { egg: ['Fried', 'Scrambled', 'Boiled'] } },
  { category: 'Breakfast', name: 'Paratha with Bhaji', nameBn: 'পরাটা ও ভাজি', priceBdt: 150, tags: ['veg'], options: {} },
  { category: 'Breakfast', name: 'Pancakes', nameBn: 'প্যানকেক', priceBdt: 280, tags: ['veg'], options: { topping: ['Honey', 'Chocolate', 'Maple'] } },
  { category: 'Breakfast', name: 'Omelette', nameBn: 'অমলেট', priceBdt: 180, tags: ['non-veg'], options: { addon: ['Plain', 'Cheese', 'Veggies'] } },
  { category: 'Breakfast', name: 'Croissant', nameBn: 'ক্রোয়াসঁ', priceBdt: 200, tags: ['veg'], options: {} },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // clear in dependency order
    await client.query('DELETE FROM "Payment"');
    await client.query('DELETE FROM "OrderItem"');
    await client.query('DELETE FROM "Order"');
    await client.query('DELETE FROM "Booking"');
    await client.query('DELETE FROM "OtpCode"');
    await client.query('DELETE FROM "MenuItem"');
    await client.query('DELETE FROM "MenuCategory"');
    await client.query('DELETE FROM "TimeSlot"');
    await client.query('DELETE FROM "Table"');
    await client.query('DELETE FROM "User"');

    for (const t of tables) {
      await client.query(
        `INSERT INTO "Table" ("code","seats","zone","x","y","shape","width","height","active","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())`,
        [t.code, t.seats, t.zone, t.x, t.y, t.shape, t.width, t.height],
      );
    }

    for (const s of timeSlots) {
      await client.query(
        `INSERT INTO "TimeSlot" ("start","end","label","active","createdAt","updatedAt") VALUES ($1,$2,$3,true,NOW(),NOW())`,
        [s.start, s.end, s.label],
      );
    }

    const catIds: Record<string, number> = {};
    for (const c of categories) {
      const res = await client.query(
        `INSERT INTO "MenuCategory" ("name","nameBn","sortOrder","active","createdAt","updatedAt") VALUES ($1,$2,$3,true,NOW(),NOW()) RETURNING id`,
        [c.name, c.nameBn, c.sortOrder],
      );
      catIds[c.name] = res.rows[0].id;
    }

    for (const item of items) {
      await client.query(
        `INSERT INTO "MenuItem" ("categoryId","name","nameBn","description","priceBdt","imageUrl","options","tags","available","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())`,
        [
          catIds[item.category],
          item.name,
          item.nameBn,
          null,
          item.priceBdt,
          null,
          JSON.stringify(item.options),
          item.tags,
        ],
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded: ${tables.length} tables, ${timeSlots.length} slots, ${categories.length} categories, ${items.length} menu items`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
