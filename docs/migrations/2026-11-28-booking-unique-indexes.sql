-- Booking uniqueness guardrails
-- Run duplicate checks before creating indexes.

-- 1) Duplicate active slot bookings (should return 0 rows)
SELECT "tableId", date, "slotId", count(*)
FROM "Booking"
WHERE status IN ('HELD','CONFIRMED','COMPLETED')
GROUP BY 1,2,3
HAVING count(*) > 1;

-- 2) Duplicate serials per day (should return 0 rows)
SELECT date, serial, count(*)
FROM "Booking"
GROUP BY 1,2
HAVING count(*) > 1;

-- 3) Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS booking_active_slot_uniq
  ON "Booking" ("tableId", "date", "slotId")
  WHERE status IN ('HELD','CONFIRMED','COMPLETED');

CREATE UNIQUE INDEX IF NOT EXISTS booking_serial_per_day_uniq
  ON "Booking" ("date", "serial");
