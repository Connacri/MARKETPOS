import React, { useEffect, useState } from 'react';
import { usePos, ViewType } from '../../context/PosContext';
import {
  Store,
  Package,
  Receipt,
  ShoppingCart,
  MoreHorizontal,
  LayoutDashboard,
  Users,
  Cloud,
  X,
  ArrowLeftRight,
} from 'lucide-react';

type NavEntry = { id: ViewType; label: string; icon: React.FC<{ className?: string }> };

const MAIN_TABS: NavEntry[] = [
  { id: 'pos', label: 'Caisse', icon: Store },
  { id: 'catalog', label: 'Rayons', icon: Package },
  { id: 'sales', label: 'Factures', icon: Receipt },
];

const MORE_TABS: { id: ViewType; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Tableau de bord', desc: 'Métriques & ventes du jour', icon: LayoutDashboard },
  { id: 'customers', label: 'Clients & Fidélité', desc: 'Comptes, crédits & points', icon: Users },
  { id: 'admin', label: 'Cloud Supabase & Sync', desc: 'Sauvegarde & imprimante', icon: Cloud },
];

export const MobileBottomNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cartSummary,
    setIsCartDrawerOpen,
    activeCartId,
    switchCart,
    cart1Summary,
    cart2Summary,
  } = usePos();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const isMoreActive = MORE_TABS.some((m) => m.id === activeView);

  return (
    <>
      {/* Backdrop overlay for 'Plus' sheet */}
      {moreOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Slide-up Action Sheet for 'Plus' secondary navigation */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu complémentaire"
          className="lg:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-50 bg-[#fdfbf7] border border-[#d8cdba] rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 max-w-md mx-auto"
        >
          {/* Sheet Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#e5dcce]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍃</span>
              <span className="font-serif-title font-bold text-sm text-[#1f3d29]">
                Autres espaces de gestion
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Fermer le menu"
              className="touch-btn min-h-[36px] min-w-[36px] p-1.5 rounded-xl text-[#6e6354] hover:bg-[#ede5d6] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dual Cart Quick Switcher in 'Plus' sheet */}
          <div className="mb-3 p-2.5 bg-[#f4efe4] border border-[#e2d7c2] rounded-2xl flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#6e6354] uppercase tracking-wider">
                Panier actif
              </div>
              <div className="text-xs font-black text-[#1f3d29] flex items-center gap-1">
                <span>{activeCartId === 1 ? '🍃 Panier 1' : '🍂 Panier 2'}</span>
                <span className="font-mono text-[11px] text-[#85522b]">
                  ({activeCartId === 1 ? cart1Summary.totalItems : cart2Summary.totalItems} art.)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => switchCart()}
              className="touch-btn min-h-[38px] px-3 py-1.5 bg-[#85522b] hover:bg-[#6e3e1c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Basculer vers P{activeCartId === 1 ? '2' : '1'}</span>
            </button>
          </div>

          {/* Navigation Links in Sheet */}
          <div className="space-y-1.5">
            {MORE_TABS.map(({ id, label, desc, icon: Icon }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setActiveView(id);
                    setMoreOpen(false);
                  }}
                  className={`touch-btn w-full min-h-[50px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1f3d29] text-[#fdfbf7] font-bold shadow-sm'
                      : 'text-[#2c241c] hover:bg-[#ede5d6] active:bg-[#e2d7c2]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#eaf2e8] text-[#234931]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-snug truncate">{label}</div>
                      <div
                        className={`text-[10px] leading-tight truncate ${
                          isActive ? 'text-emerald-100' : 'text-[#6e6354]'
                        }`}
                      >
                        {desc}
                      </div>
                    </div>
                  </div>
                  {isActive && <span className="text-xs shrink-0">🍃</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Bar (Appbar) */}
      <nav
        aria-label="Navigation mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fdfbf7]/98 backdrop-blur-xl border-t border-[#e2d7c2] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] pt-1 pb-[max(0.5rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] flex items-center justify-around"
      >
        {/* Tab 1: Caisse POS */}
        <button
          type="button"
          onClick={() => setActiveView('pos')}
          aria-current={activeView === 'pos' ? 'page' : undefined}
          className={`touch-btn min-h-[50px] flex-1 py-1 px-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer ${
            activeView === 'pos'
              ? 'bg-[#1f3d29]/10 text-[#1f3d29] font-black scale-[1.02]'
              : 'text-[#5d5244] hover:text-[#1f3d29] active:scale-95'
          }`}
        >
          <Store className={`w-5 h-5 ${activeView === 'pos' ? 'text-[#1f3d29]' : 'text-[#7d7060]'}`} />
          <span className="text-[11px] leading-tight tracking-tight">Caisse</span>
        </button>

        {/* Tab 2: Rayons / Catalogue */}
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          aria-current={activeView === 'catalog' ? 'page' : undefined}
          className={`touch-btn min-h-[50px] flex-1 py-1 px-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer ${
            activeView === 'catalog'
              ? 'bg-[#1f3d29]/10 text-[#1f3d29] font-black scale-[1.02]'
              : 'text-[#5d5244] hover:text-[#1f3d29] active:scale-95'
          }`}
        >
          <Package className={`w-5 h-5 ${activeView === 'catalog' ? 'text-[#1f3d29]' : 'text-[#7d7060]'}`} />
          <span className="text-[11px] leading-tight tracking-tight">Articles</span>
        </button>

        {/* Center Tab: Quick Panier Drawer Trigger with active cart price */}
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          className="touch-btn min-h-[52px] px-3.5 py-1 -mt-3.5 rounded-2xl bg-gradient-to-b from-[#8d5732] to-[#6e3e1c] text-[#fff6ec] shadow-lg shadow-[#6e3e1c]/30 flex flex-col items-center justify-center gap-0.5 border border-[#9f673c] transition-all cursor-pointer active:scale-95 shrink-0"
          aria-label={`Panier ${activeCartId}, ${cartSummary.totalItems} articles, total ${new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(cartSummary.totalTTC)} DA`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-[#fcdbb6]" />
            {cartSummary.totalItems > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-3 bg-[#1f3d29] text-[#86efac] font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono border-2 border-white shadow-xs"
              >
                {cartSummary.totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black text-[#fdfbf7] tracking-tight">
            {cartSummary.totalTTC > 0
              ? `${new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(cartSummary.totalTTC)} DA`
              : 'Panier'}
          </span>
        </button>

        {/* Tab 4: Factures / Ventes */}
        <button
          type="button"
          onClick={() => setActiveView('sales')}
          aria-current={activeView === 'sales' ? 'page' : undefined}
          className={`touch-btn min-h-[50px] flex-1 py-1 px-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer ${
            activeView === 'sales'
              ? 'bg-[#1f3d29]/10 text-[#1f3d29] font-black scale-[1.02]'
              : 'text-[#5d5244] hover:text-[#1f3d29] active:scale-95'
          }`}
        >
          <Receipt className={`w-5 h-5 ${activeView === 'sales' ? 'text-[#1f3d29]' : 'text-[#7d7060]'}`} />
          <span className="text-[11px] leading-tight tracking-tight">Factures</span>
        </button>

        {/* Tab 5: Plus (Sheet trigger) */}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-sheet"
          className={`touch-btn min-h-[50px] flex-1 py-1 px-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer ${
            isMoreActive || moreOpen
              ? 'bg-[#1f3d29]/10 text-[#1f3d29] font-black scale-[1.02]'
              : 'text-[#5d5244] hover:text-[#1f3d29] active:scale-95'
          }`}
        >
          <MoreHorizontal
            className={`w-5 h-5 ${
              isMoreActive || moreOpen ? 'text-[#1f3d29]' : 'text-[#7d7060]'
            }`}
          />
          <span className="text-[11px] leading-tight tracking-tight">Menu +</span>
        </button>
      </nav>
    </>
  );
};
