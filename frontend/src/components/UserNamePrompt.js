import React, { useState } from 'react';

const UserNamePrompt = ({ onSubmit, onCancel }) => {
  const [userName, setUserName] = useState('');
  const [isObserver, setIsObserver] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    onSubmit(userName.trim(), isObserver);
  };

  const handleCancel = () => {
    onCancel();
  };


  return (
    <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>Join Room</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Please enter your name to join the room
        </p>
        
        
        {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              required
              autoFocus
              style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={isObserver}
                onChange={(e) => setIsObserver(e.target.checked)}
                style={{ margin: 0 }}
              />
              <span>👓 Join as observer (read-only)</span>
            </label>
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Observers can view the room but cannot vote or participate in discussions
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              style={{ padding: '10px 20px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              style={{ padding: '10px 20px' }}
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserNamePrompt;
