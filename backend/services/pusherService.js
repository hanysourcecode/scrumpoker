const Pusher = require('pusher');
const { PUSHER_CONFIG } = require('../config');

// Initialize Pusher
const pusher = new Pusher({
  appId: PUSHER_CONFIG.appId,
  key: PUSHER_CONFIG.key,
  secret: PUSHER_CONFIG.secret,
  cluster: PUSHER_CONFIG.cluster,
  useTLS: PUSHER_CONFIG.useTLS
});

// Store user connections (userId -> { roomId, user, channel })
const userConnections = new Map();

// Store room channels
const roomChannels = new Map();

class PusherService {
  constructor(rooms, users) {
    this.rooms = rooms;
    this.users = users;
  }

  // Get or create a channel for a room
  getRoomChannel(roomId) {
    if (!roomChannels.has(roomId)) {
      roomChannels.set(roomId, `room-${roomId}`);
    }
    return roomChannels.get(roomId);
  }

  // Handle user joining a room
  handleJoinRoom(userId, roomId, userName, isObserver = false, socketId = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { error: 'Room not found' };
    }

    const user = {
      id: userId,
      name: userName,
      isObserver: isObserver,
      avatar: this.generateAvatar(userId)
    };

    // Set the first user as the creator if no creator is set
    if (!room.creatorId) {
      room.creatorId = userId;
      room.addUser(user);
      this.users.set(userId, { roomId, user });
    } else if (room.requireApproval && room.creatorId !== userId) {
      // Room requires approval and user is not the creator
      room.addJoinRequest(user);
      this.users.set(userId, { roomId, user, pending: true });
      
      // Notify creator about join request
      this.triggerToUser(room.creatorId, 'join-request', {
        user: user,
        roomId: roomId
      });
      
      return {
        pending: true,
        message: 'Your join request has been sent to the room creator for approval.'
      };
    } else {
      // Room doesn't require approval or user is creator
      room.addUser(user);
      this.users.set(userId, { roomId, user });
    }

    // Store connection (socketId may be null for initial join)
    if (!userConnections.has(userId)) {
      userConnections.set(userId, { roomId, user, socketId });
    } else {
      // Update existing connection with socketId if provided
      const existing = userConnections.get(userId);
      if (socketId) {
        existing.socketId = socketId;
      }
    }

    return {
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
    };
  }

  // Trigger event to a specific user
  triggerToUser(userId, event, data) {
    pusher.trigger(`private-user-${userId}`, event, data);
  }

  // Trigger event to all users in a room
  triggerToRoom(roomId, event, data) {
    const channel = this.getRoomChannel(roomId);
    pusher.trigger(channel, event, data);
  }

  // Handle vote casting
  handleCastVote(userId, vote) {
    const userData = this.users.get(userId);
    if (!userData) return;

    const room = this.rooms.get(userData.roomId);
    if (!room || room.showVotes) return;

    room.castVote(userId, vote);
    
    this.triggerToRoom(userData.roomId, 'room-updated', {
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
  }

  // Handle vote removal
  handleRemoveVote(userId) {
    const userData = this.users.get(userId);
    if (!userData) return;

    const room = this.rooms.get(userData.roomId);
    if (!room || room.showVotes) return;

    room.removeVote(userId);
    
    this.triggerToUser(userId, 'vote-removed', {});
    
    this.triggerToRoom(userData.roomId, 'room-updated', {
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
  }

  // Handle vote reveal
  handleRevealVotes(userId) {
    const userData = this.users.get(userId);
    if (!userData) return { error: 'User not found' };

    const room = this.rooms.get(userData.roomId);
    if (!room) return { error: 'Room not found' };

    if (!room.canRevealVotes(userId)) {
      return { error: 'Only the room creator can reveal votes in this room' };
    }

    room.revealVotes();
    this.triggerToRoom(userData.roomId, 'votes-revealed', {
      votes: room.getVoteResults(),
      averageVote: room.getAverageVote(),
      voteCount: room.getVoteCount(),
      participantCount: room.getParticipantCount()
    });

    return { success: true };
  }

  // Handle vote reset
  handleResetVotes(userId) {
    const userData = this.users.get(userId);
    if (!userData) return { error: 'User not found' };

    const room = this.rooms.get(userData.roomId);
    if (!room) return { error: 'Room not found' };

    if (!room.canRevealVotes(userId)) {
      return { error: 'Only the room creator can start a new round in this room' };
    }

    room.resetVotes();
    this.triggerToRoom(userData.roomId, 'votes-reset', {});

    return { success: true };
  }

  // Handle story setting
  handleSetStory(userId, story) {
    const userData = this.users.get(userId);
    if (!userData) return { error: 'User not found' };

    const room = this.rooms.get(userData.roomId);
    if (!room) return { error: 'Room not found' };

    if (!room.canSetStory(userId)) {
      return { error: 'Only the room creator can set the story in this room' };
    }

    room.currentStory = story;
    this.triggerToRoom(userData.roomId, 'story-updated', { story });

    return { success: true };
  }

  // Handle toggle observer
  handleToggleObserver(userId) {
    const userData = this.users.get(userId);
    if (!userData) return { error: 'User not found' };

    const room = this.rooms.get(userData.roomId);
    if (!room) return { error: 'Room not found' };

    userData.user.isObserver = !userData.user.isObserver;
    this.triggerToRoom(userData.roomId, 'user-updated', {
      user: userData.user,
      users: Array.from(room.users.values()),
      voteCount: room.getVoteCount(),
      participantCount: room.getParticipantCount()
    });

    return { success: true };
  }

  // Handle join request approval
  handleApproveJoinRequest(creatorId, userId) {
    const creatorData = this.users.get(creatorId);
    if (!creatorData) return { error: 'Creator not found' };

    const room = this.rooms.get(creatorData.roomId);
    if (!room || room.creatorId !== creatorId) {
      return { error: 'Unauthorized' };
    }

    const joinRequest = room.joinRequests.get(userId);
    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    // Approve the request
    room.removeJoinRequest(userId);
    room.addUser(joinRequest);
    
    const pendingUserData = this.users.get(userId);
    if (pendingUserData) {
      pendingUserData.pending = false;
    }
    
    // Notify the approved user
    this.triggerToUser(userId, 'join-request-approved', {
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
    this.triggerToRoom(creatorData.roomId, 'user-joined', {
      users: Array.from(room.users.values()),
      voteCount: room.getVoteCount(),
      participantCount: room.getParticipantCount()
    });

    // Notify creator about updated join requests
    this.triggerToUser(room.creatorId, 'join-requests-updated', {
      joinRequests: room.getJoinRequests()
    });

    return { success: true };
  }

  // Handle join request rejection
  handleRejectJoinRequest(creatorId, userId) {
    const creatorData = this.users.get(creatorId);
    if (!creatorData) return { error: 'Creator not found' };

    const room = this.rooms.get(creatorData.roomId);
    if (!room || room.creatorId !== creatorId) {
      return { error: 'Unauthorized' };
    }

    const joinRequest = room.joinRequests.get(userId);
    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    room.removeJoinRequest(userId);
    
    this.triggerToUser(userId, 'join-request-rejected', {
      message: 'Your join request has been rejected.'
    });
    
    const pendingUserData = this.users.get(userId);
    if (pendingUserData) {
      this.users.delete(userId);
    }

    this.triggerToUser(room.creatorId, 'join-requests-updated', {
      joinRequests: room.getJoinRequests()
    });

    return { success: true };
  }

  // Handle end session
  handleEndSession(userId) {
    const userData = this.users.get(userId);
    if (!userData) return { error: 'User not found' };

    const room = this.rooms.get(userData.roomId);
    if (!room || room.creatorId !== userId) {
      return { error: 'Only the room creator can end the session' };
    }

    this.triggerToRoom(userData.roomId, 'session-ended', {
      message: 'The session has been ended by the room creator'
    });

    // Clean up
    const roomUsers = Array.from(room.users.keys());
    roomUsers.forEach(uId => {
      userConnections.delete(uId);
      this.users.delete(uId);
    });

    this.rooms.delete(userData.roomId);
    roomChannels.delete(userData.roomId);

    return { success: true };
  }

  // Handle user disconnect
  handleDisconnect(userId) {
    const userData = this.users.get(userId);
    if (userData) {
      const room = this.rooms.get(userData.roomId);
      if (room) {
        room.removeUser(userId);
        room.removeJoinRequest(userId);
        
        if (room.users.size === 0) {
          this.rooms.delete(userData.roomId);
          roomChannels.delete(userData.roomId);
        } else {
          this.triggerToRoom(userData.roomId, 'user-left', {
            userId: userId,
            users: Array.from(room.users.values()),
            voteCount: room.getVoteCount(),
            participantCount: room.getParticipantCount()
          });
        }
      }
      this.users.delete(userId);
      userConnections.delete(userId);
    }
  }

  // Generate avatar (same as in server.js)
  generateAvatar(userId) {
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
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const index = Math.abs(hash) % avatarOptions.length;
    return avatarOptions[index];
  }

  // Authenticate Pusher channel subscription
  authenticateChannel(socketId, channel, userId) {
    const auth = pusher.authorizeChannel(socketId, channel);
    return auth;
  }

  // Authenticate private channel
  authenticatePrivateChannel(socketId, channel, userId) {
    const auth = pusher.authorizeChannel(socketId, channel);
    return auth;
  }
}

module.exports = PusherService;

