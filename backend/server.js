const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { REALTIME_PROVIDER } = require('./config');

const app = express();
const server = http.createServer(app);

// Conditionally initialize Socket.io only if using socketio
let io = null;
if (REALTIME_PROVIDER === 'socketio') {
  const socketIo = require('socket.io');
  io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV === 'production') {
          if (origin.startsWith('https://')) {
            return callback(null, true);
          }
          if (origin.startsWith('http://localhost')) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        } else {
          // Allow localhost and local network IP addresses
          const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];
          const isLocalhost = origin.startsWith('http://localhost');
          const isLocalIP = /^http:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
          
          if (allowedOrigins.includes(origin) || isLocalhost || isLocalIP) {
            return callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });
}

// Initialize Pusher service if using pusher (will be initialized after rooms/users are defined)
let pusherService = null;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      if (origin.startsWith('https://')) {
        return callback(null, true);
      }
      if (origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    } else {
      // Allow localhost and local network IP addresses
      const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];
      const isLocalhost = origin.startsWith('http://localhost');
      const isLocalIP = /^http:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
      
      if (allowedOrigins.includes(origin) || isLocalhost || isLocalIP) {
        return callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    provider: REALTIME_PROVIDER,
    rooms: rooms.size,
    users: users.size
  });
});

// In-memory storage for rooms and users
const rooms = new Map();
const users = new Map();

// Initialize Pusher service if using pusher
if (REALTIME_PROVIDER === 'pusher') {
  const PusherService = require('./services/pusherService');
  pusherService = new PusherService(rooms, users);
}

// Generate short room ID (4 digits)
const generateRoomId = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  if (rooms.has(result)) {
    return generateRoomId();
  }
  
  return result;
};

// Avatar generator
const avatarOptions = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
  '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
  '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
  '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
  '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄',
  '🐎', '🐏', '🐑', '🦙', '🐐', '🦏', '🦛', '🦘', '🐨',
  '🐼', '🐻', '🦊', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'
];

const generateAvatar = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % avatarOptions.length;
  return avatarOptions[index];
};

// Room management
class Room {
  constructor(id, name, creatorId = null, creatorOnlyReveal = false, isPublic = true, creatorOnlyStory = false) {
    this.id = id;
    this.name = name;
    this.creatorId = creatorId;
    this.creatorOnlyReveal = creatorOnlyReveal;
    this.isPublic = isPublic;
    this.creatorOnlyStory = creatorOnlyStory;
    this.users = new Map();
    this.votes = new Map();
    this.showVotes = false;
    this.currentStory = null;
    this.createdAt = new Date();
    this.joinRequests = new Map();
    this.requireApproval = false;
  }

  addUser(user) {
    this.users.set(user.id, user);
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.votes.delete(userId);
  }

  castVote(userId, vote) {
    this.votes.set(userId, vote);
  }

  removeVote(userId) {
    this.votes.delete(userId);
  }

  revealVotes() {
    this.showVotes = true;
  }

  resetVotes() {
    this.votes.clear();
    this.showVotes = false;
  }

  getVoteResults() {
    const results = {};
    for (const [userId, vote] of this.votes) {
      const user = this.users.get(userId);
      if (user) {
        results[user.name] = vote;
      }
    }
    return results;
  }

  getVoteStatus() {
    const status = {};
    for (const [userId, vote] of this.votes) {
      const user = this.users.get(userId);
      if (user) {
        status[user.name] = this.showVotes ? vote : true;
      }
    }
    return status;
  }

  getVoteCount() {
    return this.votes.size;
  }

  getParticipantCount() {
    return Array.from(this.users.values()).filter(user => !user.isObserver).length;
  }

  canRevealVotes(userId) {
    if (!this.creatorOnlyReveal) {
      return true;
    }
    return this.creatorId === userId;
  }

  canSetStory(userId) {
    if (!this.creatorOnlyStory) {
      return true;
    }
    return this.creatorId === userId;
  }

  getAverageVote() {
    const votes = Array.from(this.votes.values()).filter(vote => 
      typeof vote === 'number' && vote > 0
    );
    
    if (votes.length === 0) return null;
    
    const sum = votes.reduce((acc, vote) => acc + vote, 0);
    return Math.round(sum / votes.length);
  }

  addJoinRequest(user) {
    this.joinRequests.set(user.id, user);
  }

  removeJoinRequest(userId) {
    this.joinRequests.delete(userId);
  }

  getJoinRequests() {
    return Array.from(this.joinRequests.values());
  }

  setRequireApproval(requireApproval) {
    this.requireApproval = requireApproval;
  }
}

// API Routes
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values())
    .filter(room => room.isPublic)
    .map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.users.size,
      createdAt: room.createdAt
    }));
  res.json(roomList);
});

app.post('/api/rooms', (req, res) => {
  const { name, creatorOnlyReveal = false, requireApproval = false, isPublic = true, creatorOnlyStory = false } = req.body;
  const roomId = generateRoomId();
  const room = new Room(roomId, name || `Room ${roomId}`, null, creatorOnlyReveal, isPublic, creatorOnlyStory);
  room.setRequireApproval(requireApproval);
  rooms.set(roomId, room);
  res.json({ id: roomId, name: room.name, creatorOnlyReveal: room.creatorOnlyReveal, requireApproval: room.requireApproval, isPublic: room.isPublic, creatorOnlyStory: room.creatorOnlyStory });
});

// Pusher API endpoints
if (REALTIME_PROVIDER === 'pusher') {
  const { PUSHER_CONFIG } = require('./config');
  const Pusher = require('pusher');
  const pusher = new Pusher({
    appId: PUSHER_CONFIG.appId,
    key: PUSHER_CONFIG.key,
    secret: PUSHER_CONFIG.secret,
    cluster: PUSHER_CONFIG.cluster,
    useTLS: PUSHER_CONFIG.useTLS
  });

  // Pusher authentication endpoint
  app.post('/pusher/auth', (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    
    // For private channels, we can add user info
    const channelData = channel.startsWith('private-') ? {
      user_id: req.body.user_id || 'anonymous'
    } : undefined;
    
    const auth = pusher.authorizeChannel(socketId, channel, channelData);
    res.send(auth);
  });

  // Join room endpoint for Pusher
  app.post('/api/pusher/join-room', (req, res) => {
    const { roomId, userName, isObserver = false, userId, socketId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const result = pusherService.handleJoinRoom(userId, roomId, userName, isObserver, socketId);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    if (result.pending) {
      return res.json({ pending: true, message: result.message, userId: userId });
    }
    
    res.json({ ...result, userId: userId });
  });

  // Cast vote endpoint
  app.post('/api/pusher/cast-vote', (req, res) => {
    const { userId, vote } = req.body;
    pusherService.handleCastVote(userId, vote);
    res.json({ success: true });
  });

  // Remove vote endpoint
  app.post('/api/pusher/remove-vote', (req, res) => {
    const { userId } = req.body;
    pusherService.handleRemoveVote(userId);
    res.json({ success: true });
  });

  // Reveal votes endpoint
  app.post('/api/pusher/reveal-votes', (req, res) => {
    const { userId } = req.body;
    const result = pusherService.handleRevealVotes(userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Reset votes endpoint
  app.post('/api/pusher/reset-votes', (req, res) => {
    const { userId } = req.body;
    const result = pusherService.handleResetVotes(userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Set story endpoint
  app.post('/api/pusher/set-story', (req, res) => {
    const { userId, story } = req.body;
    const result = pusherService.handleSetStory(userId, story);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Toggle observer endpoint
  app.post('/api/pusher/toggle-observer', (req, res) => {
    const { userId } = req.body;
    const result = pusherService.handleToggleObserver(userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Approve join request endpoint
  app.post('/api/pusher/approve-join-request', (req, res) => {
    const { creatorId, userId } = req.body;
    const result = pusherService.handleApproveJoinRequest(creatorId, userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Reject join request endpoint
  app.post('/api/pusher/reject-join-request', (req, res) => {
    const { creatorId, userId } = req.body;
    const result = pusherService.handleRejectJoinRequest(creatorId, userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // End session endpoint
  app.post('/api/pusher/end-session', (req, res) => {
    const { userId } = req.body;
    const result = pusherService.handleEndSession(userId);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Disconnect endpoint
  app.post('/api/pusher/disconnect', (req, res) => {
    const { userId } = req.body;
    pusherService.handleDisconnect(userId);
    res.json({ success: true });
  });
}

// Polling API endpoints
if (REALTIME_PROVIDER === 'polling') {
  // Store pending updates for each user
  const userUpdates = new Map();
  
  // Helper function to queue update for user
  const queueUpdate = (userId, event, data) => {
    if (!userUpdates.has(userId)) {
      userUpdates.set(userId, []);
    }
    userUpdates.get(userId).push({ event, data, timestamp: Date.now() });
  };

  // Helper function to get and clear updates for user
  const getUpdates = (userId) => {
    if (!userUpdates.has(userId)) {
      return [];
    }
    const updates = userUpdates.get(userId);
    userUpdates.set(userId, []);
    return updates;
  };

  // Join room endpoint for polling
  app.post('/api/polling/join-room', (req, res) => {
    const { roomId, userName, isObserver = false, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' });
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = {
      id: userId,
      name: userName,
      isObserver: isObserver,
      avatar: generateAvatar(userId)
    };

    if (!room.creatorId) {
      room.creatorId = userId;
      room.addUser(user);
      users.set(userId, { roomId, user });
    } else if (room.requireApproval && room.creatorId !== userId) {
      room.addJoinRequest(user);
      users.set(userId, { roomId, user, pending: true });
      
      const creatorData = users.get(room.creatorId);
      if (creatorData) {
        queueUpdate(room.creatorId, 'join-request', {
          user: user,
          roomId: roomId
        });
      }
      
      queueUpdate(userId, 'join-request-pending', {
        message: 'Your join request has been sent to the room creator for approval.'
      });
      
      return res.json({ pending: true, message: 'Join request pending approval', userId: userId });
    } else {
      room.addUser(user);
      users.set(userId, { roomId, user });
    }

    // Notify other users
    const roomUsers = Array.from(room.users.values());
    roomUsers.forEach(u => {
      if (u.id !== userId) {
        queueUpdate(u.id, 'user-joined', {
          user: user,
          users: roomUsers,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount()
        });
      }
    });

    res.json({
      room: {
        id: room.id,
        name: room.name,
        users: roomUsers,
        showVotes: room.showVotes,
        votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
        averageVote: room.showVotes ? room.getAverageVote() : null,
        currentStory: room.currentStory,
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount(),
        creatorId: room.creatorId,
        creatorOnlyReveal: room.creatorOnlyReveal,
        creatorOnlyStory: room.creatorOnlyStory,
        requireApproval: room.requireApproval,
        joinRequests: room.getJoinRequests()
      },
      user: user,
      userId: userId
    });
  });

  // Poll endpoint - returns pending updates for user
  app.get('/api/polling/poll', (req, res) => {
    const userId = req.query.userId;
    const timeout = parseInt(req.query.timeout) || 30000; // Default 30 seconds for long-polling
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user exists
    if (!users.has(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Long-polling: wait for updates or timeout
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms
    
    const checkForUpdates = () => {
      const updates = getUpdates(userId);
      if (updates.length > 0 || Date.now() - startTime >= timeout) {
        res.json({ updates: updates.length > 0 ? updates : [] });
        return;
      }
      setTimeout(checkForUpdates, checkInterval);
    };
    
    checkForUpdates();
  });

  // Cast vote endpoint
  app.post('/api/polling/cast-vote', (req, res) => {
    const { userId, vote } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room || room.showVotes) {
      return res.status(400).json({ error: 'Cannot cast vote' });
    }

    room.castVote(userId, vote);
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'room-updated', {
        room: {
          id: room.id,
          name: room.name,
          users: Array.from(room.users.values()),
          showVotes: room.showVotes,
          votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
          averageVote: room.showVotes ? room.getAverageVote() : null,
          currentStory: room.currentStory,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount(),
          creatorId: room.creatorId,
          creatorOnlyReveal: room.creatorOnlyReveal
        }
      });
    });
    
    res.json({ success: true });
  });

  // Remove vote endpoint
  app.post('/api/polling/remove-vote', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room || room.showVotes) {
      return res.status(400).json({ error: 'Cannot remove vote' });
    }

    room.removeVote(userId);
    
    queueUpdate(userId, 'vote-removed', {});
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'room-updated', {
        room: {
          id: room.id,
          name: room.name,
          users: Array.from(room.users.values()),
          showVotes: room.showVotes,
          votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
          averageVote: room.showVotes ? room.getAverageVote() : null,
          currentStory: room.currentStory,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount(),
          creatorId: room.creatorId,
          creatorOnlyReveal: room.creatorOnlyReveal
        }
      });
    });
    
    res.json({ success: true });
  });

  // Reveal votes endpoint
  app.post('/api/polling/reveal-votes', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.canRevealVotes(userId)) {
      queueUpdate(userId, 'error', { message: 'Only the room creator can reveal votes in this room' });
      return res.status(403).json({ error: 'Only the room creator can reveal votes in this room' });
    }

    room.revealVotes();
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'votes-revealed', {
        votes: room.getVoteResults(),
        averageVote: room.getAverageVote(),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });
    
    res.json({ success: true });
  });

  // Reset votes endpoint
  app.post('/api/polling/reset-votes', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.canRevealVotes(userId)) {
      queueUpdate(userId, 'error', { message: 'Only the room creator can start a new round in this room' });
      return res.status(403).json({ error: 'Only the room creator can start a new round in this room' });
    }

    room.resetVotes();
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'votes-reset', {});
    });
    
    res.json({ success: true });
  });

  // Set story endpoint
  app.post('/api/polling/set-story', (req, res) => {
    const { userId, story } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.canSetStory(userId)) {
      queueUpdate(userId, 'error', { message: 'Only the room creator can set the story in this room' });
      return res.status(403).json({ error: 'Only the room creator can set the story in this room' });
    }

    room.currentStory = story;
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'story-updated', { story });
    });
    
    res.json({ success: true });
  });

  // Toggle observer endpoint
  app.post('/api/polling/toggle-observer', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    userData.user.isObserver = !userData.user.isObserver;
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'user-updated', {
        user: userData.user,
        users: Array.from(room.users.values()),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });
    
    res.json({ success: true });
  });

  // Approve join request endpoint
  app.post('/api/polling/approve-join-request', (req, res) => {
    const { creatorId, userId } = req.body;
    const creatorData = users.get(creatorId);
    
    if (!creatorData) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const room = rooms.get(creatorData.roomId);
    if (!room || room.creatorId !== creatorId) {
      return res.status(403).json({ error: 'Only the room creator can approve join requests' });
    }
    
    const joinRequest = room.joinRequests.get(userId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    room.removeJoinRequest(userId);
    room.addUser(joinRequest);
    
    const pendingUserData = users.get(userId);
    if (pendingUserData) {
      pendingUserData.pending = false;
    }
    
    queueUpdate(userId, 'join-request-approved', {
      message: 'Your join request has been approved!',
      room: {
        id: room.id,
        name: room.name,
        users: Array.from(room.users.values()),
        showVotes: room.showVotes,
        votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
        averageVote: room.showVotes ? room.getAverageVote() : null,
        currentStory: room.currentStory,
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount(),
        creatorId: room.creatorId,
        creatorOnlyReveal: room.creatorOnlyReveal,
        requireApproval: room.requireApproval,
        joinRequests: room.getJoinRequests()
      },
      user: joinRequest
    });
    
    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'user-joined', {
        users: Array.from(room.users.values()),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });
    
    queueUpdate(creatorId, 'join-requests-updated', {
      joinRequests: room.getJoinRequests()
    });
    
    res.json({ success: true });
  });

  // Reject join request endpoint
  app.post('/api/polling/reject-join-request', (req, res) => {
    const { creatorId, userId } = req.body;
    const creatorData = users.get(creatorId);
    
    if (!creatorData) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const room = rooms.get(creatorData.roomId);
    if (!room || room.creatorId !== creatorId) {
      return res.status(403).json({ error: 'Only the room creator can reject join requests' });
    }
    
    const joinRequest = room.joinRequests.get(userId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    room.removeJoinRequest(userId);
    users.delete(userId);
    
    queueUpdate(userId, 'join-request-rejected', {
      message: 'Your join request has been rejected.'
    });
    
    queueUpdate(creatorId, 'join-requests-updated', {
      joinRequests: room.getJoinRequests()
    });
    
    res.json({ success: true });
  });

  // End session endpoint
  app.post('/api/polling/end-session', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const room = rooms.get(userData.roomId);
    if (!room || room.creatorId !== userId) {
      queueUpdate(userId, 'error', { message: 'Only the room creator can end the session' });
      return res.status(403).json({ error: 'Only the room creator can end the session' });
    }

    // Notify all users in room
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      queueUpdate(uId, 'session-ended', {
        message: 'The session has been ended by the room creator'
      });
    });

    // Clean up
    roomUsers.forEach(uId => {
      users.delete(uId);
    });
    rooms.delete(userData.roomId);
    
    res.json({ success: true });
  });

  // Disconnect endpoint
  app.post('/api/polling/disconnect', (req, res) => {
    const { userId } = req.body;
    const userData = users.get(userId);
    
    if (userData) {
      const room = rooms.get(userData.roomId);
      if (room) {
        room.removeUser(userId);
        room.removeJoinRequest(userId);
        
        if (room.users.size === 0) {
          rooms.delete(userData.roomId);
        } else {
          // Notify other users
          const roomUsers = Array.from(room.users.keys());
          roomUsers.forEach(uId => {
            queueUpdate(uId, 'user-left', {
              userId: userId,
              users: Array.from(room.users.values()),
              voteCount: room.getVoteCount(),
              participantCount: room.getParticipantCount()
            });
          });
        }
      }
      users.delete(userId);
      userUpdates.delete(userId);
    }
    
    res.json({ success: true });
  });
}

// Socket.io connection handling
if (REALTIME_PROVIDER === 'socketio' && io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (data) => {
      console.log('Received join-room request:', data);
      const { roomId, userName, isObserver = false } = data;
      const room = rooms.get(roomId);
      
      if (!room) {
        console.log('Room not found:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const user = {
        id: socket.id,
        name: userName,
        isObserver: isObserver,
        avatar: generateAvatar(socket.id)
      };

      if (!room.creatorId) {
        room.creatorId = socket.id;
        room.addUser(user);
        users.set(socket.id, { roomId, user });
        socket.join(roomId);
      } else if (room.requireApproval && room.creatorId !== socket.id) {
        room.addJoinRequest(user);
        users.set(socket.id, { roomId, user, pending: true });
        socket.join(roomId);
        
        const creatorSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.id === room.creatorId);
        if (creatorSocket) {
          creatorSocket.emit('join-request', {
            user: user,
            roomId: roomId
          });
        }
        
        socket.emit('join-request-pending', {
          message: 'Your join request has been sent to the room creator for approval.'
        });
        return;
      } else {
        room.addUser(user);
        users.set(socket.id, { roomId, user });
        socket.join(roomId);
      }

      console.log('Sending joined-room response to user:', socket.id);
      socket.emit('joined-room', {
        room: {
          id: room.id,
          name: room.name,
          users: Array.from(room.users.values()),
          showVotes: room.showVotes,
          votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
          averageVote: room.showVotes ? room.getAverageVote() : null,
          currentStory: room.currentStory,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount(),
          creatorId: room.creatorId,
          creatorOnlyReveal: room.creatorOnlyReveal,
          creatorOnlyStory: room.creatorOnlyStory,
          requireApproval: room.requireApproval,
          joinRequests: room.getJoinRequests()
        },
        user: user
      });

      socket.to(roomId).emit('user-joined', {
        user: user,
        users: Array.from(room.users.values()),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });

    socket.on('cast-vote', (data) => {
      const { vote } = data;
      const userData = users.get(socket.id);
      
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room || room.showVotes) return;

      room.castVote(socket.id, vote);
      
      io.to(userData.roomId).emit('room-updated', {
        room: {
          id: room.id,
          name: room.name,
          users: Array.from(room.users.values()),
          showVotes: room.showVotes,
          votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
          averageVote: room.showVotes ? room.getAverageVote() : null,
          currentStory: room.currentStory,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount(),
          creatorId: room.creatorId,
          creatorOnlyReveal: room.creatorOnlyReveal
        }
      });
    });

    socket.on('remove-vote', () => {
      const userData = users.get(socket.id);
      
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room || room.showVotes) return;

      room.removeVote(socket.id);
      
      socket.emit('vote-removed');
      
      io.to(userData.roomId).emit('room-updated', {
        room: {
          id: room.id,
          name: room.name,
          users: Array.from(room.users.values()),
          showVotes: room.showVotes,
          votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
          averageVote: room.showVotes ? room.getAverageVote() : null,
          currentStory: room.currentStory,
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount(),
          creatorId: room.creatorId,
          creatorOnlyReveal: room.creatorOnlyReveal
        }
      });
    });

    socket.on('reveal-votes', () => {
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room) return;

      if (!room.canRevealVotes(socket.id)) {
        socket.emit('error', { message: 'Only the room creator can reveal votes in this room' });
        return;
      }

      room.revealVotes();
      io.to(userData.roomId).emit('votes-revealed', {
        votes: room.getVoteResults(),
        averageVote: room.getAverageVote(),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });

    socket.on('reset-votes', () => {
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room) return;

      if (!room.canRevealVotes(socket.id)) {
        socket.emit('error', { message: 'Only the room creator can start a new round in this room' });
        return;
      }

      room.resetVotes();
      io.to(userData.roomId).emit('votes-reset');
    });

    socket.on('set-story', (data) => {
      const { story } = data;
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room) return;

      if (!room.canSetStory(socket.id)) {
        socket.emit('error', { message: 'Only the room creator can set the story in this room' });
        return;
      }

      room.currentStory = story;
      io.to(userData.roomId).emit('story-updated', { story });
    });

    socket.on('toggle-observer', () => {
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room) return;

      userData.user.isObserver = !userData.user.isObserver;
      io.to(userData.roomId).emit('user-updated', {
        user: userData.user,
        users: Array.from(room.users.values()),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });
    });

    socket.on('approve-join-request', (data) => {
      const { userId } = data;
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room || room.creatorId !== socket.id) return;
      
      const joinRequest = room.joinRequests.get(userId);
      if (joinRequest) {
        room.removeJoinRequest(userId);
        room.addUser(joinRequest);
        
        const pendingUserData = users.get(userId);
        if (pendingUserData) {
          pendingUserData.pending = false;
        }
        
        io.to(userId).emit('join-request-approved', {
          message: 'Your join request has been approved!',
          room: {
            id: room.id,
            name: room.name,
            users: Array.from(room.users.values()),
            showVotes: room.showVotes,
            votes: room.showVotes ? room.getVoteResults() : room.getVoteStatus(),
            averageVote: room.showVotes ? room.getAverageVote() : null,
            currentStory: room.currentStory,
            voteCount: room.getVoteCount(),
            participantCount: room.getParticipantCount(),
            creatorId: room.creatorId,
            creatorOnlyReveal: room.creatorOnlyReveal,
            requireApproval: room.requireApproval,
            joinRequests: room.getJoinRequests()
          },
          user: joinRequest
        });
        
        io.to(userData.roomId).emit('user-joined', {
          users: Array.from(room.users.values()),
          voteCount: room.getVoteCount(),
          participantCount: room.getParticipantCount()
        });

        io.to(room.creatorId).emit('join-requests-updated', {
          joinRequests: room.getJoinRequests()
        });
      }
    });

    socket.on('end-session', () => {
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room || room.creatorId !== socket.id) {
        socket.emit('error', { message: 'Only the room creator can end the session' });
        return;
      }

      io.to(userData.roomId).emit('session-ended', {
        message: 'The session has been ended by the room creator'
      });

      const roomUsers = Array.from(room.users.keys());
      roomUsers.forEach(userId => {
        const userSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.id === userId);
        if (userSocket) {
          userSocket.leave(userData.roomId);
          users.delete(userId);
        }
      });

      rooms.delete(userData.roomId);
      console.log('Session ended and room deleted:', userData.roomId);
    });

    socket.on('reject-join-request', (data) => {
      const { userId } = data;
      const userData = users.get(socket.id);
      if (!userData) return;
      
      const room = rooms.get(userData.roomId);
      if (!room || room.creatorId !== socket.id) return;
      
      const joinRequest = room.joinRequests.get(userId);
      if (joinRequest) {
        room.removeJoinRequest(userId);
        
        io.to(userId).emit('join-request-rejected', {
          message: 'Your join request has been rejected.'
        });
        
        const pendingUserData = users.get(userId);
        if (pendingUserData) {
          users.delete(userId);
        }

        io.to(room.creatorId).emit('join-requests-updated', {
          joinRequests: room.getJoinRequests()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      const userData = users.get(socket.id);
      if (userData) {
        const room = rooms.get(userData.roomId);
        if (room) {
          room.removeUser(socket.id);
          room.removeJoinRequest(socket.id);
          
          if (room.users.size === 0) {
            console.log('Deleting empty room:', userData.roomId);
            rooms.delete(userData.roomId);
          } else {
            socket.to(userData.roomId).emit('user-left', {
              userId: socket.id,
              users: Array.from(room.users.values()),
              voteCount: room.getVoteCount(),
              participantCount: room.getParticipantCount()
            });
          }
        }
        users.delete(socket.id);
      }
    });
  });
}

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with ${REALTIME_PROVIDER} provider`);
});
