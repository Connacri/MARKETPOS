import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import { posSounds } from '../../services/soundService';
import {
  Camera,
  X,
  Barcode,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface PosCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

export const PosCameraScannerModal: React.FC<PosCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenCart,
}) => {
  const {
    products,
    addToCart,
    activeCartId,
    cartSummary,
    showToast,
  } = usePos();

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    product?: Product;
    success: boolean;
    error?: string;
    quantityInCart: number;
    timestamp: number;
  } | null>(null);

  const [scannedInSessionCount, setScannedInSessionCount] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});
  const containerId = 'pos-mobile-camera-scanner-viewport';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      maximumFractionDigits: 0,
    }).format(val) + '\u00A0DA';
  };

  // Handler for decoded barcode
  const handleDecodedBarcode = (code: string) => {
    if (!code) return;
    const clean = code.trim();

    // Prevent immediate repeated scans of same item within 1500ms
    const now = Date.now();
    const lastScan = lastScannedTimeRef.current[clean] || 0;
    if (now - lastScan < 1500) {
      return;
    }
    lastScannedTimeRef.current[clean] = now;

    // Find product in catalog
    const product = products.find(
      (p) => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase()
    );

    if (!product) {
      posSounds.playScanError();
      setLastScannedResult({
        code: clean,
        success: false,
        error: `Code "${clean}" non trouvé dans le catalogue`,
        quantityInCart: 0,
        timestamp: now,
      });
      return;
    }

    if (product.stock <= 0) {
      posSounds.playScanError();
      setLastScannedResult({
        code: clean,
        product,
        success: false,
        error: `"${product.name}" est en rupture de stock !`,
        quantityInCart: 0,
        timestamp: now,
      });
      return;
    }

    // Success: Add 1 unit directly to active cart
    addToCart(product, 1);
    posSounds.playScanSuccess();

    // Trigger haptic vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {
        // ignore
      }
    }

    setScannedInSessionCount((prev) => prev + 1);
    setLastScannedResult({
      code: clean,
      product,
      success: true,
      quantityInCart: 1,
      timestamp: now,
    });

    showToast(`✓ "${product.name}" ajouté au Panier ${activeCartId}`, 'success');

    // If not continuous mode, close modal after brief delay
    if (!continuousMode) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  // Initialize camera scanner when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
      return;
    }

    setLastScannedResult(null);
    setCameraError(null);
    setScannedInSessionCount(0);
    lastScannedTimeRef.current = {};

    const timer = setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      try {
        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.333333,
            },
            (decodedText) => {
              handleDecodedBarcode(decodedText);
            },
            () => {
              // silent heartbeat
            }
          )
          .then(() => {
            setIsScanning(true);
            setCameraError(null);
          })
          .catch((err) => {
            console.warn('Camera scan initialization notice:', err);
            setIsScanning(false);
            setCameraError(
              err.message ||
                "Accès caméra indisponible ou bloqué par le navigateur. Vous pouvez utiliser le simulateur de scan express ci-dessous pour tester immédiatement."
            );
          });
      } catch (err: any) {
        console.warn('Scanner init error:', err);
        setCameraError(
          "Impossible d'accéder au capteur vidéo. Utilisez les codes de test ci-dessous."
        );
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner de code-barres caméra"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 pt-[max(0.75rem,calc(0.75rem+env(safe-area-inset-top,0px)))] pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] animate-in fade-in duration-200"
    >
      <div className="bg-[#fdfbf7] w-full max-w-lg rounded-3xl shadow-2xl border border-[#d8cdba] overflow-hidden flex flex-col max-h-[95vh] h-full sm:h-auto">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-[#1f3d29] text-[#fcfbf7] border-b border-[#16311f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#85522b] flex items-center justify-center text-[#fcdbb6] shadow-xs shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base font-serif-title text-[#fff6ec] truncate flex items-center gap-1.5">
                <span>Scanner Caméra Mobile</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#86efac]/20 text-[#86efac] font-bold">
                  P{activeCartId}
                </span>
              </h3>
              <p className="text-[11px] text-[#a6c4a6] truncate">
                Ajout direct et instantané au Panier {activeCartId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le scanner"
            className="touch-btn min-h-[40px] min-w-[40px] p-2 text-[#c5ddc5] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Continuous scan mode bar & live session stats */}
        <div className="px-4 py-2 bg-[#f4efe4] border-b border-[#e2d7c2] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[#5d5244] truncate">
              {scannedInSessionCount > 0 ? (
                <span className="text-[#1f3d29] font-black">
                  ✓ {scannedInSessionCount} article{scannedInSessionCount > 1 ? 's' : ''} scanné{scannedInSessionCount > 1 ? 's' : ''}
                </span>
              ) : (
                'Prêt à scanner'
              )}
            </span>
            <span className="text-sand-300">·</span>
            <span className="text-xs font-mono font-bold text-[#85522b] truncate">
              Panier : {formatMoney(cartSummary.totalTTC)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setContinuousMode(!continuousMode)}
            className={`touch-btn px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              continuousMode
                ? 'bg-[#1f3d29] text-white border-[#2d563a]'
                : 'bg-white text-[#5d5244] border-[#d8cdba]'
            }`}
            title="Le mode continu permet de scanner plusieurs articles à la suite sans refermer la caméra"
          >
            <Zap className={`w-3 h-3 ${continuousMode ? 'text-[#86efac]' : 'text-[#7d7060]'}`} />
            <span>Scan continu {continuousMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Modal Body: Camera Viewport */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 flex flex-col min-h-0">
          {/* Camera Frame */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-4/3 flex flex-col items-center justify-center shadow-inner border border-stone-800 shrink-0">
            {/* HTML5 video element container */}
            <div
              id={containerId}
              className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
            />

            {/* Reticle Overlay */}
            {!cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="relative w-64 max-w-[80%] h-32 border-2 border-dashed border-[#86efac]/80 rounded-2xl bg-black/20 shadow-2xl flex items-center justify-center">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[#86efac] rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[#86efac] rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[#86efac] rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[#86efac] rounded-br-lg" />

                  {/* Red Laser Sweep line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" />
                </div>

                <div className="mt-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Alignez le code-barres dans le repère</span>
                </div>
              </div>
            )}

            {/* Error fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-stone-900/95 p-4 flex flex-col items-center justify-center text-center text-white space-y-2.5 z-10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-100">
                    Caméra non disponible
                  </h4>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    {cameraError}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    const container = document.getElementById(containerId);
                    if (container) {
                      const html5QrCode = new Html5Qrcode(containerId);
                      scannerRef.current = html5QrCode;
                      html5QrCode
                        .start(
                          { facingMode: 'environment' },
                          { fps: 15, qrbox: { width: 280, height: 160 } },
                          handleDecodedBarcode,
                          () => {}
                        )
                        .catch((e) => setCameraError(e.message));
                    }
                  }}
                  className="touch-btn min-h-[38px] px-3.5 py-1.5 bg-[#234931] hover:bg-[#1f3d29] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Réessayer la caméra</span>
                </button>
              </div>
            )}
          </div>

          {/* Last Scanned Feedback Banner */}
          {lastScannedResult && (
            <div
              className={`p-3 rounded-2xl border text-xs animate-in zoom-in-95 duration-150 ${
                lastScannedResult.success
                  ? 'bg-[#eaf5eb] border-[#b4dbb6] text-[#1b3d24]'
                  : 'bg-[#faece1] border-[#f0c8a8] text-[#8c3809]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {lastScannedResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold truncate">
                    {lastScannedResult.success
                      ? `✓ ${lastScannedResult.product?.name} ajouté au panier !`
                      : lastScannedResult.error}
                  </span>
                </div>
                {lastScannedResult.success && lastScannedResult.product && (
                  <span className="font-mono font-black text-xs text-[#1f3d29] shrink-0">
                    +{formatMoney(lastScannedResult.product.price)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Tap Testing Barcodes (Instant simulated scan for testing without barcodes) */}
          <div className="bg-[#f7f2e7] border border-[#d8cdba] p-2.5 rounded-2xl space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#5d5244] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Simulateur de scan rapide (test direct) :</span>
              </span>
              <span className="text-[10px] text-[#8c7e6c]">1 clic = 1 scan</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleDecodedBarcode('613000000001')}
                className="touch-btn min-h-[40px] p-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-[#d8cdba] hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="font-black text-[#1f3d29] truncate">Coca-Cola</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">613000000001</div>
              </button>
              <button
                type="button"
                onClick={() => handleDecodedBarcode('613000000004')}
                className="touch-btn min-h-[40px] p-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-[#d8cdba] hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="font-black text-[#1f3d29] truncate">Huile d'Olive</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">613000000004</div>
              </button>
              <button
                type="button"
                onClick={() => handleDecodedBarcode('613000000002')}
                className="touch-btn min-h-[40px] p-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-[#d8cdba] hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="font-black text-[#1f3d29] truncate">Lait Candia</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">613000000002</div>
              </button>
              <button
                type="button"
                onClick={() => handleDecodedBarcode('613000000012')}
                className="touch-btn min-h-[40px] p-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-[#d8cdba] hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="font-black text-[#1f3d29] truncate">Écouteurs BT</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">613000000012</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 sm:p-4 bg-[#f4efe4] border-t border-[#e2d7c2] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="touch-btn min-h-[44px] flex-1 px-4 py-2 bg-white hover:bg-[#ede5d6] text-[#5d5244] border border-[#d8cdba] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer le scan
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenCart) {
                onOpenCart();
              }
            }}
            className="touch-btn min-h-[44px] flex-1 px-4 py-2 bg-[#85522b] hover:bg-[#6e3e1c] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#fcdbb6]" />
            <span>Voir le Panier ({cartSummary.totalItems})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
