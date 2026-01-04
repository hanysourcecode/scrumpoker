// Real-time service abstraction that supports Socket.io, Pusher, and Polling
const REALTIME_PROVIDER = process.env.REACT_APP_REALTIME_PROVIDER || 'socketio';
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
const PUSHER_KEY = process.env.REACT_APP_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.REACT_APP_PUSHER_CLUSTER || 'us2';
const POLLING_INTERVAL = parseInt(process.env.REACT_APP_POLLING_INTERVAL) || 2000; // Default 2 seconds

class RealTimeService {
  constructor() {
    this.provider = REALTIME_PROVIDER;
    this.socket = null;
    this.pusher = null;
    this.channel = null;
    this.userChannel = null;
    this.userId = null;
    this.roomId = null;
    this.eventHandlers = {};
    this.pollingInterval = null;
    this.isPolling = false;
  }

  // Initialize connection
  async connect(userId, roomId, userName, isObserver = false) {
    this.userId = userId;
    this.roomId = roomId;

    if (this.provider === 'socketio') {
      return this.connectSocketIO(roomId, userName, isObserver);
    } else if (this.provider === 'pusher') {
      return this.connectPusher(userId, roomId, userName, isObserver);
    } else if (this.provider === 'polling') {
      return this.connectPolling(userId, roomId, userName, isObserver);
    }
  }

  // Socket.io connection
  connectSocketIO(roomId, userName, isObserver) {
    const { io } = require('socket.io-client');
    this.socket = io(API_BASE_URL);

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Socket.io connected');
        this.socket.emit('join-room', { roomId, userName, isObserver });
      });

      this.socket.on('joined-room', (data) => {
        resolve(data);
      });

      this.socket.on('error', (error) => {
        reject(error);
      });

      // Set up all event handlers
      this.setupSocketIOHandlers();
    });
  }

  // Pusher connection
  async connectPusher(userId, roomId, userName, isObserver) {
    const Pusher = require('pusher-js');
    
    this.pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE_URL}/pusher/auth`,
      auth: {
        params: {
          user_id: userId
        }
      }
    });

    return new Promise(async (resolve, reject) => {
      try {
        // Subscribe to room channel
        this.channel = this.pusher.subscribe(`room-${roomId}`);
        
        // Subscribe to private user channel
        this.userChannel = this.pusher.subscribe(`private-user-${userId}`);

        // Wait for subscription
        await new Promise((res) => {
          this.channel.bind('pusher:subscription_succeeded', () => {
            console.log('Pusher subscribed to room channel');
            res();
          });
        });

        // Wait for Pusher to be fully connected
        await new Promise((resolve) => {
          if (this.pusher.connection.state === 'connected') {
            resolve();
          } else {
            this.pusher.connection.bind('state_change', (states) => {
              if (states.current === 'connected') {
                resolve();
              }
            });
          }
        });

        // Join room via API
        const response = await fetch(`${API_BASE_URL}/api/pusher/join-room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            roomId,
            userName,
            isObserver,
            socketId: this.pusher.connection.socket_id
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          reject(data);
          return;
        }

        if (data.pending) {
          resolve(data);
          return;
        }

        // Set up Pusher event handlers
        this.setupPusherHandlers();
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Setup Socket.io event handlers
  setupSocketIOHandlers() {
    const events = [
      'joined-room',
      'user-joined',
      'user-left',
      'room-updated',
      'votes-revealed',
      'votes-reset',
      'story-updated',
      'user-updated',
      'join-request',
      'join-request-pending',
      'join-request-approved',
      'join-request-rejected',
      'join-requests-updated',
      'session-ended',
      'vote-removed',
      'error'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        if (this.eventHandlers[event]) {
          this.eventHandlers[event](data);
        }
      });
    });
  }

  // Polling connection
  async connectPolling(userId, roomId, userName, isObserver) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polling/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roomId,
          userName,
          isObserver
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.pending) {
        // Start polling even if pending
        this.startPolling();
        // Trigger pending event handler if registered
        if (this.eventHandlers['join-request-pending']) {
          this.eventHandlers['join-request-pending'](data);
        }
        return data;
      }

      // Start polling for updates
      this.startPolling();
      
      // Trigger joined-room event handler for consistency with other providers
      if (this.eventHandlers['joined-room']) {
        this.eventHandlers['joined-room'](data);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Start polling for updates
  startPolling() {
    if (this.isPolling || !this.userId) {
      return;
    }
    
    this.isPolling = true;
    console.log('Polling started');
    
    const poll = async () => {
      if (!this.isPolling || !this.userId) {
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/polling/poll?userId=${this.userId}&timeout=30000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Poll request failed');
        }
        
        const data = await response.json();
        
        if (data.updates && data.updates.length > 0) {
          data.updates.forEach(update => {
            if (this.eventHandlers[update.event]) {
              this.eventHandlers[update.event](update.data);
            }
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling even on error
      }
      
      // Schedule next poll
      if (this.isPolling) {
        this.pollingInterval = setTimeout(poll, POLLING_INTERVAL);
      }
    };
    
    // Start polling immediately
    poll();
  }

  // Stop polling
  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Setup Pusher event handlers
  setupPusherHandlers() {
    const events = [
      'user-joined',
      'user-left',
      'room-updated',
      'votes-revealed',
      'votes-reset',
      'story-updated',
      'user-updated',
      'session-ended'
    ];

    events.forEach(event => {
      this.channel.bind(event, (data) => {
        if (this.eventHandlers[event]) {
          this.eventHandlers[event](data);
        }
      });
    });

    // User-specific events
    const userEvents = [
      'joined-room',
      'join-request',
      'join-request-pending',
      'join-request-approved',
      'join-request-rejected',
      'join-requests-updated',
      'vote-removed',
      'error'
    ];

    userEvents.forEach(event => {
      this.userChannel.bind(event, (data) => {
        if (this.eventHandlers[event]) {
          this.eventHandlers[event](data);
        }
      });
    });
  }

  // Register event handler
  on(event, handler) {
    this.eventHandlers[event] = handler;
  }

  // Remove event handler
  off(event) {
    delete this.eventHandlers[event];
  }

  // Emit event (cast vote, reveal votes, etc.)
  emit(event, data) {
    if (this.provider === 'socketio') {
      this.socket.emit(event, data);
    } else if (this.provider === 'pusher') {
      // For Pusher, we need to use HTTP API
      this.emitPusherEvent(event, data);
    } else if (this.provider === 'polling') {
      // For Polling, we need to use HTTP API
      this.emitPollingEvent(event, data);
    }
  }

  // Emit Polling events via HTTP API
  async emitPollingEvent(event, data) {
    const endpointMap = {
      'cast-vote': '/api/polling/cast-vote',
      'remove-vote': '/api/polling/remove-vote',
      'reveal-votes': '/api/polling/reveal-votes',
      'reset-votes': '/api/polling/reset-votes',
      'set-story': '/api/polling/set-story',
      'toggle-observer': '/api/polling/toggle-observer',
      'approve-join-request': '/api/polling/approve-join-request',
      'reject-join-request': '/api/polling/reject-join-request',
      'end-session': '/api/polling/end-session'
    };

    const endpoint = endpointMap[event];
    if (!endpoint) {
      console.warn(`Unknown event: ${event}`);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...data
        }),
      });
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
    }
  }

  // Emit Pusher events via HTTP API
  async emitPusherEvent(event, data) {
    const endpointMap = {
      'cast-vote': '/api/pusher/cast-vote',
      'remove-vote': '/api/pusher/remove-vote',
      'reveal-votes': '/api/pusher/reveal-votes',
      'reset-votes': '/api/pusher/reset-votes',
      'set-story': '/api/pusher/set-story',
      'toggle-observer': '/api/pusher/toggle-observer',
      'approve-join-request': '/api/pusher/approve-join-request',
      'reject-join-request': '/api/pusher/reject-join-request',
      'end-session': '/api/pusher/end-session'
    };

    const endpoint = endpointMap[event];
    if (!endpoint) {
      console.warn(`Unknown event: ${event}`);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...data
        }),
      });
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
    }
  }

  // Disconnect
  disconnect() {
    if (this.provider === 'socketio' && this.socket) {
      this.socket.disconnect();
      this.socket = null;
    } else if (this.provider === 'pusher' && this.pusher) {
      if (this.channel) {
        this.pusher.unsubscribe(`room-${this.roomId}`);
      }
      if (this.userChannel) {
        this.pusher.unsubscribe(`private-user-${this.userId}`);
      }
      
      // Notify server about disconnect
      if (this.userId) {
        fetch(`${API_BASE_URL}/api/pusher/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: this.userId }),
        }).catch(console.error);
      }
      
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
      this.userChannel = null;
    } else if (this.provider === 'polling') {
      // Stop polling
      this.stopPolling();
      
      // Notify server about disconnect
      if (this.userId) {
        fetch(`${API_BASE_URL}/api/polling/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: this.userId }),
        }).catch(console.error);
      }
    }
    
    this.eventHandlers = {};
    this.userId = null;
    this.roomId = null;
  }
}

export default RealTimeService;

