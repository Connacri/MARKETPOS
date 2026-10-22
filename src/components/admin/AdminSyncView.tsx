import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import { supabaseSyncService, SyncLogEntry } from '../../services/supabaseSyncService';
import { PaperWidth, PrinterInterface, ThermalPrinterSettings } from '../../types';
import { SHERWOOD_ASSETS } from '../../assets/images';
import {
  Cloud,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  TableProperties,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Layers,
  Sparkles,
  Printer,
  Image as ImageIcon,
  Sliders,
  Scissors,
  Upload,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  Info,
  Share2,
  Radio,
} from 'lucide-react';

import { ObjectBoxP2pConfig } from './ObjectBoxP2pConfig';
import { ObjectBoxTerminalsList } from './ObjectBoxTerminalsList';
import { SUPABASE_SCHEMA_SQL, SUPABASE_SEED_SQL } from '../../data/supabaseSql';
import { NEON_SCHEMA_SQL, NEON_CONNECTION_HELP } from '../../data/neonSql';
import type { CloudProvider } from '../../services/supabaseSyncService';

export const AdminSyncView: React.FC = () => {
  const {
    products,
    sales,
    isOffline,
    setIsOffline,
    pendingSyncCount,
    supabaseConfig,
    updateSupabaseConfig,
    triggerSyncNow,
    bulkAddBenchmarkProducts,
    resetDemoData,
    printerSettings,
    updatePrinterSettings,
  } = usePos();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'cloud' | 'objectbox' | 'schema' | 'printer' | 'benchmark' | 'logs'>('cloud');

  // Cloud provider & state
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>(supabaseConfig.provider || 'NEON');
  const [neonConnectionString, setNeonConnectionString] = useState(supabaseConfig.neonConnectionString || '');
  const [showNeonSecret, setShowNeonSecret] = useState(false);

  // Supabase form state
  const [url, setUrl] = useState(supabaseConfig.url);
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [syncDirection, setSyncDirection] = useState(supabaseConfig.syncDirection);
  const [autoSync, setAutoSync] = useState(supabaseConfig.autoSyncEnabled);

  // Thermal Printer form state
  const [printerForm, setPrinterForm] = useState<ThermalPrinterSettings>(printerSettings);
  const [printerSaveSuccess, setPrinterSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync printer form when context updates
  useEffect(() => {
    setPrinterForm(printerSettings);
  }, [printerSettings]);

  // Statuses
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [activeSqlDoc, setActiveSqlDoc] = useState<'schema' | 'seed' | 'neon'>('schema');

  // Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{ count: number; timeMs: number } | null>(null);

  // Live Logs
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = supabaseSyncService.subscribeLogs((newLogs) => {
      setLogs([...newLogs]);
    });
    return () => unsubscribe();
  }, []);

  // Handle saving printer settings
  const handleSavePrinterSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updatePrinterSettings(printerForm);
    setPrinterSaveSuccess(true);
    supabaseSyncService.addLog(
      'SUCCESS',
      `Paramètres imprimante thermique enregistrés : ${printerForm.paperWidth} • ${printerForm.printerName}`
    );
    setTimeout(() => setPrinterSaveSuccess(false), 3000);
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPrinterForm((prev) => ({
          ...prev,
          logoDataUrl: reader.result as string,
          printLogo: true,
        }));
        supabaseSyncService.addLog('INFO', `Nouveau logo chargé (${file.name}) pour les tickets thermiques.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Use Sherwood Island mascot as logo
  const handleSetSherwoodLogo = () => {
    setPrinterForm((prev) => ({
      ...prev,
      logoDataUrl: SHERWOOD_ASSETS.shopkeeper,
      printLogo: true,
    }));
    supabaseSyncService.addLog('INFO', 'Logo Sherwood Island (Figurine Mascotte) activé pour les tickets.');
  };

  // Remove receipt logo
  const handleRemoveLogo = () => {
    setPrinterForm((prev) => ({
      ...prev,
      logoDataUrl: undefined,
      printLogo: false,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    supabaseSyncService.addLog('INFO', 'Logo retiré des tickets thermiques.');
  };

  // Thermal test print trigger
  const handlePrintTestReceipt = () => {
    // Save first to ensure sync
    updatePrinterSettings(printerForm);
    supabaseSyncService.addLog(
      'INFO',
      `Impression ticket test ${printerForm.paperWidth} envoyée vers ${printerForm.printerName}...`
    );
    window.print();
  };

  // Save config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig({
      ...supabaseConfig,
      provider: cloudProvider,
      neonConnectionString,
      url,
      anonKey,
      syncDirection,
      autoSyncEnabled: autoSync,
    });
    supabaseSyncService.addLog(
      'SUCCESS',
      `Paramètres Cloud (${cloudProvider === 'NEON' ? 'Neon Serverless Postgres' : 'Supabase'}) enregistrés avec succès`
    );
  };

  // Test connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    if (cloudProvider === 'DUAL') {
      const res = await supabaseSyncService.testDualDatabase();
      setTestResult({
        success: res.success,
        message: res.message,
        latencyMs: Math.max(res.supabaseLatency, res.neonLatency),
      });
    } else if (cloudProvider === 'NEON') {
      const res = await supabaseSyncService.testNeonConnection(neonConnectionString);
      setTestResult(res);
    } else {
      const res = await supabaseSyncService.testConnection(url, anonKey);
      setTestResult(res);
    }
    setIsTesting(false);
  };

  // Trigger sync
  const handleSyncNow = async () => {
    if (isOffline) {
      supabaseSyncService.addLog('WARNING', 'Impossible de synchroniser en mode hors-ligne');
      return;
    }
    setIsSyncing(true);
    setSyncProgress(25);
    const interval = setInterval(() => {
      setSyncProgress((p) => Math.min(90, p + 20));
    }, 200);

    const res = await triggerSyncNow();
    clearInterval(interval);
    setSyncProgress(100);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncProgress(0);
    }, 400);
  };

  // Copy SQL script to clipboard (schema, seed, or neon)
  const handleCopySql = async () => {
    try {
      const sqlContent =
        activeSqlDoc === 'neon'
          ? NEON_SCHEMA_SQL
          : activeSqlDoc === 'schema'
          ? SUPABASE_SCHEMA_SQL
          : SUPABASE_SEED_SQL;
      await navigator.clipboard.writeText(sqlContent);
      setHasCopiedSql(true);
      setTimeout(() => setHasCopiedSql(false), 2500);
      const docLabel =
        activeSqlDoc === 'neon'
          ? 'Schéma Neon PostgreSQL'
          : activeSqlDoc === 'schema'
          ? 'Schéma DDL Supabase'
          : 'Seed démo';
      supabaseSyncService.addLog('INFO', `Script SQL (${docLabel}) copié dans le presse-papiers`);
    } catch {
      supabaseSyncService.addLog('WARNING', 'Impossible de copier le script automatiquement');
    }
  };

  // Download schema.sql, seed.sql, or neon-schema.sql file
  const handleDownloadSql = () => {
    const sqlContent =
      activeSqlDoc === 'neon'
        ? NEON_SCHEMA_SQL
        : activeSqlDoc === 'schema'
        ? SUPABASE_SCHEMA_SQL
        : SUPABASE_SEED_SQL;
    const fileName =
      activeSqlDoc === 'neon'
        ? 'neon-schema-pos.sql'
        : activeSqlDoc === 'schema'
        ? 'supabase-schema-pos.sql'
        : 'supabase-seed-pos.sql';
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    supabaseSyncService.addLog('INFO', `Fichier ${fileName} téléchargé`);
  };

  // Run database benchmark
  const handleRunBenchmark = async (count: number) => {
    setIsBenchmarking(true);
    supabaseSyncService.addLog('INFO', `Test de charge: écriture de ${count} articles dans IndexedDB...`);
    const res = await bulkAddBenchmarkProducts(count);
    setBenchmarkResult(res);
    setIsBenchmarking(false);
    supabaseSyncService.addLog(
      'SUCCESS',
      `Benchmark réussi: ${res.count} articles indexés en ${res.timeMs} ms (${Math.round(
        (res.timeMs / res.count) * 1000
      )} µs/article)`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Global Sherwood Theme */}
      <div className="sherwood-panel flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden w-full min-w-0">
        <div className="min-w-0">
          <div className="sherwood-badge-forest mb-2">
            <Server className="w-3.5 h-3.5 text-[#234931] shrink-0" />
            <span>Cloud Supabase & Moteur POS Décentralisé</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#234931] font-serif-title tracking-tight truncate">
            Panneau Cloud Supabase & Synchronisation Multi-Postes
          </h2>
          <p className="text-xs sm:text-sm text-[#605547] mt-1 max-w-2xl font-medium leading-relaxed">
            Connectez votre base PostgreSQL Supabase, déployez le schéma des tables et synchronisez vos données de caisse en temps réel ou hors-ligne.
          </p>
        </div>

        {/* Offline Toggle Switch with Sherwood Styling */}
        <div className="sherwood-panel-subtle p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-3 min-w-0">
            {isOffline ? (
              <div className="w-11 h-11 rounded-2xl bg-[#fef4ea] border border-[#f5cf9e] text-[#8f521b] flex items-center justify-center shrink-0 shadow-2xs">
                <WifiOff className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-[#eaf2e8] border border-[#cbe0cb] text-[#234931] flex items-center justify-center shrink-0 shadow-2xs">
                <Wifi className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#2c241c] truncate">
                {isOffline ? 'Mode Hors-Ligne (Autonome)' : 'En Ligne (Cloud Connecté)'}
              </div>
              <div className="text-[11px] text-[#605547] font-medium truncate">
                {pendingSyncCount} vente(s) en attente de synk
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOffline(!isOffline)}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto flex items-center justify-center ${
              isOffline
                ? 'sherwood-btn-wood text-white shadow-xs'
                : 'sherwood-btn-outline'
            }`}
          >
            {isOffline ? 'Repasser En Ligne' : 'Simuler Hors-Ligne'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs with min 44px touch targets and container bounds */}
      <div className="w-full min-w-0 border-b border-[#e7ddca] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none touch-pan-x -mx-1 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'cloud'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <Cloud className="w-4 h-4 shrink-0" />
            <span>Connexion Cloud & Synk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('objectbox')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'objectbox'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>ObjectBox P2P (Sans Serveur)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeTab === 'objectbox' ? 'bg-white/20 text-white' : 'bg-[#eaf2e8] text-[#234931]'
              }`}
            >
              LAN Mesh
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'schema'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <FileCode className="w-4 h-4 shrink-0" />
            <span>Script SQL des Tables</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${activeTab === 'schema' ? 'bg-white/20 text-white' : 'bg-[#faeee2] text-[#85522b]'}`}>
              10 tables
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('printer')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'printer'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Imprimante Thermique</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${activeTab === 'printer' ? 'bg-white/20 text-white' : 'bg-[#eaf2e8] text-[#234931]'}`}>
              {printerForm.paperWidth}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('benchmark')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'benchmark'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Moteur Local (IndexedDB)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'logs'
                ? 'bg-[#234931] text-[#fdfbf7] shadow-sm'
                : 'bg-[#fdfbf7] text-[#483d31] hover:bg-[#f7f2e7] border border-[#d8cdba]'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>Journal d'Activité</span>
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-[#eaf2e8] text-[#234931]'}`}>
                {logs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CLOUD CONNECTION & SYNC */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 w-full min-w-0">
          {/* ObjectBox P2P Local Discovery Network Terminals Visual Component */}
          <ObjectBoxTerminalsList onOpenConfig={() => setActiveTab('objectbox')} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          {/* Main Config Form */}
          <div className="lg:col-span-2 sherwood-panel space-y-6 w-full min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7ddca] min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold shrink-0 shadow-2xs border border-[#cbe0cb]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif-title font-black text-base sm:text-lg text-[#234931] truncate">
                    Identifiants du Projet Supabase
                  </h3>
                  <p className="text-xs text-[#605547] font-medium truncate">
                    Réplication PostgreSQL & Gestion décentralisée des ventes
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSyncing || isOffline}
                onClick={handleSyncNow}
                className={`touch-btn min-h-[46px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto shrink-0 ${
                  isOffline
                    ? 'bg-[#e2d7c2] text-[#877a6b] cursor-not-allowed'
                    : 'sherwood-btn-forest'
                }`}
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="whitespace-nowrap">{isSyncing ? 'Synchronisation...' : 'Synchroniser Maintenant'}</span>
              </button>
            </div>

            {/* Sync progress indicator */}
            {isSyncing && (
              <div className="sherwood-panel-subtle p-3.5 space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between text-xs text-[#234931] font-bold">
                  <span>Synchronisation Cloud en cours...</span>
                  <span className="font-mono">{syncProgress}%</span>
                </div>
                <div className="w-full bg-[#e2d7c2] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#234931] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-5">
              {/* Cloud Provider Switcher */}
              <div className="space-y-1.5 p-3.5 bg-[#f4ece1] rounded-2xl border border-[#ded3be]">
                <label className="block text-xs font-black uppercase tracking-wider text-[#483d31]">
                  Moteur Cloud Backend Actif
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCloudProvider('DUAL');
                      setTestResult(null);
                    }}
                    className={`touch-btn py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      cloudProvider === 'DUAL'
                        ? 'bg-[#1f3d29] text-white border-[#16311f] shadow-sm font-black'
                        : 'bg-white text-[#483d31] hover:bg-[#faf7f0] border-[#ded3be]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#86efac]" />
                    <span>Double Base (Supabase + Neon)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCloudProvider('NEON');
                      setTestResult(null);
                    }}
                    className={`touch-btn py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      cloudProvider === 'NEON'
                        ? 'bg-[#1f3d29] text-white border-[#16311f] shadow-sm font-black'
                        : 'bg-white text-[#483d31] hover:bg-[#faf7f0] border-[#ded3be]'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00e599]" />
                    <span>Neon Postgres 16</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCloudProvider('SUPABASE');
                      setTestResult(null);
                    }}
                    className={`touch-btn py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      cloudProvider === 'SUPABASE'
                        ? 'bg-[#1f3d29] text-white border-[#16311f] shadow-sm font-black'
                        : 'bg-white text-[#483d31] hover:bg-[#faf7f0] border-[#ded3be]'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3ecf8e]" />
                    <span>Supabase Cloud</span>
                  </button>
                </div>
              </div>

              {/* Provider Specific Inputs */}
              {(cloudProvider === 'NEON' || cloudProvider === 'DUAL') && (
                <div className="space-y-4 p-4 bg-white rounded-2xl border border-[#ded3be] shadow-2xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#483d31]">
                        Chaîne de Connexion Neon (PostgreSQL Connection String URI)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNeonSecret(!showNeonSecret)}
                        className="text-xs text-[#877a6b] hover:text-[#234931] flex items-center gap-1 cursor-pointer font-bold"
                      >
                        {showNeonSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showNeonSecret ? 'Masquer' : 'Afficher'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showNeonSecret ? 'text' : 'password'}
                        required
                        value={neonConnectionString}
                        onChange={(e) => setNeonConnectionString(e.target.value)}
                        placeholder="postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
                        className="w-full pl-3.5 pr-10 py-3 min-h-[46px] sherwood-input text-xs sm:text-sm font-mono"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#877a6b] pointer-events-none">
                        <Database className="w-4 h-4 text-[#00e599]" />
                      </div>
                    </div>

                    <span className="text-[11px] text-[#877a6b] block font-medium leading-normal">
                      Accessible depuis la console Neon : <strong>Dashboard → Connection Details → Connection String</strong>. Le mode <code>-pooler</code> est recommandé.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-[#faf7f0] border border-[#ede5d6]">
                      <span className="text-[#877a6b] block">Moteur</span>
                      <span className="font-bold text-[#1f3d29]">PostgreSQL 16</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#faf7f0] border border-[#ede5d6]">
                      <span className="text-[#877a6b] block">Architecture</span>
                      <span className="font-bold text-[#1f3d29]">Serverless Autoscale</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#faf7f0] border border-[#ede5d6] col-span-2 sm:col-span-1">
                      <span className="text-[#877a6b] block">SSL</span>
                      <span className="font-bold text-emerald-800">Obligatoire (?sslmode=require)</span>
                    </div>
                  </div>
                </div>
              )}

              {(cloudProvider === 'SUPABASE' || cloudProvider === 'DUAL') && (
                <div className="space-y-4 p-4 bg-white rounded-2xl border border-[#ded3be] shadow-2xs">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#483d31]">
                      URL du projet Supabase
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://xyzcompany.supabase.co"
                        className="w-full pl-3.5 pr-10 py-3 min-h-[46px] sherwood-input text-xs sm:text-sm font-mono"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#877a6b] pointer-events-none">
                        <Server className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-[11px] text-[#877a6b] block font-medium leading-normal">
                      Accessible depuis votre tableau de bord Supabase : Project Settings → API → Project URL
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#483d31]">
                      Clé Publique Anonyme (Anon Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showAnonKey ? 'text' : 'password'}
                        required
                        value={anonKey}
                        onChange={(e) => setAnonKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                        className="w-full pl-3.5 pr-12 py-3 min-h-[46px] sherwood-input text-xs sm:text-sm font-mono tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAnonKey(!showAnonKey)}
                        aria-label={showAnonKey ? 'Masquer la clé' : 'Afficher la clé'}
                        className="touch-btn absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#877a6b] hover:text-[#2c241c] rounded-xl transition-colors cursor-pointer"
                      >
                        {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#877a6b] block font-medium leading-normal">
                      Clé de niveau client pour la synchronisation POS sécurisée par RLS (Row Level Security).
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#483d31]">
                    Direction du Flux
                  </label>
                  <select
                    value={syncDirection}
                    onChange={(e) => setSyncDirection(e.target.value as any)}
                    className="w-full min-h-[46px] px-3.5 py-2.5 sherwood-input text-xs font-bold cursor-pointer"
                  >
                    <option value="BIDIRECTIONAL">Bidirectionnel (Cloud ⇄ Local)</option>
                    <option value="CLOUD_TO_LOCAL">Descendant (Cloud → Caisse Locale)</option>
                    <option value="LOCAL_TO_CLOUD">Ascendant (Caisse Locale → Cloud)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#483d31]">
                    Synchronisation Automatique
                  </label>
                  <select
                    value={autoSync ? 'true' : 'false'}
                    onChange={(e) => setAutoSync(e.target.value === 'true')}
                    className="w-full min-h-[46px] px-3.5 py-2.5 sherwood-input text-xs font-bold cursor-pointer"
                  >
                    <option value="true">Automatique (À chaque vente)</option>
                    <option value="false">Manuelle uniquement</option>
                  </select>
                </div>
              </div>

              {/* Ping / Test status badge */}
              {testResult && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
                    testResult.success
                      ? 'bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb]'
                      : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#234931] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
                    )}
                    <span className="truncate">{testResult.message}</span>
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-[#cbe0cb] font-black shrink-0">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {/* Responsive actions bar: full-width stacked on mobile, inline on sm+ */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#e7ddca]">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="touch-btn min-h-[46px] px-5 py-2.5 sherwood-btn-outline text-xs font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isTesting ? 'animate-spin' : ''}`} />
                  <span className="whitespace-nowrap">{isTesting ? 'Vérification en cours...' : 'Tester la Connexion'}</span>
                </button>

                <button
                  type="submit"
                  className="touch-btn min-h-[46px] px-6 py-2.5 sherwood-btn-forest text-xs font-bold shadow-xs flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Sauvegarder les Paramètres</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats & Cloud Topology Card */}
          <div className="space-y-5 w-full min-w-0">
            <div className="sherwood-panel p-5 space-y-4 w-full min-w-0">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#e7ddca]">
                <div className="w-9 h-9 rounded-xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold shrink-0 border border-[#f0d4ba]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-serif-title font-black text-sm text-[#234931]">
                  Statut du Cluster Cloud Supabase
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
                  <span className="text-[#483d31] font-bold">Fournisseur Cloud</span>
                  <span className="font-extrabold text-[#234931]">Supabase PostgreSQL</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
                  <span className="text-[#483d31] font-bold">Sécurité RLS</span>
                  <span className="font-black text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    <span>Activée (10 tables)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
                  <span className="text-[#483d31] font-bold">File d'attente locale</span>
                  <span className="font-mono font-black text-[#85522b] bg-[#faeee2] px-2.5 py-1 rounded-xl border border-[#f0d4ba]">
                    {pendingSyncCount} ticket(s)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
                  <span className="text-[#483d31] font-bold">Articles synchronisables</span>
                  <span className="font-mono font-black text-[#234931] bg-[#eaf2e8] px-2.5 py-1 rounded-xl border border-[#cbe0cb]">
                    {products.length} articles
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className="w-full touch-btn min-h-[44px] py-2.5 sherwood-btn-wood text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileCode className="w-4 h-4 shrink-0" />
                  <span>Voir le Script de Création SQL</span>
                </button>
              </div>
            </div>

            {/* Quick Guide Card */}
            <div className="p-4 rounded-3xl bg-white border border-[#d8cdba] shadow-2xs space-y-2 text-xs">
              <div className="font-black text-[#234931] flex items-center gap-2 text-sm font-serif-title">
                <span>🌲</span>
                <span>Mode Décentralisé & P2P Autonome</span>
              </div>
              <p className="text-[#483d31] leading-relaxed font-medium">
                Le point de vente fonctionne 100% hors-ligne. En cas de coupure Internet, les encaissements continuent normalement et sont automatiquement déversés vers Supabase dès le rétablissement du réseau.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB: OBJECTBOX P2P (SANS SERVEUR CENTRAL) */}
      {activeTab === 'objectbox' && (
        <ObjectBoxP2pConfig />
      )}

      {/* TAB 2: SQL SCHEMA & TABLE CREATION SCRIPT */}
      {activeTab === 'schema' && (
        <div className="space-y-5">
          <div className="sherwood-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7ddca]">
              <div>
                <div className="sherwood-badge-wood mb-1.5">
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Base PostgreSQL Supabase Cloud</span>
                </div>
                <h3 className="font-serif-title font-black text-lg text-[#234931]">
                  Scripts SQL Alignés avec l'Application & les Modèles
                </h3>
                <p className="text-xs text-[#605547] mt-0.5">
                  Exécutez ces scripts directement dans le <strong>SQL Editor</strong> de Supabase pour initialiser ou aligner votre base de données.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="touch-btn px-4 py-2 sherwood-btn-forest text-xs font-bold flex items-center gap-2"
                >
                  {hasCopiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{hasCopiedSql ? 'Copié !' : `Copier ${activeSqlDoc === 'schema' ? 'le Schéma' : 'le Seed'}`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="touch-btn px-4 py-2 sherwood-btn-outline text-xs font-bold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{activeSqlDoc === 'schema' ? 'Télécharger schema.sql' : 'Télécharger seed.sql'}</span>
                </button>
              </div>
            </div>

            {/* Sub-selector between schema.sql and seed.sql */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[#f4ece1] rounded-2xl border border-[#e0d3c0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSqlDoc('schema')}
                  className={`touch-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSqlDoc === 'schema'
                      ? 'bg-[#234931] text-white shadow-xs'
                      : 'text-[#605547] hover:text-[#234931] hover:bg-white/60'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>1. Schéma des Tables (schema.sql)</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeSqlDoc === 'schema' ? 'bg-white/20' : 'bg-[#e5d9c6]'}`}>
                    12 tables + vue + RLS
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSqlDoc('seed')}
                  className={`touch-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSqlDoc === 'seed'
                      ? 'bg-[#85522b] text-white shadow-xs'
                      : 'text-[#605547] hover:text-[#85522b] hover:bg-white/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Données Démo (seed.sql)</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeSqlDoc === 'seed' ? 'bg-white/20' : 'bg-[#e5d9c6]'}`}>
                    18 articles & clients
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSqlDoc('neon')}
                  className={`touch-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSqlDoc === 'neon'
                      ? 'bg-[#1f3d29] text-white shadow-xs font-black'
                      : 'text-[#605547] hover:text-[#1f3d29] hover:bg-white/60'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-[#00e599]" />
                  <span>3. Schéma Neon Serverless (neon.sql)</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeSqlDoc === 'neon' ? 'bg-white/20' : 'bg-[#e5d9c6]'}`}>
                    Postgres 16 + Pooling
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-[#706453] px-3 font-medium">
                PostgreSQL 16+ • UTF-8 • Idempotent (IF NOT EXISTS / ON CONFLICT)
              </div>
            </div>

            {/* List of generated tables chips with clear contrast and font */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'categories',
                'products',
                'customers',
                'sales',
                'sale_items',
                'sync_audit_log',
                'v_daily_revenue_summary',
              ].map((table) => (
                <span
                  key={table}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#d8cdba] font-mono text-[11px] font-bold text-[#1f3d29] shadow-2xs hover:border-[#1f3d29] transition-colors"
                >
                  {table.startsWith('v_') ? 'view' : 'table'}: public.{table}
                </span>
              ))}
            </div>

            {/* SQL Code Block */}
            <div className="relative rounded-2xl bg-[#1e231f] text-[#d6e2d8] border border-[#2d3b2f] p-4 font-mono text-xs overflow-x-auto shadow-inner">
              <pre className="leading-relaxed whitespace-pre font-mono-pos max-h-[480px] overflow-y-auto pr-2">
                {activeSqlDoc === 'neon'
                  ? NEON_SCHEMA_SQL
                  : activeSqlDoc === 'schema'
                  ? SUPABASE_SCHEMA_SQL
                  : SUPABASE_SEED_SQL}
              </pre>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs space-y-2">
                <div className="text-xs font-black text-[#1f3d29] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1f3d29] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Ouvrir Supabase</span>
                </div>
                <p className="text-xs text-[#483d31] leading-relaxed font-medium">
                  Connectez-vous sur supabase.com et accédez au tableau de bord de votre projet POS.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs space-y-2">
                <div className="text-xs font-black text-[#1f3d29] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1f3d29] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>SQL Editor</span>
                </div>
                <p className="text-xs text-[#483d31] leading-relaxed font-medium">
                  Cliquez sur l'onglet <strong>SQL Editor</strong> dans le menu de gauche, puis sur <em>New query</em>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs space-y-2">
                <div className="text-xs font-black text-[#1f3d29] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1f3d29] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Coller & Exécuter</span>
                </div>
                <p className="text-xs text-[#483d31] leading-relaxed font-medium">
                  Collez l'intégralité du script SQL et cliquez sur <strong>Run</strong>. Les 10 tables et politiques RLS seront créées en 1 seconde.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: THERMAL PRINTER SETTINGS (80mm / 58mm, LOGO, HARDWARE) */}
      {activeTab === 'printer' && (
        <div className="space-y-6">
          {printerSaveSuccess && (
            <div className="p-4 bg-[#eaf2e8] border border-[#cbe0cb] text-[#234931] rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Paramètres d'impression thermique enregistrés avec succès dans la mémoire locale de la caisse.</span>
              </div>
              <button
                type="button"
                onClick={() => setPrinterSaveSuccess(false)}
                className="text-[#234931] hover:underline"
              >
                Fermer
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Controls & Settings */}
            <form onSubmit={handleSavePrinterSettings} className="lg:col-span-7 space-y-5">
              {/* Card 1: Format Papier Thermique (80mm vs 58mm) */}
              <div className="sherwood-panel space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e7ddca]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif-title font-black text-sm text-[#234931]">
                        1. Format du Rouleau Thermique
                      </h3>
                      <p className="text-[11px] text-[#605547]">
                        Choisissez la largeur du papier selon votre matériel de caisse
                      </p>
                    </div>
                  </div>
                  <span className="sherwood-badge-forest text-[11px]">
                    Actif : {printerForm.paperWidth}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 80mm Option */}
                  <div
                    onClick={() => setPrinterForm((prev) => ({ ...prev, paperWidth: '80mm' }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      printerForm.paperWidth === '80mm'
                        ? 'bg-[#eaf2e8] border-[#234931] shadow-sm'
                        : 'bg-[#fdfbf7] border-[#e2d7c2] hover:border-[#85522b]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-black text-sm text-[#234931] font-mono">80 mm</div>
                      {printerForm.paperWidth === '80mm' && (
                        <span className="w-5 h-5 rounded-full bg-[#234931] text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#2c241c] mt-1">
                      Standard Caisse & Supermarché
                    </div>
                    <p className="text-[11px] text-[#605547] mt-1 leading-relaxed">
                      Largeur d'impression 72 à 80 mm. Format standard pour commerce de détail, jusqu'à 48 caractères par ligne.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#d8cdba] flex items-center justify-between text-[10px] text-[#85522b] font-mono font-bold">
                      <span>48 Colonnes</span>
                      <span>Rouleau Ø 80mm</span>
                    </div>
                  </div>

                  {/* 58mm Option */}
                  <div
                    onClick={() => setPrinterForm((prev) => ({ ...prev, paperWidth: '58mm' }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      printerForm.paperWidth === '58mm'
                        ? 'bg-[#eaf2e8] border-[#234931] shadow-sm'
                        : 'bg-[#fdfbf7] border-[#e2d7c2] hover:border-[#85522b]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-black text-sm text-[#234931] font-mono">58 mm</div>
                      {printerForm.paperWidth === '58mm' && (
                        <span className="w-5 h-5 rounded-full bg-[#234931] text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#2c241c] mt-1">
                      Format Économique & Mobile
                    </div>
                    <p className="text-[11px] text-[#605547] mt-1 leading-relaxed">
                      Largeur d'impression 48 à 58 mm. Idéal pour terminaux mobiles, kiosques et caisses compactes (32 colonnes).
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#d8cdba] flex items-center justify-between text-[10px] text-[#85522b] font-mono font-bold">
                      <span>32 Colonnes</span>
                      <span>Rouleau Ø 50mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Sélection Imprimante & Interface */}
              <div className="sherwood-panel space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#e7ddca]">
                  <div className="w-9 h-9 rounded-2xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-title font-black text-sm text-[#234931]">
                      2. Imprimante par Défaut & Interface Matérielle
                    </h3>
                    <p className="text-[11px] text-[#605547]">
                      Protocole ESC/POS ou gestionnaire d'impression standard
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Preset Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-[#2c241c] mb-1">
                      Modèle d'imprimante
                    </label>
                    <select
                      value={printerForm.printerName}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, printerName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-semibold bg-[#f7f2e7] border border-[#d8cdba] rounded-xl text-[#2c241c] focus:outline-hidden focus:border-[#234931]"
                    >
                      <option value="EPSON TM-T20III (USB/Ethernet)">EPSON TM-T20III (Standard de caisse)</option>
                      <option value="EPSON TM-T88VI (Ultra-rapide 350mm/s)">EPSON TM-T88VI (Haut débit)</option>
                      <option value="Star Micronics TSP143III (USB/LAN/BT)">Star Micronics TSP143III</option>
                      <option value="Bixolon SRP-330II (ESC/POS)">Bixolon SRP-330II</option>
                      <option value="Xprinter XP-N160M / XP-58 (Économique)">Xprinter XP-N160M / XP-58</option>
                      <option value="Sunmi T2 / V2 Pro (POS Tactile)">Sunmi T2 / V2 Pro</option>
                      <option value="Imprimante Système Standard (Spooler OS)">Imprimante Système Standard (Spooler)</option>
                    </select>
                  </div>

                  {/* Custom Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#2c241c] mb-1">
                      Nom affiché sur les rapports
                    </label>
                    <input
                      type="text"
                      value={printerForm.printerName}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, printerName: e.target.value }))}
                      placeholder="Nom de l'imprimante caisse..."
                      className="w-full px-3 py-2 text-xs sherwood-input"
                    />
                  </div>
                </div>

                {/* Interface Selector Buttons */}
                <div>
                  <label className="block text-xs font-bold text-[#2c241c] mb-2">
                    Liaison matérielle
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'SYSTEM_DEFAULT', label: 'Navigateur / OS', desc: 'Boîte système' },
                      { id: 'USB_RAW', label: 'USB Direct', desc: 'ESC/POS natif' },
                      { id: 'NETWORK_IP', label: 'Réseau IP', desc: 'Ethernet / Wi-Fi' },
                      { id: 'BLUETOOTH', label: 'Bluetooth', desc: 'Imprimante mobile' },
                    ].map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setPrinterForm((prev) => ({ ...prev, printerInterface: it.id as PrinterInterface }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          printerForm.printerInterface === it.id
                            ? 'bg-[#234931] text-[#fdfbf7] border-[#234931] shadow-2xs'
                            : 'bg-[#fdfbf7] border-[#d8cdba] text-[#483d31] hover:bg-[#f7f2e7]'
                        }`}
                      >
                        <div className="font-bold text-[11px] leading-tight">{it.label}</div>
                        <div className={`text-[10px] ${printerForm.printerInterface === it.id ? 'text-[#c5ddc5]' : 'text-[#877a6b]'}`}>
                          {it.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Network IP selected, show IP & Port inputs */}
                {printerForm.printerInterface === 'NETWORK_IP' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#f7f2e7] border border-[#e2d7c2] rounded-xl text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                        Adresse IP de l'imprimante
                      </label>
                      <input
                        type="text"
                        value={printerForm.printerIp}
                        onChange={(e) => setPrinterForm((prev) => ({ ...prev, printerIp: e.target.value }))}
                        placeholder="192.168.1.200"
                        className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-[#d8cdba] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                        Port Raw (9100)
                      </label>
                      <input
                        type="number"
                        value={printerForm.printerPort}
                        onChange={(e) => setPrinterForm((prev) => ({ ...prev, printerPort: Number(e.target.value) }))}
                        placeholder="9100"
                        className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-[#d8cdba] rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Logo du Ticket de Caisse */}
              <div className="sherwood-panel space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e7ddca]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif-title font-black text-sm text-[#234931]">
                        3. Logo Personnalisé du Ticket
                      </h3>
                      <p className="text-[11px] text-[#605547]">
                        Téléchargez votre propre image pour l'en-tête thermique
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#234931]">
                    <input
                      type="checkbox"
                      checked={printerForm.printLogo}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, printLogo: e.target.checked }))}
                      className="w-4 h-4 accent-[#234931] rounded"
                    />
                    <span>Activer sur les tickets</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview Thumbnail */}
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-[#d8cdba] flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
                    {printerForm.logoDataUrl ? (
                      <img
                        src={printerForm.logoDataUrl}
                        alt="Logo Ticket"
                        className="w-full h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-center text-[#877a6b] text-[10px] p-1 font-medium">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#c7baa3]" />
                        Sans logo
                      </div>
                    )}
                  </div>

                  {/* Upload and quick buttons */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="touch-btn px-3.5 py-2 sherwood-btn-forest text-xs font-bold flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Téléverser mon Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSetSherwoodLogo}
                        className="touch-btn px-3 py-2 sherwood-btn-outline text-xs font-semibold flex items-center gap-1.5"
                        title="Activer la mascotte Sherwood Island HD"
                      >
                        <span>🍃 Figurine Sherwood HD</span>
                      </button>

                      {printerForm.logoDataUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="touch-btn px-2.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-[#605547] leading-relaxed">
                      Format recommandé : image PNG ou JPG carrée ou panoramique (environ 250×150 px). Le logo est automatiquement converti en niveaux de gris pour l'impression thermique.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Coordonnées du Magasin */}
              <div className="sherwood-panel space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e7ddca]">
                  <div className="w-8 h-8 rounded-xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif-title font-black text-sm text-[#234931]">
                      4. Coordonnées & En-tête Imprimé
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Nom de l'enseigne
                    </label>
                    <input
                      type="text"
                      value={printerForm.storeName}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, storeName: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Sous-titre / Activité
                    </label>
                    <input
                      type="text"
                      value={printerForm.storeSubtitle}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, storeSubtitle: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={printerForm.storeAddress}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, storeAddress: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={printerForm.storePhone}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, storePhone: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Identifiants fiscaux (NIF, RC, NIS)
                    </label>
                    <input
                      type="text"
                      value={printerForm.storeTaxId}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, storeTaxId: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input font-mono text-[11px]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#2c241c] mb-1">
                      Message de pied de ticket
                    </label>
                    <textarea
                      rows={2}
                      value={printerForm.receiptFooterMessage}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, receiptFooterMessage: e.target.value }))}
                      className="w-full px-3 py-1.5 sherwood-input text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 5: Options Matérielles (Découpe, Tiroir, Exemplaires) */}
              <div className="sherwood-panel space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e7ddca]">
                  <div className="w-8 h-8 rounded-xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif-title font-black text-sm text-[#234931]">
                    5. Automatismes Caisse & Tiroir
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="p-3 bg-[#f7f2e7] border border-[#e2d7c2] rounded-xl flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerForm.autoCut}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, autoCut: e.target.checked }))}
                      className="w-4 h-4 accent-[#234931] rounded"
                    />
                    <div>
                      <div className="font-bold text-[#2c241c]">Découpe Papier</div>
                      <div className="text-[10px] text-[#605547]">Commande ESC/POS GS V</div>
                    </div>
                  </label>

                  <label className="p-3 bg-[#f7f2e7] border border-[#e2d7c2] rounded-xl flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerForm.openCashDrawer}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, openCashDrawer: e.target.checked }))}
                      className="w-4 h-4 accent-[#234931] rounded"
                    />
                    <div>
                      <div className="font-bold text-[#2c241c]">Tiroir-Caisse</div>
                      <div className="text-[10px] text-[#605547]">Impulsion ESC p (Pin 2)</div>
                    </div>
                  </label>

                  <div className="p-3 bg-[#f7f2e7] border border-[#e2d7c2] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#2c241c]">Exemplaires</div>
                      <div className="text-[10px] text-[#605547]">Nombre de tickets</div>
                    </div>
                    <select
                      value={printerForm.printCopies}
                      onChange={(e) => setPrinterForm((prev) => ({ ...prev, printCopies: Number(e.target.value) }))}
                      className="px-2 py-1 bg-white border border-[#d8cdba] rounded-lg text-xs font-bold"
                    >
                      <option value={1}>1 ticket</option>
                      <option value={2}>2 tickets</option>
                      <option value={3}>3 tickets</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="touch-btn flex-1 py-3 px-5 sherwood-btn-forest text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer la Configuration Imprimante</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintTestReceipt}
                  className="touch-btn py-3 px-4 sherwood-btn-wood text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Ticket de Test ({printerForm.paperWidth})</span>
                </button>
              </div>
            </form>

            {/* Right 5 cols: Authentic Live Thermal Ticket Slip Visualizer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sherwood-panel space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e7ddca]">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#234931]" />
                    <h4 className="font-serif-title font-black text-xs text-[#234931]">
                      Aperçu Réel du Ticket Thermique
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] bg-[#faeee2] text-[#85522b] px-2 py-0.5 rounded-md font-bold">
                    Format : {printerForm.paperWidth}
                  </span>
                </div>

                <div className="bg-[#ede6d8] p-4 rounded-2xl flex justify-center overflow-x-auto">
                  {/* Calibrated Thermal Ticket Slip */}
                  <div
                    className={`bg-white rounded-lg shadow-md border border-[#d6cbba] font-mono text-slate-900 transition-all ${
                      printerForm.paperWidth === '58mm'
                        ? 'w-[230px] p-3 text-[10px] space-y-2.5'
                        : 'w-[310px] p-4 text-xs space-y-3.5'
                    }`}
                  >
                    {/* Thermal Cut Mark */}
                    <div className="text-center text-[9px] text-slate-400 border-b border-dashed border-slate-300 pb-1">
                      ✂ - - - - - - DÉCOUPE TICKET - - - - - - ✂
                    </div>

                    {/* Logo if enabled */}
                    {printerForm.printLogo && printerForm.logoDataUrl && (
                      <div className="flex justify-center pb-1">
                        <img
                          src={printerForm.logoDataUrl}
                          alt="Logo Ticket"
                          className="max-h-14 max-w-[140px] object-contain filter contrast-150 grayscale"
                        />
                      </div>
                    )}

                    {/* Header Store Info */}
                    <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                      <div className="font-black text-slate-900 tracking-wider uppercase text-sm">
                        {printerForm.storeName || 'SHERWOOD POS MODULE'}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        {printerForm.storeSubtitle || 'Commerce Général & Épicerie'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {printerForm.storeAddress || '14 Rue de Sherwood, Alger'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Tél : {printerForm.storePhone || '+213 21 00 00 00'}
                      </div>
                      <div className="text-[8px] text-slate-400 pt-0.5">
                        {printerForm.storeTaxId || 'NIF: 001916010042879 • RC: 16/00-098234B19'}
                      </div>
                    </div>

                    {/* Ticket Meta */}
                    <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                      <div className="flex justify-between font-bold">
                        <span>Ticket N° :</span>
                        <span>TEST-{new Date().getFullYear()}-001</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Date :</span>
                        <span>{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Imprimante :</span>
                        <span className="truncate max-w-[140px]">{printerForm.printerName.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Gabarit :</span>
                        <span className="font-bold text-[#234931]">{printerForm.paperWidth} ESC/POS</span>
                      </div>
                    </div>

                    {/* Sample Items Table */}
                    <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[10px]">
                      <div className="flex justify-between font-bold text-slate-500 border-b border-slate-200 pb-0.5">
                        <span>Article</span>
                        <span>Total</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="truncate max-w-[150px]">Huile d'olive vierge 1L</span>
                          <span>950 DA</span>
                        </div>
                        <div className="text-[9px] text-slate-400">1 x 950 DA (TVA 19%)</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="truncate max-w-[150px]">Café Moulu Familial 250g</span>
                          <span>420 DA</span>
                        </div>
                        <div className="text-[9px] text-slate-400">2 x 210 DA (TVA 9%)</div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>Sous-total HT :</span>
                        <span>1 184 DA</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>TVA :</span>
                        <span>186 DA</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-0.5 border-t border-slate-300">
                        <span>TOTAL TTC :</span>
                        <span>1 370 DA</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                        <span>Mode Règlement :</span>
                        <span>ESPÈCES</span>
                      </div>
                    </div>

                    {/* Footer barcode & custom message */}
                    <div className="text-center space-y-1.5 pt-1">
                      {/* Barcode line mock */}
                      <div className="font-mono text-[9px] tracking-widest text-slate-700 font-bold">
                        |||||| | |||||||| || ||||||||| |
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        *613000000001*
                      </div>
                      <p className="text-[9px] text-slate-600 leading-tight">
                        {printerForm.receiptFooterMessage || "Merci de votre confiance ! À bientôt."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handlePrintTestReceipt}
                    className="w-full py-2.5 sherwood-btn-outline text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#234931]" />
                    <span>Lancer le Test d'Impression ({printerForm.paperWidth})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL INDEXEDDB & BENCHMARK */}
      {activeTab === 'benchmark' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 sherwood-panel space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7ddca]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#faeee2] text-[#85522b] flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title font-black text-base text-[#234931]">
                    Moteur Local Décentralisé (IndexedDB O(1))
                  </h3>
                  <p className="text-[11px] text-[#605547]">
                    Index B-Tree binaire pour catalogue massif & recherche ultra-rapide
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#eaf2e8] text-[#234931]">
                Moteur Actif
              </span>
            </div>

            {/* Metrics cards with clear typography and contrast */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs text-center">
                <span className="text-[11px] text-[#483d31] uppercase font-bold block mb-1">Articles Indexés</span>
                <span className="text-2xl font-black text-[#234931] font-mono">
                  {products.length.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs text-center">
                <span className="text-[11px] text-[#483d31] uppercase font-bold block mb-1">Recherche Code-Barres</span>
                <span className="text-2xl font-black text-emerald-800 font-mono">
                  &lt; 0.2 ms
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs text-center">
                <span className="text-[11px] text-[#483d31] uppercase font-bold block mb-1">File Hors-Ligne</span>
                <span className="text-2xl font-black text-[#85522b] font-mono">
                  {pendingSyncCount}
                </span>
              </div>
            </div>

            {/* Stress-Test */}
            <div className="p-5 rounded-3xl bg-white border border-[#d8cdba] shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e7ddca]">
                <Zap className="w-5 h-5 text-[#85522b]" />
                <h4 className="text-sm font-black text-[#234931] font-serif-title">
                  Test de Charge Massive (Montée à des Milliers d'Articles)
                </h4>
              </div>
              <p className="text-xs text-[#483d31] leading-relaxed font-medium">
                Injectez des séries d'articles avec codes-barres réels pour tester la réactivité de la caisse POS et de la synchronisation cloud sous charge.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isBenchmarking}
                  onClick={() => handleRunBenchmark(5000)}
                  className="touch-btn min-h-[44px] px-4 py-2 sherwood-btn-forest text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>+5 000 Articles</span>
                </button>

                <button
                  type="button"
                  disabled={isBenchmarking}
                  onClick={() => handleRunBenchmark(15000)}
                  className="touch-btn min-h-[44px] px-4 py-2 sherwood-btn-wood text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>+15 000 Articles</span>
                </button>

                <button
                  type="button"
                  onClick={resetDemoData}
                  className="touch-btn min-h-[44px] px-4 py-2 sherwood-btn-outline text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réinitialiser la Base</span>
                </button>
              </div>

              {benchmarkResult && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3 bg-[#eaf2e8] border border-[#cbe0cb] rounded-xl text-xs text-[#234931] font-bold flex items-center justify-between"
                >
                  <span>
                    ✓ {benchmarkResult.count.toLocaleString('fr-FR')} articles ajoutés et indexés
                  </span>
                  <span className="font-mono text-[#1f3d29]">
                    en {benchmarkResult.timeMs} ms ({Math.round((benchmarkResult.timeMs / benchmarkResult.count) * 1000)} µs/art.)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="sherwood-panel space-y-4">
            <h3 className="font-serif-title font-black text-sm text-[#234931]">
              Architecture Décentralisée
            </h3>
            <p className="text-xs text-[#605547] leading-relaxed">
              Inspiré de l'architecture ObjectBox P2P et SQLite embarqué : chaque poste de caisse conserve l'intégralité de sa base de données locale dans le navigateur via IndexedDB.
            </p>
            <div className="sherwood-panel-subtle p-3 space-y-2 text-xs">
              <div className="font-bold text-[#483d31]">Zéro Latence Réseau</div>
              <p className="text-[11px] text-[#605547]">
                Le scan d'un article et la validation d'un ticket s'exécutent en moins d'une milliseconde, même sans connexion Internet.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('objectbox')}
              className="w-full touch-btn min-h-[42px] py-2 px-3 sherwood-btn-forest text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Ouvrir la Configuration ObjectBox P2P</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-[#1b231d] text-[#e3ebe4] p-5 border border-[#2b3a2e] shadow-lg space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b3a2e]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-[#e3ebe4]">Journal d'Événements Synchronisation & Base Locale</span>
            </div>
            <span className="text-[10px] text-[#87a08b] font-semibold">Temps Réel</span>
          </div>

          <div
            aria-live="polite"
            aria-atomic="false"
            className="h-64 overflow-y-auto space-y-1.5 pr-2"
          >
            {logs.length === 0 ? (
              <div className="text-[#87a08b] py-6 text-center">Aucun événement enregistré.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-[11px] leading-relaxed">
                  <span className="text-[#718a75] shrink-0 font-mono">[{log.timestamp}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.type === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.type === 'ERROR'
                        ? 'text-rose-400'
                        : log.type === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-sky-300'
                    }`}
                  >
                    [{log.type}]
                  </span>
                  <span className="text-[#d8e5d9]">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
