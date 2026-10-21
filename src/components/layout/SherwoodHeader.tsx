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
} from 'lucide-react';

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

  return (
    <header className="sherwood-header sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#e5dcce] shadow-2xs w-full max-w-full overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 gap-x-3 min-w-0 overflow-hidden">
        {/* Left: Branding & Navigation (Takes full width row on mobile, flex-1 on desktop) */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden touch-btn p-1.5 -ml-1 text-[#483d31] hover:text-[#234931] hover:bg-[#f7f2e7] rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop / Tablet Sidebar Minimize / Expand Action Button */}
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

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-[#223d2b] font-serif-title tracking-tight leading-tight flex items-center gap-1.5 truncate">
                <span className="shrink-0 text-base sm:text-xl">🍃</span>
                <span className="truncate">Caisse Sherwood</span>
              </h1>
              <p className="text-[11px] text-[#605547] font-medium hidden sm:block truncate">
                Ventes et stocks en direct
              </p>
            </div>
          </div>

          {/* Mobile-only quick time pill on the top row */}
          {currentTime && (
            <div className="sm:hidden flex items-center gap-1 px-2 py-0.5 bg-[#f4efe4] border border-[#e5dcce] rounded-lg text-[11px] font-mono font-bold text-[#6e6354] shrink-0">
              <Clock className="w-3 h-3 text-[#8d5732]" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>

        {/* Right: Actions, Sync & Cart (Drops to Row 2 on mobile via flex-wrap, or sits right on desktop) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0 overflow-hidden shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#e7ddca]/60">
          {/* Date Pill: Desktop only */}
          {currentDate && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-[#fdfbf7] border border-[#e5dcce] rounded-full text-xs font-semibold text-[#483d31] shadow-2xs whitespace-nowrap shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-[#527d52]" />
              <span>{currentDate}</span>
            </div>
          )}

          {/* Live Clock Pill: Tablet & Desktop */}
          {currentTime && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#fdfbf7] border border-[#e5dcce] rounded-full text-xs font-mono font-bold text-[#483d31] shadow-2xs whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#8d5732]" />
              <span>{currentTime}</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Offline / Online Sync Pill */}
            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className={`touch-btn flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-2xs shrink-0 ${
                isOffline
                  ? 'bg-[#faece1] border-[#f0c8a8] text-[#a85a18]'
                  : 'bg-[#edf5ec] border-[#cce4ca] text-[#245229]'
              }`}
              title={isOffline ? 'Mode hors-ligne actif (cliquer pour basculer)' : 'En ligne et synchronisé'}
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
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-xs font-semibold">En ligne</span>
                </>
              )}
            </button>

            {/* Visual Indicator of Active Cart (Panier 1 or Panier 2) with item count */}
            <div
              className={`flex items-center gap-1.5 p-1 rounded-xl sm:rounded-2xl border transition-all shadow-2xs shrink-0 ${
                activeCartId === 1
                  ? 'bg-[#edf5ec] border-[#b4dbb6] text-[#1b3d24]'
                  : 'bg-[#faf0e6] border-[#e8c8a8] text-[#5c3014]'
              }`}
            >
              {/* Active Cart Pill */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('pos');
                  setIsCartDrawerOpen(true);
                }}
                className="touch-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
                title={`Panier ${activeCartId} actuellement ACTIF (${cartSummary.totalItems} article${cartSummary.totalItems > 1 ? 's' : ''}) • Cliquer pour ouvrir`}
              >
                <span className="text-sm">
                  {activeCartId === 1 ? '🍃' : '🍂'}
                </span>
                <span className="font-extrabold tracking-tight">
                  Panier {activeCartId}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    activeCartId === 1
                      ? 'bg-[#234931] text-emerald-100'
                      : 'bg-[#85522b] text-amber-100'
                  }`}
                >
                  {cartSummary.totalItems} art.
                </span>
              </button>

              {/* Quick Switch Button with F2 / Tab dedicated shortcut */}
              <button
                type="button"
                onClick={() => switchCart()}
                className={`touch-btn px-2 py-1 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer shadow-2xs ${
                  activeCartId === 1
                    ? 'bg-white hover:bg-emerald-50 text-[#234931] border-[#c0e0c2]'
                    : 'bg-white hover:bg-amber-50 text-[#85522b] border-[#ebd4bf]'
                }`}
                title={`Basculer vers Panier ${activeCartId === 1 ? '2' : '1'} (Raccourci : F2 ou Tab)`}
                aria-label={`Basculer vers Panier ${activeCartId === 1 ? '2' : '1'}`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] font-black uppercase px-1 py-0.5 rounded bg-black/5">
                  F2 / Tab
                </span>
              </button>
            </div>

            {/* Header Quick Cart Button */}
            <button
              type="button"
              onClick={() => {
                setActiveView('pos');
                setIsCartDrawerOpen(true);
              }}
              className="touch-btn flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 bg-[#85522b] hover:bg-[#6e3e1c] text-[#fff6ec] rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Ouvrir le panier"
              aria-label={`Panier, ${cartSummary.totalItems} articles`}
            >
              <ShoppingCart className="w-4 h-4 text-[#fcdbb6] shrink-0" />
              <span className="inline">Panier</span>
              <span className="px-1.5 py-0.2 bg-[#5d3112] text-[#fff2e2] rounded-full text-[10px] sm:text-xs font-mono font-bold">
                {cartSummary.totalItems}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
