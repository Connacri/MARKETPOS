-- ============================================================
-- POS MODULE PRO / SHERWOOD ISLAND POS - SEED OFFICIEL SUPABASE
-- Aligné à 100% avec les données initiales du projet (src/data/seedData.ts)
-- Exécutable dans l'éditeur SQL Supabase ou via psql
-- ============================================================

-- 1. CATÉGORIES (6 rayons conformes à INITIAL_CATEGORIES)
INSERT INTO public.categories (id, name, icon, color, parent_id, sort_order, is_active, created_at, updated_at, sync_status)
VALUES
  (1, 'Boissons', 'CupSoda', '#3b82f6', 0, 1, true, now(), now(), 0),
  (2, 'Alimentation', 'Utensils', '#10b981', 0, 2, true, now(), now(), 0),
  (3, 'Hygiène & Soins', 'Sparkles', '#ec4899', 0, 3, true, now(), now(), 0),
  (4, 'High-Tech & Accessoires', 'Smartphone', '#8b5cf6', 0, 4, true, now(), now(), 0),
  (5, 'Boulangerie & Pâtisserie', 'Croissant', '#f59e0b', 0, 5, true, now(), now(), 0),
  (6, 'Entretien & Maison', 'Home', '#06b6d4', 0, 6, true, now(), now(), 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- 2. PRODUITS (18 articles du catalogue conformes à INITIAL_PRODUCTS)
INSERT INTO public.products (id, sku, name, description, category_id, price, cost_price, tax_rate, stock, low_stock_threshold, barcode, image_url, is_active, created_at, updated_at, sync_status)
VALUES
  (1,  'REF-0001', 'Coca-Cola 33cl', 'Canette 33cl, boisson gazeuse fraîche', 1, 120.00, 80.00, 0.19, 95, 20, '613000000001', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (2,  'REF-0002', 'Eau minérale naturelle 1,5L', 'Bouteille 1,5L pureté des montagnes', 1, 60.00, 35.00, 0.09, 180, 30, '613000000002', 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (3,  'REF-0003', 'Jus d''orange 100% Pur 1L', 'Brique 1L sans sucre ajouté', 1, 180.00, 120.00, 0.19, 45, 15, '613000000003', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (4,  'REF-0004', 'Huile d''olive Vierge Extra 1L', 'Huile d''olive première pression à froid', 2, 950.00, 700.00, 0.19, 55, 10, '613000000004', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (5,  'REF-0005', 'Riz Basmati Sélection 5kg', 'Sac de 5kg, grains longs parfumés', 2, 2200.00, 1800.00, 0.19, 35, 8, '613000000005', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (6,  'REF-0006', 'Couscous Fin Traditionnel 1kg', 'Semoule de blé dur de qualité supérieure', 2, 190.00, 130.00, 0.09, 80, 15, '613000000006', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (7,  'REF-0007', 'Pâtes Penne Rigate 500g', 'Blé 100% sélectionné, cuisson al dente', 2, 140.00, 95.00, 0.09, 110, 20, '613000000007', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (8,  'REF-0008', 'Shampooing Antipelliculaire 400ml', 'Formule au zinc pyrithione actif', 3, 420.00, 280.00, 0.19, 32, 10, '613000000008', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (9,  'REF-0009', 'Dentifrice Blancheur Éclat 75ml', 'Protection émail & blancheur naturelle', 3, 210.00, 130.00, 0.19, 6, 12, '613000000009', 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (10, 'REF-0010', 'Savon Liquide Mains Aloe Vera 500ml', 'Hydratation intense, parfum délicat', 3, 290.00, 175.00, 0.19, 4, 15, '613000000010', 'https://images.unsplash.com/photo-1608248597359-59749fb2193b?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (11, 'REF-0011', 'Câble USB-C Tressé Renforcé 1.2m', 'Support charge rapide 60W Power Delivery', 4, 650.00, 320.00, 0.19, 45, 10, '613000000011', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (12, 'REF-0012', 'Écouteurs Sans Fil TWS Bluetooth 5.3', 'Autonomie 24h avec boîtier nomade', 4, 2800.00, 1600.00, 0.19, 14, 5, '613000000012', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (13, 'REF-0013', 'Pain Complet Artisanal Bio', 'Farine bio, levain naturel', 5, 25.00, 12.00, 0.00, 0, 15, '613000000013', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (14, 'REF-0014', 'Baguette Traditionnelle Dorée', 'Cuisson sur sole, croustillante', 5, 15.00, 7.00, 0.00, 140, 30, '613000000014', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (15, 'REF-0015', 'Croissant au Beurre AOP', 'Feuilletage artisanal pur beurre', 5, 45.00, 20.00, 0.09, 60, 15, '613000000015', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (16, 'REF-0016', 'Lessive Liquide Fraîcheur 2L', 'Formule détachante efficace à froid', 6, 850.00, 600.00, 0.19, 25, 8, '613000000016', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (17, 'REF-0017', 'Liquide Vaisselle Concentré 1L', 'Dégraissant actif au citron d''Alger', 6, 220.00, 130.00, 0.19, 50, 12, '613000000017', 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0),
  (18, 'REF-0018', 'Sacs Poubelle Ultra-Résistants 50L (x20)', 'Avec lien coulissant étanche', 6, 120.00, 70.00, 0.19, 125, 25, '613000000018', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80', true, now(), now(), 0)
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  cost_price = EXCLUDED.cost_price,
  stock = EXCLUDED.stock,
  tax_rate = EXCLUDED.tax_rate,
  barcode = EXCLUDED.barcode,
  image_url = EXCLUDED.image_url;

-- 3. CLIENTS (4 comptes conformes à INITIAL_CUSTOMERS)
INSERT INTO public.customers (id, name, phone, email, address, company, tax_id, notes, balance_due, loyalty_points, created_at, updated_at, sync_status)
VALUES
  (1, 'Client Comptoir (Passager)', '', '', 'Vente directe magasin', NULL, NULL, 'Encaissements rapides sans compte pro', 0.00, 0, now(), now(), 0),
  (2, 'Kamel Benali', '0550 12 34 56', 'kamel.benali@example.dz', 'Cité 200 Logts, Bab Ezzouar, Alger', 'SARL Benali Import', '099912345678', 'Compte Pro - Règlement 30 jours fin de mois', 38575.00, 120, now(), now(), 0),
  (3, 'Fatima Zohra Mansouri', '0661 98 76 54', 'fz.mansouri@algerie-tech.com', 'Rue Didouche Mourad, Alger Centre', 'EURL Mansouri Services', '088876543210', 'Facturation officielle avec bon de commande', 12400.00, 85, now(), now(), 0),
  (4, 'Yacine Amrani', '0770 45 67 89', 'yacine.amrani@gmail.com', 'Kouba, Alger', 'Amrani Retail', '077712349999', 'Règlement Carte CIB / Espèces', 0.00, 45, now(), now(), 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company,
  balance_due = EXCLUDED.balance_due;

-- 4. VENTES RÉCENTES (Avec items en JSONB pour compatibilité directe avec le modèle TypeScript Sale)
INSERT INTO public.sales (id, sale_number, customer_id, customer_name, cashier_id, items, subtotal_ht, tax_total, discount_total, total_ttc, total, payment_method, amount_tendered, change_given, status, notes, created_at, updated_at, sync_status)
VALUES
  (1, 'INV-2026-0001', 2, 'Kamel Benali', 1, '[{"productId":1,"productName":"Coca-Cola 33cl","sku":"REF-0001","quantity":2,"unitPrice":120,"taxRate":0.19,"discountPercent":0,"totalHT":202,"totalTTC":240},{"productId":4,"productName":"Huile d''olive Vierge Extra 1L","sku":"REF-0004","quantity":1,"unitPrice":950,"taxRate":0.19,"discountPercent":0,"totalHT":798,"totalTTC":950}]'::jsonb, 1000.00, 190.00, 0.00, 1190.00, 1190.00, 'CASH', 1200.00, 10.00, 'COMPLETED', 'Vente comptoir', now() - interval '2 days', now() - interval '2 days', 0),
  (2, 'INV-2026-0002', 3, 'Fatima Zohra Mansouri', 1, '[{"productId":12,"productName":"Écouteurs Sans Fil TWS Bluetooth 5.3","sku":"REF-0012","quantity":1,"unitPrice":2800,"taxRate":0.19,"discountPercent":0,"totalHT":2353,"totalTTC":2800},{"productId":11,"productName":"Câble USB-C Tressé Renforcé 1.2m","sku":"REF-0011","quantity":2,"unitPrice":650,"taxRate":0.19,"discountPercent":0,"totalHT":1092,"totalTTC":1300}]'::jsonb, 3445.00, 655.00, 0.00, 4100.00, 4100.00, 'CARD', 4100.00, 0.00, 'COMPLETED', 'Facture B2B', now() - interval '1 day', now() - interval '1 day', 0),
  (3, 'INV-2026-0003', 1, 'Client Comptoir (Passager)', 1, '[{"productId":2,"productName":"Eau minérale naturelle 1,5L","sku":"REF-0002","quantity":4,"unitPrice":60,"taxRate":0.09,"discountPercent":0,"totalHT":220,"totalTTC":240},{"productId":15,"productName":"Croissant au Beurre AOP","sku":"REF-0015","quantity":2,"unitPrice":45,"taxRate":0.09,"discountPercent":0,"totalHT":83,"totalTTC":90}]'::jsonb, 303.00, 27.00, 0.00, 330.00, 330.00, 'CASH', 350.00, 20.00, 'COMPLETED', NULL, now() - interval '3 hours', now() - interval '3 hours', 0)
ON CONFLICT (id) DO UPDATE SET
  sale_number = EXCLUDED.sale_number,
  total_ttc = EXCLUDED.total_ttc,
  items = EXCLUDED.items;

-- 5. LIGNES DE VENTE DÉTAILLÉES (sale_items normalisées)
INSERT INTO public.sale_items (sale_id, product_id, product_name, sku, unit_price, cost_price, tax_rate, quantity, discount_percent, total_ht, total_ttc, created_at)
VALUES
  (1, 1, 'Coca-Cola 33cl', 'REF-0001', 120.00, 80.00, 0.19, 2, 0.00, 202.00, 240.00, now() - interval '2 days'),
  (1, 4, 'Huile d''olive Vierge Extra 1L', 'REF-0004', 950.00, 700.00, 0.19, 1, 0.00, 798.00, 950.00, now() - interval '2 days'),
  (2, 12, 'Écouteurs Sans Fil TWS Bluetooth 5.3', 'REF-0012', 2800.00, 1600.00, 0.19, 1, 0.00, 2353.00, 2800.00, now() - interval '1 day'),
  (2, 11, 'Câble USB-C Tressé Renforcé 1.2m', 'REF-0011', 650.00, 320.00, 0.19, 2, 0.00, 1092.00, 1300.00, now() - interval '1 day'),
  (3, 2, 'Eau minérale naturelle 1,5L', 'REF-0002', 60.00, 35.00, 0.09, 4, 0.00, 220.00, 240.00, now() - interval '3 hours'),
  (3, 15, 'Croissant au Beurre AOP', 'REF-0015', 45.00, 20.00, 0.09, 2, 0.00, 83.00, 90.00, now() - interval '3 hours');

-- 6. FACTURES OFFICIELLES (invoices)
INSERT INTO public.invoices (id, invoice_number, sale_id, customer_id, status, subtotal_ht, tax_total, discount_total, total_ttc, company_name, company_address, company_tax_id, due_date, notes, created_at, updated_at, sync_status)
VALUES
  (1, 'FAC-2026-0001', 2, 3, 'PAID', 3445.00, 655.00, 0.00, 4100.00, 'SHERWOOD ISLAND POS', '14 Boulevard Zighout Youcef, 16000 Alger', 'NIF: 099900112233001 • RC: 16/00-0987654', now() + interval '30 days', 'Facture acquittée par carte bancaire CIB', now() - interval '1 day', now() - interval '1 day', 0)
ON CONFLICT (id) DO UPDATE SET
  invoice_number = EXCLUDED.invoice_number,
  total_ttc = EXCLUDED.total_ttc;

-- 7. LIGNES DE FACTURE (invoice_items)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, tax_rate, discount_percent, total_ht, total_ttc)
VALUES
  (1, 12, 'Écouteurs Sans Fil TWS Bluetooth 5.3', 1, 2800.00, 0.19, 0.00, 2353.00, 2800.00),
  (1, 11, 'Câble USB-C Tressé Renforcé 1.2m', 2, 650.00, 0.19, 0.00, 1092.00, 1300.00);

-- 8. PAIEMENTS (payments)
INSERT INTO public.payments (amount, payment_method, sale_id, invoice_id, reference, paid_at, sync_status)
VALUES
  (1190.00, 'CASH', 1, 0, 'CAISSE-ESP-001', now() - interval '2 days', 0),
  (4100.00, 'CARD', 2, 1, 'TRAN-CIB-984210', now() - interval '1 day', 0),
  (330.00, 'CASH', 3, 0, 'CAISSE-ESP-002', now() - interval '3 hours', 0);

-- 9. MOUVEMENTS DE STOCK INITIAUX (stock_movements)
INSERT INTO public.stock_movements (product_id, change_amount, reason, reference_id, notes, created_at)
VALUES
  (1, -2, 'SALE', 'INV-2026-0001', 'Vente comptoir', now() - interval '2 days'),
  (4, -1, 'SALE', 'INV-2026-0001', 'Vente comptoir', now() - interval '2 days'),
  (12, -1, 'SALE', 'INV-2026-0002', 'Vente B2B', now() - interval '1 day'),
  (11, -2, 'SALE', 'INV-2026-0002', 'Vente B2B', now() - interval '1 day'),
  (2, -4, 'SALE', 'INV-2026-0003', 'Vente comptoir', now() - interval '3 hours'),
  (15, -2, 'SALE', 'INV-2026-0003', 'Vente comptoir', now() - interval '3 hours');

-- 10. PARAMÈTRES D'IMPRESSION THERMIQUE (printer_settings)
INSERT INTO public.printer_settings (id, paper_width, printer_interface, printer_name, printer_ip, printer_port, auto_cut, open_cash_drawer, print_logo, store_name, store_subtitle, store_address, store_phone, store_tax_id, receipt_footer_message, print_copies, updated_at)
VALUES
  ('default', '80mm', 'SYSTEM_DEFAULT', 'Imprimante Thermique Système (80mm ESC/POS)', '192.168.1.200', 9100, true, true, true, 'SHERWOOD ISLAND POS', 'Boutique & Caisse Artisanale', '14 Boulevard Zighout Youcef, 16000 Alger', '+213 (0) 21 73 45 67', 'NIF: 099900112233001 • RC: 16/00-0987654', 'Merci de votre visite à Sherwood Island ! Articles échangeables sous 15 jours sur présentation du ticket.', 1, now())
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  store_address = EXCLUDED.store_address;
