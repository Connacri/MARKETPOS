import React, { useState, useEffect } from 'react';
import {
  Share2,
  Radio,
  Server,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Sliders,
  ShieldCheck,
  Terminal,
  Activity,
  Laptop,
  Tablet,
  QrCode,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  objectboxP2pService,
  ObjectBoxP2pConfig as P2pConfigType,
  ObjectBoxP2pPeer,
  P2pSyncStats,
  ObjectBoxNodeRole,
  ObjectBoxConflictStrategy,
} from '../../services/objectboxP2pService';
import { usePos } from '../../context/PosContext';

export const ObjectBoxP2pConfig: React.FC = () => {
  const { showToast } = usePos();

  // Service state
  const [config, setConfig] = useState<P2pConfigType>(objectboxP2pService.getConfig());
  const [peers, setPeers] = useState<ObjectBoxP2pPeer[]>(objectboxP2pService.getPeers());
  const [stats, setStats] = useState<P2pSyncStats>(objectboxP2pService.getStats());

  // Local UI state
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingPeerId, setSyncingPeerId] = useState<string | null>(null);
  const [pingingPeerId, setPingingPeerId] = useState<string | null>(null);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showAddPeerModal, setShowAddPeerModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [hasCopiedPairing, setHasCopiedPairing] = useState(false);

  // Manual Add Form
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerIp, setNewPeerIp] = useState('');
  const [newPeerRole, setNewPeerRole] = useState<ObjectBoxNodeRole>('PEER');

  // Code snippets tab
  const [codeLang, setCodeLang] = useState<'kotlin' | 'flutter' | 'ts'>('kotlin');

  // Subscribe to service changes
  useEffect(() => {
    const unsubscribe = objectboxP2pService.subscribe(() => {
      setConfig(objectboxP2pService.getConfig());
      setPeers(objectboxP2pService.getPeers());
      setStats(objectboxP2pService.getStats());
    });
    return () => unsubscribe();
  }, []);

  // Save changes
  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    objectboxP2pService.saveConfig(config);
    showToast('Configuration ObjectBox P2P mise à jour avec succès', 'success');
  };

  // Scan network
  const handleScan = async () => {
    setIsScanning(true);
    try {
      await objectboxP2pService.scanNetwork();
      showToast('Scan mDNS/UDP du réseau local terminé', 'info');
    } finally {
      setIsScanning(false);
    }
  };

  // Sync with specific peer
  const handleSyncPeer = async (peerId: string) => {
    setSyncingPeerId(peerId);
    try {
      const res = await objectboxP2pService.syncWithPeer(peerId);
      if (res.success) {
        showToast(
          `Synchronisation P2P terminée : ${res.itemsSynced} objets échangés (${res.durationMs} ms)`,
          'success'
        );
      }
    } finally {
      setSyncingPeerId(null);
    }
  };

  // Ping specific peer
  const handlePingPeer = async (peerId: string) => {
    setPingingPeerId(peerId);
    try {
      const res = await objectboxP2pService.pingPeer(peerId);
      if (res.success) {
        showToast(`Latence P2P mesurée : ${res.latencyMs} ms (Ultra-faible)`, 'info');
      }
    } finally {
      setPingingPeerId(null);
    }
  };

  // Sync all peers
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await objectboxP2pService.syncAllPeers();
      showToast(
        `Synchronisation maillée terminée : ${res.totalSynced} entités partagées sur ${res.peersCount} terminaux`,
        'success'
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Add manual peer
  const handleAddManualPeer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeerIp.trim()) return;

    objectboxP2pService.addManualPeer(newPeerName, newPeerIp, newPeerRole);
    setNewPeerName('');
    setNewPeerIp('');
    setShowAddPeerModal(false);
    showToast('Terminal POS ajouté au maillage', 'success');
  };

  // Simulate discovering a new peer
  const handleSimulateDiscover = () => {
    const p = objectboxP2pService.simulateDiscoverNewPeer();
    showToast(`Nouveau terminal découvert : ${p.name} (${p.address})`, 'success');
  };

  // Copy secret key
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(config.encryptionKey);
      setHasCopiedSecret(true);
      setTimeout(() => setHasCopiedSecret(false), 2000);
      showToast('Clé secrète de maillage copiée', 'info');
    } catch {
      // ignore
    }
  };

  // Copy pairing payload
  const handleCopyPairing = async () => {
    try {
      await navigator.clipboard.writeText(objectboxP2pService.generatePairingPayload());
      setHasCopiedPairing(true);
      setTimeout(() => setHasCopiedPairing(false), 2000);
      showToast('Jeton de jumelage copié', 'info');
    } catch {
      // ignore
    }
  };

  // Regenerate Node ID
  const handleRegenerateNodeId = () => {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
    setConfig((prev) => ({ ...prev, nodeId: `OBX-POS-${hex}` }));
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Overview Banner */}
      <div className="sherwood-panel flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden w-full min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="sherwood-badge-forest">
              <Share2 className="w-3.5 h-3.5 text-[#234931] shrink-0" />
              <span>ObjectBox P2P Sync (Zero-Server)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb]">
              Sans Serveur Central
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef4ea] text-[#8f521b] border border-[#f5cf9e]">
              Latence &lt; 5 ms (LAN)
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-[#234931] font-serif-title tracking-tight">
            Maillage P2P & Découverte Locale des Caisses
          </h3>
          <p className="text-xs sm:text-sm text-[#605547] mt-1 max-w-3xl font-medium leading-relaxed">
            Permet aux différents terminaux POS (comptoir, tablettes mobiles, bornes) de se découvrir automatiquement sur le réseau local Wi-Fi / Ethernet et de synchroniser instantanément les ventes, articles, stocks et paniers en direct sans dépendre d'Internet ni d'un serveur distant.
          </p>
        </div>

        {/* Master P2P Switch & Quick Actions */}
        <div className="sherwood-panel-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                config.enabled
                  ? 'bg-[#eaf2e8] border-[#cbe0cb] text-[#234931]'
                  : 'bg-[#f5ede0] border-[#d8cdba] text-[#857b6f]'
              }`}
            >
              <Radio className={`w-5 h-5 ${config.enabled ? 'animate-pulse text-[#234931]' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2c241c]">
                {config.enabled ? 'Maillage P2P Actif' : 'P2P Désactivé'}
              </div>
              <div className="text-[11px] text-[#605547]">
                {stats.connectedPeersCount} terminal(aux) connecté(s)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const updated = { ...config, enabled: !config.enabled };
              setConfig(updated);
              objectboxP2pService.saveConfig(updated);
              showToast(
                updated.enabled ? 'Synchronisation ObjectBox P2P activée' : 'Synchronisation P2P suspendue',
                updated.enabled ? 'success' : 'info'
              );
            }}
            className={`touch-btn min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              config.enabled ? 'sherwood-btn-forest text-white' : 'sherwood-btn-outline'
            }`}
          >
            {config.enabled ? 'Désactiver P2P' : 'Activer P2P'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Terminaux Connectés</span>
          <span className="text-xl font-black text-[#234931] font-mono flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-[#234931]" />
            {stats.connectedPeersCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Objets Synchronisés</span>
          <span className="text-xl font-black text-[#234931] font-mono flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#234931]" />
            {stats.totalSyncedObjects}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Latence Moyenne LAN</span>
          <span className="text-xl font-black text-emerald-800 font-mono flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-700" />
            {stats.avgLatencyMs} ms
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Conflits Résolus</span>
          <span className="text-xl font-black text-[#85522b] font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#85522b]" />
            {stats.conflictsResolved}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Volume Binaire</span>
          <span className="text-xl font-black text-[#2c241c] font-mono truncate">
            {stats.bytesTransferredKb.toLocaleString('fr-FR')} Ko
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs">
          <span className="text-[10px] text-[#605547] uppercase font-bold block mb-1">Dernière Synk</span>
          <span className="text-sm font-black text-[#234931] font-mono truncate">
            {stats.lastSyncTimestamp || 'Aucune'}
          </span>
        </div>
      </div>

      {/* Main Grid: Peers List (Left 2 cols) & Local Node Config (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* PEERS LIST & DISCOVERY */}
        <div className="lg:col-span-2 space-y-5">
          <div className="sherwood-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e7ddca]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold border border-[#cbe0cb]">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif-title font-black text-base text-[#234931]">
                    Terminaux Détectés sur le Réseau Local (Sous-Réseau LAN)
                  </h4>
                  <p className="text-[11px] text-[#605547]">
                    Découverte automatique mDNS / UDP ZeroConf sur le port {config.discoveryPort}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isScanning || !config.enabled}
                  onClick={handleScan}
                  className="touch-btn min-h-[40px] px-3.5 py-1.5 sherwood-btn-outline text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Scanner le réseau local pour trouver les autres caisses"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#234931] ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scan en cours...' : 'Scanner le Réseau'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingAll || !config.enabled}
                  onClick={handleSyncAll}
                  className="touch-btn min-h-[40px] px-3.5 py-1.5 sherwood-btn-forest text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Share2 className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Synk en cours...' : 'Synchroniser Tout'}</span>
                </button>
              </div>
            </div>

            {/* Sub toolbar: Add peer & Simulate */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#faf6ee] border border-[#e7ddca] text-xs">
              <span className="text-[#605547] font-medium text-[11px]">
                {peers.length} terminal(aux) configuré(s) ou découverts dans ce maillage.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPeerModal(true)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white text-[#234931] border border-[#d8cdba] hover:bg-[#f7f2e7] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#234931]" />
                  <span>Ajouter une IP Caisse</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDiscover}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#faeee2] text-[#85522b] border border-[#f5cf9e] hover:bg-[#fef4ea] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Simule la mise sous tension d'une caisse mobile ou tablette dans le magasin"
                >
                  <Tablet className="w-3.5 h-3.5 text-[#85522b]" />
                  <span>+ Simuler Caisse Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPairingModal(true)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb] hover:bg-[#dcead9] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#234931]" />
                  <span>Jumelage QR</span>
                </button>
              </div>
            </div>

            {/* Peers List Cards */}
            <div className="space-y-3">
              {peers.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#faf6ee] border border-dashed border-[#d8cdba]">
                  <Radio className="w-8 h-8 text-[#857b6f] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-[#483d31]">Aucun autre terminal détecté sur le réseau</p>
                  <p className="text-xs text-[#605547] mt-1 max-w-sm mx-auto">
                    Vérifiez que les autres caisses sont connectées au même réseau Wi-Fi ou cliquez sur "Scanner le Réseau" ou "Ajouter une IP Caisse".
                  </p>
                </div>
              ) : (
                peers.map((peer) => {
                  const isSyncing = syncingPeerId === peer.id || peer.status === 'SYNCING';
                  const isPinging = pingingPeerId === peer.id;
                  const isConnected = peer.status === 'CONNECTED';

                  return (
                    <div
                      key={peer.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isConnected
                          ? 'bg-white border-[#d8cdba] shadow-2xs hover:border-[#234931]/40'
                          : 'bg-[#faf6ee]/70 border-[#e7ddca] opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Peer Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                              isConnected
                                ? 'bg-[#eaf2e8] text-[#234931] border-[#cbe0cb]'
                                : 'bg-[#f5ede0] text-[#857b6f] border-[#d8cdba]'
                            }`}
                          >
                            {peer.name.toLowerCase().includes('tablette') ? (
                              <Tablet className="w-5 h-5" />
                            ) : peer.role === 'SERVER_HUB' ? (
                              <Server className="w-5 h-5" />
                            ) : (
                              <Laptop className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[#2c241c] truncate">
                                {peer.name}
                              </span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#f7f2e7] text-[#605547] font-semibold">
                                {peer.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isConnected
                                    ? 'bg-[#eaf2e8] text-[#234931]'
                                    : 'bg-[#f5ede0] text-[#857b6f]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                                  }`}
                                />
                                {isConnected ? 'Connecté' : 'Hors-Ligne'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#faeee2] text-[#85522b]">
                                {peer.role === 'SERVER_HUB' ? 'Hub Principal' : 'Nœud Pair'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#605547] mt-1.5">
                              <span className="font-mono font-medium text-[#2c241c]">
                                {peer.address}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-emerald-800 font-semibold font-mono">
                                <Zap className="w-3 h-3 text-emerald-700" />
                                {peer.latencyMs} ms
                              </span>
                              <span>•</span>
                              <span>Vu: {peer.lastSeen}</span>
                              <span>•</span>
                              <span className="font-mono text-[#85522b]">
                                {peer.syncedEntitiesCount} objets synchronisés
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for this peer */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            disabled={isPinging || !isConnected}
                            onClick={() => handlePingPeer(peer.id)}
                            className="touch-btn min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f7f2e7] text-[#483d31] hover:bg-[#ede5d4] border border-[#d8cdba] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            title="Envoyer un ping réseau UDP/TCP"
                          >
                            <Zap className={`w-3.5 h-3.5 text-amber-600 ${isPinging ? 'animate-bounce' : ''}`} />
                            <span>Ping</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSyncing || !isConnected}
                            onClick={() => handleSyncPeer(peer.id)}
                            className="touch-btn min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#234931] text-[#fdfbf7] hover:bg-[#1b3a27] shadow-2xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                            title="Synchroniser immédiatement avec cette caisse"
                          >
                            <Share2 className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'En cours...' : 'Synchroniser'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => objectboxP2pService.togglePeerConnection(peer.id)}
                            className="touch-btn min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs text-[#605547] hover:text-[#2c241c] hover:bg-[#f7f2e7] cursor-pointer"
                            title={isConnected ? 'Isoler cette caisse' : 'Reconnecter'}
                          >
                            {isConnected ? <WifiOff className="w-4 h-4 text-amber-700" /> : <Wifi className="w-4 h-4 text-emerald-700" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => objectboxP2pService.removePeer(peer.id)}
                            className="touch-btn min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 cursor-pointer"
                            title="Supprimer du maillage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conflict & Synchronization Entities Policy */}
          <div className="sherwood-panel space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e7ddca]">
              <ShieldCheck className="w-5 h-5 text-[#234931]" />
              <h4 className="font-serif-title font-black text-sm text-[#234931]">
                Stratégie de Résolution de Conflits & Entités Partagées
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conflict strategy selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2c241c] block">
                  Politique de Conflit (Écritures Concurrentes)
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#d8cdba] cursor-pointer">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      checked={config.conflictStrategy === 'LWW'}
                      onChange={() => setConfig({ ...config, conflictStrategy: 'LWW' })}
                      className="mt-0.5 text-[#234931] focus:ring-[#234931]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2c241c]">Dernière Écriture Gagne (LWW)</div>
                      <div className="text-[11px] text-[#605547]">
                        Horodatage haute précision en microsecondes. Idéal pour paniers et ventes.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#d8cdba] cursor-pointer">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      checked={config.conflictStrategy === 'MERGE_CRDT'}
                      onChange={() => setConfig({ ...config, conflictStrategy: 'MERGE_CRDT' })}
                      className="mt-0.5 text-[#234931] focus:ring-[#234931]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2c241c]">Fusion Incrémentale Automatique (CRDT)</div>
                      <div className="text-[11px] text-[#605547]">
                        Additionne les sorties de stock sans écraser les articles vendus sur l'autre caisse.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#d8cdba] cursor-pointer">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      checked={config.conflictStrategy === 'MASTER_HUB'}
                      onChange={() => setConfig({ ...config, conflictStrategy: 'MASTER_HUB' })}
                      className="mt-0.5 text-[#234931] focus:ring-[#234931]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2c241c]">Hub Maître Prioritaire</div>
                      <div className="text-[11px] text-[#605547]">
                        La caisse comptoir centrale a priorité sur les terminaux vendeurs mobiles.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Synchronized Entities */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2c241c] block">
                  Données Synchronisées en P2P
                </label>
                <div className="p-3 rounded-2xl bg-[#faf6ee] border border-[#e7ddca] space-y-2.5">
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-[#2c241c]">Catalogue Articles & Tarifs</span>
                    <input
                      type="checkbox"
                      checked={config.syncEntities.products}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          syncEntities: { ...config.syncEntities, products: e.target.checked },
                        })
                      }
                      className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-[#2c241c]">Stocks & Quantités en Rayon</span>
                    <input
                      type="checkbox"
                      checked={config.syncEntities.stock}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          syncEntities: { ...config.syncEntities, stock: e.target.checked },
                        })
                      }
                      className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-[#2c241c]">Ventes Réalisées & Factures</span>
                    <input
                      type="checkbox"
                      checked={config.syncEntities.sales}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          syncEntities: { ...config.syncEntities, sales: e.target.checked },
                        })
                      }
                      className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-[#2c241c]">Fichier Clients & Crédits</span>
                    <input
                      type="checkbox"
                      checked={config.syncEntities.customers}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          syncEntities: { ...config.syncEntities, customers: e.target.checked },
                        })
                      }
                      className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer pt-1 border-t border-[#e7ddca]">
                    <div>
                      <span className="font-bold text-[#234931] block">Paniers en Direct (Dual Carts)</span>
                      <span className="text-[10px] text-[#605547]">
                        Permet de commencer un panier sur tablette et encaisser sur caisse principale
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.syncEntities.carts}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          syncEntities: { ...config.syncEntities, carts: e.target.checked },
                        })
                      }
                      className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig()}
                className="touch-btn min-h-[42px] px-5 py-2 sherwood-btn-forest text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer les Préférences P2P</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOCAL NODE CONFIG (RIGHT COLUMN) */}
        <div className="space-y-5">
          <form onSubmit={handleSaveConfig} className="sherwood-panel space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e7ddca]">
              <Sliders className="w-4 h-4 text-[#234931]" />
              <h4 className="font-serif-title font-black text-sm text-[#234931]">
                Identité de ce Terminal POS
              </h4>
            </div>

            {/* Terminal Name */}
            <div>
              <label className="text-xs font-bold text-[#2c241c] block mb-1">
                Nom d'Affichage du Poste
              </label>
              <input
                type="text"
                value={config.terminalName}
                onChange={(e) => setConfig({ ...config, terminalName: e.target.value })}
                placeholder="ex. Caisse Principale #1"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#d8cdba] focus:outline-none focus:ring-2 focus:ring-[#234931] text-[#2c241c]"
              />
              <span className="text-[10px] text-[#605547] mt-0.5 block">
                Visible par les autres caisses lors de la découverte.
              </span>
            </div>

            {/* Node ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#2c241c]">Identifiant Nœud ObjectBox</label>
                <button
                  type="button"
                  onClick={handleRegenerateNodeId}
                  className="text-[10px] font-bold text-[#234931] hover:underline cursor-pointer"
                >
                  Régénérer
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={config.nodeId}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#faf6ee] border border-[#d8cdba] rounded-xl text-[#234931]"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-bold text-[#2c241c] block mb-1">
                Rôle dans le Maillage P2P
              </label>
              <select
                value={config.role}
                onChange={(e) => setConfig({ ...config, role: e.target.value as ObjectBoxNodeRole })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#d8cdba] focus:outline-none focus:ring-2 focus:ring-[#234931] text-[#2c241c]"
              >
                <option value="PEER">Pair Autonome (Bi-directionnel égalitaire)</option>
                <option value="SERVER_HUB">Hub Local / Nœud Maître (Référence)</option>
                <option value="CLIENT">Client Léger (Écoute & Réception)</option>
              </select>
            </div>

            {/* Ports */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#2c241c] block mb-1">Port Écoute P2P</label>
                <input
                  type="number"
                  value={config.listenPort}
                  onChange={(e) => setConfig({ ...config, listenPort: parseInt(e.target.value, 10) || 9999 })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-[#d8cdba] text-[#2c241c]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#2c241c] block mb-1">Port mDNS</label>
                <input
                  type="number"
                  value={config.discoveryPort}
                  onChange={(e) => setConfig({ ...config, discoveryPort: parseInt(e.target.value, 10) || 9998 })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-[#d8cdba] text-[#2c241c]"
                />
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#2c241c] flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#234931]" />
                  <span>Clé Secrète de Maillage (AES-256)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1 text-[#605547] hover:text-[#2c241c] cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1 text-[#605547] hover:text-[#2c241c] cursor-pointer"
                    title="Copier la clé"
                  >
                    {hasCopiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <input
                type={showSecret ? 'text' : 'password'}
                value={config.encryptionKey}
                onChange={(e) => setConfig({ ...config, encryptionKey: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-[#d8cdba] text-[#2c241c]"
              />
              <span className="text-[10px] text-[#605547] mt-0.5 block">
                Toutes les caisses du magasin doivent partager cette même clé pour s'authentifier.
              </span>
            </div>

            {/* Auto Discovery Beacon */}
            <div className="pt-2 border-t border-[#e7ddca] space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="font-bold text-[#2c241c]">Diffusion Beacon mDNS active</span>
                <input
                  type="checkbox"
                  checked={config.autoDiscovery}
                  onChange={(e) => setConfig({ ...config, autoDiscovery: e.target.checked })}
                  className="rounded text-[#234931] focus:ring-[#234931] w-4 h-4"
                />
              </label>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#605547]">Intervalle du Beacon</span>
                <span className="font-mono font-bold text-[#234931]">{config.beaconIntervalSec}s</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full touch-btn min-h-[44px] py-2.5 sherwood-btn-forest text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer ce Terminal</span>
            </button>
          </form>

          {/* Reset Mesh button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('Réinitialiser la liste des terminaux détectés aux caisses d\'atelier par défaut ?')) {
                  objectboxP2pService.resetToDefaultMesh();
                  showToast('Maillage réinitialisé aux terminaux de démo', 'info');
                }
              }}
              className="text-xs text-[#605547] hover:text-[#234931] font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les Terminaux de Démo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Developer & Integration Snippets (ObjectBox Native SDK) */}
      <div className="sherwood-panel space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e7ddca]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#234931]" />
            <h4 className="font-serif-title font-black text-sm text-[#234931]">
              Code d'Intégration ObjectBox P2P (SDK Natif Embarqué)
            </h4>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setCodeLang('kotlin')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                codeLang === 'kotlin' ? 'bg-[#234931] text-white' : 'bg-[#faf6ee] text-[#483d31]'
              }`}
            >
              Kotlin / Android POS
            </button>
            <button
              type="button"
              onClick={() => setCodeLang('flutter')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                codeLang === 'flutter' ? 'bg-[#234931] text-white' : 'bg-[#faf6ee] text-[#483d31]'
              }`}
            >
              Flutter / Dart
            </button>
            <button
              type="button"
              onClick={() => setCodeLang('ts')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                codeLang === 'ts' ? 'bg-[#234931] text-white' : 'bg-[#faf6ee] text-[#483d31]'
              }`}
            >
              TypeScript / Web POS
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1b231d] p-4 text-[#e3ebe4] font-mono text-xs overflow-x-auto">
          {codeLang === 'kotlin' && (
            <pre className="text-[11px] leading-relaxed">
{`// 1. Initialiser le Store ObjectBox embarqué localement
val store = MyObjectBox.builder().androidContext(context).build()

// 2. Démarrer le serveur P2P local (écoute sur le port ${config.listenPort})
val syncServer = Sync.server(
    store,
    "tcp://0.0.0.0:${config.listenPort}",
    SyncCredentials.sharedSecret("${config.encryptionKey}")
).start()

// 3. Découverte mDNS ZeroConf automatique pour connecter les tablettes caissiers
Sync.client(
    store,
    "tcp://192.168.1.42:${config.listenPort}",
    SyncCredentials.sharedSecret("${config.encryptionKey}")
).start()`}
            </pre>
          )}

          {codeLang === 'flutter' && (
            <pre className="text-[11px] leading-relaxed">
{`// Initialisation ObjectBox P2P en Flutter multi-plateforme
final store = await openStore();

// Lancer le Sync Client vers les caisses découvertes sur le LAN
final syncClient = Sync.client(
  store,
  'tcp://192.168.1.10:${config.listenPort}',
  SyncCredentials.sharedSecret('${config.encryptionKey}'),
);
syncClient.start();`}
            </pre>
          )}

          {codeLang === 'ts' && (
            <pre className="text-[11px] leading-relaxed">
{`// WebAssembly & BroadcastChannel Mesh pour navigateur & Electron
import { objectboxP2pService } from './services/objectboxP2pService';

// Découverte active sur le sous-réseau
await objectboxP2pService.scanNetwork();

// Synchronisation bi-directionnelle instantanée des 2 paniers & stocks
const syncResult = await objectboxP2pService.syncAllPeers();
console.log('Entités synchronisées sans serveur:', syncResult.totalSynced);`}
            </pre>
          )}
        </div>
      </div>

      {/* MODAL: AJOUT MANUEL D'UN TERMINAL */}
      {showAddPeerModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-[#fdfbf7] rounded-3xl p-6 max-w-md w-full border border-[#d8cdba] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7ddca]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#234931]" />
                <h3 className="font-serif-title font-black text-base text-[#234931]">
                  Ajouter une Caisse Manuellement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPeerModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#605547] hover:bg-[#faeee2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualPeer} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#2c241c] block mb-1">
                  Nom du Terminal / Emplacement
                </label>
                <input
                  type="text"
                  required
                  value={newPeerName}
                  onChange={(e) => setNewPeerName(e.target.value)}
                  placeholder="ex. Caisse Rayon Boulangerie"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#d8cdba] text-[#2c241c] focus:outline-none focus:ring-2 focus:ring-[#234931]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2c241c] block mb-1">
                  Adresse IP:Port sur le Réseau Local
                </label>
                <input
                  type="text"
                  required
                  value={newPeerIp}
                  onChange={(e) => setNewPeerIp(e.target.value)}
                  placeholder="ex. 192.168.1.85:9999"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-[#d8cdba] text-[#2c241c] focus:outline-none focus:ring-2 focus:ring-[#234931]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2c241c] block mb-1">Rôle</label>
                <select
                  value={newPeerRole}
                  onChange={(e) => setNewPeerRole(e.target.value as ObjectBoxNodeRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#d8cdba] text-[#2c241c]"
                >
                  <option value="PEER">Pair Autonome</option>
                  <option value="SERVER_HUB">Hub Principal</option>
                  <option value="CLIENT">Client Récepteur</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPeerModal(false)}
                  className="touch-btn min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-[#605547] hover:bg-[#faf6ee] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="touch-btn min-h-[42px] px-5 py-2 sherwood-btn-forest text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter au Maillage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR PAIRING */}
      {showPairingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-[#fdfbf7] rounded-3xl p-6 max-w-sm w-full border border-[#d8cdba] shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-[#e7ddca]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#234931]" />
                <h3 className="font-serif-title font-black text-base text-[#234931]">
                  Jumelage Express
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPairingModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#605547] hover:bg-[#faeee2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#605547] leading-relaxed">
              Flashez ce QR Code depuis l'appareil photo d'une nouvelle tablette ou caisse mobile pour la rattacher automatiquement au maillage.
            </p>

            {/* Stylized QR Code container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#234931]/30 inline-block mx-auto shadow-inner">
              <div className="w-44 h-44 bg-[#faf6ee] rounded-xl flex flex-col items-center justify-center border border-[#d8cdba] relative p-3">
                {/* QR Simulation graphic */}
                <div className="grid grid-cols-4 gap-1.5 w-full h-full p-2 bg-white rounded-lg">
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-transparent" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-transparent" />
                  <div className="bg-[#85522b] rounded-xs" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-transparent" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-transparent" />
                  <div className="bg-[#234931] rounded-xs" />
                  <div className="bg-[#85522b] rounded-xs" />
                  <div className="bg-transparent" />
                  <div className="bg-[#234931] rounded-xs" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded-md bg-[#234931] text-white text-[9px] font-mono font-bold shadow-xs">
                    {config.nodeId}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[#234931] font-bold">
              Port: {config.listenPort} • mDNS Actif
            </div>

            <button
              type="button"
              onClick={handleCopyPairing}
              className="w-full touch-btn min-h-[42px] py-2 sherwood-btn-outline text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              {hasCopiedPairing ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{hasCopiedPairing ? 'Jeton Copié !' : 'Copier le Jeton de Jumelage'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
