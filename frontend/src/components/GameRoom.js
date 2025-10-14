import React, { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';

const FIBONACCI_SEQUENCE = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?'];

const GameRoom = ({ room, user, socket, onLeaveRoom }) => {
  const [selectedVote, setSelectedVote] = useState(null);
  const [isObserver, setIsObserver] = useState(user?.isObserver || false);
  const [showNewStoryPopup, setShowNewStoryPopup] = useState(false);
  const [newStoryName, setNewStoryName] = useState('');

  useEffect(() => {
    setIsObserver(user?.isObserver || false);
  }, [user]);

  useEffect(() => {
    // Clear selected vote when votes are reset (room.votes becomes empty)
    if (room && Object.keys(room.votes || {}).length === 0 && !room.showVotes) {
      setSelectedVote(null);
    }
  }, [room?.votes, room?.showVotes]);

  // Sync selectedVote with room data (only when votes are revealed)
  useEffect(() => {
    if (room?.votes && user?.name && room.showVotes) {
      const userVote = room.votes[user.name];
      if (userVote !== undefined) {
        setSelectedVote(userVote);
      } else if (selectedVote !== null) {
        // User's vote was removed
        setSelectedVote(null);
      }
    }
  }, [room?.votes, user?.name, room?.showVotes, selectedVote]);

  const handleVote = (vote) => {
    if (isObserver || room?.showVotes) return;
    
    setSelectedVote(vote);
    socket.emit('cast-vote', { vote });
  };

  const handleRevealVotes = () => {
    socket.emit('reveal-votes');
  };

  const handleResetVotes = () => {
    setShowNewStoryPopup(true);
  };

  const handleVoteAgain = () => {
    // Reset votes without changing the story
    socket.emit('reset-votes');
    setSelectedVote(null);
  };

  const handleNewStorySubmit = () => {
    if (newStoryName.trim()) {
      // Set the new story first
      socket.emit('set-story', { story: newStoryName.trim() });
    }
    // Reset votes
    socket.emit('reset-votes');
    setSelectedVote(null);
    setShowNewStoryPopup(false);
    setNewStoryName('');
  };

  const handleNewStoryCancel = () => {
    setShowNewStoryPopup(false);
    setNewStoryName('');
  };



  // const getVotedUsers = () => {
  //   if (!room?.votes) return [];
  //   return Object.keys(room.votes);
  // };

  const getVoteDistribution = () => {
    if (!room?.votes || !room?.showVotes) return {};
    
    const distribution = {};
    Object.values(room.votes).forEach(vote => {
      distribution[vote] = (distribution[vote] || 0) + 1;
    });
    return distribution;
  };

  const getVotersForVote = (voteValue) => {
    if (!room?.votes || !room?.showVotes) return [];
    
    return Object.entries(room.votes)
      .filter(([userName, vote]) => vote === voteValue)
      .map(([userName]) => userName);
  };

  const getVoteCount = () => {
    return room?.voteCount || 0;
  };

  const getTotalUsers = () => {
    return room?.participantCount || 0;
  };

  const canRevealVotes = () => {
    if (!room?.creatorOnlyReveal) {
      return true; // Anyone can reveal if creator-only is disabled
    }
    return user?.id === room?.creatorId; // Only creator can reveal if enabled
  };

  const canResetVotes = () => {
    // Creator can always start a new round, even if there's no current story
    if (user?.id === room?.creatorId) {
      return true;
    }
    if (!room?.creatorOnlyReveal) {
      return true; // Anyone can reset if creator-only is disabled
    }
    return false; // Only creator can reset if enabled
  };

  // const copyRoomLink = async () => {
  //   const roomUrl = `${window.location.origin}/room/${room?.id}`;
  //   try {
  //     await navigator.clipboard.writeText(roomUrl);
  //     alert('Room link copied to clipboard!');
  //   } catch (err) {
  //     // Fallback for older browsers
  //     const textArea = document.createElement('textarea');
  //     textArea.value = roomUrl;
  //     document.body.appendChild(textArea);
  //     textArea.select();
  //     document.execCommand('copy');
  //     document.body.removeChild(textArea);
  //     alert('Room link copied to clipboard!');
  //   }
  // };

  const handleApproveJoinRequest = (userId) => {
    socket.emit('approve-join-request', { userId });
  };

  const handleRejectJoinRequest = (userId) => {
    socket.emit('reject-join-request', { userId });
  };

  const handleRemoveVote = () => {
    if (socket) {
      socket.emit('remove-vote');
    }
  };

  const handleEndSession = () => {
    if (socket && user?.id === room?.creatorId) {
      if (window.confirm('Are you sure you want to end the session? This will disconnect all users from the room.')) {
        socket.emit('end-session');
      }
    }
  };


  // Debug: Log room data
  console.log('GameRoom - room data:', room);
  
  return (
    <div className="container">
      <div className="game-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '15px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>
            {room?.name || 'Room Title'}
          </div>
          <div className="room-info" style={{ fontSize: '0.8rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Room ID: {room?.id}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <DarkModeToggle />
          {user?.id === room?.creatorId ? (
            <button onClick={handleEndSession} className="btn btn-danger" style={{ width: 'auto' }}>
              End Session
            </button>
          ) : (
            <button onClick={onLeaveRoom} className="btn btn-danger" style={{ width: 'auto' }}>
              Leave
            </button>
          )}
        </div>
      </div>

      <div className="users-section">
        <h3>
          Participants ({getTotalUsers()})
          {getVoteCount() > 0 && (
            <span style={{ color: '#28a745', fontSize: '0.9rem', fontWeight: 'normal' }}>
              {' '}• {getVoteCount()} voted
            </span>
          )}
        </h3>
        <div className="users-grid">
          {room?.users?.map((participant) => {
            const hasVoted = room.votes && room.votes[participant.name] !== undefined;
            const isCurrentUser = participant.id === user?.id;
            const isCreator = participant.id === room?.creatorId;
            
            return (
              <div
                key={participant.id}
                className={`user-card ${participant.isObserver ? 'observer' : ''} ${hasVoted ? 'voted' : ''} ${isCurrentUser ? 'current-user' : ''}`}
                style={isCurrentUser ? { borderColor: '#667eea', borderWidth: '3px' } : {}}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                    {participant.avatar || '👤'}
                  </div>
                  <div className="user-name" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  {participant.name}
                  {isCurrentUser && ' (You)'}
                </div>
                  <div className="user-status" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                    {participant.isObserver && '👓 Observer'}
                    {isCreator && '👑 Creator'}
                  </div>
                </div>
                {hasVoted && !room.showVotes && (
                  <div style={{ marginTop: '5px', fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                    ✓
                  </div>
                )}
                {hasVoted && room.showVotes && (
                  <div style={{ marginTop: '5px', fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                    {room.votes[participant.name]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
      </div>

      {/* Join Requests Section - Only visible to creator */}
      {user?.id === room?.creatorId && room?.joinRequests && room.joinRequests.length > 0 && (
        <div className="join-requests-section" style={{ marginTop: '20px' }}>
          <h3>Join Requests ({room.joinRequests.length})</h3>
          <div className="users-grid">
            {room.joinRequests.map((request) => (
              <div key={request.id} className="user-card" style={{ borderColor: '#ffc107' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                    {request.avatar || '👤'}
                  </div>
                  <div className="user-name" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    {request.name}
                  </div>
                  <div className="user-status" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                    ⏳ Pending Approval
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleApproveJoinRequest(request.id)}
                    className="btn btn-success"
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleRejectJoinRequest(request.id)}
                    className="btn btn-danger"
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
            </div>
        </div>
      )}

      {room?.currentStory && (
        <div className="story-display" style={{ textAlign: 'center', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
            {room.currentStory}
          </p>
        </div>
      )}

      {!isObserver && !room?.showVotes && room?.currentStory && (
        <div className="voting-section">
          <div className="voting-cards">
            {FIBONACCI_SEQUENCE.map((value, index) => (
              <div
                key={index}
                className={`voting-card ${value === '?' ? 'question' : ''} ${selectedVote === value ? 'selected' : ''}`}
                onClick={() => handleVote(value)}
                style={{ cursor: 'pointer' }}
              >
                {value}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
            {selectedVote !== null ? selectedVote : 'Select your estimate'}
          </div>
          
          {selectedVote !== null && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button
                onClick={handleRemoveVote}
                className="btn btn-secondary"
                style={{ 
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  backgroundColor: '#6c757d',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Remove Vote
              </button>
            </div>
          )}
        </div>
      )}

      {!isObserver && !room?.showVotes && !room?.currentStory && (
        <div className="waiting-message" style={{ textAlign: 'center', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ fontStyle: 'italic' }}>
            Waiting for the room creator to start the first round...
          </p>
        </div>
      )}

      {/* Vote Distribution Graph */}
      {room?.showVotes && Object.keys(getVoteDistribution()).length > 0 && (
        <div className="vote-distribution" style={{ marginBottom: '20px', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>Vote Distribution</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(getVoteDistribution())
              .sort(([a], [b]) => {
                // Sort numerically, with '?' at the end
                if (a === '?') return 1;
                if (b === '?') return -1;
                return Number(a) - Number(b);
              })
              .map(([vote, count]) => {
                const totalVotes = Object.values(getVoteDistribution()).reduce((sum, c) => sum + c, 0);
                const percentage = (count / totalVotes) * 100;
                const voters = getVotersForVote(vote);
                
                return (
                  <div key={vote} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      minWidth: '30px', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {vote}
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{
                        height: '20px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div 
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: vote === '?' ? '#6c757d' : '#667eea',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          title={`Voters: ${voters.join(', ')}`}
                          onMouseEnter={(e) => {
                            const tooltip = document.createElement('div');
                            tooltip.id = 'vote-tooltip';
                            tooltip.style.cssText = `
                              position: absolute;
                              background: #333;
                              color: white;
                              padding: 8px 12px;
                              border-radius: 6px;
                              font-size: 0.8rem;
                              z-index: 1000;
                              pointer-events: none;
                              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                              max-width: 200px;
                              word-wrap: break-word;
                            `;
                            tooltip.textContent = `Voters: ${voters.join(', ')}`;
                            document.body.appendChild(tooltip);
                            
                            const rect = e.target.getBoundingClientRect();
                            tooltip.style.left = `${rect.left + rect.width / 2}px`;
                            tooltip.style.top = `${rect.top - 10}px`;
                            tooltip.style.transform = 'translateX(-50%)';
                          }}
                          onMouseLeave={() => {
                            const tooltip = document.getElementById('vote-tooltip');
                            if (tooltip) {
                              tooltip.remove();
                            }
                          }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      minWidth: '40px', 
                      textAlign: 'left', 
                      fontSize: '0.8rem',
                      color: '#666'
                    }}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
          </div>
          <div style={{ 
            textAlign: 'center', 
            marginTop: '15px', 
            fontSize: '0.9rem', 
            color: '#666',
            fontWeight: 'bold'
          }}>
            Average: {room?.averageVote || 'N/A'}
          </div>
        </div>
      )}

      {isObserver && (
        <div className="observer-message" style={{ textAlign: 'center', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ fontStyle: 'italic' }}>
            You are in observer mode. You can watch the voting but cannot participate.
          </p>
        </div>
      )}

      <div className="controls">
        
        {!room?.showVotes && room?.currentStory && canRevealVotes() ? (
          <button
            onClick={handleRevealVotes}
            className="btn btn-success"
            style={{ width: 'auto' }}
            disabled={getVoteCount() === 0}
          >
            Reveal Votes ({getVoteCount()}/{getTotalUsers()})
          </button>
        ) : (
          canResetVotes() && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {getVoteCount() > 0 && (
                <button
                  onClick={handleVoteAgain}
                  className="btn btn-primary"
                  style={{ width: 'auto' }}
                >
                  Vote Again
                </button>
              )}
          <button
            onClick={handleResetVotes}
            className="btn btn-secondary"
            style={{ width: 'auto' }}
          >
            New Round
          </button>
            </div>
          )
        )}
      </div>

      {/* New Story Popup */}
      {showNewStoryPopup && (
        <div className="popup-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="popup-content" style={{
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
              New Round
            </h3>
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Enter a new story name for the next round:
            </p>
            
            <div className="form-group">
              <input
                type="text"
                value={newStoryName}
                onChange={(e) => setNewStoryName(e.target.value)}
                placeholder="Enter new story name..."
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                autoFocus
              />
              </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={handleNewStoryCancel}
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleNewStorySubmit}
                className="btn"
                style={{ padding: '10px 20px' }}
              >
                Start New Round
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameRoom;
