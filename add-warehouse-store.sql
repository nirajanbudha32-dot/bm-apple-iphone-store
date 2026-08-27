-- Add Warehouse as a special store (not managed via StoreManager)
INSERT INTO public.stores (id, name, address, phone, email, pan, vat_number, status) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'Warehouse', 'Central Storage', '', '', '', '', 'active')
ON CONFLICT (id) DO NOTHING;
