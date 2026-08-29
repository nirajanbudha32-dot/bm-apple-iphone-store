ALTER TABLE public.stock_transfer_items
  ADD COLUMN IF NOT EXISTS dest_item_code text,
  ADD COLUMN IF NOT EXISTS dest_item_name text;
