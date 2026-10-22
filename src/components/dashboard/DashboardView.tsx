import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { D3RevenueTrendChart } from './D3RevenueTrendChart';
import { DailyRevenueChart } from './DailyRevenueChart';
import { InventoryAlertWidget } from './InventoryAlertWidget';
import { MultiPeriodRevenueCard } from './MultiPeriodRevenueCard';
import { QuickAddCartFab } from './QuickAddCartFab';
import { PrintableReceiptModal } from '../receipt/PrintableReceiptModal';
import {
  TrendingUp,
  Layers,
  Store,
  Package,
  AlertTriangle,
  Calendar,
  Receipt,
  Banknote,
  CheckCircle2,
  Users,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Tag,
  Zap,
  ShoppingCart,
  PlusCircle,
  FileText,
  Eye,
  ShieldCheck,
  Percent,
  Target,
  Trophy,
  Sparkles,
  Flame,
} from 'lucide-react';
import type { PaymentMethod, Sale } from '../../types';

export type TimePeriod = 'today' | 'week' | 'month' | '2months' | '6months' | 'year' | 'custom';

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; textCls: string }> = {
  CASH: { label: 'Espèces', textCls: 'text-[#1f3d29]' },
  CARD: { label: 'Carte CIB', textCls: 'text-[#0284c7]' },
  TRANSFER: { label: 'Virement', textCls: 'text-purple-800' },
  CHEQUE: { label: 'Chèque', textCls: 'text-amber-800' },
};

const PERIOD_CONFIG: Record<
  TimePeriod,
  { label: string; rangeLabel: string; hint: string; chartDays: number }
> = {
  today: {
    label: "Aujourd'hui",
    rangeLabel: "Aujourd'hui",
    hint: 'Journée en cours (00h–24h)',
    chartDays: 7,
  },
  week: {
    label: '7 jours',
    rangeLabel: '7 derniers jours',
    hint: 'Semaine glissante',
    chartDays: 7,
  },
  month: {
    label: '30 jours',
    rangeLabel: '30 derniers jours',
    hint: 'Mois glissant complet',
    chartDays: 30,
  },
  '2months': {
    label: '2 mois',
    rangeLabel: '2 derniers mois (60j)',
    hint: 'Bimestre glissant',
    chartDays: 60,
  },
  '6months': {
    label: '6 mois',
    rangeLabel: '6 derniers mois (180j)',
    hint: 'Semestre glissant',
    chartDays: 180,
  },
  year: {
    label: '1 année',
    rangeLabel: '1 an glissant (365j)',
    hint: 'Exercice complet (12 mois)',
    chartDays: 365,
  },
  custom: {
    label: 'Date personnalisée',
    rangeLabel: 'Période personnalisée',
    hint: 'Intervalle sur mesure',
    chartDays: 30,
  },
};

const formatMoney = (val: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0DA';

const formatSaleDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
  tone?: 'default' | 'warning' | 'success' | 'forest' | 'wood';
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  hint,
  icon: Icon,
  tone = 'default',
  onClick,
}) => {
  const isWarning = tone === 'warning';
  const isSuccess = tone === 'success';

  const cardContent = (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#7d6f5f] truncate">
            {label}
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black font-serif-title font-mono tabular-nums tracking-tight leading-none mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis ${
              isWarning
                ? 'text-[#9a3412]'
                : isSuccess
                ? 'text-[#1b3d24]'
                : 'text-[#1f3d29]'
            }`}
            title={value}
          >
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-[#85522b] font-mono font-bold mt-1 truncate">
              {subValue}
            </div>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
            isWarning
              ? 'bg-[#faece1] text-[#a85a18] border border-[#f0c8a8]'
              : isSuccess
              ? 'bg-[#edf5ec] text-[#1b3d24] border border-[#b4dbb6]'
              : 'bg-[#faf7f0] text-[#1f3d29] border border-[#ded3be] group-hover:scale-105'
          }`}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="pt-2.5 border-t border-[#ede5d6] flex items-center justify-between text-[11px] text-[#7d6f5f] font-medium">
        <span className="truncate">{hint}</span>
        {onClick && (
          <span className="text-[#1f3d29] font-bold flex items-center gap-0.5 shrink-0">
            <span>Détails</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group bg-white p-5 rounded-3xl border border-[#ded3be] shadow-2xs hover:border-[#1f3d29]/40 hover:shadow-xs transition-all text-left w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1f3d29]"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="bg-white p-5 rounded-3xl border border-[#ded3be] shadow-2xs">
      {cardContent}
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const {
    sales,
    products,
    categories,
    customers,
    setActiveView,
    setOpenNewProductModal,
    isOffline,
  } = usePos();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [chartTab, setChartTab] = useState<'d3-trend' | 'bar-breakdown'>('d3-trend');
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const validSales = useMemo(
    () => sales.filter((s) => s.status !== 'CANCELLED'),
    [sales]
  );

  // Sales filtered by active period
  const periodSales = useMemo(() => {
    const now = new Date();

    if (selectedPeriod === 'custom') {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return validSales.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= start && d <= end;
      });
    }

    const cutoff = new Date(now);
    if (selectedPeriod === 'today') {
      cutoff.setHours(0, 0, 0, 0);
      return validSales.filter((s) => new Date(s.createdAt) >= cutoff);
    } else if (selectedPeriod === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      cutoff.setDate(now.getDate() - 30);
    } else if (selectedPeriod === '2months') {
      cutoff.setDate(now.getDate() - 60);
    } else if (selectedPeriod === '6months') {
      cutoff.setDate(now.getDate() - 180);
    } else if (selectedPeriod === 'year') {
      cutoff.setDate(now.getDate() - 365);
    }
    cutoff.setHours(0, 0, 0, 0);

    return validSales.filter((s) => new Date(s.createdAt) >= cutoff);
  }, [validSales, selectedPeriod, customStartDate, customEndDate]);

  // Key Metrics calculations
  const totalSalesRevenue = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + s.totalTTC, 0);
  }, [periodSales]);

  const activeCustomersCount = useMemo(() => {
    const customerIdsWithSales = new Set(
      validSales.filter((s) => s.customerId).map((s) => s.customerId)
    );
    return Math.max(customerIdsWithSales.size, customers.length);
  }, [validSales, customers]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.lowStockThreshold).length;
  }, [products]);

  const averageBasket = useMemo(() => {
    return periodSales.length > 0 ? Math.round(totalSalesRevenue / periodSales.length) : 0;
  }, [periodSales, totalSalesRevenue]);

  // Today's total sales revenue & count (calendar day 00h-24h)
  const { todaySalesRevenue, todaySalesCount } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayList = validSales.filter((s) => new Date(s.createdAt) >= startOfToday);
    const rev = todayList.reduce((acc, s) => acc + s.totalTTC, 0);
    return { todaySalesRevenue: rev, todaySalesCount: todayList.length };
  }, [validSales]);

  // Daily sales target state with localStorage persistence
  const [dailySalesTarget, setDailySalesTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pos_daily_sales_target');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 50000; // default 50 000 DA
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');

  const handleUpdateTarget = (val: number) => {
    if (val > 0) {
      setDailySalesTarget(val);
      try {
        localStorage.setItem('pos_daily_sales_target', String(val));
      } catch {}
    }
    setIsEditingTarget(false);
    setCustomTargetInput('');
  };

  const targetPercentage = Math.min(100, Math.round((todaySalesRevenue / Math.max(1, dailySalesTarget)) * 100));
  const rawPercentage = Math.round((todaySalesRevenue / Math.max(1, dailySalesTarget)) * 100);
  const remainingToTarget = Math.max(0, dailySalesTarget - todaySalesRevenue);
  const isTargetAchieved = todaySalesRevenue >= dailySalesTarget;

  // Top 5 products
  const topProducts = useMemo(() => {
    const map = new Map<
      number,
      { name: string; sku: string; units: number; revenue: number; imageUrl?: string }
    >();

    const prodMap = new Map(products.map((p) => [p.id, p]));

    periodSales.forEach((s) =>
      s.items.forEach((it) => {
        const fullProd = prodMap.get(it.productId);
        const cur = map.get(it.productId) ?? {
          name: it.productName,
          sku: it.sku,
          units: 0,
          revenue: 0,
          imageUrl: fullProd?.imageUrl,
        };
        cur.units += it.quantity;
        cur.revenue += it.totalTTC;
        map.set(it.productId, cur);
      })
    );
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [periodSales, products]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const productCategory = new Map(products.map((p) => [p.id, p.categoryId]));
    const revenueByCat = new Map<number, number>();

    periodSales.forEach((sale) =>
      sale.items.forEach((item) => {
        const catId = productCategory.get(item.productId);
        if (catId !== undefined) {
          revenueByCat.set(catId, (revenueByCat.get(catId) ?? 0) + item.totalTTC);
        }
      })
    );

    const total = Array.from(revenueByCat.values()).reduce((a, b) => a + b, 0);
    return categories
      .map((cat) => {
        const revenue = revenueByCat.get(cat.id) ?? 0;
        return {
          id: cat.id,
          name: cat.name,
          revenue,
          percentage: total > 0 ? Math.round((revenue / total) * 100) : 0,
        };
      })
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [categories, products, periodSales]);

  const recentSales = periodSales.slice(0, 5);
  const activePeriodConfig = PERIOD_CONFIG[selectedPeriod];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20">
      {/* ============================================================
          TOP LEVEL BAR: Store Status, Title & Period Filter
          ============================================================ */}
      <div className="bg-[#fdfbf7] p-5 sm:p-6 rounded-3xl border border-[#ded3be] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#edf5ec] text-[#1b3d24] border border-[#b4dbb6]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#234931]" />
                <span>Caisse Certifiée</span>
              </span>
              <span className="text-xs text-[#7d6f5f] font-medium hidden sm:inline">
                • {isOffline ? 'Mode Hors-ligne (IndexedDB)' : 'Cloud Synchronisé (Dual Supabase + Neon)'}
              </span>
              <span className="text-xs text-[#7d6f5f] font-medium hidden sm:inline">
                • {products.length} articles actifs
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1f3d29] font-serif-title tracking-tight flex items-center gap-2">
              <span>🍃</span>
              <span>Tableau de Bord Commercial</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#605547] font-medium">
              Supervision des encaissements, indicateurs prioritaires et accès rapide aux modules de caisse
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('pos')}
              className="touch-btn min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#1f3d29] hover:bg-[#16311f] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Store className="w-4 h-4 text-[#86efac]" />
              <span>Ouvrir Caisse POS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenNewProductModal(true);
                setActiveView('catalog');
              }}
              className="touch-btn min-h-[44px] px-4 py-2.5 rounded-2xl bg-white hover:bg-[#faf7f0] text-[#1f3d29] border border-[#ded3be] font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#85522b]" />
              <span>+ Produit</span>
            </button>
          </div>
        </div>

        {/* Period Chips Selector */}
        <div className="pt-3 border-t border-[#ded3be] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7d6f5f] shrink-0 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#1f3d29]" />
              <span>Période :</span>
            </span>

            {(['today', 'week', 'month', '2months', '6months', 'year', 'custom'] as TimePeriod[]).map((periodKey) => {
              const isSelected = selectedPeriod === periodKey;
              const config = PERIOD_CONFIG[periodKey];

              return (
                <button
                  key={periodKey}
                  type="button"
                  onClick={() => setSelectedPeriod(periodKey)}
                  className={`touch-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1f3d29] text-white shadow-xs font-black scale-100 ring-2 ring-[#86efac]/40'
                      : 'bg-white hover:bg-[#faf7f0] text-[#605547] border border-[#ded3be]'
                  }`}
                >
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#7d6f5f] font-medium shrink-0 flex items-center gap-2">
            <span>Intervalle actif :</span>
            <strong className="text-[#1f3d29] bg-[#ede5d6] px-2.5 py-1 rounded-xl font-bold font-mono">
              {activePeriodConfig.rangeLabel}
            </strong>
          </div>
        </div>
      </div>

      {/* ============================================================
          1. TOP: 'KEY METRICS' SECTION (Total Sales, Active Customers, Low-Stock Alerts)
          ============================================================ */}
      <section aria-labelledby="key-metrics-title" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1f3d29] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4 text-[#86efac]" />
            </div>
            <div>
              <h2 id="key-metrics-title" className="font-bold text-base sm:text-lg text-[#1f3d29] font-serif-title leading-tight">
                Indicateurs Clés • Key Metrics
              </h2>
              <p className="text-xs text-[#7d6f5f]">
                Métriques prioritaires consolidées sur {activePeriodConfig.rangeLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Key Metric 1: Total Sales */}
          <KpiCard
            label="Total des Ventes (CA Net)"
            value={formatMoney(totalSalesRevenue)}
            subValue={`${periodSales.length} ticket${periodSales.length > 1 ? 's' : ''} émis`}
            hint={activePeriodConfig.hint}
            icon={Banknote}
            tone="default"
            onClick={() => setActiveView('sales')}
          />

          {/* Key Metric 2: Active Customers */}
          <KpiCard
            label="Clients Actifs"
            value={String(activeCustomersCount)}
            subValue={`${customers.length} fiches répertoriées`}
            hint="Comptes avec transactions enregistrées"
            icon={Users}
            tone="default"
            onClick={() => setActiveView('customers')}
          />

          {/* Key Metric 3: Low-Stock Alerts */}
          <KpiCard
            label="Alertes Stock Critique"
            value={String(lowStockCount)}
            subValue={lowStockCount > 0 ? 'Articles sous seuil minimal' : 'Stock 100% conforme'}
            hint={lowStockCount > 0 ? 'Réapprovisionnement requis' : 'Aucune rupture'}
            icon={AlertTriangle}
            tone={lowStockCount > 0 ? 'warning' : 'success'}
            onClick={() => setActiveView('catalog')}
          />

          {/* Key Metric 4: Average Basket */}
          <KpiCard
            label="Panier Moyen"
            value={formatMoney(averageBasket)}
            subValue={`${periodSales.length} transaction${periodSales.length > 1 ? 's' : ''}`}
            hint="Dépense moyenne par passage en caisse"
            icon={Percent}
            tone="default"
          />
        </div>

        {/* Daily Sales Target Progress Bar Widget */}
        <div className="bg-white rounded-3xl border border-[#ded3be] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isTargetAchieved
                    ? 'bg-[#edf5ec] text-[#1b3d24] border border-[#b4dbb6]'
                    : 'bg-[#faf7f0] text-[#85522b] border border-[#ded3be]'
                }`}
              >
                {isTargetAchieved ? (
                  <Trophy className="w-5 h-5 text-[#234931]" />
                ) : (
                  <Target className="w-5 h-5 text-[#85522b]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-[#1f3d29] font-serif-title">
                    Objectif de Ventes du Jour • Daily Sales Target
                  </h3>
                  {isTargetAchieved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#edf5ec] text-[#166534] border border-[#86efac]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Objectif Atteint !
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#faf7f0] text-[#85522b] border border-[#ded3be]">
                      {rawPercentage}% réalisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7d6f5f] mt-0.5">
                  Progression du chiffre d&apos;affaires aujourd&apos;hui ({todaySalesCount} transaction{todaySalesCount > 1 ? 's' : ''})
                </p>
              </div>
            </div>

            {/* Quick Target Selectors / Custom Target */}
            <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto">
              <span className="text-[11px] font-bold text-[#7d6f5f] uppercase tracking-wider mr-1 hidden sm:inline">
                Cible :
              </span>
              {[25000, 50000, 100000, 150000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdateTarget(preset)}
                  className={`touch-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    dailySalesTarget === preset && !isEditingTarget
                      ? 'bg-[#1f3d29] text-white shadow-2xs font-black ring-1 ring-[#86efac]/40'
                      : 'bg-[#faf7f0] hover:bg-[#ede5d6] text-[#605547] border border-[#ded3be]'
                  }`}
                >
                  {preset / 1000}k DA
                </button>
              ))}

              {!isEditingTarget ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomTargetInput(String(dailySalesTarget));
                    setIsEditingTarget(true);
                  }}
                  className="touch-btn px-2.5 py-1 rounded-xl text-xs font-medium text-[#85522b] hover:bg-[#faf7f0] border border-dashed border-[#ded3be] transition-colors cursor-pointer"
                  title="Définir un montant personnalisé"
                >
                  Autre...
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={customTargetInput}
                    onChange={(e) => setCustomTargetInput(e.target.value)}
                    placeholder="Montant DA"
                    className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#1f3d29] rounded-xl focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = Number(customTargetInput);
                      if (num > 0) handleUpdateTarget(num);
                    }}
                    className="px-2.5 py-1 bg-[#1f3d29] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#16311f]"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTarget(false)}
                    className="px-2 py-1 text-xs text-[#7d6f5f] hover:text-[#2c241c] cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Target Amount Stats and Percentage Header */}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1 border-t border-[#f0e8dc]">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-serif-title font-mono text-[#1f3d29] tracking-tight">
                {formatMoney(todaySalesRevenue)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#7d6f5f] font-mono">
                / {formatMoney(dailySalesTarget)} fixé
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isTargetAchieved ? (
                <span className="text-xs font-bold text-[#166534] bg-[#edf5ec] px-3 py-1 rounded-xl border border-[#b4dbb6]">
                  Dépassement de +{formatMoney(todaySalesRevenue - dailySalesTarget)}
                </span>
              ) : (
                <span className="text-xs font-bold text-[#85522b] bg-[#faf7f0] px-3 py-1 rounded-xl border border-[#ded3be]">
                  Reste {formatMoney(remainingToTarget)}
                </span>
              )}
              <span
                className={`text-base sm:text-lg font-black font-mono px-3 py-0.5 rounded-xl border ${
                  isTargetAchieved
                    ? 'bg-[#1b3d24] text-[#86efac] border-[#1b3d24]'
                    : 'bg-[#faf7f0] text-[#1f3d29] border-[#ded3be]'
                }`}
              >
                {rawPercentage}%
              </span>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="space-y-1.5">
            <div
              role="progressbar"
              aria-valuenow={todaySalesRevenue}
              aria-valuemin={0}
              aria-valuemax={dailySalesTarget}
              aria-label={`Progression de l'objectif de vente quotidien: ${rawPercentage}%`}
              className="h-4.5 sm:h-5 bg-[#ede5d6] rounded-full overflow-hidden p-0.5 border border-[#ded3be] relative shadow-inner"
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                  isTargetAchieved
                    ? 'bg-linear-to-r from-[#1f3d29] via-[#234931] to-[#15803d]'
                    : 'bg-linear-to-r from-[#85522b] via-[#1f3d29] to-[#234931]'
                }`}
                style={{ width: `${targetPercentage}%` }}
              >
                {/* Visual Shimmer Bar */}
                <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
              </div>
            </div>

            {/* Milestones markers */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#7d6f5f] px-1">
              <span>0 DA</span>
              <span className="hidden sm:inline">25% ({formatMoney(dailySalesTarget * 0.25)})</span>
              <span>50% ({formatMoney(dailySalesTarget * 0.5)})</span>
              <span className="hidden sm:inline">75% ({formatMoney(dailySalesTarget * 0.75)})</span>
              <span className="font-bold text-[#1f3d29]">100% ({formatMoney(dailySalesTarget)})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Stock Alert banner if low-stock items exist */}
      {lowStockCount > 0 && <InventoryAlertWidget />}

      {/* ============================================================
          2. CENTER: 'QUICK ACCESS' GRID
          ============================================================ */}
      <section aria-labelledby="quick-access-title" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#85522b] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 text-[#fcdbb6]" />
            </div>
            <div>
              <h2 id="quick-access-title" className="font-bold text-base sm:text-lg text-[#1f3d29] font-serif-title leading-tight">
                Accès Rapide • Quick Access
              </h2>
              <p className="text-xs text-[#7d6f5f]">
                Raccourcis vers vos actions prioritaires du quotidien
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: New Sale */}
          <button
            type="button"
            onClick={() => setActiveView('pos')}
            className="p-5 text-left rounded-3xl bg-white border border-[#ded3be] hover:border-[#1f3d29] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f3d29] bg-[#edf5ec] px-2.5 py-0.5 rounded-full border border-[#b4dbb6]">
                  Caisse POS
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#1f3d29] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-4 h-4 text-[#86efac]" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#1f3d29] font-serif-title">
                Nouvelle Vente
              </h3>
              <p className="text-xs text-[#7d6f5f] leading-relaxed">
                Ouvrir le terminal de caisse, scanner des articles et enregistrer un encaissement.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#ede5d6] flex items-center justify-between text-xs font-bold text-[#1f3d29]">
              <span>Lancer la caisse</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 2: Add Product */}
          <button
            type="button"
            onClick={() => {
              setOpenNewProductModal(true);
              setActiveView('catalog');
            }}
            className="p-5 text-left rounded-3xl bg-white border border-[#ded3be] hover:border-[#85522b] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85522b] bg-[#faece1] px-2.5 py-0.5 rounded-full border border-[#f0c8a8]">
                  Inventaire
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#85522b] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4 text-[#fcdbb6]" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#85522b] font-serif-title">
                Ajouter un Produit
              </h3>
              <p className="text-xs text-[#7d6f5f] leading-relaxed">
                Créer un article avec code-barres, prix de vente DZD et seuil d'alerte.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#ede5d6] flex items-center justify-between text-xs font-bold text-[#85522b]">
              <span>Créer une référence</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 3: Reports / Sales History */}
          <button
            type="button"
            onClick={() => setActiveView('sales')}
            className="p-5 text-left rounded-3xl bg-white border border-[#ded3be] hover:border-[#1f3d29] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f3d29] bg-[#edf5ec] px-2.5 py-0.5 rounded-full border border-[#b4dbb6]">
                  Comptabilité
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#1f3d29] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 text-[#86efac]" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#1f3d29] font-serif-title">
                Journal des Factures
              </h3>
              <p className="text-xs text-[#7d6f5f] leading-relaxed">
                Consulter les tickets enregistrés, réimprimer les reçus 80mm et analyser le journal.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#ede5d6] flex items-center justify-between text-xs font-bold text-[#1f3d29]">
              <span>Voir les factures</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 4: Customer Directory */}
          <button
            type="button"
            onClick={() => setActiveView('customers')}
            className="p-5 text-left rounded-3xl bg-white border border-[#ded3be] hover:border-[#1f3d29] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f3d29] bg-[#edf5ec] px-2.5 py-0.5 rounded-full border border-[#b4dbb6]">
                  Fidélité CRM
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#1f3d29] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4 text-[#86efac]" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#1f3d29] font-serif-title">
                Fichier Clients
              </h3>
              <p className="text-xs text-[#7d6f5f] leading-relaxed">
                Gérer les coordonnées clients, soldes fidélité et paniers clients en attente.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#ede5d6] flex items-center justify-between text-xs font-bold text-[#1f3d29]">
              <span>Ouvrir les clients</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* ============================================================
          3. BOTTOM: REVENUE CHARTS (TODAY, MONTH, SIX MONTHS) & ANALYTIC CONTAINERS
          ============================================================ */}
      <section aria-labelledby="revenue-charts-title" className="space-y-6 pt-2">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 border-b border-[#ded3be] pb-3">
          <div>
            <h2 id="revenue-charts-title" className="font-serif-title font-black text-xl sm:text-2xl text-[#1f3d29] flex items-center gap-2">
              <span>📊</span>
              <span>Analyses des Recettes & Graphiques Financiers</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#7d6f5f]">
              Cartes uniformes haute visibilité pour Aujourd'hui, Ce Mois et Six Mois, complétées par les courbes interactives
            </p>
          </div>
        </div>

        {/* UNIFORM HIGH-CONTRAST REVENUE CARDS: Today, Month, Six Months */}
        <div className="responsive-container">
          <MultiPeriodRevenueCard
            sales={sales}
            activePeriod={selectedPeriod}
            onSelectPeriod={(period) => setSelectedPeriod(period)}
            onNavigateToSales={() => setActiveView('sales')}
          />
        </div>

        {/* RESPONSIVE CHARTS CONTAINER: D3 Trend & Daily Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#ded3be] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede5d6] pb-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#1f3d29] font-serif-title flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1f3d29]" />
                <span>Courbe Temporelle des Recettes ({activePeriodConfig.label})</span>
              </h3>
              <p className="text-xs text-[#7d6f5f]">
                Visualisation interactive des flux de caisse et histogramme quotidien
              </p>
            </div>

            {/* Chart mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#faf7f0] rounded-xl border border-[#ded3be] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartTab('d3-trend')}
                className={`touch-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartTab === 'd3-trend'
                    ? 'bg-[#1f3d29] text-white shadow-xs'
                    : 'text-[#605547] hover:text-[#1f3d29]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Courbe D3 ({activePeriodConfig.chartDays}j)</span>
              </button>

              <button
                type="button"
                onClick={() => setChartTab('bar-breakdown')}
                className={`touch-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartTab === 'bar-breakdown'
                    ? 'bg-[#1f3d29] text-white shadow-xs'
                    : 'text-[#605547] hover:text-[#1f3d29]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Histogramme</span>
              </button>
            </div>
          </div>

          <div className="min-h-[280px]">
            {chartTab === 'd3-trend' ? (
              <D3RevenueTrendChart days={activePeriodConfig.chartDays} />
            ) : (
              <DailyRevenueChart />
            )}
          </div>
        </div>

        {/* OPERATIONAL BREAKDOWN (2 COLUMNS): Top Products + Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Left: Top 5 Best Sellers & Category Breakdown */}
          <div className="space-y-5">
            <section className="bg-white p-5 rounded-3xl border border-[#ded3be] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#ede5d6] pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1f3d29] font-serif-title flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#85522b]" />
                    <span>Articles les Plus Vendus ({activePeriodConfig.label})</span>
                  </h3>
                  <p className="text-[11px] text-[#7d6f5f]">Classement par volume de ventes</p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('catalog')}
                  className="text-xs font-bold text-[#1f3d29] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Catalogue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#877a6b]">
                  Aucun article vendu sur cette période.
                </div>
              ) : (
                <ul className="divide-y divide-[#ede5d6]">
                  {topProducts.map((p, idx) => (
                    <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#faf7f0] text-[#1f3d29] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#ded3be]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1f3d29] truncate">{p.name}</div>
                          <div className="text-[10px] text-[#7d6f5f] font-mono">
                            {p.sku} • {p.units} unité{p.units > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-[#85522b]">
                          {formatMoney(p.revenue)}
                        </div>
                        <div className="text-[10px] text-[#7d6f5f]">Chiffre généré</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Category Split */}
            <section className="bg-white p-5 rounded-3xl border border-[#ded3be] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#ede5d6] pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1f3d29] font-serif-title flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#1f3d29]" />
                    <span>Répartition par Rayon & Catégorie</span>
                  </h3>
                  <p className="text-[11px] text-[#7d6f5f]">Contribution au chiffre d'affaires</p>
                </div>
              </div>

              {categoryStats.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#877a6b]">
                  Aucune vente par rayon disponible.
                </div>
              ) : (
                <ul className="space-y-3 pt-1">
                  {categoryStats.map((c) => (
                    <li key={c.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1f3d29]">{c.name}</span>
                        <span className="font-mono font-bold text-[#1f3d29]">
                          {formatMoney(c.revenue)}{' '}
                          <span className="text-[#7d6f5f] font-normal">({c.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#ede5d6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1f3d29] transition-all duration-300"
                          style={{ width: `${Math.max(4, c.percentage)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right: Recent Transactions (with 1-click Thermal Receipt Preview) */}
          <div className="space-y-5">
            <section className="bg-white p-5 rounded-3xl border border-[#ded3be] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#ede5d6] pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1f3d29] font-serif-title flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#1f3d29]" />
                    <span>Dernières Transactions ({activePeriodConfig.label})</span>
                  </h3>
                  <p className="text-[11px] text-[#7d6f5f]">Aperçu ticket thermique en un clic</p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('sales')}
                  className="text-xs font-bold text-[#1f3d29] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Journal complet</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#877a6b]">
                  Aucune transaction récente enregistrée.
                </div>
              ) : (
                <ul className="divide-y divide-[#ede5d6]">
                  {recentSales.map((s) => {
                    const payInfo = PAYMENT_LABELS[s.paymentMethod] || { label: 'Autre', textCls: 'text-[#1f3d29]' };
                    const totalItems = s.items.reduce((sum, it) => sum + it.quantity, 0);

                    return (
                      <li
                        key={s.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#faf7f0] rounded-xl px-1.5 transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1f3d29]">
                              {s.saleNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#faf7f0] border border-[#ded3be] ${payInfo.textCls}`}>
                              {payInfo.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7d6f5f] flex items-center gap-1.5 truncate">
                            <span>{s.customerName || 'Client comptoir'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#a49685]" />
                              {formatSaleDate(s.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-black text-sm text-[#1f3d29]">
                              {formatMoney(s.totalTTC)}
                            </div>
                            <div className="text-[10px] text-[#7d6f5f]">
                              {totalItems} article{totalItems > 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Thermal Receipt Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewSale(s)}
                            className="touch-btn p-2 rounded-xl bg-[#faf7f0] hover:bg-[#1f3d29] hover:text-white text-[#1f3d29] border border-[#ded3be] transition-colors cursor-pointer"
                            title="Aperçu & impression du ticket thermique"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* ============================================================
          FLOATING ACTION BUTTON: Instant 1-click cart addition
          ============================================================ */}
      <QuickAddCartFab />

      {/* ============================================================
          THERMAL RECEIPT PREVIEW MODAL
          ============================================================ */}
      {previewSale && (
        <PrintableReceiptModal
          sale={previewSale}
          onClose={() => setPreviewSale(null)}
        />
      )}
    </div>
  );
};
