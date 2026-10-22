import React, { useState, useEffect } from 'react';
import {
  Share2,
  Radio,
  Server,
  RefreshCw,
  Zap,
  CheckCircle2,
  Wifi,
  WifiOff,
  Laptop,
  Tablet,
  Plus,
  Trash2,
  Activity,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  HardDrive,
  Info,
} from 'lucide-react';
import {
  objectboxP2pService,
  ObjectBoxP2pConfig,
  ObjectBoxP2pPeer,
  P2pSyncStats,
  ObjectBoxNodeRole,
} from '../../services/objectboxP2pService';
import { usePos } from '../../context/PosContext';

interface ObjectBoxTerminalsListProps {
  onOpenConfig?: () => void;
  compact?: boolean;
}

export const ObjectBoxTerminalsList: React.FC<ObjectBoxTerminalsListProps> = ({
  onOpenConfig,
  compact = false,
}) => {
  const { showToast } = usePos();

  // Reactive state from ObjectBox P2P service
  const [config, setConfig] = useState<ObjectBoxP2pConfig>(objectboxP2pService.getConfig());
  const [peers, setPeers] = useState<ObjectBoxP2pPeer[]>(objectboxP2pService.getPeers());
  const [stats, setStats] = useState<P2pSyncStats>(objectboxP2pService.getStats());

  // Component UI state
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingPeerId, setSyncingPeerId] = useState<string | null>(null);
  const [pingingPeerId, setPingingPeerId] = useState<string | null>(null);
  const [copiedPeerId, setCopiedPeerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Manual add form
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualRole, setManualRole] = useState<ObjectBoxNodeRole>('PEER');

  // Subscribe to real-time service updates
  useEffect(() => {
    const unsubscribe = objectboxP2pService.subscribe(() => {
      setConfig(objectboxP2pService.getConfig());
      setPeers(objectboxP2pService.getPeers());
      setStats(objectboxP2pService.getStats());
    });
    return () => unsubscribe();
  }, []);

  // Trigger local network mDNS / broadcast scan
  const handleScanNetwork = async () => {
    setIsScanning(true);
    try {
      await objectboxP2pService.scanNetwork();
      showToast('Scan mDNS/UDP du réseau local terminé avec succès', 'success');
    } catch {
      showToast('Erreur lors du scan du réseau local', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Sync all connected peers
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await objectboxP2pService.syncAllPeers();
      showToast(
        `Synchronisation P2P terminée : ${res.totalSynced} entités synchronisées sur ${res.peersCount} terminaux`,
        'success'
      );
    } catch {
      showToast('Erreur lors de la synchronisation globale', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Ping a specific peer
  const handlePingPeer = async (peer: ObjectBoxP2pPeer) => {
    setPingingPeerId(peer.id);
    try {
      const res = await objectboxP2pService.pingPeer(peer.id);
      if (res.success) {
        showToast(`Ping vers ${peer.name} : ${res.latencyMs} ms (FlatBuffers LAN)`, 'info');
      } else {
        showToast(`Échec du ping vers ${peer.name}`, 'warning');
      }
    } finally {
      setPingingPeerId(null);
    }
  };

  // Sync with specific peer
  const handleSyncPeer = async (peer: ObjectBoxP2pPeer) => {
    setSyncingPeerId(peer.id);
    try {
      const res = await objectboxP2pService.syncWithPeer(peer.id);
      if (res.success) {
        showToast(
          `Synchronisation avec ${peer.name} : ${res.itemsSynced} objets échangés en ${res.durationMs} ms`,
          'success'
        );
      } else {
        showToast(`Échec de synchronisation avec ${peer.name}`, 'warning');
      }
    } finally {
      setSyncingPeerId(null);
    }
  };

  // Simulate discovering another POS terminal
  const handleSimulateDiscover = () => {
    const newPeer = objectboxP2pService.simulateDiscoverNewPeer();
    showToast(`Nouveau terminal POS détecté : ${newPeer.name} (${newPeer.address})`, 'success');
  };

  // Add terminal manually
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddress.trim()) return;
    objectboxP2pService.addManualPeer(manualName, manualAddress, manualRole);
    setManualName('');
    setManualAddress('');
    setShowAddModal(false);
    showToast('Terminal ajouté au maillage local', 'success');
  };

  // Copy IP address
  const handleCopyAddress = (peer: ObjectBoxP2pPeer) => {
    navigator.clipboard?.writeText(peer.address);
    setCopiedPeerId(peer.id);
    setTimeout(() => setCopiedPeerId(null), 2000);
    showToast(`Adresse de ${peer.name} copiée`, 'info');
  };

  // Helper for device icon
  const getDeviceIcon = (peer: ObjectBoxP2pPeer) => {
    const lower = peer.name.toLowerCase();
    if (lower.includes('tablette') || lower.includes('mobile') || lower.includes('rayon')) {
      return <Tablet className="w-5 h-5 text-[#234931]" />;
    }
    if (peer.role === 'SERVER_HUB' || lower.includes('hub') || lower.includes('serveur')) {
      return <Server className="w-5 h-5 text-[#8f521b]" />;
    }
    return <Laptop className="w-5 h-5 text-[#234931]" />;
  };

  const activePeers = peers.filter((p) => p.status === 'CONNECTED' || p.status === 'SYNCING');

  return (
    <div className="sherwood-panel space-y-5 w-full min-w-0 border-2 border-[#cbe0cb] bg-[#fbfdfa] relative overflow-hidden shadow-sm">
      {/* Top Banner & Title */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#e2d8c3] min-w-0">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sherwood-badge-forest text-[11px] font-bold">
              <Share2 className="w-3.5 h-3.5 text-[#234931] shrink-0" />
              <span>ObjectBox P2P Zero-Server</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Découverte Réseau Local Active</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#f5ede0] text-[#605547] border border-[#ded3be]">
              mDNS/UDP 9998 &bull; TCP 9999
            </span>
          </div>

          <h3 className="font-serif-title font-black text-lg sm:text-xl text-[#234931] tracking-tight">
            Terminaux Détectés sur le Réseau Local (ObjectBox P2P)
          </h3>
          <p className="text-xs text-[#605547] font-medium leading-relaxed max-w-3xl">
            Découverte automatique zéro-serveur des autres caisses, tablettes et kiosques connectés au même réseau Wi-Fi/Ethernet. Synchronisation binaire instantanée des ventes, paniers et stocks même sans accès Internet.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isScanning || !config.enabled}
            onClick={handleScanNetwork}
            title="Envoyer une requête de découverte mDNS/UDP sur le réseau local"
            className={`touch-btn min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isScanning
                ? 'bg-[#e2d7c2] text-[#605547] cursor-wait'
                : 'sherwood-btn-forest shadow-2xs'
            }`}
          >
            <Search className={`w-4 h-4 shrink-0 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scan mDNS en cours...' : 'Scanner le Réseau'}</span>
          </button>

          <button
            type="button"
            disabled={isSyncingAll || !config.enabled || activePeers.length === 0}
            onClick={handleSyncAll}
            title="Synchroniser toutes les caisses détectées"
            className="touch-btn min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[#eaf2e8] hover:bg-[#d8edd4] text-[#234931] border border-[#cbe0cb] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>Tout Synchroniser</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateDiscover}
            title="Simuler la connexion d'une nouvelle tablette POS sur le Wi-Fi local"
            className="touch-btn min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-[#f4ece1] hover:bg-[#eae0d2] text-[#483d31] border border-[#d8cdba] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0 text-[#234931]" />
            <span>Simuler Caisse</span>
          </button>

          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              title="Accéder aux paramètres complets du maillage ObjectBox (chiffrement, entités, conflits)"
              className="touch-btn min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-white hover:bg-[#f7f2e7] text-[#234931] border border-[#d8cdba] transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0 text-[#234931]" />
              <span>Gérer le Maillage</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Self-Identity & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Local Node Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#cbe0cb] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold shrink-0 border border-[#bfe0be]">
            <Radio className="w-5 h-5 text-[#234931] animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-[#605547]">
              Ce Terminal (Local)
            </div>
            <div className="text-xs font-bold text-[#234931] truncate">
              {config.terminalName}
            </div>
            <div className="text-[11px] font-mono text-[#8a7d6d] truncate">
              {config.nodeId} &bull; :{config.listenPort}
            </div>
          </div>
        </div>

        {/* Connected Peers Counter */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold shrink-0 border border-[#cbe0cb]">
            <Wifi className="w-5 h-5 text-[#234931]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-[#605547]">
              Terminaux Découverts
            </div>
            <div className="text-sm font-black text-[#234931]">
              {activePeers.length} / {peers.length} en ligne
            </div>
            <div className="text-[11px] text-[#605547]">
              Maillage LAN zéro-config
            </div>
          </div>
        </div>

        {/* Average Latency */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fef4ea] text-[#8f521b] flex items-center justify-center font-bold shrink-0 border border-[#f5cf9e]">
            <Zap className="w-5 h-5 text-[#8f521b]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-[#605547]">
              Latence Moyenne LAN
            </div>
            <div className="text-sm font-black text-[#8f521b] font-mono">
              {stats.avgLatencyMs || 3} ms
            </div>
            <div className="text-[11px] text-[#605547]">
              Format binaire FlatBuffers
            </div>
          </div>
        </div>

        {/* Synchronized Objects */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#d8cdba] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold shrink-0 border border-[#cbe0cb]">
            <HardDrive className="w-5 h-5 text-[#234931]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-[#605547]">
              Objets Synchronisés
            </div>
            <div className="text-sm font-black text-[#234931] font-mono">
              {stats.totalSyncedObjects} entités
            </div>
            <div className="text-[11px] text-[#605547]">
              Dernier : {stats.lastSyncTimestamp || 'À l\'instant'}
            </div>
          </div>
        </div>
      </div>

      {/* Discovered Terminals List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#483d31] px-1">
          <div className="flex items-center gap-2">
            <span>Caisses et Terminaux Découverts ({peers.length})</span>
            <span className="text-[11px] font-normal text-[#605547]">
              (Protocole ObjectBox Broadcast & Heartbeat UDP)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs text-[#234931] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter par IP Directe</span>
          </button>
        </div>

        {peers.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#f7f2e7] border border-dashed border-[#d8cdba] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#eaf2e8] text-[#234931] mx-auto flex items-center justify-center border border-[#cbe0cb]">
              <Radio className="w-7 h-7 animate-pulse text-[#234931]" />
            </div>
            <h4 className="font-serif-title font-bold text-base text-[#234931]">
              Aucun autre terminal POS détecté sur ce sous-réseau
            </h4>
            <p className="text-xs text-[#605547] max-w-md mx-auto">
              Vérifiez que vos autres tablettes ou caisses sont allumées et connectées au même réseau Wi-Fi / Ethernet local.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleScanNetwork}
                className="touch-btn px-4 py-2 sherwood-btn-forest text-xs font-bold"
              >
                Relancer le Scan mDNS
              </button>
              <button
                type="button"
                onClick={handleSimulateDiscover}
                className="touch-btn px-4 py-2 sherwood-btn-outline text-xs font-bold"
              >
                Simuler une Caisse Locale
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {peers.map((peer) => {
              const isPeerSyncing = syncingPeerId === peer.id || peer.status === 'SYNCING';
              const isPeerPinging = pingingPeerId === peer.id;
              const isOnline = peer.status === 'CONNECTED' || peer.status === 'SYNCING';

              return (
                <div
                  key={peer.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative bg-white ${
                    isOnline
                      ? 'border-[#cbe0cb] shadow-2xs hover:border-[#234931]'
                      : 'border-[#ded3be] bg-[#fbf9f5] opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Device Icon & Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isOnline
                            ? 'bg-[#eaf2e8] border-[#cbe0cb]'
                            : 'bg-[#f4ece1] border-[#ded3be]'
                        }`}
                      >
                        {getDeviceIcon(peer)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#234931] truncate">
                            {peer.name}
                          </h4>
                        </div>

                        {/* Node ID & IP Address */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-bold text-[#605547]">
                            {peer.id}
                          </span>
                          <span className="text-[#a5998a]">&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(peer)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#234931] hover:underline bg-[#eaf2e8] px-1.5 py-0.5 rounded cursor-pointer"
                            title="Cliquer pour copier l'adresse IP"
                          >
                            <span>{peer.address}</span>
                            {copiedPeerId === peer.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-[#605547]" />
                            )}
                          </button>
                        </div>

                        {/* Role & Protocol Info */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              peer.role === 'SERVER_HUB'
                                ? 'bg-[#faeee2] text-[#85522b] border border-[#f5cf9e]'
                                : 'bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb]'
                            }`}
                          >
                            {peer.role === 'SERVER_HUB' ? 'Serveur Hub' : 'Nœud Pair (P2P)'}
                          </span>

                          <span className="text-[10px] text-[#877a6b] font-medium">
                            {peer.appVersion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isOnline
                            ? 'bg-[#eaf2e8] text-[#234931] border border-[#cbe0cb]'
                            : 'bg-[#f4ece1] text-[#877a6b] border border-[#d8cdba]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-500' : 'bg-[#a5998a]'
                          }`}
                        />
                        <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
                      </span>

                      {/* Latency badge */}
                      {isOnline && (
                        <span className="font-mono text-[10px] text-[#605547] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <span>{peer.latencyMs} ms</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sync Details & Live Stats */}
                  <div className="mt-3.5 pt-3 border-t border-[#f0e7d8] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-[#605547] flex items-center gap-2">
                      <span>Synchronisés : <strong>{peer.syncedEntitiesCount} objets</strong></span>
                      <span>&bull;</span>
                      <span>Vu : {peer.lastSeen}</span>
                    </div>

                    {/* Terminal Quick Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isPeerPinging}
                        onClick={() => handlePingPeer(peer)}
                        title="Envoyer un ping réseau FlatBuffers pour mesurer la latence"
                        className="touch-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#f4ece1] hover:bg-[#eae0d2] text-[#483d31] transition-all cursor-pointer flex items-center gap-1 border border-[#ded3be]"
                      >
                        <Zap className={`w-3 h-3 ${isPeerPinging ? 'animate-bounce text-amber-500' : 'text-[#8f521b]'}`} />
                        <span>{isPeerPinging ? 'Ping...' : 'Ping'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPeerSyncing || !isOnline}
                        onClick={() => handleSyncPeer(peer)}
                        title="Synchroniser immédiatement ce terminal"
                        className="touch-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#eaf2e8] hover:bg-[#d8edd4] text-[#234931] transition-all cursor-pointer flex items-center gap-1 border border-[#cbe0cb]"
                      >
                        <RefreshCw className={`w-3 h-3 ${isPeerSyncing ? 'animate-spin' : ''}`} />
                        <span>{isPeerSyncing ? 'Synchro...' : 'Synchroniser'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Retirer le terminal ${peer.name} (${peer.id}) du maillage local ?`)) {
                            objectboxP2pService.removePeer(peer.id);
                            showToast(`Terminal ${peer.name} retiré`, 'info');
                          }
                        }}
                        title="Retirer ce terminal de la liste locale"
                        className="touch-btn p-1.5 rounded-lg text-[#877a6b] hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual IP Addition Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] border border-[#d8cdba] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2d8c3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eaf2e8] text-[#234931] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-serif-title font-bold text-base text-[#234931]">
                  Ajouter un Terminal par IP Directe
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#605547] hover:text-[#234931] font-bold text-sm cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#605547]">
              Utile si votre routeur d'entreprise bloque les paquets de découverte multicast mDNS / UDP.
            </p>

            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#483d31]">
                  Nom de la caisse ou du terminal
                </label>
                <input
                  type="text"
                  placeholder="ex: Caisse Comptoir #3 (iPad)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d8cdba] bg-white text-[#234931] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#234931]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#483d31]">
                  Adresse IP & Port LAN
                </label>
                <input
                  type="text"
                  placeholder="192.168.1.55:9999"
                  value={manualAddress}
                  required
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#d8cdba] bg-white text-[#234931] focus:outline-hidden focus:ring-2 focus:ring-[#234931]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#483d31]">
                  Rôle dans le maillage ObjectBox
                </label>
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as ObjectBoxNodeRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d8cdba] bg-white text-[#234931] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#234931]"
                >
                  <option value="PEER">Nœud Pair P2P (Égal à égal - Recommandé)</option>
                  <option value="SERVER_HUB">Serveur Hub Central</option>
                  <option value="CLIENT">Client Léger Unidirectionnel</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="touch-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#f4ece1] text-[#483d31] hover:bg-[#eae0d2] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="touch-btn px-4 py-2 rounded-xl text-xs font-bold sherwood-btn-forest cursor-pointer"
                >
                  Ajouter au Réseau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
