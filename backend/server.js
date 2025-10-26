const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In production, be more permissive
      if (process.env.NODE_ENV === 'production') {
        // Allow all HTTPS origins for production
        if (origin.startsWith('https://')) {
          return callback(null, true);
        }
        // Allow HTTP for local development even in production mode
        if (origin.startsWith('http://localhost')) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      } else {
        // In development, allow localhost
        const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, be more permissive
    if (process.env.NODE_ENV === 'production') {
      // Allow all HTTPS origins for production
      if (origin.startsWith('https://')) {
        return callback(null, true);
      }
      // Allow HTTP for local development even in production mode
      if (origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    } else {
      // In development, allow localhost
      const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
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
    rooms: rooms.size,
    users: users.size
  });
});

// In-memory storage for rooms and users
const rooms = new Map();
const users = new Map();

// Generate short room ID (4 digits)
const generateRoomId = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Check if room ID already exists, if so generate a new one
  if (rooms.has(result)) {
    return generateRoomId();
  }
  
  return result;
};

// Fibonacci sequence for story points
const FIBONACCI_SEQUENCE = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?'];

// Avatar generator
const avatarOptions = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
  '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
  '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
  '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
  '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄',
  '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦏', '🦛', '🦘', '🐨',
  '🐼', '🐻', '🦊', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'
];

const generateAvatar = (userId) => {
  // Use userId as seed for consistent avatar per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
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
    this.isPublic = isPublic; // Whether room is visible in available rooms list
    this.creatorOnlyStory = creatorOnlyStory; // Whether only creator can set story
    this.users = new Map();
    this.votes = new Map();
    this.showVotes = false;
    this.currentStory = null;
    this.createdAt = new Date();
    this.joinRequests = new Map(); // Store pending join requests
    this.requireApproval = false; // Whether room requires creator approval
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
        status[user.name] = this.showVotes ? vote : true; // true means voted but not revealed
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
      return true; // Anyone can reveal if creator-only is disabled
    }
    return this.creatorId === userId; // Only creator can reveal if enabled
  }

  canSetStory(userId) {
    if (!this.creatorOnlyStory) {
      return true; // Anyone can set story if creator-only is disabled
    }
    return this.creatorId === userId; // Only creator can set story if enabled
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
    .filter(room => room.isPublic) // Only return public rooms
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

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
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

    // Set the first user as the creator if no creator is set
    if (!room.creatorId) {
      room.creatorId = socket.id;
      room.addUser(user);
      users.set(socket.id, { roomId, user });
      socket.join(roomId);
    } else if (room.requireApproval && room.creatorId !== socket.id) {
      // Room requires approval and user is not the creator
      room.addJoinRequest(user);
      users.set(socket.id, { roomId, user, pending: true });
      socket.join(roomId);
      
      // Notify creator about join request
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
      // Room doesn't require approval or user is creator
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

  // Cast vote
  socket.on('cast-vote', (data) => {
    const { vote } = data;
    const userData = users.get(socket.id);
    
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room || room.showVotes) return;

    room.castVote(socket.id, vote);
    
    // Emit updated room state to all users in the room
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

  // Remove vote
  socket.on('remove-vote', () => {
    const userData = users.get(socket.id);
    
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room || room.showVotes) return;

    room.removeVote(socket.id);
    
    // Emit vote-removed event to the user who removed their vote
    socket.emit('vote-removed');
    
    // Emit updated room state to all users in the room
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

  // Reveal votes
  socket.on('reveal-votes', () => {
    const userData = users.get(socket.id);
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room) return;

    // Check if user can reveal votes
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

  // Reset votes
  socket.on('reset-votes', () => {
    const userData = users.get(socket.id);
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room) return;

    // Check if user can reset votes
    if (!room.canRevealVotes(socket.id)) {
      socket.emit('error', { message: 'Only the room creator can start a new round in this room' });
      return;
    }

    room.resetVotes();
    io.to(userData.roomId).emit('votes-reset');
  });

  // Set current story
  socket.on('set-story', (data) => {
    const { story } = data;
    const userData = users.get(socket.id);
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room) return;

    // Check if user can set story
    if (!room.canSetStory(socket.id)) {
      socket.emit('error', { message: 'Only the room creator can set the story in this room' });
      return;
    }

    room.currentStory = story;
    io.to(userData.roomId).emit('story-updated', { story });
  });

  // Toggle observer mode
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

  // Handle join request approval/rejection
  socket.on('approve-join-request', (data) => {
    const { userId } = data;
    const userData = users.get(socket.id);
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room || room.creatorId !== socket.id) return;
    
    const joinRequest = room.joinRequests.get(userId);
    if (joinRequest) {
      // Approve the request
      room.removeJoinRequest(userId);
      room.addUser(joinRequest);
      
      // Update user status
      const pendingUserData = users.get(userId);
      if (pendingUserData) {
        pendingUserData.pending = false;
      }
      
      // Notify the approved user and send full room data
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
      
      // Notify all users in the room
      io.to(userData.roomId).emit('user-joined', {
        users: Array.from(room.users.values()),
        voteCount: room.getVoteCount(),
        participantCount: room.getParticipantCount()
      });

      // Notify creator about updated join requests
      io.to(room.creatorId).emit('join-requests-updated', {
        joinRequests: room.getJoinRequests()
      });
    }
  });

  // Handle end session (room creator only)
  socket.on('end-session', () => {
    const userData = users.get(socket.id);
    if (!userData) return;
    
    const room = rooms.get(userData.roomId);
    if (!room || room.creatorId !== socket.id) {
      socket.emit('error', { message: 'Only the room creator can end the session' });
      return;
    }

    // Notify all users in the room that the session has ended
    io.to(userData.roomId).emit('session-ended', {
      message: 'The session has been ended by the room creator'
    });

    // Remove all users from the room and clean up
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(userId => {
      const userSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.id === userId);
      if (userSocket) {
        userSocket.leave(userData.roomId);
        users.delete(userId);
      }
    });

    // Delete the room
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
      // Reject the request
      room.removeJoinRequest(userId);
      
      // Notify the rejected user
      io.to(userId).emit('join-request-rejected', {
        message: 'Your join request has been rejected.'
      });
      
      // Remove user from room
      const pendingUserData = users.get(userId);
      if (pendingUserData) {
        users.delete(userId);
      }

      // Notify creator about updated join requests
      io.to(room.creatorId).emit('join-requests-updated', {
        joinRequests: room.getJoinRequests()
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userData = users.get(socket.id);
    if (userData) {
      const room = rooms.get(userData.roomId);
      if (room) {
        room.removeUser(socket.id);
        room.removeJoinRequest(socket.id); // Remove any pending join requests
        
        if (room.users.size === 0) {
          // Delete empty rooms immediately
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
