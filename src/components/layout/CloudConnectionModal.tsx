import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  supabaseSyncService,
  CloudProvider,
  parseNeonConnectionString,
  DEFAULT_SUPABASE_CONFIG,
} from '../../services/supabaseSyncService';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  ArrowUpDown,
  ExternalLink,
  Settings,
  X,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CloudConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudConnectionModal: React.FC<CloudConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOffline,
    setIsOffline,
    pendingSyncCount,
    supabaseConfig,
    updateSupabaseConfig,
    triggerSyncNow,
    setActiveView,
    showToast,
  } = usePos();

  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(
    supabaseConfig.provider || 'DUAL'
  );
  const [neonConnStr, setNeonConnStr] = useState(supabaseConfig.neonConnectionString || '');
  const [showNeonSecret, setShowNeonSecret] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [showAnonSecret, setShowAnonSecret] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const neonDiagnostics = React.useMemo(() => parseNeonConnectionString(neonConnStr), [neonConnStr]);

  const handleAlignNeonConfig = () => {
    const envConn = DEFAULT_SUPABASE_CONFIG.neonConnectionString;
    setNeonConnStr(envConn);
    updateSupabaseConfig({
      ...supabaseConfig,
      neonConnectionString: envConn,
      neonEndpoint: DEFAULT_SUPABASE_CONFIG.neonEndpoint,
      neonProjectId: DEFAULT_SUPABASE_CONFIG.neonProjectId,
      neonApiKey: DEFAULT_SUPABASE_CONFIG.neonApiKey,
    });
    showToast('Configuration Neon alignée sur les variables (.env)', 'success');
  };

  if (!isOpen) return null;

  const handleProviderChange = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setTestResult(null);
    updateSupabaseConfig({
      ...supabaseConfig,
      provider,
      syncMode: provider === 'DUAL' ? 'DUAL' : 'SINGLE',
    });
  };

  const handleSyncNow = async () => {
    if (isOffline) {
      showToast('Impossible de synchroniser en mode hors-ligne.', 'warning');
      return;
    }
    setIsSyncing(true);
    setTestResult(null);
    try {
      const res = await triggerSyncNow();
      if (res.success) {
        const modeLabel =
          selectedProvider === 'DUAL'
            ? 'Double base (Supabase + Neon)'
            : selectedProvider === 'NEON'
            ? 'Neon PostgreSQL'
            : 'Supabase';
        showToast(
          `Cloud ${modeLabel} synchronisé avec succès : inventaire & ventes`,
          'success'
        );
      } else {
        showToast('Erreur lors de la synchronisation avec le Cloud.', 'error');
      }
    } catch {
      showToast('Erreur inattendue lors de la synchronisation.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (selectedProvider === 'DUAL') {
        const res = await supabaseSyncService.testDualDatabase();
        setTestResult({
          success: res.success,
          message: res.message,
          latencyMs: Math.max(res.supabaseLatency, res.neonLatency),
        });
        if (res.success) {
          updateSupabaseConfig({
            ...supabaseConfig,
            provider: 'DUAL',
            syncMode: 'DUAL',
            neonConnectionString: neonConnStr,
            url: supabaseUrl,
            anonKey: supabaseAnonKey,
          });
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'warning');
        }
      } else if (selectedProvider === 'NEON') {
        const res = await supabaseSyncService.testNeonConnection(neonConnStr);
        setTestResult(res);
        if (res.success) {
          updateSupabaseConfig({
            ...supabaseConfig,
            provider: 'NEON',
            syncMode: 'SINGLE',
            neonConnectionString: neonConnStr,
          });
          showToast(`Connexion Neon PostgreSQL active (${res.latencyMs} ms)`, 'success');
        } else {
          showToast(res.message, 'error');
        }
      } else {
        const res = await supabaseSyncService.testConnection(supabaseUrl, supabaseAnonKey);
        setTestResult(res);
        if (res.success) {
          updateSupabaseConfig({
            ...supabaseConfig,
            provider: 'SUPABASE',
            syncMode: 'SINGLE',
            url: supabaseUrl,
            anonKey: supabaseAnonKey,
          });
          showToast(`Connexion Supabase valide (${res.latencyMs} ms)`, 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Impossible de joindre le serveur Cloud sélectionné.',
      });
      showToast('Échec de la connexion Cloud.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenAdminSettings = () => {
    setActiveView('admin');
    onClose();
  };

  const formattedLastSync = supabaseConfig.lastSyncTimestamp
    ? new Date(supabaseConfig.lastSyncTimestamp).toLocaleTimeString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Aucune récente';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-[#fdfbf7] w-full max-w-xl rounded-3xl shadow-2xl border border-[#e5dcce] overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#1f3d29] text-[#fcfbf7] border-b border-[#16311f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2d583b] rounded-xl text-[#86efac] border border-[#3c6e4c]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cloud-modal-title" className="font-bold text-sm sm:text-base font-serif-title flex items-center gap-1.5">
                <span>Connexion Cloud & Double Synchronisation</span>
              </h3>
              <p className="text-[11px] text-[#c5ddc5] font-medium">
                Backend Supabase Cloud & Neon Serverless PostgreSQL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre Cloud"
            className="touch-btn p-2 text-[#c5ddc5] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
          {/* Provider Selection Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#605547] uppercase tracking-wider block">
              Mode de Synchronisation Cloud
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#ede5d6] rounded-2xl">
              <button
                type="button"
                onClick={() => handleProviderChange('DUAL')}
                className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedProvider === 'DUAL'
                    ? 'bg-[#1f3d29] text-white shadow-sm font-black'
                    : 'text-[#605547] hover:text-[#1f3d29]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Double Base</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('NEON')}
                className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedProvider === 'NEON'
                    ? 'bg-[#1f3d29] text-white shadow-sm font-black'
                    : 'text-[#605547] hover:text-[#1f3d29]'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00e599]" />
                <span>Neon Postgres</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('SUPABASE')}
                className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedProvider === 'SUPABASE'
                    ? 'bg-[#1f3d29] text-white shadow-sm font-black'
                    : 'text-[#605547] hover:text-[#1f3d29]'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
                <span>Supabase</span>
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isOffline
                ? 'bg-[#faece1] border-[#f0c8a8] text-[#85522b]'
                : 'bg-[#edf5ec] border-[#b4dbb6] text-[#1b3d24]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isOffline ? (
                <div className="p-2.5 bg-[#f5d7be] rounded-xl text-[#a85a18]">
                  <CloudOff className="w-5 h-5" />
                </div>
              ) : (
                <div className="relative p-2.5 bg-[#d4ebd2] rounded-xl text-[#1f3d29]">
                  <Cloud className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                </div>
              )}

              <div>
                <div className="font-bold text-sm">
                  {isOffline
                    ? 'Caisse Hors-ligne'
                    : selectedProvider === 'DUAL'
                    ? 'Double Base Synchronisée (Supabase + Neon)'
                    : `Cloud ${selectedProvider === 'NEON' ? 'Neon Serverless' : 'Supabase'} Connecté`}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isOffline
                    ? 'Les transactions sont conservées localement dans la base IndexedDB.'
                    : selectedProvider === 'DUAL'
                    ? 'Téléversement automatique de l\'inventaire et des ventes vers Supabase et Neon.'
                    : selectedProvider === 'NEON'
                    ? 'PostgreSQL 16 autoscaling avec support du pooling de transactions.'
                    : 'Base PostgreSQL distante répliquée avec PostgREST.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className="touch-btn min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shrink-0 bg-white shadow-2xs hover:bg-[#f7f2e7]"
            >
              {isOffline ? 'Se reconnecter' : 'Simuler Hors-ligne'}
            </button>
          </div>

          {/* Parameters for Neon (shown if NEON or DUAL) */}
          {(selectedProvider === 'NEON' || selectedProvider === 'DUAL') && (
            <div className="p-4 bg-white rounded-2xl border border-[#ded3be] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#1f3d29]">
                  <Database className="w-4 h-4 text-[#00e599]" />
                  <span>Paramètres Neon PostgreSQL Serverless</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#edf5ec] text-[#1f3d29] font-bold">
                  Postgres 16
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#605547]">
                    Chaîne de Connexion URI Neon
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAlignNeonConfig}
                      className="text-[10px] text-[#234931] hover:underline font-bold cursor-pointer"
                      title="Réaligner automatiquement avec l'URI de l'environnement (.env)"
                    >
                      Aligner (.env)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNeonSecret(!showNeonSecret)}
                      className="text-[#877a6b] hover:text-[#1f3d29] flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                    >
                      {showNeonSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showNeonSecret ? 'Masquer' : 'Afficher'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type={showNeonSecret ? 'text' : 'password'}
                  value={neonConnStr}
                  onChange={(e) => setNeonConnStr(e.target.value)}
                  placeholder="postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
                  className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded3be] font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#86efac]/30"
                />

                {neonDiagnostics && (
                  <div className="mt-2 p-2.5 bg-[#f5efe6] rounded-xl border border-[#ded3be] text-[10px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#1f3d29]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Configuration Neon Reconnue</span>
                      </span>
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#ded3be]">
                        {neonDiagnostics.isPooler ? '⚡ Pooler Actif' : '🔌 Direct'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[#605547] font-mono">
                      <div>Hôte: <span className="text-[#1f3d29] font-bold truncate inline-block max-w-[120px] align-bottom" title={neonDiagnostics.host}>{neonDiagnostics.host}</span></div>
                      <div>Base: <span className="text-[#1f3d29] font-bold">{neonDiagnostics.database}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parameters for Supabase (shown if SUPABASE or DUAL) */}
          {(selectedProvider === 'SUPABASE' || selectedProvider === 'DUAL') && (
            <div className="p-4 bg-white rounded-2xl border border-[#ded3be] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#1f3d29]">
                  <Server className="w-4 h-4 text-[#3ecf8e]" />
                  <span>Paramètres Supabase PostgREST</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#edf5ec] text-[#1f3d29] font-bold">
                  API REST
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#605547]">URL du Projet Supabase</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded3be] font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#86efac]/30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#605547]">Clé API Anon (Public)</label>
                  <button
                    type="button"
                    onClick={() => setShowAnonSecret(!showAnonSecret)}
                    className="text-[#877a6b] hover:text-[#1f3d29] flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {showAnonSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAnonSecret ? 'Masquer' : 'Afficher'}</span>
                  </button>
                </div>
                <input
                  type={showAnonSecret ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded3be] font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#86efac]/30"
                />
              </div>
            </div>
          )}

          {/* Pending Changes & Sync Status */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#e5dcce] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#8d5732]" />
              <div>
                <span className="font-bold text-[#2c241c] block">
                  Transactions en attente de téléversement
                </span>
                <span className="text-[11px] text-[#877a6b]">
                  Dernière synchro : {formattedLastSync}
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                pendingSyncCount > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {pendingSyncCount} en attente
            </span>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">{testResult.message}</span>
              </div>
              {testResult.latencyMs !== undefined && (
                <span className="font-mono text-[11px] bg-white/70 px-2 py-0.5 rounded-md font-bold shrink-0">
                  ⚡ {testResult.latencyMs} ms
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#e5dcce] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSyncing || isOffline}
                onClick={handleSyncNow}
                className={`touch-btn min-h-[44px] px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isOffline
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-[#1f3d29] hover:bg-[#16311f] text-white active:scale-98'
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 text-[#86efac] ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span>
                  {isSyncing
                    ? 'Synchronisation...'
                    : selectedProvider === 'DUAL'
                    ? 'Synchroniser Double Base'
                    : `Synchroniser vers ${selectedProvider}`}
                </span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="touch-btn min-h-[44px] px-4 py-2.5 rounded-2xl font-bold text-xs bg-white hover:bg-[#f7f2e7] text-[#2c241c] border border-[#d8cdba] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                <Zap className={`w-4 h-4 text-[#85522b] ${isTesting ? 'animate-pulse' : ''}`} />
                <span>{isTesting ? 'Test en cours...' : 'Tester les Connexions'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAdminSettings}
              className="touch-btn w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold text-[#5d5244] hover:text-[#1f3d29] hover:bg-[#ede5d6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#5d5244]" />
              <span>Ouvrir l'administration Neon / Supabase & scripts SQL</span>
              <ExternalLink className="w-3 h-3 text-[#877a6b]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
