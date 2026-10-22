import React, { useEffect, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Keyboard,
  X,
  ArrowLeftRight,
  Search,
  Receipt,
  Barcode,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeCartId,
    switchCart,
    cart1Summary,
    cart2Summary,
  } = usePos();

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape & trap focus when opened
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
      }).format(val) + '\u00A0DA'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#fdfbf7] rounded-3xl shadow-2xl border border-[#d8cdba] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1f3d29] text-[#fdfbf7] px-5 py-4 flex items-center justify-between border-b border-[#16311f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#86efac] shadow-inner">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="text-base sm:text-lg font-bold font-serif-title tracking-tight text-[#fff5ea] flex items-center gap-2"
              >
                <span>Aide & Raccourcis Clavier</span>
                <span className="text-xs font-mono font-bold text-[#86efac] bg-black/30 border border-[#86efac]/40 px-2 py-0.5 rounded-full">
                  MARKETPOS
                </span>
              </h2>
              <p className="text-xs text-[#c5ddc5] font-medium">
                Accélérez vos opérations de caisse et la navigation sans toucher la souris
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aide des raccourcis clavier (Échap)"
            className="touch-btn min-h-[44px] min-w-[44px] p-2 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-[#fdfbf7] border border-white/20 flex items-center justify-center transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#86efac]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-[#2c241c]">
          {/* Section 1: Gestion des 2 Paniers (App.tsx) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#85522b]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1f3d29] font-serif-title">
                  Gestion Double Panier (Multi-Caisse)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#85522b] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2e7d32]" />
                Données préservées
              </span>
            </div>

            {/* Live Interactive Cart Status & Test Switcher */}
            <div className="p-3.5 rounded-2xl bg-[#f4efe4] border border-[#dcd3c3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 animate-pulse ${
                    activeCartId === 1 ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-[#2c241c] flex items-center gap-2">
                    <span>Actuellement actif :</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-black ${
                        activeCartId === 1
                          ? 'bg-[#1f3d29] text-white'
                          : 'bg-[#85522b] text-white'
                      }`}
                    >
                      {activeCartId === 1 ? '🍃 Panier 1' : '🍂 Panier 2'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6b5e51] mt-0.5 font-medium">
                    P1: <strong className="text-[#1f3d29]">{formatMoney(cart1Summary.totalTTC)}</strong> ({cart1Summary.totalItems} art.)
                    {' • '}
                    P2: <strong className="text-[#85522b]">{formatMoney(cart2Summary.totalTTC)}</strong> ({cart2Summary.totalItems} art.)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => switchCart()}
                className="touch-btn min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#eae1cf] active:bg-[#ded1bc] border border-[#cfc3ad] text-xs font-bold text-[#1f3d29] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
                title="Tester le raccourci F2 ou Tab"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#85522b]" />
                <span>Tester la bascule (F2 / Tab)</span>
              </button>
            </div>

            {/* Shortcut cards list for Cart Switching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* F2 dedicated */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex items-start justify-between gap-3 hover:border-[#86efac] transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1f3d29] flex items-center gap-1.5">
                    <span>Bascule Caisse Prioritaire</span>
                    <span className="text-[10px] font-bold text-[#15803d] bg-[#dcfce7] px-1.5 py-0.2 rounded">Recommandé</span>
                  </div>
                  <p className="text-[11px] text-[#6b5e51] leading-relaxed">
                    Bascule instantanément entre le Panier 1 et le Panier 2 sans vider les articles saisis.
                  </p>
                </div>
                <kbd className="font-mono font-black text-xs sm:text-sm bg-[#1f3d29] text-[#fcfbf7] px-2.5 py-1.5 rounded-xl border border-[#16311f] shadow-xs shrink-0">
                  F2
                </kbd>
              </div>

              {/* Tab shortcut */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex items-start justify-between gap-3 hover:border-amber-300 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1f3d29]">
                    Bascule Rapide Tabulation
                  </div>
                  <p className="text-[11px] text-[#6b5e51] leading-relaxed">
                    Alterne entre les deux paniers quand le curseur n'est pas dans un champ texte.
                  </p>
                </div>
                <kbd className="font-mono font-black text-xs sm:text-sm bg-[#f4efe4] text-[#2c241c] px-2.5 py-1.5 rounded-xl border border-[#d8cdba] shadow-xs shrink-0">
                  Tab
                </kbd>
              </div>

              {/* F3 / F4 / Alt+P fallback */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex items-start justify-between gap-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1f3d29]">
                    Raccourcis Universels Alternatifs
                  </div>
                  <p className="text-[11px] text-[#6b5e51] leading-relaxed">
                    Prise en charge des claviers POS spéciaux et terminaux sans touches fonctionnelles.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <kbd className="font-mono font-bold text-xs bg-[#f4efe4] text-[#42362b] px-2 py-1 rounded-lg border border-[#d8cdba]">
                    F3
                  </kbd>
                  <kbd className="font-mono font-bold text-xs bg-[#f4efe4] text-[#42362b] px-2 py-1 rounded-lg border border-[#d8cdba]">
                    F4
                  </kbd>
                  <kbd className="font-mono font-bold text-xs bg-[#f4efe4] text-[#42362b] px-2 py-1 rounded-lg border border-[#d8cdba]">
                    Alt + P
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Opérations de Caisse POS */}
          <div className="space-y-2.5 pt-2 border-t border-[#e8dfd1]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f3d29]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1f3d29] font-serif-title">
                Opérations de Caisse & Ventes (POS)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* F1 */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <Search className="w-4 h-4 text-[#1f3d29]" />
                  <kbd className="font-mono font-black text-xs bg-[#eef7ee] text-[#1b5e20] px-2 py-1 rounded-lg border border-[#c8e6c9]">
                    F1
                  </kbd>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1f3d29]">Recherche Article</div>
                  <p className="text-[11px] text-[#6b5e51] mt-0.5 leading-snug">
                    Place le focus et sélectionne le champ de filtre des produits.
                  </p>
                </div>
              </div>

              {/* F9 */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <Receipt className="w-4 h-4 text-[#85522b]" />
                  <kbd className="font-mono font-black text-xs bg-[#fef3c7] text-[#92400e] px-2 py-1 rounded-lg border border-[#fde68a]">
                    F9
                  </kbd>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1f3d29]">Encaissement</div>
                  <p className="text-[11px] text-[#6b5e51] mt-0.5 leading-snug">
                    Ouvre la fenêtre de règlement et de paiement pour la commande active.
                  </p>
                </div>
              </div>

              {/* Enter for Barcode */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <Barcode className="w-4 h-4 text-[#2c241c]" />
                  <kbd className="font-mono font-black text-xs bg-[#f4efe4] text-[#2c241c] px-2 py-1 rounded-lg border border-[#d8cdba]">
                    Entrée ↵
                  </kbd>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1f3d29]">Scan Code-barres</div>
                  <p className="text-[11px] text-[#6b5e51] mt-0.5 leading-snug">
                    Validation instantanée après le tir de la douchette USB ou Bluetooth.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Navigation & Accessibilité Globale */}
          <div className="space-y-2.5 pt-2 border-t border-[#e8dfd1]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4a5568]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1f3d29] font-serif-title">
                Navigation & Accessibilité Globale
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Question mark (?) */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1f3d29] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#1f3d29]" />
                    <span>Afficher cette aide</span>
                  </div>
                  <p className="text-[11px] text-[#6b5e51] leading-relaxed">
                    Ouvre ou referme cette fiche d'aide des raccourcis à tout moment.
                  </p>
                </div>
                <kbd className="font-mono font-black text-xs sm:text-sm bg-[#f4efe4] text-[#1f3d29] px-2.5 py-1.5 rounded-xl border border-[#d8cdba] shadow-xs shrink-0">
                  ?
                </kbd>
              </div>

              {/* Escape (Échap) */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5dcce] shadow-2xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1f3d29]">
                    Fermer les fenêtres & tiroirs
                  </div>
                  <p className="text-[11px] text-[#6b5e51] leading-relaxed">
                    Ferme les modales, tiroir panier et menu mobile en sécurité (le panier n'est jamais vidé).
                  </p>
                </div>
                <kbd className="font-mono font-black text-xs sm:text-sm bg-[#fee2e2] text-[#991b1b] px-2.5 py-1.5 rounded-xl border border-[#fca5a5] shadow-xs shrink-0">
                  Échap
                </kbd>
              </div>
            </div>
          </div>

          {/* Accessibility & Hardware Note */}
          <div className="p-3.5 rounded-2xl bg-[#edf5ec] border border-[#cce4ca] flex items-start gap-3 text-xs text-[#234931]">
            <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                Compatibilité Matériel Caisse & Claviers Terminaux
              </span>
              <p className="text-[#3b664a] leading-relaxed">
                MARKETPOS intercepte directement les flux de douchettes code-barres (USB, Bluetooth, émulation clavier) et les pavés numériques POS sans nécessiter de configuration additionnelle.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#f4efe4] px-5 py-3.5 border-t border-[#d8cdba] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#6b5e51] hidden sm:flex items-center gap-1.5 font-medium">
            <span>Appuyez sur</span>
            <kbd className="font-mono text-[11px] font-bold bg-white px-1.5 py-0.5 rounded border border-[#cfc3ad] text-[#2c241c]">
              Échap
            </kbd>
            <span>pour fermer</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-btn min-h-[44px] w-full sm:w-auto px-6 py-2.5 bg-[#1f3d29] hover:bg-[#284f35] active:bg-[#16311f] text-[#fdfbf7] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm text-center"
          >
            Compris & Continuer
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
