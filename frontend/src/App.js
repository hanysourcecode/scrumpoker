import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import GameRoom from './components/GameRoom';
import UserNamePrompt from './components/UserNamePrompt';
import { DarkModeProvider } from './contexts/DarkModeContext';
import RealTimeService from './services/realtimeService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// Generate or retrieve userId from localStorage
const getUserId = () => {
  let userId = localStorage.getItem('scrumPokerUserId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('scrumPokerUserId', userId);
  }
  return userId;
};

// Component for handling room routes
function RoomRoute() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [realtimeService, setRealtimeService] = useState(null);
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserNamePrompt, setShowUserNamePrompt] = useState(false);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (realtimeService) {
        realtimeService.disconnect();
      }
      // Reset the ref when component unmounts
      hasJoinedRef.current = false;
    };
  }, [realtimeService]);

  // Handle direct access to room URL
  useEffect(() => {
    if (roomId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      // Always show user name prompt screen
      setShowUserNamePrompt(true);
      setIsLoading(false);
    }
  }, [roomId, navigate]);

  const joinRoom = async (roomId, userName, isObserver = false) => {
    console.log('Attempting to join room:', roomId, 'with user:', userName, 'as observer:', isObserver);
    const userId = getUserId();
    const service = new RealTimeService();
    
    try {
      const data = await service.connect(userId, roomId, userName, isObserver);
      
      // Handle pending join request
      if (data.pending) {
        setIsLoading(false);
        setRoom({
          joinRequestPending: true,
          joinRequestMessage: data.message
        });
        setRealtimeService(service);
        return;
      }

      // Set up event handlers
      service.on('joined-room', (data) => {
        console.log('Successfully joined room:', data);
        setRoom(data.room);
        setUser(data.user);
        setIsLoading(false);
      });

      service.on('error', (error) => {
        console.error('Real-time error:', error);
        alert(error.message);
      });

      service.on('user-joined', (data) => {
        setRoom(prev => ({
          ...prev,
          users: data.users,
          voteCount: data.voteCount,
          participantCount: data.participantCount
        }));
      });

      service.on('user-left', (data) => {
        setRoom(prev => ({
          ...prev,
          users: data.users,
          voteCount: data.voteCount,
          participantCount: data.participantCount
        }));
      });

      service.on('room-updated', (data) => {
        setRoom(data.room);
      });

      service.on('votes-revealed', (data) => {
        setRoom(prev => ({
          ...prev,
          showVotes: true,
          votes: data.votes,
          averageVote: data.averageVote,
          voteCount: data.voteCount,
          participantCount: data.participantCount
        }));
      });

      service.on('votes-reset', () => {
        setRoom(prev => ({
          ...prev,
          showVotes: false,
          votes: {},
          averageVote: null,
          voteCount: 0
        }));
      });

      service.on('story-updated', (data) => {
        setRoom(prev => ({
          ...prev,
          currentStory: data.story
        }));
      });

      service.on('user-updated', (data) => {
        setRoom(prev => ({
          ...prev,
          users: data.users,
          voteCount: data.voteCount,
          participantCount: data.participantCount
        }));
      });

      service.on('join-request', (data) => {
        setRoom(prev => ({
          ...prev,
          joinRequests: [...(prev.joinRequests || []), data.user]
        }));
      });

      service.on('join-request-pending', (data) => {
        setIsLoading(false);
        setRoom(prev => ({
          ...prev,
          joinRequestPending: true,
          joinRequestMessage: data.message
        }));
      });

      service.on('join-request-approved', (data) => {
        setRoom(data.room);
        setUser(data.user);
        setIsLoading(false);
      });

      service.on('join-request-rejected', (data) => {
        alert(data.message);
        navigate('/');
      });

      service.on('join-requests-updated', (data) => {
        setRoom(prev => ({
          ...prev,
          joinRequests: data.joinRequests
        }));
      });

      service.on('session-ended', (data) => {
        alert(data.message);
        navigate('/');
      });

      setRealtimeService(service);
      
      // If data was returned directly (Pusher), set it immediately
      if (data.room && data.user) {
        setRoom(data.room);
        setUser(data.user);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert(error.message || 'Failed to join room');
      setIsLoading(false);
    }
  };

  // const createRoom = async (roomName, creatorOnlyReveal = false) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/rooms`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name: roomName, creatorOnlyReveal }),
  //     });
  //     const data = await response.json();
  //     return data.id;
  //   } catch (error) {
  //     console.error('Error creating room:', error);
  //     throw error;
  //   }
  // };

  const handleUserNameSubmit = (userName, isObserver = false) => {
    localStorage.setItem('userName', userName);
    setShowUserNamePrompt(false);
    setIsLoading(true);
    joinRoom(roomId, userName, isObserver);
  };

  const handleUserNameCancel = () => {
    navigate('/');
  };

  const leaveRoom = () => {
    if (realtimeService) {
      realtimeService.disconnect();
      setRealtimeService(null);
    }
    setRoom(null);
    setUser(null);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Joining room...</h2>
      </div>
    );
  }

  if (showUserNamePrompt) {
    return (
      <UserNamePrompt
        onSubmit={handleUserNameSubmit}
        onCancel={handleUserNameCancel}
      />
    );
  }

  if (room?.joinRequestPending) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>⏳ {room.joinRequestMessage}</h2>
        <p style={{ color: '#666', marginTop: '20px' }}>
          Please wait while the room creator reviews your request...
        </p>
      </div>
    );
  }

  return (
    <GameRoom
      room={room}
      user={user}
      realtimeService={realtimeService}
      onLeaveRoom={leaveRoom}
    />
  );
}

// Main App component
function App() {
  const navigate = useNavigate();

  // const createRoom = async (roomName, creatorOnlyReveal = false, requireApproval = false, isPublic = true, creatorOnlyStory = false) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/rooms`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name: roomName, creatorOnlyReveal, requireApproval, isPublic, creatorOnlyStory }),
  //     });
  //     const data = await response.json();
  //     console.log('API response:', data);
  //     return data.id;
  //   } catch (error) {
  //     console.error('Error creating room:', error);
  //     throw error;
  //   }
  // };

  const handleCreateRoom = async (roomName, creatorOnlyReveal = false, requireApproval = false, isPublic = true, creatorOnlyStory = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: roomName, creatorOnlyReveal, requireApproval, isPublic, creatorOnlyStory }),
      });
      const data = await response.json();
      console.log('API response:', data);
      const roomId = data.id;
      console.log('Created room with ID:', roomId);
      if (roomId) {
        navigate(`/room/${roomId}`);
      } else {
        alert('Failed to create room - no room ID returned.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="App">
      <HomePage 
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}

// Root component with Router
function AppWithRouter() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/room/:roomId" element={<RoomRoute />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default AppWithRouter;