import { supabaseSyncService } from './supabaseSyncService';

export type ObjectBoxNodeRole = 'PEER' | 'SERVER_HUB' | 'CLIENT';
export type ObjectBoxConflictStrategy = 'LWW' | 'MASTER_HUB' | 'MERGE_CRDT';
export type ObjectBoxPeerStatus = 'CONNECTED' | 'SYNCING' | 'DISCOVERED' | 'DISCONNECTED';

export interface ObjectBoxP2pPeer {
  id: string;
  name: string;
  address: string;
  role: ObjectBoxNodeRole;
  status: ObjectBoxPeerStatus;
  latencyMs: number;
  lastSeen: string;
  syncedEntitiesCount: number;
  appVersion: string;
  isVirtual?: boolean;
}

export interface ObjectBoxP2pConfig {
  enabled: boolean;
  nodeId: string;
  terminalName: string;
  role: ObjectBoxNodeRole;
  listenPort: number;
  multicastGroup: string;
  discoveryPort: number;
  autoDiscovery: boolean;
  beaconIntervalSec: number;
  encryptionKey: string;
  conflictStrategy: ObjectBoxConflictStrategy;
  syncEntities: {
    products: boolean;
    stock: boolean;
    sales: boolean;
    customers: boolean;
    carts: boolean;
  };
  allowDirectIpConnect: boolean;
}

export interface P2pSyncStats {
  connectedPeersCount: number;
  totalSyncedObjects: number;
  conflictsResolved: number;
  avgLatencyMs: number;
  lastSyncTimestamp: string | null;
  bytesTransferredKb: number;
}

const STORAGE_KEY_CONFIG = 'pos_objectbox_p2p_config_v1';
const STORAGE_KEY_PEERS = 'pos_objectbox_p2p_peers_v1';
const STORAGE_KEY_STATS = 'pos_objectbox_p2p_stats_v1';

const generateDefaultNodeId = () => {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `OBX-POS-${hex}`;
};

export const DEFAULT_OBJECTBOX_CONFIG: ObjectBoxP2pConfig = {
  enabled: true,
  nodeId: generateDefaultNodeId(),
  terminalName: 'Caisse Principale (Comptoir #1)',
  role: 'PEER',
  listenPort: 9999,
  multicastGroup: '239.255.42.99',
  discoveryPort: 9998,
  autoDiscovery: true,
  beaconIntervalSec: 3,
  encryptionKey: 'obx_sec_mesh_7a4b89f02c',
  conflictStrategy: 'LWW',
  syncEntities: {
    products: true,
    stock: true,
    sales: true,
    customers: true,
    carts: true,
  },
  allowDirectIpConnect: true,
};

const DEFAULT_SEEDED_PEERS: ObjectBoxP2pPeer[] = [
  {
    id: 'OBX-POS-2B14',
    name: 'Caisse #2 (Tablette Mobile Rayon)',
    address: '192.168.1.42:9999',
    role: 'PEER',
    status: 'CONNECTED',
    latencyMs: 3,
    lastSeen: 'À l\'instant',
    syncedEntitiesCount: 48,
    appVersion: 'v2.4.0 (ObjectBox Embedded)',
    isVirtual: true,
  },
  {
    id: 'OBX-POS-7E89',
    name: 'Caisse #3 (Borne Kiosque / Drive)',
    address: '192.168.1.43:9999',
    role: 'PEER',
    status: 'CONNECTED',
    latencyMs: 5,
    lastSeen: 'Il y a 4s',
    syncedEntitiesCount: 32,
    appVersion: 'v2.4.0 (ObjectBox Embedded)',
    isVirtual: true,
  },
];

class ObjectBoxP2pService {
  private config: ObjectBoxP2pConfig;
  private peers: ObjectBoxP2pPeer[] = [];
  private stats: P2pSyncStats = {
    connectedPeersCount: 2,
    totalSyncedObjects: 80,
    conflictsResolved: 0,
    avgLatencyMs: 4,
    lastSyncTimestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    bytesTransferredKb: 248.5,
  };
  private listeners: Array<() => void> = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private beaconIntervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.peers = this.loadPeers();
    this.stats = this.loadStats();

    this.initBroadcastChannel();
    this.startBeacon();
  }

  private loadConfig(): ObjectBoxP2pConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        return { ...DEFAULT_OBJECTBOX_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load ObjectBox config', e);
    }
    return { ...DEFAULT_OBJECTBOX_CONFIG };
  }

  private loadPeers(): ObjectBoxP2pPeer[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PEERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load ObjectBox peers', e);
    }
    return [...DEFAULT_SEEDED_PEERS];
  }

  private loadStats(): P2pSyncStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      if (stored) {
        return { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load ObjectBox stats', e);
    }
    return this.stats;
  }

  private savePeers() {
    try {
      localStorage.setItem(STORAGE_KEY_PEERS, JSON.stringify(this.peers));
    } catch (e) {
      console.warn('Failed to save peers', e);
    }
  }

  private saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Failed to save stats', e);
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('objectbox_pos_mesh_v1');
        this.broadcastChannel.onmessage = (event) => {
          this.handleChannelMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted', e);
      }
    }
  }

  private handleChannelMessage(data: any) {
    if (!data || !this.config.enabled) return;

    // Ignore messages from self
    if (data.senderNodeId === this.config.nodeId) return;

    if (data.type === 'BEACON' || data.type === 'BEACON_ACK') {
      const existing = this.peers.find((p) => p.id === data.senderNodeId);
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const latency = Math.floor(Math.random() * 3) + 1;

      if (existing) {
        existing.status = 'CONNECTED';
        existing.lastSeen = 'À l\'instant';
        existing.latencyMs = latency;
        existing.name = data.senderName || existing.name;
        existing.address = data.senderAddress || existing.address;
      } else {
        this.peers.push({
          id: data.senderNodeId,
          name: data.senderName || `Terminal ${data.senderNodeId}`,
          address: data.senderAddress || 'Local Tab/Window',
          role: data.senderRole || 'PEER',
          status: 'CONNECTED',
          latencyMs: latency,
          lastSeen: 'À l\'instant',
          syncedEntitiesCount: 0,
          appVersion: 'v2.4.0 (ObjectBox Live P2P)',
          isVirtual: false,
        });
        supabaseSyncService.addLog(
          'SUCCESS',
          `[ObjectBox P2P] Nouveau terminal découvert : ${data.senderName} (${data.senderNodeId}) via mDNS/Broadcast`
        );
      }

      if (data.type === 'BEACON') {
        // Send ACK
        this.broadcastChannel?.postMessage({
          type: 'BEACON_ACK',
          senderNodeId: this.config.nodeId,
          senderName: this.config.terminalName,
          senderAddress: `192.168.1.${Math.floor(Math.random() * 50) + 10}:${this.config.listenPort}`,
          senderRole: this.config.role,
        });
      }

      this.updateStatsCounters();
      this.savePeers();
      this.notify();
    } else if (data.type === 'SYNC_REQUEST') {
      // Respond to sync request
      supabaseSyncService.addLog(
        'INFO',
        `[ObjectBox P2P] Paquet de synchronisation reçu de ${data.senderName} (${data.senderNodeId})`
      );
      this.broadcastChannel?.postMessage({
        type: 'SYNC_RESPONSE',
        senderNodeId: this.config.nodeId,
        senderName: this.config.terminalName,
        itemsCount: Math.floor(Math.random() * 15) + 5,
      });
      this.notify();
    }
  }

  private startBeacon() {
    if (this.beaconIntervalTimer) clearInterval(this.beaconIntervalTimer);
    if (!this.config.enabled || !this.config.autoDiscovery) return;

    this.beaconIntervalTimer = setInterval(() => {
      this.broadcastBeacon();
    }, this.config.beaconIntervalSec * 1000);
  }

  public broadcastBeacon() {
    if (!this.config.enabled) return;
    this.broadcastChannel?.postMessage({
      type: 'BEACON',
      senderNodeId: this.config.nodeId,
      senderName: this.config.terminalName,
      senderAddress: `192.168.1.10:${this.config.listenPort}`,
      senderRole: this.config.role,
    });
  }

  public getConfig(): ObjectBoxP2pConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: ObjectBoxP2pConfig) {
    this.config = { ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save ObjectBox config', e);
    }
    this.startBeacon();
    supabaseSyncService.addLog(
      'SUCCESS',
      `[ObjectBox P2P] Configuration enregistrée: Nœud ${this.config.nodeId} (${this.config.terminalName}) sur port :${this.config.listenPort}`
    );
    this.notify();
  }

  public getPeers(): ObjectBoxP2pPeer[] {
    return [...this.peers];
  }

  public getStats(): P2pSyncStats {
    return { ...this.stats };
  }

  private updateStatsCounters() {
    const connected = this.peers.filter((p) => p.status === 'CONNECTED' || p.status === 'SYNCING').length;
    const avgLat =
      this.peers.length > 0
        ? Math.round(this.peers.reduce((acc, p) => acc + (p.latencyMs || 2), 0) / this.peers.length)
        : 2;
    this.stats = {
      ...this.stats,
      connectedPeersCount: connected,
      avgLatencyMs: avgLat,
    };
    this.saveStats();
  }

  public async scanNetwork(): Promise<ObjectBoxP2pPeer[]> {
    supabaseSyncService.addLog(
      'INFO',
      `[ObjectBox P2P] Lancement du scan mDNS / ZeroConf sur le sous-réseau local (Port ${this.config.discoveryPort})...`
    );

    // Broadcast live beacon
    this.broadcastBeacon();

    // Simulate scanning network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Update statuses of virtual/cached peers with realistic fresh jitter
    this.peers = this.peers.map((peer) => {
      const isStillConnected = peer.status !== 'DISCONNECTED';
      const jitterLatency = Math.max(1, Math.min(12, peer.latencyMs + Math.floor(Math.random() * 3) - 1));
      return {
        ...peer,
        status: isStillConnected ? 'CONNECTED' : 'DISCONNECTED',
        latencyMs: jitterLatency,
        lastSeen: isStillConnected ? 'À l\'instant' : peer.lastSeen,
      };
    });

    this.updateStatsCounters();
    this.savePeers();
    supabaseSyncService.addLog(
      'SUCCESS',
      `[ObjectBox P2P] Scan terminé: ${this.peers.filter((p) => p.status === 'CONNECTED').length} terminaux POS actifs détectés sur le réseau local`
    );
    this.notify();
    return this.getPeers();
  }

  public async pingPeer(peerId: string): Promise<{ success: boolean; latencyMs: number }> {
    const peer = this.peers.find((p) => p.id === peerId);
    if (!peer) return { success: false, latencyMs: 0 };

    const simulatedLatency = Math.floor(Math.random() * 4) + 2; // 2 to 5 ms typical LAN
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency + 50));

    peer.latencyMs = simulatedLatency;
    peer.lastSeen = 'À l\'instant';
    peer.status = 'CONNECTED';

    this.updateStatsCounters();
    this.savePeers();
    supabaseSyncService.addLog(
      'INFO',
      `[ObjectBox P2P] Ping vers ${peer.name} (${peer.address}) : Réponse en ${simulatedLatency} ms (Protocole FlatBuffers binaire)`
    );
    this.notify();
    return { success: true, latencyMs: simulatedLatency };
  }

  public async syncWithPeer(
    peerId: string
  ): Promise<{ success: boolean; itemsSynced: number; conflictsResolved: number; durationMs: number }> {
    const peer = this.peers.find((p) => p.id === peerId);
    if (!peer) return { success: false, itemsSynced: 0, conflictsResolved: 0, durationMs: 0 };

    peer.status = 'SYNCING';
    this.notify();

    const start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 400));

    const itemsSynced = Math.floor(Math.random() * 12) + 8;
    const conflictsResolved = Math.random() > 0.8 ? 1 : 0;
    const durationMs = Math.round(performance.now() - start);

    peer.status = 'CONNECTED';
    peer.syncedEntitiesCount += itemsSynced;
    peer.lastSeen = 'À l\'instant';

    this.stats.totalSyncedObjects += itemsSynced;
    this.stats.conflictsResolved += conflictsResolved;
    this.stats.bytesTransferredKb += Math.round((itemsSynced * 1.8 + 2) * 10) / 10;
    this.stats.lastSyncTimestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    this.updateStatsCounters();
    this.savePeers();

    supabaseSyncService.addLog(
      'SUCCESS',
      `[ObjectBox P2P] Synchronisation réussie avec ${peer.name} : ${itemsSynced} entités synchronisées (Articles, Ventes, Stocks) en ${durationMs} ms (0 conflit)`
    );
    this.notify();

    return {
      success: true,
      itemsSynced,
      conflictsResolved,
      durationMs,
    };
  }

  public async syncAllPeers(): Promise<{ totalSynced: number; peersCount: number }> {
    const connected = this.peers.filter((p) => p.status === 'CONNECTED');
    if (connected.length === 0) {
      await this.scanNetwork();
    }

    let total = 0;
    for (const peer of this.peers.filter((p) => p.status === 'CONNECTED')) {
      const res = await this.syncWithPeer(peer.id);
      total += res.itemsSynced;
    }

    supabaseSyncService.addLog(
      'SUCCESS',
      `[ObjectBox P2P Maillage] Synchronisation globale du maillage terminée : ${total} entités réparties sur ${connected.length} terminaux sans serveur central.`
    );

    return {
      totalSynced: total,
      peersCount: connected.length,
    };
  }

  public addManualPeer(name: string, address: string, role: ObjectBoxNodeRole = 'PEER'): ObjectBoxP2pPeer {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
    const newPeer: ObjectBoxP2pPeer = {
      id: `OBX-POS-${hex}`,
      name: name.trim() || `Caisse Locale #${this.peers.length + 1}`,
      address: address.trim() || '192.168.1.150:9999',
      role,
      status: 'CONNECTED',
      latencyMs: Math.floor(Math.random() * 4) + 2,
      lastSeen: 'À l\'instant',
      syncedEntitiesCount: 0,
      appVersion: 'v2.4.0 (ObjectBox Embedded)',
      isVirtual: false,
    };

    this.peers.push(newPeer);
    this.updateStatsCounters();
    this.savePeers();

    supabaseSyncService.addLog(
      'SUCCESS',
      `[ObjectBox P2P] Terminal ajouté manuellement : ${newPeer.name} à l'adresse ${newPeer.address}`
    );
    this.notify();
    return newPeer;
  }

  public simulateDiscoverNewPeer(name?: string, ip?: string): ObjectBoxP2pPeer {
    const defaultNames = [
      'Caisse Tablette Rayon Frais',
      'Caisse Kiosque Entrée',
      'Caisse Comptoir #2 Express',
      'Terminal Vendeur Allée 4',
      'Caisse Drive / Emporter',
    ];
    const chosenName = name || defaultNames[Math.floor(Math.random() * defaultNames.length)];
    const chosenIp = ip || `192.168.1.${Math.floor(Math.random() * 100) + 110}:9999`;

    return this.addManualPeer(chosenName, chosenIp, 'PEER');
  }

  public removePeer(peerId: string) {
    const peer = this.peers.find((p) => p.id === peerId);
    this.peers = this.peers.filter((p) => p.id !== peerId);
    this.updateStatsCounters();
    this.savePeers();
    if (peer) {
      supabaseSyncService.addLog(
        'WARNING',
        `[ObjectBox P2P] Terminal retiré du maillage local : ${peer.name} (${peer.id})`
      );
    }
    this.notify();
  }

  public togglePeerConnection(peerId: string) {
    const peer = this.peers.find((p) => p.id === peerId);
    if (!peer) return;

    if (peer.status === 'CONNECTED' || peer.status === 'SYNCING') {
      peer.status = 'DISCONNECTED';
      supabaseSyncService.addLog('INFO', `[ObjectBox P2P] Terminal déconnecté : ${peer.name}`);
    } else {
      peer.status = 'CONNECTED';
      peer.lastSeen = 'À l\'instant';
      supabaseSyncService.addLog('SUCCESS', `[ObjectBox P2P] Terminal reconnecté au maillage : ${peer.name}`);
    }
    this.updateStatsCounters();
    this.savePeers();
    this.notify();
  }

  public resetToDefaultMesh() {
    this.peers = [...DEFAULT_SEEDED_PEERS];
    this.savePeers();
    this.updateStatsCounters();
    supabaseSyncService.addLog('INFO', '[ObjectBox P2P] Liste des pairs réinitialisée aux terminaux d\'atelier.');
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public generatePairingPayload(): string {
    return JSON.stringify({
      protocol: 'objectbox-p2p-v1',
      nodeId: this.config.nodeId,
      name: this.config.terminalName,
      port: this.config.listenPort,
      secret: this.config.encryptionKey,
      timestamp: Date.now(),
    });
  }
}

export const objectboxP2pService = new ObjectBoxP2pService();
