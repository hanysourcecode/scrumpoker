# 🎯 Scrum Poker

A real-time collaborative estimation tool for Agile teams. Estimate user stories using the Fibonacci sequence with your team members in real-time.

## Features

- **Real-time Collaboration**: Vote simultaneously with your team using WebSockets
- **Fibonacci Sequence**: Use standard story point values (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?)
- **Room Management**: Create or join existing rooms
- **Observer Mode**: Watch the voting process without participating
- **Story Management**: Set and display current user story
- **Vote Results**: See individual votes and average estimates
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **UUID** for room ID generation
- **CORS** for cross-origin requests

### Frontend
- **React** with functional components and hooks
- **Socket.io-client** for real-time communication
- **Axios** for HTTP requests
- **CSS3** with modern styling and animations

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd scrum-poker
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

3. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Creating a Room
1. Enter your name
2. Optionally enter a room name
3. Click "Create New Room"
4. Share the Room ID with your team members

### Joining a Room
1. Enter your name
2. Enter the Room ID provided by the room creator
3. Click "Join Room"

### Voting Process
1. **Set a Story**: Enter a user story description and click "Set Story"
2. **Vote**: Click on your estimate (Fibonacci sequence values)
3. **Reveal**: Once everyone has voted, click "Reveal Votes"
4. **Review**: See individual votes and the average estimate
5. **New Round**: Click "New Round" to start estimating the next story

### Observer Mode
- Toggle between participant and observer mode
- Observers can watch the voting process but cannot vote
- Useful for stakeholders or team members who want to observe

## API Endpoints

### REST API
- `GET /api/rooms` - Get list of available rooms
- `POST /api/rooms` - Create a new room

### WebSocket Events
- `join-room` - Join a room
- `cast-vote` - Cast a vote
- `reveal-votes` - Reveal all votes
- `reset-votes` - Reset votes for new round
- `set-story` - Set current story
- `toggle-observer` - Toggle observer mode

## Project Structure

```
scrum-poker/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js
│   │   │   └── GameRoom.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## Customization

### Environment Variables
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000
```

### Styling
The application uses CSS3 with modern design principles. You can customize the styling by modifying:
- `frontend/src/App.css` - Main stylesheet
- Color scheme and gradients
- Responsive breakpoints
- Animation effects

### Fibonacci Sequence
To modify the voting options, update the `FIBONACCI_SEQUENCE` array in:
- `backend/server.js` (line 15)
- `frontend/src/components/GameRoom.js` (line 3)

## Deployment

### Backend Deployment
1. Set environment variables (PORT, etc.)
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve the `build` folder with a web server
3. Update `REACT_APP_API_URL` to point to your backend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your team's estimation needs!

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Ensure both backend and frontend are running
   - Check that ports 3000 and 5000 are available
   - Verify firewall settings

2. **Room Not Found**
   - Double-check the Room ID
   - Ensure the room creator is still connected
   - Try creating a new room

3. **Votes Not Updating**
   - Refresh the page
   - Check browser console for errors
   - Ensure WebSocket connection is established

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

For the best experience, use a modern browser with WebSocket support.
