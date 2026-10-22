import React, { useState, useEffect } from 'react';
import { usePos, ViewType } from '../../context/PosContext';
import {
  Store,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Cloud,
  X,
  ChevronsLeft,
  ChevronsRight,
  Keyboard,
  HelpCircle,
} from 'lucide-react';

interface SherwoodSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SherwoodSidebar: React.FC<SherwoodSidebarProps> = ({
  isMobile = false,
  onClose,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) => {
  const {
    activeView,
    setActiveView,
    isSidebarCollapsed: contextIsCollapsed,
    toggleSidebarCollapsed: contextToggle,
    activeCartId,
    switchCart,
    cart1Summary,
    cart2Summary,
    isOffline,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
  } = usePos();

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      maximumFractionDigits: 0,
    }).format(val) + '\u00A0DA';
  };

  // Controlled prop takes precedence if provided, otherwise context state
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : contextIsCollapsed;
  const toggleCollapsed = onToggleCollapse || contextToggle;

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'pos', label: 'Caisse POS', icon: Store },
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'catalog', label: 'Catalogue', icon: Package },
    { id: 'sales', label: 'Factures & Ventes', icon: Receipt },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'admin', label: 'Admin & Sync', icon: Cloud },
  ];

  const handleNavClick = (id: ViewType) => {
    setActiveView(id);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleOpenShortcuts = () => {
    setIsShortcutsModalOpen(true);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // If mobile, it is never collapsed
  const collapsed = !isMobile && isCollapsed;

  return (
    <aside
      className={`bg-[#1f3d29] text-[#fcfbf7] flex flex-col justify-between border-r border-[#16311f] select-none shadow-xl sherwood-sidebar ${
        isMobile
          ? 'w-full h-full overflow-y-auto p-4 pt-[max(1rem,calc(1rem+env(safe-area-inset-top,0px)))] pb-[max(1rem,calc(1rem+env(safe-area-inset-bottom,0px)))] pl-[max(1rem,calc(1rem+env(safe-area-inset-left,0px)))]'
          : collapsed
          ? 'sherwood-sidebar-collapsed h-screen sticky top-0 p-2.5 items-center'
          : 'sherwood-sidebar-expanded h-screen sticky top-0 p-4'
      }`}
    >
      {/* Top Section: Header & Signboard + Navigation */}
      <div className="w-full space-y-4">
        {/* Mobile Header with dedicated Close Button if isMobile */}
        {isMobile && (
          <div className="space-y-3 pb-3 border-b border-[#2d563a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍃</span>
                <div>
                  <span className="font-serif-title font-bold text-base text-[#fff5ea] tracking-tight block">
                    MARKETPOS
                  </span>
                  <span className="text-[10px] text-[#a6c4a6] font-medium block">
                    Menu de navigation
                  </span>
                </div>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer le menu de navigation"
                  className="touch-btn min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-[#fdfbf7] border border-white/20 shadow-xs flex items-center justify-center transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#86efac]"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Quick Dual Cart Status Pill in Mobile Menu */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#a6c4a6] uppercase tracking-wider">
                <span>Panier actif en caisse</span>
                <span className="text-[#86efac]">{activeCartId === 1 ? 'Panier 1 actif' : 'Panier 2 actif'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchCart(1);
                  }}
                  className={`touch-btn min-h-[44px] p-2.5 rounded-2xl flex flex-col items-start justify-center transition-all cursor-pointer border text-left ${
                    activeCartId === 1
                      ? 'bg-[#274b33] text-white border-[#86efac] shadow-md ring-1 ring-[#86efac]'
                      : 'bg-[#14281b] text-[#c5ddc5] border-[#2d563a] hover:bg-[#1a3524]'
                  }`}
                  aria-pressed={activeCartId === 1}
                >
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <span className="text-xs font-black flex items-center gap-1">
                      <span>🍃</span> P1
                    </span>
                    {activeCartId === 1 && (
                      <span className="w-2 h-2 rounded-full bg-[#86efac] inline-block animate-pulse" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-[#86efac] mt-0.5 truncate w-full">
                    {formatMoney(cart1Summary.totalTTC)}
                  </div>
                  <span className="text-[9px] text-[#a6c4a6]/80 font-medium">
                    {cart1Summary.totalItems} art.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchCart(2);
                  }}
                  className={`touch-btn min-h-[44px] p-2.5 rounded-2xl flex flex-col items-start justify-center transition-all cursor-pointer border text-left ${
                    activeCartId === 2
                      ? 'bg-[#85522b] text-[#fff6ec] border-amber-300 shadow-md ring-1 ring-amber-300'
                      : 'bg-[#14281b] text-[#c5ddc5] border-[#2d563a] hover:bg-[#1a3524]'
                  }`}
                  aria-pressed={activeCartId === 2}
                >
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <span className="text-xs font-black flex items-center gap-1">
                      <span>🍂</span> P2
                    </span>
                    {activeCartId === 2 && (
                      <span className="w-2 h-2 rounded-full bg-amber-300 inline-block animate-pulse" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-amber-200 mt-0.5 truncate w-full">
                    {formatMoney(cart2Summary.totalTTC)}
                  </div>
                  <span className="text-[9px] text-[#a6c4a6]/80 font-medium">
                    {cart2Summary.totalItems} art.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop / Tablet Header: Full Signboard or Compact Timber Tile */}
        {!isMobile && (
          <div className="pt-1 w-full">
            {collapsed ? (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="touch-btn w-full sherwood-wood-board rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-md cursor-pointer hover:brightness-105 transition-all group"
                title="Agrandir le menu latéral (Afficher les libellés)"
                aria-label="Agrandir le menu"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🍃</span>
                <span className="text-[10px] font-black text-[#fff2e2] font-serif-title mt-0.5">POS</span>
              </button>
            ) : (
              <div className="sherwood-wood-board rounded-2xl p-4 text-center relative group">
                {/* Wooden Nails / Screws in 4 corners */}
                <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#30190a] border border-[#5a3217] shadow-inner" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#30190a] border border-[#5a3217] shadow-inner" />
                <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-[#30190a] border border-[#5a3217] shadow-inner" />
                <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[#30190a] border border-[#5a3217] shadow-inner" />

                {/* Wooden Board Typography */}
                <div className="text-[11px] uppercase tracking-widest text-[#f5d7b5] font-bold drop-shadow-xs">
                  Système de Vente
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#fff2e2] font-serif-title tracking-tight drop-shadow-md">
                  MARKETPOS
                </div>
                <div className="text-xs text-[#eed1b0] font-semibold tracking-wide">
                  Caisse & Facturation
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation items (accessible min 48px/52px touch targets on mobile) */}
        <nav className="space-y-2 w-full" aria-label="Menu principal">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`touch-btn w-full ${
                  isMobile ? 'min-h-[52px]' : 'min-h-[48px]'
                } rounded-2xl text-sm font-bold flex items-center transition-all cursor-pointer ${
                  collapsed
                    ? 'justify-center p-2.5'
                    : 'justify-between px-4 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#fdfbf7] text-[#1f3d29] shadow-md shadow-black/20 scale-[1.01]'
                    : 'text-[#c7dac7] hover:text-white hover:bg-[#284f35] active:bg-[#16311f]'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1f3d29]' : 'text-[#a6c4a6]'}`} />
                  {!collapsed && <span className="text-left leading-tight truncate">{item.label}</span>}
                </div>
                {!collapsed && isActive && (
                  <span className="text-xs shrink-0" title="Vue active">
                    🍃
                  </span>
                )}
              </button>
            );
          })}

          {/* Visual Help & Keyboard Shortcuts Entry in Main Menu */}
          <div className="pt-2 mt-2 border-t border-[#2d563a]/60">
            <button
              type="button"
              onClick={handleOpenShortcuts}
              aria-haspopup="dialog"
              title={collapsed ? 'Aide & Raccourcis Clavier [F2, Tab, F1, F9, ?]' : undefined}
              className={`touch-btn w-full ${
                isMobile ? 'min-h-[50px]' : 'min-h-[44px]'
              } rounded-2xl text-xs sm:text-sm font-bold flex items-center transition-all cursor-pointer border border-[#2d563a] bg-[#172f20]/70 hover:bg-[#254b32] text-[#c7dac7] hover:text-white active:bg-[#16311f] ${
                collapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3.5 py-2.5'
              }`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <Keyboard className="w-5 h-5 shrink-0 text-[#86efac]" />
                {!collapsed && (
                  <span className="text-left leading-tight truncate">
                    Raccourcis Clavier
                  </span>
                )}
              </div>
              {!collapsed && (
                <kbd className="text-[10px] font-mono font-bold bg-[#0d1d13] text-[#86efac] px-2 py-0.5 rounded-lg border border-[#2d563a] shadow-xs shrink-0">
                  F2 • ?
                </kbd>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Footer / Minimize Toggle in Sidebar */}
      <div className="pt-3 w-full border-t border-[#16311f] flex flex-col items-center gap-2">
        {isMobile && (
          <div className="w-full flex items-center justify-between text-xs text-[#a6c4a6]/90 px-1 py-1">
            <span className="font-semibold">Statut caisse :</span>
            <span className="font-mono font-bold text-[#86efac]">
              {isOffline ? 'Hors-Ligne' : 'Synchronisé Cloud'}
            </span>
          </div>
        )}

        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`touch-btn w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold text-[#c7dac7] hover:text-white hover:bg-[#284f35] flex items-center transition-all cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={collapsed ? 'Agrandir le menu latéral (afficher les libellés)' : 'Réduire le menu en icônes'}
            aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu en icônes'}
          >
            <div className="flex items-center gap-2">
              {collapsed ? (
                <ChevronsRight className="w-4 h-4 text-[#86efac]" />
              ) : (
                <>
                  <ChevronsLeft className="w-4 h-4 text-[#a6c4a6]" />
                  <span>Réduire en icônes</span>
                </>
              )}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-mono text-[#a6c4a6]/80 bg-black/20 px-1.5 py-0.5 rounded">
                Tablette
              </span>
            )}
          </button>
        )}

        {!collapsed && (
          <div className="text-center text-xs text-[#a6c4a6]/80 font-medium">
            <span>Format Ticket : </span>
            <strong className="text-[#fdfbf7] font-mono">80 mm</strong>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SherwoodSidebar;
