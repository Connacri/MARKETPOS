import React, { useMemo } from 'react';
import { Sale } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Banknote,
  CreditCard,
  Receipt,
  ShoppingBag,
  Sparkles,
  PieChart,
  Percent,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import type { TimePeriod } from './DashboardView';

interface MultiPeriodRevenueCardProps {
  sales: Sale[];
  activePeriod: TimePeriod;
  onSelectPeriod: (period: TimePeriod) => void;
  onNavigateToSales: () => void;
}

export type RevenuePeriodKey = 'today' | 'month' | '6months';

interface UniformPeriodCardData {
  id: RevenuePeriodKey;
  targetPeriod: TimePeriod;
  title: string;
  badge: string;
  timeframe: string;
  comparisonLabel: string;
  revenue: number;
  count: number;
  avgBasket: number;
  itemsCount: number;
  cashRevenue: number;
  cardRevenue: number;
  otherRevenue: number;
  growthPct: number | null;
  sparkline: number[]; // 10 bars normalized 0..100
}

const formatMoneyPlain = (val: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Math.round(val));

const formatMoney = (val: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0DA';

export const MultiPeriodRevenueCard: React.FC<MultiPeriodRevenueCardProps> = ({
  sales,
  activePeriod,
  onSelectPeriod,
  onNavigateToSales,
}) => {
  const validSales = useMemo(
    () => sales.filter((s) => s.status !== 'CANCELLED'),
    [sales]
  );

  // Compute uniform metrics for: Aujourd'hui, Ce Mois (30j), et Six Mois (180j)
  const cardsData: UniformPeriodCardData[] = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const startOfToday = new Date(todayY, todayM, todayD, 0, 0, 0, 0).getTime();
    const endOfToday = new Date(todayY, todayM, todayD, 23, 59, 59, 999).getTime();

    const startOfYesterday = new Date(todayY, todayM, todayD - 1, 0, 0, 0, 0).getTime();
    const endOfYesterday = new Date(todayY, todayM, todayD - 1, 23, 59, 59, 999).getTime();

    const msPerDay = 86400000;
    const nowTime = now.getTime();

    const buildCard = (
      id: RevenuePeriodKey,
      targetPeriod: TimePeriod,
      title: string,
      badge: string,
      timeframe: string,
      comparisonLabel: string,
      currentSales: Sale[],
      priorSales: Sale[],
      daysSpan: number
    ): UniformPeriodCardData => {
      const revenue = currentSales.reduce((acc, s) => acc + s.totalTTC, 0);
      const priorRevenue = priorSales.reduce((acc, s) => acc + s.totalTTC, 0);
      const count = currentSales.length;
      const avgBasket = count > 0 ? Math.round(revenue / count) : 0;
      const itemsCount = currentSales.reduce(
        (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
        0
      );

      let cashRevenue = 0;
      let cardRevenue = 0;
      let otherRevenue = 0;
      currentSales.forEach((s) => {
        if (s.paymentMethod === 'CASH') cashRevenue += s.totalTTC;
        else if (s.paymentMethod === 'CARD') cardRevenue += s.totalTTC;
        else otherRevenue += s.totalTTC;
      });

      let growthPct: number | null = null;
      if (priorRevenue > 0) {
        growthPct = Math.round(((revenue - priorRevenue) / priorRevenue) * 1000) / 10;
      } else if (revenue > 0 && priorRevenue === 0) {
        growthPct = 100;
      }

      // Generate 10-point normalized sparkline
      const sparkBins = 10;
      const binDuration = Math.max(1, (daysSpan * msPerDay) / sparkBins);
      const binTotals = new Array(sparkBins).fill(0);
      const earliest = nowTime - daysSpan * msPerDay;

      currentSales.forEach((s) => {
        const t = new Date(s.createdAt).getTime();
        const diff = t - earliest;
        if (diff >= 0) {
          const idx = Math.min(sparkBins - 1, Math.max(0, Math.floor(diff / binDuration)));
          binTotals[idx] += s.totalTTC;
        }
      });

      const maxBin = Math.max(...binTotals, 1);
      const sparkline = binTotals.map((val) => Math.max(12, Math.round((val / maxBin) * 100)));

      return {
        id,
        targetPeriod,
        title,
        badge,
        timeframe,
        comparisonLabel,
        revenue,
        count,
        avgBasket,
        itemsCount,
        cashRevenue,
        cardRevenue,
        otherRevenue,
        growthPct,
        sparkline,
      };
    };

    // 1. Aujourd'hui
    const todaySales = validSales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= startOfToday && t <= endOfToday;
    });
    const yesterdaySales = validSales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= startOfYesterday && t <= endOfYesterday;
    });

    // 2. 1 Mois (30 jours)
    const cutoff30d = nowTime - 30 * msPerDay;
    const cutoff60d = nowTime - 60 * msPerDay;
    const monthSales = validSales.filter((s) => new Date(s.createdAt).getTime() >= cutoff30d);
    const priorMonthSales = validSales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= cutoff60d && t < cutoff30d;
    });

    // 3. 6 Mois (180 jours)
    const cutoff180d = nowTime - 180 * msPerDay;
    const cutoff360d = nowTime - 360 * msPerDay;
    const sixMonthsSales = validSales.filter((s) => new Date(s.createdAt).getTime() >= cutoff180d);
    const priorSixMonthsSales = validSales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= cutoff360d && t < cutoff180d;
    });

    return [
      buildCard(
        'today',
        'today',
        "Recette Aujourd'hui",
        '24 Heures',
        'Journée en cours',
        'vs hier',
        todaySales,
        yesterdaySales,
        1
      ),
      buildCard(
        'month',
        'month',
        'Recette du Mois',
        '30 Jours',
        'Mois glissant complet',
        'vs mois précédent',
        monthSales,
        priorMonthSales,
        30
      ),
      buildCard(
        '6months',
        '6months',
        'Recette à 6 Mois',
        'Semestre (180j)',
        'Six derniers mois',
        'vs semestre précédent',
        sixMonthsSales,
        priorSixMonthsSales,
        180
      ),
    ];
  }, [validSales]);

  return (
    <div className="space-y-4">
      {/* Section Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h3 className="font-serif-title font-black text-lg sm:text-xl text-[#1f3d29] flex items-center gap-2">
            <span>🍃</span>
            <span>Cartes de Recettes Comparatives (Aujourd'hui • 1 Mois • 6 Mois)</span>
          </h3>
          <p className="text-xs text-[#605547] font-medium">
            Synthèse financière normalisée à fort contraste et totaux centrés à haute visibilité
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToSales}
          className="touch-btn text-xs font-bold text-[#1f3d29] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>Consulter le journal des factures</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* UNIFORM 3-CARD HIGH-CONTRAST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {cardsData.map((card) => {
          const isSelected = activePeriod === card.targetPeriod;

          const cashShare =
            card.revenue > 0 ? Math.round((card.cashRevenue / card.revenue) * 100) : 0;
          const cardShare =
            card.revenue > 0 ? Math.round((card.cardRevenue / card.revenue) * 100) : 0;
          const otherShare = Math.max(0, 100 - cashShare - cardShare);

          return (
            <div
              key={card.id}
              onClick={() => onSelectPeriod(card.targetPeriod)}
              className={`rounded-3xl border-2 transition-all duration-200 cursor-pointer p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#ffffff] border-[#1f3d29] ring-2 ring-[#86efac]/40 shadow-md scale-[1.01]'
                  : 'bg-[#fdfbf7] hover:bg-white border-[#ded3be] hover:border-[#85522b]/50 hover:shadow-xs'
              }`}
            >
              {/* Subtle themed watermark */}
              <div className="absolute right-3 -bottom-4 opacity-[0.03] select-none pointer-events-none text-[#1f3d29]">
                <Banknote className="w-40 h-40" />
              </div>

              {/* 1. Card Header: Title, Period Badge & Growth Rate */}
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#85522b] bg-[#faece1] px-2.5 py-0.5 rounded-full border border-[#f0c8a8]">
                    {card.badge}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-[#1f3d29] font-serif-title pt-1">
                    {card.title}
                  </h4>
                  <div className="text-[11px] text-[#7d6f5f] font-medium">{card.timeframe}</div>
                </div>

                {card.growthPct !== null ? (
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0 border ${
                      card.growthPct >= 0
                        ? 'bg-[#edf5ec] text-[#1b3d24] border-[#b4dbb6]'
                        : 'bg-[#faece1] text-[#a85a18] border-[#f0c8a8]'
                    }`}
                    title={`${card.growthPct}% ${card.comparisonLabel}`}
                  >
                    {card.growthPct >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#234931]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#a85a18]" />
                    )}
                    <span>
                      {card.growthPct >= 0 ? '+' : ''}
                      {card.growthPct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#877a6b] font-mono font-bold bg-[#ede5d6] px-2 py-0.5 rounded-md">
                    Base
                  </span>
                )}
              </div>

              {/* 2. PRIMARY TOTAL: LARGE, BOLD, CENTERED NUMBER USING 'font-serif-title' */}
              <div className="text-center py-4 px-2 my-1 bg-gradient-to-b from-[#ffffff] to-[#faf6ee] rounded-2xl border border-[#ded3be]/70 shadow-2xs relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest text-[#7d6f5f] mb-1 font-mono">
                  Recette Nette Encaissée
                </div>
                <div
                  className="font-serif-title font-black text-3xl sm:text-4xl lg:text-5xl text-[#1f3d29] tracking-tight leading-none tabular-nums select-all"
                  title={`${formatMoneyPlain(card.revenue)} Dinars Algériens`}
                >
                  {formatMoneyPlain(card.revenue)}
                </div>
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#85522b] mt-1.5 font-mono">
                  Dinars Algériens (DA)
                </div>
              </div>

              {/* 3. Micro Sparkline / Trajectory Chart */}
              <div className="space-y-1 relative z-10">
                <div className="flex items-center justify-between text-[10px] text-[#7d6f5f] font-medium">
                  <span>Trajectoire des encaissements</span>
                  <span className="font-mono text-[#1f3d29] font-bold">10 intervalles</span>
                </div>
                <div className="h-10 flex items-end gap-1 px-1.5 pt-1.5 bg-[#f4eee1]/80 rounded-xl border border-[#ded3be]">
                  {card.sparkline.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-[#1f3d29] group-hover:bg-[#85522b] rounded-t-sm transition-all duration-200"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* 4. Core Operational Metrics (Tickets, Panier Moyen, Articles) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ded3be] text-center relative z-10">
                <div className="p-2 rounded-xl bg-white border border-[#ded3be]">
                  <span className="text-[10px] font-bold text-[#7d6f5f] uppercase tracking-wider block">
                    Tickets
                  </span>
                  <span className="font-mono font-black text-sm text-[#1f3d29] mt-0.5 block">
                    {card.count}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#ded3be]">
                  <span className="text-[10px] font-bold text-[#7d6f5f] uppercase tracking-wider block">
                    Panier
                  </span>
                  <span
                    className="font-mono font-black text-xs sm:text-sm text-[#85522b] mt-0.5 block truncate"
                    title={formatMoney(card.avgBasket)}
                  >
                    {formatMoney(card.avgBasket)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#ded3be]">
                  <span className="text-[10px] font-bold text-[#7d6f5f] uppercase tracking-wider block">
                    Articles
                  </span>
                  <span className="font-mono font-black text-sm text-[#1f3d29] mt-0.5 block">
                    {card.itemsCount}
                  </span>
                </div>
              </div>

              {/* 5. Payment Methods Split Bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#ded3be] relative z-10 text-[11px]">
                <div className="flex items-center justify-between text-[#7d6f5f]">
                  <span className="font-bold flex items-center gap-1 text-[#1f3d29]">
                    <PieChart className="w-3 h-3 text-[#1f3d29]" />
                    <span>Règlements</span>
                  </span>
                  <span className="font-mono font-medium">
                    {cashShare}% Esp. • {cardShare}% CIB
                  </span>
                </div>

                <div className="h-2 w-full bg-[#ede5d6] rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="bg-[#1f3d29] transition-all duration-300"
                    style={{ width: `${cashShare}%` }}
                    title={`Espèces : ${cashShare}%`}
                  />
                  <div
                    className="bg-[#0284c7] transition-all duration-300"
                    style={{ width: `${cardShare}%` }}
                    title={`Carte CIB : ${cardShare}%`}
                  />
                  <div
                    className="bg-[#b45309] transition-all duration-300"
                    style={{ width: `${otherShare}%` }}
                    title={`Autre : ${otherShare}%`}
                  />
                </div>
              </div>

              {/* Selection Indicator Footer */}
              <div
                className={`pt-2 text-center text-[11px] font-bold tracking-tight rounded-xl py-1 transition-colors relative z-10 ${
                  isSelected
                    ? 'bg-[#1f3d29] text-white shadow-2xs'
                    : 'text-[#7d6f5f] bg-[#f4eee1] group-hover:bg-[#ede5d6] group-hover:text-[#1f3d29]'
                }`}
              >
                {isSelected ? '✓ Période actuellement active' : 'Cliquer pour activer'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
