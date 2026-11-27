# Brew & Book — Day 1 Wireframes (Mobile-first)

## 1) Home / Landing
- **Mobile**
  - Sticky nav: logo, lang toggle, cart
  - Hero: headline, CTA “Reserve a Table”, “Explore Menu”
  - Menu preview cards (2-col scroll/grid)
  - Book section anchor
  - Footer
- **Desktop**
  - Nav links visible
  - Hero split: copy + visual
  - Menu 4-col grid

## 2) Floor Plan / Booking Page
- **Mobile**
  - Date strip (horizontal)
  - Time slot chips grouped Morning/Afternoon/Evening
  - Seat/zone filters
  - Legend: Available/Held/Booked/Unavailable
  - Floor plan SVG (pinch/zoom)
  - Tap table -> bottom sheet: table info, photo, menu categories, items, add-to-order
  - Sticky cart bar
- **Desktop**
  - Left: filters + floor plan
  - Right: table/menu panel

## 3) Table Panel / Menu
- Table header: code, status, seats, zone, photo
- Date/slot summary
- Search + category tabs
- Item card: image, name EN/BN, price, tags/options, add/+/- qty
- Option modal for customizable items

## 4) Booking Form (Day 3)
- Selected table + date + slot summary
- Customer: name, phone, party size, notes
- OTP verification
- Payment choice: bKash/Nagad/Card/Pay at shop
- Confirm booking CTA

## 5) Token Page (Day 3)
- Success state + QR code
- Token ID, table no., serial no., name, phone, date/time
- Booking status, payment status
- Download/share token

## 6) Admin
- Login
- Tabs: Menu & Pricing, Tables/Floor Plan Editor
- Menu: category CRUD, item add/edit/delete/price/availability/image
- Tables: add/edit/activate, drag-drop reposition on SVG, table list
- Future: bookings/check-in dashboard
