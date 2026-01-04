// Configuration for real-time communication
// Set REALTIME_PROVIDER to 'socketio', 'pusher', or 'polling'
// Default: 'socketio'
const REALTIME_PROVIDER = process.env.REALTIME_PROVIDER || 'socketio';

// Pusher configuration
const PUSHER_CONFIG = {
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
};

module.exports = {
  REALTIME_PROVIDER,
  PUSHER_CONFIG
};


