-- ============================================================
-- Seed: seed.sql
-- Lost and Found Management System
-- ============================================================
-- PREREQUISITES:
--   1. Run the migration first (001_init.sql).
--   2. Create an admin user in Supabase Auth (see README).
--   3. Replace <AUTH_USER_ID> below with the UUID from Supabase Auth.
-- ============================================================

-- ─── Admin ───────────────────────────────────────────────────
-- After creating the user in Supabase Auth Dashboard, insert their profile:
-- INSERT INTO office_administrator (auth_user_id, admin_name, admin_contact_no)
-- VALUES ('<AUTH_USER_ID>', 'Maria Reyes', '09171234567');

-- ─── Finders ─────────────────────────────────────────────────
INSERT INTO finder (finder_name, finder_contact_no) VALUES
  ('Juan dela Cruz',  '09181111111'),
  ('Ana Santos',      '09182222222'),
  ('Carlo Reyes',     '09183333333'),
  (null,              null);           -- anonymous finder (row for FK demo)

-- ─── Found Items ─────────────────────────────────────────────
-- NOTE: Replace <ADMIN_ID> with the actual admin_id after inserting the admin.
-- For seeding purposes, we assume admin_id = 1.

-- Non-high-value items
INSERT INTO found_item (item_name, category, item_description, item_picture_path,
  found_location, found_datetime, is_high_value, finder_id, logged_by)
VALUES
  ('Black Backpack',
   'Bags',
   'Black Jansport backpack with a yellow zipper. Contains notebooks and a water bottle.',
   'placeholder-backpack.jpg',
   'COE Building – Room 204',
   now() - interval '10 days',
   false, 1, 1),

  ('Blue Umbrella',
   'Others',
   'Compact blue umbrella, brand: Esprit. Found near the main entrance.',
   'placeholder-umbrella.jpg',
   'Main Gate',
   now() - interval '8 days',
   false, 2, 1),

  ('Textbook – Engineering Mathematics',
   'Books & Stationery',
   'Engineering Mathematics 7th Edition by Stroud. Name written inside: R. Bautista.',
   'placeholder-textbook.jpg',
   'E-Library – 2nd Floor',
   now() - interval '7 days',
   false, 3, 1),

  ('Key Chain with 3 Keys',
   'Keys',
   'Key chain with a small basketball charm. Three keys on the ring.',
   'placeholder-keys.jpg',
   'Activity Center',
   now() - interval '5 days',
   false, null, 1),

  ('White Polo Shirt (L)',
   'Clothing',
   'White polo shirt, size L, with an embroidered college logo. Likely a PE uniform.',
   'placeholder-shirt.jpg',
   'Gym – Locker Room',
   now() - interval '3 days',
   false, 1, 1),

  ('Black Ballpen Pouch',
   'Books & Stationery',
   'Transparent black zipper pouch with various pens and a USB drive.',
   'placeholder-pouch.jpg',
   'Library – Study Area',
   now() - interval '2 days',
   false, 2, 1),

  ('Prescription Eyeglasses',
   'Others',
   'Black rectangular frame, anti-glare lenses. Inside a blue hard case.',
   'placeholder-glasses.jpg',
   'Canteen – East Wing',
   now() - interval '1 day',
   false, 3, 1);

-- High-value items (photo and details hidden from public)
INSERT INTO found_item (item_name, category, item_description, item_picture_path,
  found_location, found_datetime, is_high_value, finder_id, logged_by)
VALUES
  ('Samsung Galaxy A54',
   'Electronics',
   'Black Samsung Galaxy A54 smartphone in a cracked blue silicone case.',
   'items/placeholder-phone.jpg',
   'Main Gate',
   now() - interval '9 days',
   true, 2, 1),

  ('Brown Leather Wallet',
   'Wallets & Cards',
   'Brown leather bifold wallet containing cash, an ATM card, and a college ID.',
   'items/placeholder-wallet.jpg',
   'Activity Center',
   now() - interval '6 days',
   true, 1, 1),

  ('HP Laptop (Silver)',
   'Electronics',
   'Silver HP laptop with a sticker on the lid. Model: HP 14s. Inside a black sleeve.',
   'items/placeholder-laptop.jpg',
   'COE Building – Computer Lab',
   now() - interval '4 days',
   true, null, 1);

-- ─── Claimants ───────────────────────────────────────────────
INSERT INTO claimant (claimant_name, claimant_contact_no, claimant_type, school_id, cys, department)
VALUES
  ('Roberto Bautista',  '09501234567', 'Student', '2021-00042', 'BSCE 3-B', 'College of Engineering'),
  ('Liza Gomez',        '09509876543', 'Faculty', 'FAC-2019-05', null, 'College of Arts and Sciences');

-- ─── Claims ──────────────────────────────────────────────────
-- Pending claim (item_id=1 – Black Backpack, claimant_id=1)
INSERT INTO item_claim (claim_code, item_id, claimant_id, submitted_at,
  lost_location, evidence_statement, claim_status)
VALUES
  ('CLM-SEED01', 1, 1, now() - interval '9 days',
   'COE Building hallway',
   'The backpack is mine. It contains my BSCE 3-B notebooks, a blue Tupperware water bottle, and a copy of Engineering Mechanics.',
   'Pending');

-- Approved claim (item_id=3 – Textbook, claimant_id=1)
-- Note: reviewed_by requires a real admin_id; we use 1 for seeding.
INSERT INTO item_claim (claim_code, item_id, claimant_id, submitted_at,
  lost_location, evidence_statement, claim_status, reviewed_by, reviewed_at)
VALUES
  ('CLM-SEED02', 3, 1, now() - interval '6 days',
   'E-Library 2nd floor study area',
   'The name R. Bautista written inside refers to me, Roberto Bautista. I lost it last Tuesday.',
   'Approved', 1, now() - interval '5 days');

-- Rejected claim (item_id=2 – Blue Umbrella, claimant_id=2)
INSERT INTO item_claim (claim_code, item_id, claimant_id, submitted_at,
  lost_location, evidence_statement, claim_status, reviewed_by, reviewed_at, rejection_reason)
VALUES
  ('CLM-SEED03', 2, 2, now() - interval '7 days',
   'Near the faculty room',
   'I believe this is my umbrella. I often leave it near the main entrance.',
   'Rejected', 1, now() - interval '6 days',
   'The description does not uniquely identify the umbrella. Please resubmit with a more specific description or proof (e.g., receipt, photo).');

-- ─── Return ──────────────────────────────────────────────────
-- Record return for the approved textbook claim (item_claim for CLM-SEED02)
-- Use a subquery to get the item_claim_id dynamically
INSERT INTO item_return (item_claim_id, returned_by, returned_at)
SELECT ic.item_claim_id, 1, now() - interval '4 days'
FROM item_claim ic
WHERE ic.claim_code = 'CLM-SEED02';

