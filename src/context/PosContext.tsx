import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  Category,
  Customer,
  CartItem,
  Sale,
  SaleItem,
  PaymentMethod,
  DailyRevenueStat,
  ThermalPrinterSettings,
  CartId,
  SingleCartState,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  generateHistoricSales,
} from '../data/seedData';
import { ultraLocalDb } from '../services/localDb';
import { posSounds } from '../services/soundService';
import { supabaseSyncService, SupabaseConfig } from '../services/supabaseSyncService';

export interface CartSummary {
  subtotalHT: number;
  totalTax: number;
  discountAmount: number;
  totalTTC: number;
  totalItems: number;
  uniqueCount: number;
}

export type ViewType = 'dashboard' | 'pos' | 'catalog' | 'sales' | 'customers' | 'admin';

export const DEFAULT_PRINTER_SETTINGS: ThermalPrinterSettings = {
  paperWidth: '80mm',
  printerInterface: 'SYSTEM_DEFAULT',
  printerName: 'Imprimante Thermique Système (80mm ESC/POS)',
  printerIp: '192.168.1.200',
  printerPort: 9100,
  autoCut: true,
  openCashDrawer: true,
  printLogo: true,
  logoDataUrl: '',
  storeName: 'SHERWOOD ISLAND POS',
  storeSubtitle: 'Boutique & Caisse Artisanale',
  storeAddress: '14 Boulevard Zighout Youcef, 16000 Alger',
  storePhone: '+213 (0) 21 73 45 67',
  storeTaxId: 'NIF: 099900112233001 • RC: 16/00-0987654',
  receiptFooterMessage: 'Merci de votre visite à Sherwood Island ! Articles échangeables sous 15 jours sur présentation du ticket.',
  printCopies: 1,
};

interface PosContextType {
  // Navigation & Active View
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  openNewProductModal: boolean;
  setOpenNewProductModal: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isPrintPreviewOpen: boolean;
  setIsPrintPreviewOpen: (open: boolean) => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  amountTenderedInput: string;
  setAmountTenderedInput: (val: string) => void;
  initiateCheckout: () => void;

  // Offline & Network status
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  pendingSyncCount: number;
  refreshPendingSyncCount: () => void;

  // Entities
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];

  // Persistent Dual Carts & Active Cart
  activeCartId: CartId;
  switchCart: (targetId?: CartId) => void;
  carts: Record<CartId, SingleCartState>;
  cart: CartItem[];
  cartSummary: CartSummary;
  cart1Summary: CartSummary;
  cart2Summary: CartSummary;
  selectedCustomerId: number;
  setSelectedCustomerId: (id: number) => void;
  globalDiscountPercent: number;
  setGlobalDiscountPercent: (pct: number) => void;
  orderNote: string;
  setOrderNote: (note: string) => void;

  // Customer specific carts (Client Carts)
  customerCarts: Record<number, CartItem[]>;
  loadCustomerCart: (customerId: number, targetCartId?: CartId) => void;
  saveCurrentCartToCustomer: (customerId?: number) => void;
  getCustomerCart: (customerId: number) => CartItem[];
  getCustomerCartCount: (customerId: number) => number;

  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  incrementQuantity: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  setItemDiscount: (productId: number, discountPercent: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: (saveForUndo?: boolean) => void;
  canUndoClearCart: boolean;
  undoClearCart: () => void;

  // High-performance barcode scanner action
  scanAndAddToCart: (
    barcodeOrSku: string
  ) => Promise<{ success: boolean; product?: Product; error?: string; lookupTimeMs: number }>;

  // Products CRUD & Benchmark
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  bulkAddBenchmarkProducts: (count: number) => Promise<{ count: number; timeMs: number }>;

  // Customers CRUD
  addCustomer: (cust: Omit<Customer, 'id'>) => Customer;

  // Checkout & Sales
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;
  selectedInvoice: Sale | null;
  setSelectedInvoice: (sale: Sale | null) => void;
  completeSale: (
    paymentMethod: PaymentMethod,
    amountTendered?: number
  ) => { success: boolean; sale?: Sale; error?: string };

  // Analytics & Dashboard
  dailyStats: DailyRevenueStat[];
  todayStats: {
    revenue: number;
    salesCount: number;
    averageBasket: number;
    itemsSold: number;
    lowStockCount: number;
  };

  // Supabase sync
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (cfg: SupabaseConfig) => void;
  triggerSyncNow: () => Promise<{ success: boolean; pushedCount: number; pulledCount: number }>;

  // Thermal Printer settings
  printerSettings: ThermalPrinterSettings;
  updatePrinterSettings: (settings: ThermalPrinterSettings) => void;

  // Toast & Screen reader feedback
  globalToast: { id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: () => void;

  resetDemoData: () => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CART: 'pos_module_cart_v3',
  PRODUCTS: 'pos_module_products_v3',
  SALES: 'pos_module_sales_v3',
  CUSTOMERS: 'pos_module_customers_v3',
  CUSTOMER: 'pos_module_selected_customer_v3',
  NOTE: 'pos_module_order_note_v3',
  DISCOUNT: 'pos_module_global_discount_v3',
  SIMULATED_OFFLINE: 'pos_module_sim_offline_v3',
  PRINTER_SETTINGS: 'pos_module_printer_settings_v2',
  DUAL_CARTS: 'pos_module_dual_carts_v4',
  ACTIVE_CART_ID: 'pos_module_active_cart_id_v4',
  CUSTOMER_CARTS: 'pos_module_customer_carts_v4',
};

export const computeCartSummary = (items: CartItem[], discountPercent: number): CartSummary => {
  let subtotalHT = 0;
  let totalTax = 0;
  let baseTTC = 0;
  let totalItems = 0;

  items.forEach((item) => {
    totalItems += item.quantity;
    const lineOriginal = item.unitPrice * item.quantity;
    const lineDisc = lineOriginal * (item.discountPercent / 100);
    const lineNet = lineOriginal - lineDisc;

    const lineHT = lineNet / (1 + item.product.taxRate);
    const lineTVA = lineNet - lineHT;

    baseTTC += lineNet;
    subtotalHT += lineHT;
    totalTax += lineTVA;
  });

  const globalDiscountAmount = baseTTC * (discountPercent / 100);
  const finalTTC = Math.max(0, baseTTC - globalDiscountAmount);

  return {
    subtotalHT: Math.round(subtotalHT * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    discountAmount: Math.round(globalDiscountAmount * 100) / 100,
    totalTTC: Math.round(finalTTC * 100) / 100,
    totalItems,
    uniqueCount: items.length,
  };
};

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [openNewProductModal, setOpenNewProductModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Real-time offline detection
  const [isOffline, setIsOfflineState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sim = localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE);
      if (sim === 'true') return true;
      return !navigator.onLine;
    }
    return false;
  });

  const setIsOffline = (offline: boolean) => {
    setIsOfflineState(offline);
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, String(offline));
    } catch {}
  };

  useEffect(() => {
    const handleOnline = () => {
      const sim = localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE);
      if (sim !== 'true') setIsOfflineState(false);
    };
    const handleOffline = () => setIsOfflineState(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global Toast & Screen Reader Feedback
  const [globalToast, setGlobalToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setGlobalToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
      setGlobalToast({ id, message, type });
      toastTimerRef.current = setTimeout(() => {
        setGlobalToast(null);
      }, 4000);
    },
    []
  );

  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const refreshPendingSyncCount = useCallback(async () => {
    const count = await ultraLocalDb.getPendingSyncCount();
    setPendingSyncCount(count);
  }, []);

  useEffect(() => {
    refreshPendingSyncCount();
  }, [refreshPendingSyncCount]);

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read failed for products:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Sync products into ultra-fast IndexedDB and in-memory hash index
  useEffect(() => {
    ultraLocalDb.loadMemoryCache(products);
    ultraLocalDb.bulkPutProducts(products).catch(() => {});
  }, [products]);

  // Categories
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CUSTOMERS;
  });

  // Sales
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read failed for sales:', e);
    }
    return generateHistoricSales();
  });

  // Dual Carts & Active Cart state
  const [activeCartId, setActiveCartId] = useState<CartId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CART_ID);
      if (saved === '1' || saved === '2') return Number(saved) as CartId;
    } catch {}
    return 1;
  });

  const [carts, setCarts] = useState<Record<CartId, SingleCartState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DUAL_CARTS);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Migration fallback from single cart
    let legacyCart: CartItem[] = [];
    let legacyCustId = 1;
    let legacyDiscount = 0;
    let legacyNote = '';
    try {
      const c = localStorage.getItem(STORAGE_KEYS.CART);
      if (c) legacyCart = JSON.parse(c);
      const cust = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      if (cust) legacyCustId = Number(cust);
      const d = localStorage.getItem(STORAGE_KEYS.DISCOUNT);
      if (d) legacyDiscount = Number(d);
      legacyNote = localStorage.getItem(STORAGE_KEYS.NOTE) || '';
    } catch {}

    return {
      1: {
        id: 1,
        name: 'Panier 1',
        items: legacyCart,
        customerId: legacyCustId,
        discountPercent: legacyDiscount,
        note: legacyNote,
      },
      2: {
        id: 2,
        name: 'Panier 2',
        items: [],
        customerId: 1,
        discountPercent: 0,
        note: '',
      },
    };
  });

  // Customer specific carts (pre-seeded with realistic articles for testing)
  const [customerCarts, setCustomerCarts] = useState<Record<number, CartItem[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_CARTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      2: [
        {
          product: INITIAL_PRODUCTS[0], // Huile d'Olive Vierge Extra 1L
          quantity: 2,
          unitPrice: INITIAL_PRODUCTS[0].price,
          discountPercent: 0,
        },
        {
          product: INITIAL_PRODUCTS[5], // Couscous Fin Traditionnel 1kg
          quantity: 3,
          unitPrice: INITIAL_PRODUCTS[5].price,
          discountPercent: 0,
        },
      ],
      3: [
        {
          product: INITIAL_PRODUCTS[11], // Écouteurs Sans Fil TWS Bluetooth 5.3
          quantity: 1,
          unitPrice: INITIAL_PRODUCTS[11].price,
          discountPercent: 5,
        },
        {
          product: INITIAL_PRODUCTS[10], // Chargeur Rapide USB-C 30W
          quantity: 2,
          unitPrice: INITIAL_PRODUCTS[10].price,
          discountPercent: 0,
        },
      ],
      4: [
        {
          product: INITIAL_PRODUCTS[13], // Baguette Traditionnelle Dorée
          quantity: 4,
          unitPrice: INITIAL_PRODUCTS[13].price,
          discountPercent: 0,
        },
        {
          product: INITIAL_PRODUCTS[14], // Croissant au Beurre AOP
          quantity: 6,
          unitPrice: INITIAL_PRODUCTS[14].price,
          discountPercent: 0,
        },
        {
          product: INITIAL_PRODUCTS[6], // Café Moulu Torréfié 250g
          quantity: 2,
          unitPrice: INITIAL_PRODUCTS[6].price,
          discountPercent: 0,
        },
      ],
    };
  });

  // Active cart convenience aliases
  const cart = carts[activeCartId].items;
  const selectedCustomerId = carts[activeCartId].customerId;
  const globalDiscountPercent = carts[activeCartId].discountPercent;
  const orderNote = carts[activeCartId].note;

  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Global Checkout & 80mm Print Preview state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTenderedInput, setAmountTenderedInput] = useState<string>('');

  // Supabase Config state
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(() =>
    supabaseSyncService.getConfig()
  );

  const updateSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfigState(cfg);
    supabaseSyncService.saveConfig(cfg);
  };

  const triggerSyncNow = async () => {
    const res = await supabaseSyncService.triggerSync(products, sales);
    await refreshPendingSyncCount();
    setSupabaseConfigState(supabaseSyncService.getConfig());
    return res;
  };

  // Thermal Printer Settings state
  const [printerSettings, setPrinterSettings] = useState<ThermalPrinterSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRINTER_SETTINGS);
      if (saved) {
        return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_PRINTER_SETTINGS;
  });

  const updatePrinterSettings = (newSettings: ThermalPrinterSettings) => {
    setPrinterSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(newSettings));
    } catch {}
  };

  // Cart Undo State & Recovery
  const [previousCart, setPreviousCart] = useState<CartItem[] | null>(null);
  const [canUndoClearCart, setCanUndoClearCart] = useState<boolean>(false);

  // LocalStorage sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DUAL_CARTS, JSON.stringify(carts));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CART_ID, String(activeCartId));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(carts[activeCartId].items));
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, String(carts[activeCartId].customerId));
      localStorage.setItem(STORAGE_KEYS.DISCOUNT, String(carts[activeCartId].discountPercent));
      localStorage.setItem(STORAGE_KEYS.NOTE, carts[activeCartId].note);
    } catch {}
  }, [carts, activeCartId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_CARTS, JSON.stringify(customerCarts));
    } catch {}
  }, [customerCarts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch {}
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch {}
  }, [customers]);

  // Setters for active cart metadata
  const setSelectedCustomerId = (id: number) => {
    setCarts((prev) => ({
      ...prev,
      [activeCartId]: {
        ...prev[activeCartId],
        customerId: id,
      },
    }));
  };

  const setGlobalDiscountPercent = (pct: number) => {
    setCarts((prev) => ({
      ...prev,
      [activeCartId]: {
        ...prev[activeCartId],
        discountPercent: pct,
      },
    }));
  };

  const setOrderNote = (note: string) => {
    setCarts((prev) => ({
      ...prev,
      [activeCartId]: {
        ...prev[activeCartId],
        note,
      },
    }));
  };

  // Switch between Panier 1 and Panier 2
  const switchCart = useCallback(
    (targetId?: CartId) => {
      setActiveCartId((curr) => {
        const nextId: CartId = targetId !== undefined ? targetId : curr === 1 ? 2 : 1;
        posSounds.playCartSwitch();
        const targetCart = carts[nextId];
        const count = targetCart.items.reduce((s, it) => s + it.quantity, 0);
        const cust = customers.find((c) => c.id === targetCart.customerId);
        const custLabel = cust ? cust.name : 'Client Comptoir';
        showToast(
          `🍃 Basculé sur Panier ${nextId} (${count} article${count > 1 ? 's' : ''} • ${custLabel}) [F3 / Alt+P]`,
          'info'
        );
        return nextId;
      });
    },
    [carts, customers, showToast]
  );

  // Load a customer's specific cart items into active cart or target cart
  const loadCustomerCart = useCallback(
    (customerId: number, targetCartId?: CartId) => {
      const cust = customers.find((c) => c.id === customerId);
      const targetId: CartId = targetCartId ?? activeCartId;
      const items = customerCarts[customerId] || [];

      setCarts((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          customerId,
          items: [...items],
        },
      }));

      if (activeCartId !== targetId) {
        setActiveCartId(targetId);
      }

      setActiveView('pos');
      setIsCartDrawerOpen(true);
      posSounds.playCartAdd();

      const totalItems = items.reduce((s, it) => s + it.quantity, 0);
      const totalAmount = items.reduce(
        (s, it) => s + it.unitPrice * it.quantity * (1 - it.discountPercent / 100),
        0
      );
      const formattedAmount = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(totalAmount) + ' DA';

      showToast(
        items.length > 0
          ? `🛒 Panier de ${cust?.name || 'Client'} affiché : ${totalItems} article(s) (${formattedAmount}) dans Panier ${targetId}`
          : `🍃 Panier de ${cust?.name || 'Client'} ouvert dans Panier ${targetId} (panier vide, prêt pour ajout)`,
        items.length > 0 ? 'success' : 'info'
      );
    },
    [activeCartId, customerCarts, customers, setActiveView, setIsCartDrawerOpen, showToast]
  );

  // Save current active cart items directly into customer's profile
  const saveCurrentCartToCustomer = useCallback(
    (customerId?: number) => {
      const targetCustId = customerId ?? carts[activeCartId].customerId;
      if (!targetCustId || targetCustId === 1) return;
      const items = [...carts[activeCartId].items];
      setCustomerCarts((prev) => ({
        ...prev,
        [targetCustId]: items,
      }));
      const cust = customers.find((c) => c.id === targetCustId);
      showToast(
        `🍃 Articles sauvegardés dans le panier de ${cust?.name || 'Client'} (${items.length} article(s))`,
        'success'
      );
    },
    [activeCartId, carts, customers, showToast]
  );

  const getCustomerCart = useCallback(
    (customerId: number) => {
      return customerCarts[customerId] || [];
    },
    [customerCarts]
  );

  const getCustomerCartCount = useCallback(
    (customerId: number) => {
      const items = customerCarts[customerId] || [];
      return items.reduce((sum, it) => sum + it.quantity, 0);
    },
    [customerCarts]
  );

  // Universal keyboard shortcut listener for dual cart switching (F3, F4, Alt+P, Alt+C, Alt+1, Alt+2)
  useEffect(() => {
    const handleUniversalKeyDown = (e: KeyboardEvent) => {
      // 0. F2: Raccourci dédié pour basculer de panier (Panier 1 <-> Panier 2)
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        switchCart();
        return;
      }

      // Tab: Basculer de panier lorsqu'on ne tape pas dans un champ texte
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !isInput) {
        e.preventDefault();
        e.stopPropagation();
        switchCart();
        return;
      }

      // 1. F3 or F4: Universal switch between Panier 1 and Panier 2
      if (e.key === 'F3' || e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        switchCart();
        return;
      }

      // 2. Alt + P or Alt + C: Universal switch
      if (e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        switchCart();
        return;
      }

      // 3. Alt + 1: Switch directly to Panier 1 (supports standard numbers, Numpad, and French AZERTY '&')
      if (
        e.altKey &&
        (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '&')
      ) {
        e.preventDefault();
        e.stopPropagation();
        switchCart(1);
        return;
      }

      // 4. Alt + 2: Switch directly to Panier 2 (supports standard numbers, Numpad, and French AZERTY 'é')
      if (
        e.altKey &&
        (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2' || e.key === 'é')
      ) {
        e.preventDefault();
        e.stopPropagation();
        switchCart(2);
        return;
      }
    };

    // Capture phase ensures shortcuts work reliably regardless of currently focused input
    window.addEventListener('keydown', handleUniversalKeyDown, true);
    return () => window.removeEventListener('keydown', handleUniversalKeyDown, true);
  }, [switchCart]);

  // Helper to update active cart items and keep customer cart synced
  const updateActiveCartItems = (updater: (prevItems: CartItem[]) => CartItem[]) => {
    setCarts((prev) => {
      const currentCart = prev[activeCartId];
      const newItems = updater(currentCart.items);
      const updated = {
        ...prev,
        [activeCartId]: {
          ...currentCart,
          items: newItems,
        },
      };
      // Keep customer cart in sync if a customer other than passager is selected
      if (currentCart.customerId && currentCart.customerId !== 1) {
        setCustomerCarts((custPrev) => ({
          ...custPrev,
          [currentCart.customerId]: newItems,
        }));
      }
      return updated;
    });
  };

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    updateActiveCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          product,
          quantity: next[existingIdx].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.max(1, quantity),
          unitPrice: product.price,
          discountPercent: 0,
        },
      ];
    });
  };

  // High-performance barcode scanner action
  const scanAndAddToCart = async (
    barcodeOrSku: string
  ): Promise<{ success: boolean; product?: Product; error?: string; lookupTimeMs: number }> => {
    const { product, lookupTimeMs } = await ultraLocalDb.lookupByBarcodeOrSku(barcodeOrSku);

    if (!product) {
      posSounds.playScanError();
      return {
        success: false,
        error: `Code "${barcodeOrSku}" introuvable`,
        lookupTimeMs,
      };
    }

    if (product.stock <= 0) {
      posSounds.playScanError();
      return {
        success: false,
        product,
        error: `Article "${product.name}" en rupture de stock!`,
        lookupTimeMs,
      };
    }

    // Success sound and instant add
    posSounds.playScanSuccess();
    addToCart(product, 1);

    return {
      success: true,
      product,
      lookupTimeMs,
    };
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    updateActiveCartItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: Math.floor(quantity) } : it))
    );
  };

  const incrementQuantity = (productId: number) => {
    updateActiveCartItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: it.quantity + 1 } : it))
    );
  };

  const decrementQuantity = (productId: number) => {
    updateActiveCartItems((prev) =>
      prev
        .map((it) => (it.product.id === productId ? { ...it, quantity: it.quantity - 1 } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const setItemDiscount = (productId: number, discountPercent: number) => {
    const clamped = Math.min(100, Math.max(0, discountPercent));
    updateActiveCartItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, discountPercent: clamped } : it))
    );
  };

  const removeFromCart = (productId: number) => {
    updateActiveCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = (saveForUndo = true) => {
    if (saveForUndo && cart.length > 0) {
      setPreviousCart([...cart]);
      setCanUndoClearCart(true);
      setTimeout(() => {
        setCanUndoClearCart(false);
      }, 6000);
    }
    setCarts((prev) => {
      const currentCart = prev[activeCartId];
      if (currentCart.customerId && currentCart.customerId !== 1) {
        setCustomerCarts((custPrev) => ({
          ...custPrev,
          [currentCart.customerId]: [],
        }));
      }
      return {
        ...prev,
        [activeCartId]: {
          ...currentCart,
          items: [],
          discountPercent: 0,
          note: '',
        },
      };
    });
  };

  const undoClearCart = () => {
    if (previousCart && previousCart.length > 0) {
      updateActiveCartItems(() => previousCart);
      setPreviousCart(null);
      setCanUndoClearCart(false);
      posSounds.playCartAdd();
    }
  };

  // Real-time calculation of totals for active cart and both carts
  const cartSummary: CartSummary = useMemo(() => {
    return computeCartSummary(carts[activeCartId].items, carts[activeCartId].discountPercent);
  }, [carts, activeCartId]);

  const cart1Summary: CartSummary = useMemo(() => {
    return computeCartSummary(carts[1].items, carts[1].discountPercent);
  }, [carts]);

  const cart2Summary: CartSummary = useMemo(() => {
    return computeCartSummary(carts[2].items, carts[2].discountPercent);
  }, [carts]);

  // Products CRUD
  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    updateActiveCartItems((prev) =>
      prev.map((it) =>
        it.product.id === updated.id ? { ...it, product: updated, unitPrice: updated.price } : it
      )
    );
  };

  const addProduct = (newProdData: Omit<Product, 'id'>): Product => {
    const nextId = Math.max(...products.map((p) => p.id), 0) + 1;
    const newProduct: Product = { ...newProdData, id: nextId };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  // Generate benchmark products to test millions-capability of IndexedDB
  const bulkAddBenchmarkProducts = async (count: number) => {
    const startId = Math.max(...products.map((p) => p.id), 0) + 1;
    const generated: Product[] = [];
    const catIds = [1, 2, 3, 4, 5, 6];

    for (let i = 0; i < count; i++) {
      const id = startId + i;
      const sku = `BENCH-${id.toString().padStart(6, '0')}`;
      const barcode = `613${id.toString().padStart(9, '0')}`;
      const catId = catIds[i % catIds.length];
      const price = 50 + (i % 500) * 10;
      const costPrice = Math.round(price * 0.7);

      generated.push({
        id,
        sku,
        name: `Article Test High-Performance #${id}`,
        categoryId: catId,
        price,
        costPrice,
        stock: 50 + (i % 100),
        taxRate: 0.19,
        lowStockThreshold: 10,
        barcode,
        isActive: true,
      });
    }

    const { timeMs } = await ultraLocalDb.bulkPutProducts([...products, ...generated]);
    setProducts((prev) => [...prev, ...generated]);
    return { count, timeMs };
  };

  const addCustomer = (newCustData: Omit<Customer, 'id'>): Customer => {
    const nextId = Math.max(...customers.map((c) => c.id), 0) + 1;
    const newCust: Customer = { ...newCustData, id: nextId, balanceDue: 0 };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  // Initiate transaction checkout
  const initiateCheckout = useCallback(() => {
    if (cart.length === 0) {
      posSounds.playScanError();
      return;
    }
    setAmountTenderedInput(cartSummary.totalTTC.toString());
    setIsCheckoutOpen(true);
  }, [cart.length, cartSummary.totalTTC]);

  // Complete checkout
  const completeSale = (
    paymentMethod: PaymentMethod,
    amountTendered?: number
  ): { success: boolean; sale?: Sale; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Le panier est vide.' };
    }

    const saleItems: SaleItem[] = cart.map((item) => {
      const lineNet = item.unitPrice * item.quantity * (1 - item.discountPercent / 100);
      const lineHT = lineNet / (1 + item.product.taxRate);

      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.product.taxRate,
        discountPercent: item.discountPercent,
        totalHT: Math.round(lineHT * 100) / 100,
        totalTTC: Math.round(lineNet * 100) / 100,
      };
    });

    const now = new Date();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const saleId = Math.max(...sales.map((s) => s.id), 0) + 1;
    const saleNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${saleId.toString().padStart(4, '0')}`;

    const tendered = amountTendered ?? cartSummary.totalTTC;
    const changeGiven = Math.max(0, tendered - cartSummary.totalTTC);

    const newSale: Sale = {
      id: saleId,
      saleNumber,
      customerId: selectedCustomerId,
      customerName: customer ? customer.name : 'Client Comptoir',
      items: saleItems,
      subtotalHT: cartSummary.subtotalHT,
      taxTotal: cartSummary.totalTax,
      discountTotal: cartSummary.discountAmount,
      totalTTC: cartSummary.totalTTC,
      paymentMethod,
      amountTendered: tendered,
      changeGiven,
      status: 'COMPLETED',
      createdAt: now.toISOString(),
      notes: orderNote || undefined,
    };

    // Deduct stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((ci) => ci.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity),
          };
        }
        return prod;
      })
    );

    // Save sale to local state and IndexedDB outbox
    setSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    ultraLocalDb.queueSaleForSync(newSale).then(() => refreshPendingSyncCount());

    // Close checkout and preview modals
    setIsCheckoutOpen(false);
    setIsPrintPreviewOpen(false);

    // Register chime
    posSounds.playPaymentSuccess();

    clearCart();
    return { success: true, sale: newSale };
  };

  // Recharts Daily Stats
  const dailyStats: DailyRevenueStat[] = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number; orders: number; unitsSold: number }>();
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, { revenue: 0, cost: 0, orders: 0, unitsSold: 0 });
    }

    sales
      .filter((s) => s.status !== 'CANCELLED')
      .forEach((s) => {
        const d = new Date(s.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (map.has(key)) {
          const cur = map.get(key)!;
          cur.revenue += s.totalTTC;
          cur.orders += 1;
          cur.unitsSold += s.items.reduce((sum, it) => sum + it.quantity, 0);
          cur.cost += s.totalTTC * 0.65;
        }
      });

    const result: DailyRevenueStat[] = [];
    const keys = Array.from(map.keys()).sort();

    keys.forEach((key) => {
      const val = map.get(key)!;
      const [year, month, day] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

      result.push({
        date: key,
        formattedDate,
        revenue: Math.round(val.revenue),
        cost: Math.round(val.cost),
        profit: Math.round(val.revenue - val.cost),
        orders: val.orders,
        unitsSold: val.unitsSold,
      });
    });

    return result;
  }, [sales]);

  // Today KPI (Local date boundary and cancelled sales exclusion)
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const todaySales = sales.filter((s) => {
      if (s.status === 'CANCELLED') return false;
      const d = new Date(s.createdAt);
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    });

    const revenue = todaySales.reduce((sum, s) => sum + s.totalTTC, 0);
    const salesCount = todaySales.length;
    const averageBasket = salesCount > 0 ? revenue / salesCount : 0;
    const itemsSold = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
      0
    );
    const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

    return {
      revenue: Math.round(revenue),
      salesCount,
      averageBasket: Math.round(averageBasket),
      itemsSold,
      lowStockCount,
    };
  }, [sales, products]);

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
    localStorage.removeItem(STORAGE_KEYS.NOTE);
    localStorage.removeItem(STORAGE_KEYS.DISCOUNT);
    localStorage.removeItem(STORAGE_KEYS.DUAL_CARTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CART_ID);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_CARTS);
    setProducts(INITIAL_PRODUCTS);
    setSales(generateHistoricSales());
    setCustomers(INITIAL_CUSTOMERS);
    setActiveCartId(1);
    setCarts({
      1: { id: 1, name: 'Panier 1', items: [], customerId: 1, discountPercent: 0, note: '' },
      2: { id: 2, name: 'Panier 2', items: [], customerId: 1, discountPercent: 0, note: '' },
    });
    setCustomerCarts({});
    refreshPendingSyncCount();
  };

  return (
    <PosContext.Provider
      value={{
        activeView,
        setActiveView,
        openNewProductModal,
        setOpenNewProductModal,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isOffline,
        setIsOffline,
        pendingSyncCount,
        refreshPendingSyncCount,
        products,
        categories,
        customers,
        sales,
        activeCartId,
        switchCart,
        carts,
        cart,
        cartSummary,
        cart1Summary,
        cart2Summary,
        selectedCustomerId,
        setSelectedCustomerId,
        globalDiscountPercent,
        setGlobalDiscountPercent,
        orderNote,
        setOrderNote,
        customerCarts,
        loadCustomerCart,
        saveCurrentCartToCustomer,
        getCustomerCart,
        getCustomerCartCount,
        addToCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        setItemDiscount,
        removeFromCart,
        clearCart,
        scanAndAddToCart,
        updateProduct,
        addProduct,
        bulkAddBenchmarkProducts,
        addCustomer,
        lastCompletedSale,
        setLastCompletedSale,
        selectedInvoice,
        setSelectedInvoice,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isPrintPreviewOpen,
        setIsPrintPreviewOpen,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        amountTenderedInput,
        setAmountTenderedInput,
        initiateCheckout,
        completeSale,
        dailyStats,
        todayStats,
        supabaseConfig,
        updateSupabaseConfig,
        triggerSyncNow,
        printerSettings,
        updatePrinterSettings,
        canUndoClearCart,
        undoClearCart,
        globalToast,
        showToast,
        dismissToast,
        resetDemoData,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};
