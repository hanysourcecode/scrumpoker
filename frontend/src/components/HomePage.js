import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = ({ onJoinRoom, onCreateRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [creatorOnlyReveal] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [creatorOnlyStory] = useState(true);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms`);
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    // Always navigate to room URL, which will trigger the user name prompt
    window.location.href = `/room/${roomId.trim()}`;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      await onCreateRoom(newRoomName.trim() || 'My Scrum Poker Room', creatorOnlyReveal, requireApproval, isPublic, creatorOnlyStory);
      // Note: onCreateRoom now handles navigation automatically
    } catch (error) {
      setError('Failed to create room. Please try again.');
      setLoading(false);
    }
  };

  const joinExistingRoom = async (roomId) => {
    // Always navigate to room URL, which will trigger the user name prompt
    window.location.href = `/room/${roomId}`;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Scrum Poker</h1>
        <p>Estimate user stories with your team in real-time</p>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleJoinRoom}>
        <div className="form-group">
          <label htmlFor="roomId">Room ID</label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            required
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>

      <div className="divider">
        <span>OR</span>
      </div>

      <form onSubmit={handleCreateRoom}>
        <div className="form-group">
          <label htmlFor="newRoomName">Room Name (Optional)</label>
          <input
            type="text"
            id="newRoomName"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Enter room name"
          />
        </div>

        {/* Compact Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span>🌐 Public room</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span>🔐 Require approval</span>
          </label>
        </div>

        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? 'Creating...' : 'Create New Room'}
        </button>
      </form>

      {availableRooms.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
            Available Rooms
          </h3>
          <div className="users-grid">
            {availableRooms.map((room) => (
              <div key={room.id} className="user-card" style={{ cursor: 'pointer' }}>
                <div className="user-name">{room.name}</div>
                <div className="user-status">
                  {room.userCount} participant{room.userCount !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => joinExistingRoom(room.id)}
                  className="btn"
                  style={{ 
                    marginTop: '10px', 
                    padding: '8px 16px', 
                    fontSize: '0.9rem',
                    width: 'auto'
                  }}
                  disabled={loading}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
