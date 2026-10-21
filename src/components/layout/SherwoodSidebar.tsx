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
} from 'lucide-react';

interface SherwoodSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export const SherwoodSidebar: React.FC<SherwoodSidebarProps> = ({ isMobile = false, onClose }) => {
  const { activeView, setActiveView } = usePos();

  // Collapsed state persisted in localStorage for desktop & tablet
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('pos_sidebar_collapsed') === 'true';
      } catch {}
    }
    return false;
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pos_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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

  // If mobile, it is never collapsed
  const collapsed = !isMobile && isCollapsed;

  return (
    <aside
      className={`bg-[#1f3d29] text-[#fcfbf7] flex flex-col justify-between border-r border-[#16311f] select-none shadow-xl transition-all duration-200 ${
        isMobile
          ? 'w-full h-full overflow-y-auto p-4 pt-[max(1rem,calc(1rem+env(safe-area-inset-top,0px)))] pb-[max(1rem,calc(1rem+env(safe-area-inset-bottom,0px)))] pl-[max(1rem,calc(1rem+env(safe-area-inset-left,0px)))]'
          : collapsed
          ? 'w-20 h-screen sticky top-0 p-2.5 items-center'
          : 'w-64 h-screen sticky top-0 p-4'
      }`}
    >
      {/* Top Section: Header & Signboard + Navigation */}
      <div className="w-full space-y-4">
        {/* Mobile Header with dedicated Close Button if isMobile */}
        {isMobile && (
          <div className="flex items-center justify-between pb-3 border-b border-[#2d563a]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍃</span>
              <span className="font-serif-title font-bold text-sm text-[#fff5ea] tracking-tight">Menu Sherwood</span>
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
                  Bienvenue chez
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#fff2e2] font-serif-title tracking-tight drop-shadow-md">
                  Sherwood
                </div>
                <div className="text-xs text-[#eed1b0] font-semibold tracking-wide">
                  Boutique • Caisse POS
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation items (accessible min 44px/48px touch targets) */}
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
                className={`touch-btn w-full min-h-[48px] rounded-2xl text-sm font-bold flex items-center transition-all cursor-pointer ${
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
        </nav>
      </div>

      {/* Footer / Minimize Toggle in Sidebar */}
      <div className="pt-3 w-full border-t border-[#16311f] flex flex-col items-center gap-2">
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
