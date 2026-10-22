import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Wifi,
  WifiOff,
  ShoppingCart,
  Menu,
  Clock,
  Calendar as CalendarIcon,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
} from 'lucide-react';
import { CloudConnectionModal } from './CloudConnectionModal';

export const SherwoodHeader: React.FC = () => {
  const {
    isOffline,
    setIsOffline,
    pendingSyncCount,
    cartSummary,
    setIsCartDrawerOpen,
    setIsMobileMenuOpen,
    setActiveView,
    activeCartId,
    switchCart,
    cart1Summary,
    cart2Summary,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = usePos();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
      }).format(val) + '\u00A0DA'
    );
  };

  return (
    <header className="sherwood-header sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#e5dcce] shadow-2xs w-full max-w-full overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      {/* ============================================================
          MOBILE TOPBAR (< sm: 640px)
          Compact 2-row ergonomic layout for phones & mobile handhelds
          ============================================================ */}
      <div className="sm:hidden px-3 pt-2 pb-2.5 space-y-2">
        {/* Row 1: Burger Menu + Brand Title + Status & Quick Cart with Price */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="touch-btn min-h-[44px] min-w-[44px] p-2.5 text-[#2c241c] hover:text-[#234931] hover:bg-[#ede5d6] active:bg-[#e2d7c2] rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-[#e5dcce]/80 bg-[#fdfbf7]"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5 text-[#234931]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black text-[#1f3d29] font-serif-title tracking-tight leading-tight flex items-center gap-1.5 truncate">
                <span className="shrink-0 text-base">🍃</span>
                <span className="truncate">MARKETPOS</span>
              </h1>
              <p className="text-[10px] text-[#6e6354] font-semibold truncate">
                Point de vente tactile
              </p>
            </div>
          </div>

          {/* Right Status: Un point vert quand en ligne (ou badge hors-ligne) + Bouton Connexion Cloud */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className={`touch-btn min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-2xs shrink-0 ${
                isOffline
                  ? 'bg-[#faece1] border-[#f0c8a8] text-[#a85a18]'
                  : 'bg-[#edf5ec] border-[#cce4ca] hover:bg-[#e0f0df]'
              }`}
              title={
                isOffline
                  ? 'Mode hors-ligne actif (cliquer pour basculer)'
                  : 'En ligne et synchronisé (cliquer pour simuler hors-ligne)'
              }
              aria-label={isOffline ? 'Hors ligne' : 'En ligne'}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#a85a18] shrink-0" />
                  <span className="text-[11px] font-bold">Hors ligne</span>
                  {pendingSyncCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#a85a18] text-white rounded-full text-[10px] font-mono">
                      {pendingSyncCount}
                    </span>
                  )}
                </>
              ) : (
                /* Point vert quand en ligne */
                <span className="relative flex h-3 w-3 items-center justify-center" title="En ligne">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs border border-emerald-600" />
                </span>
              )}
            </button>

            {/* Bouton de connexion avec le Cloud (Mobile) */}
            <button
              type="button"
              onClick={() => setIsCloudModalOpen(true)}
              className="touch-btn min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title="Connexion Cloud (Supabase)"
              aria-label="Connexion avec le Cloud"
            >
              <Cloud className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <span className="text-[11px] font-black">Cloud</span>
            </button>
          </div>
        </div>

        {/* Row 2: Touch-optimized Segmented Dual Cart Switcher Tab Bar with Prices */}
        <div className="flex items-center gap-1.5 p-1 bg-[#ede5d6] border border-[#d8cdba] rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => switchCart(1)}
            aria-pressed={activeCartId === 1}
            className={`touch-btn min-h-[42px] flex-1 py-1 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
              activeCartId === 1
                ? 'bg-[#1f3d29] text-[#fdfbf7] shadow-sm font-black'
                : 'text-[#5d5244] hover:text-[#1f3d29] hover:bg-white/40'
            }`}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs">🍃</span>
              <span className="truncate">P1</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-mono text-[11px] font-black">
                {formatMoney(cart1Summary.totalTTC)}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  activeCartId === 1
                    ? 'bg-[#86efac]/20 text-[#86efac]'
                    : 'bg-black/10 text-[#5d5244]'
                }`}
              >
                {cart1Summary.totalItems}
              </span>
            </div>
          </button>

          {/* Quick Swap Icon Button */}
          <button
            type="button"
            onClick={() => switchCart()}
            className="touch-btn min-h-[42px] min-w-[42px] p-2 bg-[#fdfbf7] hover:bg-[#f7f2e7] active:bg-[#e5dcce] text-[#85522b] border border-[#d8cdba] rounded-xl shadow-2xs flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Basculer instantanément de panier"
            aria-label="Basculer de panier"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#85522b]" />
          </button>

          <button
            type="button"
            onClick={() => switchCart(2)}
            aria-pressed={activeCartId === 2}
            className={`touch-btn min-h-[42px] flex-1 py-1 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
              activeCartId === 2
                ? 'bg-[#85522b] text-[#fff6ec] shadow-sm font-black'
                : 'text-[#5d5244] hover:text-[#85522b] hover:bg-white/40'
            }`}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs">🍂</span>
              <span className="truncate">P2</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-mono text-[11px] font-black">
                {formatMoney(cart2Summary.totalTTC)}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  activeCartId === 2
                    ? 'bg-white/20 text-white'
                    : 'bg-black/10 text-[#5d5244]'
                }`}
              >
                {cart2Summary.totalItems}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================
          DESKTOP & TABLET TOPBAR (>= sm: 640px)
          Spacious single-line layout with keyboard shortcuts & full widgets
          ============================================================ */}
      <div className="hidden sm:flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 items-center justify-between gap-3 min-w-0">
        {/* Left: Branding & Sidebar Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden touch-btn p-2 text-[#483d31] hover:text-[#234931] hover:bg-[#f7f2e7] rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex touch-btn min-h-[40px] min-w-[40px] p-2 items-center justify-center text-[#483d31] hover:text-[#234931] hover:bg-[#f7f2e7] active:bg-[#ede5d6] border border-[#e5dcce] rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            title={
              isSidebarCollapsed
                ? "Déployer le menu latéral (Afficher les libellés)"
                : "Réduire le menu en icônes uniquement"
            }
            aria-label={
              isSidebarCollapsed
                ? "Déployer la barre latérale"
                : "Réduire la barre latérale en icônes"
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#234931]" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-[#5d5244]" />
            )}
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-[#223d2b] font-serif-title tracking-tight leading-tight flex items-center gap-1.5 truncate">
              <span className="shrink-0 text-xl">🍃</span>
              <span className="truncate">MARKETPOS</span>
            </h1>
            <p className="text-[11px] text-[#605547] font-medium truncate">
              Ventes et stocks en direct
            </p>
          </div>
        </div>

        {/* Right: Date, Clock, Offline/Online Point Vert, Dual Cart tabs, Cart Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Date Pill: Desktop only */}
          {currentDate && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-[#fdfbf7] border border-[#e5dcce] rounded-full text-xs font-semibold text-[#483d31] shadow-2xs whitespace-nowrap shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-[#527d52]" />
              <span>{currentDate}</span>
            </div>
          )}

          {/* Live Clock Pill */}
          {currentTime && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#fdfbf7] border border-[#e5dcce] rounded-full text-xs font-mono font-bold text-[#483d31] shadow-2xs whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#8d5732]" />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Status Chip: Un point vert quand en ligne, ou pastille hors ligne */}
          <button
            type="button"
            onClick={() => setIsOffline(!isOffline)}
            className={`touch-btn min-h-[38px] px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-2xs shrink-0 ${
              isOffline
                ? 'bg-[#faece1] border-[#f0c8a8] text-[#a85a18]'
                : 'bg-[#edf5ec] border-[#cce4ca] hover:bg-[#e0f0df]'
            }`}
            title={
              isOffline
                ? 'Mode hors-ligne actif (cliquer pour basculer)'
                : 'En ligne et synchronisé (cliquer pour simuler hors-ligne)'
            }
            aria-label={isOffline ? 'Hors ligne' : 'En ligne'}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#a85a18] shrink-0" />
                <span className="text-xs font-semibold">Hors ligne</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#a85a18] text-white rounded-full text-[10px] font-mono">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : (
              /* Point vert quand en ligne */
              <span className="relative flex h-3 w-3 items-center justify-center" title="En ligne">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs border border-emerald-600" />
              </span>
            )}
          </button>

          {/* Bouton de connexion avec le Cloud (Desktop) placé juste à côté du bouton vert de connexion */}
          <button
            type="button"
            onClick={() => setIsCloudModalOpen(true)}
            className="touch-btn min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
            title="Connexion avec le Cloud Supabase (cliquer pour voir l'état et synchroniser)"
            aria-label="Connexion avec le Cloud"
          >
            <Cloud className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <span className="font-bold">Cloud</span>
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500" />
            </span>
          </button>

          {/* Dual Cart Indicator & Switcher with totals and F2/Tab badges */}
          <div
            className={`flex items-center gap-1.5 p-1 rounded-2xl border transition-all shadow-2xs shrink-0 ${
              activeCartId === 1
                ? 'bg-[#edf5ec] border-[#b4dbb6] text-[#1b3d24]'
                : 'bg-[#faf0e6] border-[#e8c8a8] text-[#5c3014]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveView('pos');
                setIsCartDrawerOpen(true);
              }}
              className="touch-btn flex items-center gap-2 px-2.5 py-1 rounded-xl font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
              title={`Panier ${activeCartId} actif • Total : ${formatMoney(cartSummary.totalTTC)} (${cartSummary.totalItems} art.)`}
            >
              <span className="text-sm">{activeCartId === 1 ? '🍃' : '🍂'}</span>
              <span className="font-extrabold tracking-tight">Panier {activeCartId}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeCartId === 1
                    ? 'bg-[#234931] text-emerald-100'
                    : 'bg-[#85522b] text-amber-100'
                }`}
              >
                {formatMoney(cartSummary.totalTTC)}
              </span>
              <span className="text-[10px] opacity-75 font-mono">
                ({cartSummary.totalItems} art.)
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchCart()}
              className={`touch-btn px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer shadow-2xs ${
                activeCartId === 1
                  ? 'bg-white hover:bg-emerald-50 text-[#234931] border-[#c0e0c2]'
                  : 'bg-white hover:bg-amber-50 text-[#85522b] border-[#ebd4bf]'
              }`}
              title="Basculer vers l'autre panier (F2 ou Tab)"
              aria-label="Basculer de panier"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-black uppercase px-1 py-0.5 rounded bg-black/5">
                F2 / Tab
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Cloud Connection & Sync Modal */}
      <CloudConnectionModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </header>
  );
};
