import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  ArrowRight,
  X,
  Sparkles,
  Check,
  Package,
  Layers,
  Zap,
} from 'lucide-react';

const formatMoney = (val: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0DA';

export const QuickAddCartFab: React.FC = () => {
  const {
    products,
    cart,
    cartSummary,
    activeCartId,
    switchCart,
    addToCart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    setActiveView,
    showToast,
  } = usePos();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  // Top 8 fast-moving products for 1-click addition
  const quickPickProducts = useMemo(() => {
    return products
      .filter((p) => p.isActive && p.stock > 0)
      .slice(0, 8);
  }, [products]);

  // Filtered search products
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(q) ||
            p.barcode.includes(q) ||
            p.sku.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [products, searchQuery]);

  const handleQuickAdd = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`Stock épuisé pour ${product.name}`, 'warning');
      return;
    }
    addToCart(product, 1);
    setJustAddedId(product.id);
    showToast(`+1 ${product.name} ajouté au panier`, 'success');
    setTimeout(() => setJustAddedId(null), 800);
  };

  const handleGoToPos = () => {
    setIsOpen(false);
    setActiveView('pos');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Accès rapide panier de caisse"
          className="group touch-btn relative flex items-center gap-2.5 px-4 sm:px-5 py-3.5 rounded-full bg-[#1f3d29] hover:bg-[#16311f] text-white shadow-xl hover:shadow-2xl border-2 border-[#86efac]/30 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {/* Cart Icon & Item Badge */}
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-[#86efac]" />
            {cartSummary.totalItems > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 bg-[#85522b] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#1f3d29] shadow-sm animate-pulse">
                {cartSummary.totalItems}
              </span>
            )}
          </div>

            {/* Label & Amount */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#a8d3a8] leading-none flex items-center gap-1">
              <span>Panier Actif</span>
              <span className="bg-[#2d583b] text-[9px] px-1 rounded text-white font-mono">
                {activeCartId === 1 ? 'P1' : 'P2'}
              </span>
            </span>
            <span className="text-sm font-black font-mono text-white leading-tight mt-0.5">
              {cartSummary.totalItems > 0 ? formatMoney(cartSummary.totalTTC) : 'Ajout 1-Clic'}
            </span>
          </div>

          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center ml-1 group-hover:bg-white/20 transition-colors">
            <Plus className="w-4 h-4 text-[#86efac]" />
          </div>
        </button>
      </div>

      {/* Quick Add Popover Drawer / Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="relative z-10 bg-[#fdfbf7] w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#ded3be] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-[#1f3d29] text-white border-b border-[#16311f] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2d583b] rounded-xl text-[#86efac] border border-[#3c6e4c]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="quick-add-title" className="font-bold text-sm sm:text-base font-serif-title flex items-center gap-1.5">
                    <span>Ajout Immédiat au Panier Actif</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#c5ddc5]">
                    <span>Caisse Active :</span>
                    <button
                      type="button"
                      onClick={() => switchCart()}
                      className="underline font-bold hover:text-white cursor-pointer"
                      title="Changer de panier (P1/P2)"
                    >
                      {activeCartId === 1 ? 'Panier 1 (Principal)' : 'Panier 2 (En attente)'} ⇋
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="touch-btn p-2 text-[#c5ddc5] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#877a6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scanner un code-barres ou rechercher un article..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#ded3be] focus:border-[#1f3d29] focus:outline-none focus:ring-2 focus:ring-[#86efac]/30 text-xs font-medium placeholder-[#a49685]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#877a6b] hover:text-[#1f3d29]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dynamic Search Results */}
              {searchQuery && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#605547] uppercase tracking-wider">
                    Résultats ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[#877a6b] bg-white rounded-2xl border border-[#ded3be]">
                      Aucun article trouvé pour "{searchQuery}"
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="p-2.5 rounded-xl bg-white border border-[#ded3be] flex items-center justify-between gap-3 hover:border-[#1f3d29]/40 transition-all"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#1f3d29] truncate">{product.name}</div>
                            <div className="text-[10px] text-[#877a6b] font-mono">
                              {product.sku} • Stock : {product.stock}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-black text-xs text-[#85522b]">
                              {formatMoney(product.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(product)}
                              className="touch-btn px-3 py-1.5 rounded-xl bg-[#1f3d29] hover:bg-[#16311f] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Ajouter</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Top Quick Pick Chips (1-Click) */}
              {!searchQuery && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#605547] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#1f3d29]" />
                      <span>Sélection Rapide 1-Clic (Produits Phares)</span>
                    </span>
                    <span className="text-[10px] text-[#877a6b] font-normal lowercase">
                      toucher pour ajouter +1
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickPickProducts.map((product) => {
                      const isAdded = justAddedId === product.id;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className={`touch-btn p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-[#1f3d29] text-white border-[#16311f] scale-98 shadow-sm'
                              : 'bg-white hover:bg-[#faf7f0] text-[#2c241c] border-[#ded3be] hover:border-[#1f3d29]/40 hover:shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0">
                            <div
                              className={`text-[11px] font-bold truncate ${
                                isAdded ? 'text-white' : 'text-[#1f3d29]'
                              }`}
                            >
                              {product.name}
                            </div>
                            <div
                              className={`text-[10px] font-mono mt-0.5 ${
                                isAdded ? 'text-[#86efac]' : 'text-[#85522b] font-bold'
                              }`}
                            >
                              {formatMoney(product.price)}
                            </div>
                          </div>

                          <div className="mt-2 pt-1 border-t border-current/10 flex items-center justify-between text-[10px]">
                            <span className="opacity-70">Reste {product.stock}</span>
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                isAdded ? 'bg-white text-[#1f3d29]' : 'bg-[#1f3d29]/10 text-[#1f3d29]'
                              }`}
                            >
                              {isAdded ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Cart Mini-Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#ded3be] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#ede5d6] pb-2">
                  <span className="font-bold text-[#1f3d29] flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#1f3d29]" />
                    <span>Contenu du panier en cours ({cart.length} ligne{cart.length > 1 ? 's' : ''})</span>
                  </span>
                  <span className="font-mono font-black text-sm text-[#85522b]">
                    {formatMoney(cartSummary.totalTTC)}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-4 text-center text-[#877a6b] text-xs">
                    Le panier actif est vide. Cliquez sur un produit ci-dessus pour l'ajouter instantanément.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#faf7f0] border border-[#ede5d6]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#1f3d29] truncate">{item.product.name}</div>
                          <div className="text-[10px] text-[#877a6b] font-mono">
                            {formatMoney(item.unitPrice)} x {item.quantity}
                          </div>
                        </div>

                        {/* +/- quantity controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.product.id)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#ded3be] flex items-center justify-center text-[#605547] hover:bg-[#ede5d6] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.product.id)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#ded3be] flex items-center justify-center text-[#605547] hover:bg-[#ede5d6] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-6 h-6 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-1 cursor-pointer"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / CTA Buttons */}
            <div className="p-4 bg-[#f4eee1] border-t border-[#ded3be] flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs">
                <span className="text-[#877a6b] block">Total TTC Caisse</span>
                <span className="text-base font-black font-mono text-[#1f3d29]">
                  {formatMoney(cartSummary.totalTTC)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="touch-btn px-3 py-2 rounded-xl text-xs font-bold text-[#605547] bg-white border border-[#ded3be] hover:bg-[#faf7f0] cursor-pointer"
                >
                  Continuer sur le Dashboard
                </button>

                <button
                  type="button"
                  onClick={handleGoToPos}
                  className="touch-btn px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1f3d29] hover:bg-[#16311f] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Passer en Caisse (POS)</span>
                  <ArrowRight className="w-4 h-4 text-[#86efac]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
