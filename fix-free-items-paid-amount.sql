-- ============================================================
-- Fix Free Items: Set paid_amount = 0 in sales table
-- Generated from C:\Users\DELL\Documents\free items.xlsx (38 free items)
-- ============================================================

-- Method 1: Set paid_amount = 0 for the exact 38 free item IDs from Excel
UPDATE sales
SET 
  paid_amount = 0,
  remaining = 0,
  is_free = true
WHERE id IN (
  '0280c79b-a169-49bf-9bc7-9b850844dd42',
  '03ff2c99-3d2f-4419-854c-b77e0f3b7563',
  '12890d5c-9ac6-4570-97df-5680b1194ebc',
  '182627df-c60c-492b-b2e9-60bed41eba8d',
  '1f2c559a-f48a-4d32-b8b2-3d287d537816',
  '296c05ee-4c42-4c81-896e-2effafc471a5',
  '2b4883fc-7a5e-4945-b5b0-cd008c35be5a',
  '2e49c49c-aa48-4a85-988c-8f515c5b909f',
  '2f440a2a-c8cc-407c-9e57-bab6198ca0be',
  '2fa0dded-0b7c-458a-bdaa-ccd1277a6ded',
  '38aad84e-2c7e-4734-8dea-ee107236a5c8',
  '3aa3ed39-640f-49e6-86aa-8017fa7393b5',
  '3c01b541-78d2-4acc-b649-d98ff836430f',
  '410e506d-4b47-4b8f-86e1-193346ff88dd',
  '41cf58f7-69b4-42ce-87e4-5eb62f6916a1',
  '4a0bbca9-9d47-428f-b515-897034fc009f',
  '4bda72d9-fcbe-415e-926c-37bb547c09f5',
  '5609db1b-8e09-4ebd-a2e3-c5b9c1b64083',
  '6124a260-019b-4beb-a9c0-1c87774305f5',
  '78ec7e33-f91a-4b68-bd2e-688539e71a09',
  '91497780-957a-4490-9502-6754ed1c022e',
  '98ddb191-32b4-4e23-b3ce-60bf4f20db1b',
  '9b70b689-16fb-4f11-96bd-44bb4a4b6512',
  '9b8ec207-b6e0-4d24-b783-7e04872fbd47',
  'a9603de7-96fb-4d19-bf23-ade035cceb7a',
  'a9e8281d-e431-4f4f-a36f-424f959e816e',
  'b51cdddd-56d5-48a9-a1ff-702b278afe24',
  'b57c10ea-3fa5-45ab-a4cc-be1a46fbe71f',
  'c02c3f04-110f-442d-b565-516825ea49bb',
  'cd9220ef-2812-4601-aea9-ea73a6fd57f9',
  'd1ad2694-9dbe-4bcb-a7fa-9d611a746e85',
  'dcdfdf22-a7c5-47df-8767-5a97e45302ea',
  'e4e65b46-d8ae-4e05-b455-a4c575e4de59',
  'e9b860aa-9495-4024-bd81-52006912b462',
  'eaea2104-b909-45fb-bc9f-246a9977101f',
  'ec6f34e1-4a72-4b97-af80-2cc75f23bb43',
  'ecfd75d9-38db-44a9-a295-fe81cc83ce91',
  'f5fbae0e-0ab8-49b0-8b48-6ebee3325d85'
);

-- Method 2: Also ensure ANY row flagged as is_free has paid_amount = 0
UPDATE sales
SET 
  paid_amount = 0,
  remaining = 0
WHERE is_free = true;

-- Verification: Check that none of the free items have paid_amount > 0
SELECT id, invoice_no, item_name, total, paid_amount, remaining, is_free
FROM sales
WHERE is_free = true AND paid_amount > 0;
