import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import GameRoom from './components/GameRoom';
import UserNamePrompt from './components/UserNamePrompt';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// Component for handling room routes
function RoomRoute() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserNamePrompt, setShowUserNamePrompt] = useState(false);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
      // Reset the ref when component unmounts
      hasJoinedRef.current = false;
    };
  }, [socket]);

  // Handle direct access to room URL
  useEffect(() => {
    if (roomId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      // Always show user name prompt screen
      setShowUserNamePrompt(true);
      setIsLoading(false);
    }
  }, [roomId, navigate]);

  const joinRoom = (roomId, userName, isObserver = false) => {
    console.log('Attempting to join room:', roomId, 'with user:', userName, 'as observer:', isObserver);
    const newSocket = io(API_BASE_URL);
    
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('joined-room', (data) => {
      console.log('Successfully joined room:', data);
      setRoom(data.room);
      setUser(data.user);
      setIsLoading(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    newSocket.on('user-joined', (data) => {
      setRoom(prev => ({
        ...prev,
        users: data.users,
        voteCount: data.voteCount,
        participantCount: data.participantCount
      }));
    });

    newSocket.on('user-left', (data) => {
      setRoom(prev => ({
        ...prev,
        users: data.users,
        voteCount: data.voteCount,
        participantCount: data.participantCount
      }));
    });

    newSocket.on('vote-cast', (data) => {
      // Handle vote cast notification
    });

    newSocket.on('room-updated', (data) => {
      setRoom(data.room);
    });

    newSocket.on('votes-revealed', (data) => {
      setRoom(prev => ({
        ...prev,
        showVotes: true,
        votes: data.votes,
        averageVote: data.averageVote,
        voteCount: data.voteCount,
        participantCount: data.participantCount
      }));
    });

    newSocket.on('votes-reset', () => {
      setRoom(prev => ({
        ...prev,
        showVotes: false,
        votes: {},
        averageVote: null,
        voteCount: 0
      }));
    });


    newSocket.on('story-updated', (data) => {
      setRoom(prev => ({
        ...prev,
        currentStory: data.story
      }));
    });

    newSocket.on('user-updated', (data) => {
      setRoom(prev => ({
        ...prev,
        users: data.users,
        voteCount: data.voteCount,
        participantCount: data.participantCount
      }));
    });

    newSocket.on('join-request', (data) => {
      setRoom(prev => ({
        ...prev,
        joinRequests: [...(prev.joinRequests || []), data.user]
      }));
    });

    newSocket.on('join-request-pending', (data) => {
      // Don't show alert, just update the loading message
      setIsLoading(false);
      setRoom(prev => ({
        ...prev,
        joinRequestPending: true,
        joinRequestMessage: data.message
      }));
    });

    newSocket.on('join-request-approved', (data) => {
      // Set room and user data from the approval response
      setRoom(prev => ({
        ...data.room,
        joinRequestPending: false,
        joinRequestMessage: null
      }));
      setUser(data.user);
      setIsLoading(false);
    });

    newSocket.on('join-request-rejected', (data) => {
      alert(data.message);
      navigate('/');
    });

    newSocket.on('join-requests-updated', (data) => {
      setRoom(prev => ({
        ...prev,
        joinRequests: data.joinRequests
      }));
    });

    newSocket.on('session-ended', (data) => {
      alert(data.message);
      navigate('/');
    });

    setSocket(newSocket);
    console.log('Emitting join-room event with:', { roomId, userName, isObserver });
    newSocket.emit('join-room', { roomId, userName, isObserver });
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
    if (socket) {
      socket.disconnect();
      setSocket(null);
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
      socket={socket}
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