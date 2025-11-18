// Room State Management (Mock - ready for backend integration)

export interface Player {
  id: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  stakeAmount: string;
  isPrivate: boolean;
  players: Player[];
  createdAt: number;
}

// In-memory room storage (replace with backend API calls)
const rooms = new Map<string, Room>();

// Event listeners for room updates
type RoomUpdateListener = (room: Room) => void;
const listeners = new Map<string, Set<RoomUpdateListener>>();

export function createRoom(
  code: string,
  hostId: string,
  username: string,
  stakeAmount: string,
  isPrivate: boolean
): Room {
  const room: Room = {
    code,
    hostId,
    stakeAmount,
    isPrivate,
    players: [
      {
        id: hostId,
        username,
        isHost: true,
        isReady: false,
      },
    ],
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  playerId: string,
  username: string
): Room | null {
  const room = rooms.get(code);
  
  if (!room) {
    return null;
  }

  // Check if room is full
  if (room.players.length >= 2) {
    return null;
  }

  // Check if player already in room
  if (room.players.some(p => p.id === playerId)) {
    return room;
  }

  // Add player to room
  room.players.push({
    id: playerId,
    username,
    isHost: false,
    isReady: false,
  });

  // Notify listeners
  notifyListeners(code, room);
  
  return room;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code) || null;
}

export function updatePlayerReady(
  code: string,
  playerId: string,
  isReady: boolean
): Room | null {
  const room = rooms.get(code);
  
  if (!room) {
    return null;
  }

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = isReady;
    
    // Create a new room object to trigger React re-renders
    const updatedRoom = { ...room, players: [...room.players] };
    rooms.set(code, updatedRoom);
    
    // Notify listeners
    notifyListeners(code, updatedRoom);
    
    return updatedRoom;
  }

  return room;
}

export function updateRoomStake(
  code: string,
  stakeAmount: string
): Room | null {
  const room = rooms.get(code);
  
  if (!room) {
    return null;
  }

  room.stakeAmount = stakeAmount;
  // Notify listeners
  notifyListeners(code, room);
  
  return room;
}

export function leaveRoom(code: string, playerId: string): void {
  const room = rooms.get(code);
  
  if (!room) {
    return;
  }

  // Remove player
  room.players = room.players.filter(p => p.id !== playerId);

  // If host left, delete room
  if (playerId === room.hostId) {
    rooms.delete(code);
    // Notify listeners that room is closed
    notifyListeners(code, null);
  } else {
    // Notify listeners
    notifyListeners(code, room);
  }
}

export function subscribeToRoom(
  code: string,
  callback: RoomUpdateListener
): () => void {
  if (!listeners.has(code)) {
    listeners.set(code, new Set());
  }
  
  listeners.get(code)!.add(callback);

  // Return unsubscribe function
  return () => {
    const roomListeners = listeners.get(code);
    if (roomListeners) {
      roomListeners.delete(callback);
      if (roomListeners.size === 0) {
        listeners.delete(code);
      }
    }
  };
}

function notifyListeners(code: string, room: Room | null): void {
  const roomListeners = listeners.get(code);
  if (roomListeners) {
    roomListeners.forEach(callback => {
      if (room) {
        callback(room);
      }
    });
  }
}

// Cleanup old rooms (run periodically)
export function cleanupOldRooms(maxAgeMinutes: number = 30): void {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;

  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge) {
      rooms.delete(code);
    }
  }
}

// Generate player ID (replace with actual auth system)
export function generatePlayerId(): string {
  return `player_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current user (mock - replace with actual auth)
let currentUserId: string | null = null;
let currentUsername: string = 'Guest';

export function getCurrentUser(): { id: string; username: string } {
  if (!currentUserId) {
    currentUserId = generatePlayerId();
  }
  return { id: currentUserId, username: currentUsername };
}

export function setCurrentUser(id: string, username: string): void {
  currentUserId = id;
  currentUsername = username;
}

// Developer Test Mode - Create a test room for easy testing
export function createTestRoom(): Room {
  const testCode = 'TEST01';
  const testHostId = 'test_host_123';
  const testHostUsername = 'TestHost';
  
  // Remove existing test room if any
  if (rooms.has(testCode)) {
    rooms.delete(testCode);
  }
  
  const testRoom = createRoom(testCode, testHostId, testHostUsername, '0.1', true);
  console.log('🎮 TEST ROOM CREATED - Code: TEST01');
  console.log('Use this code to test joining a private room!');
  
  return testRoom;
}

// Initialize test room on module load (for development)
if (typeof window !== 'undefined') {
  createTestRoom();
}