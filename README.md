# 🎵 Nebula Spotify Clone

A state-of-the-art, fully functional Spotify Clone built with the MERN stack (MongoDB, Express, React, Node.js). This application delivers a premium user experience with robust audio playback, smart recommendations, and seamless cross-device synchronization.

![Nebula Spotify Clone](https://placeholder-image-url.com/banner.png) *Add a screenshot here*

## ✨ Key Features

### 🎧 Advanced Audio Player
- **YouTube Integration**: Reliable playback using the YouTube IFrame Player API (No 403 errors).
- **Smart Autoplay**: Predictive algorithm uses your listening history to recommend the perfect next track.
- **Queue Management**: Shuffle, repeat, and queue functionality.
- **Cross-Device Sync**: Your "Recently Played" and "Liked Songs" sync across all browsers and devices.
- **Google Cast Support**: Cast your music to supported devices (Chromecast).

### 🔐 Authentication & User System
- **Secure Login/Register**: JWT-based authentication.
- **Guest Access**: Try the app instantly without creating an account.
- **Admin Dashboard**: Specialized controls for platform administrators.

### 🎨 Premium UI/UX
- **Responsive Design**: Flawless experience on Desktop, User, and Mobile.
- **Dynamic Visuals**: Glassmorphism effects, smooth transitions, and vinyl record animations.
- **Lyrics Integration**: Real-time synchronized lyrics for supported tracks.

### 🛠️ Technical Highlights
- **Smart Caching**: Video IDs and Likes are cached to minimize API usage and load instanty.
- **Self-Healing Server**: Built-in health check prevents server spin-down on free hosting (Render).
- **Secure Backend**: Rotatable API keys and robust error handling.

## 🚀 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **APIs**: YouTube Data API v3, Custom Spotify Scraper, Genius Lyrics

## 🛠️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/nebula-spotify-clone.git
    cd nebula-spotify-clone
    ```

2.  **Install Dependencies**
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the `server` directory:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    # ADMIN_SECRET=your_admin_secret (Optional)
    ```
    
    Create a `.env` file in the `client` directory:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

4.  **Run the Application**
    You need two terminals:
    
    *Terminal 1 (Server):*
    ```bash
    cd server
    npm start
    ```
    
    *Terminal 2 (Client):*
    ```bash
    cd client
    npm run dev
    ```

## 🌍 Deployment

### Deploying to Render
1.  **Backend**: Create a Web Service for `server`.
    *   Build Command: `npm install`
    *   Start Command: `node index.js`
    *   Env Vars: Add `MONGO_URI`, `JWT_SECRET`, and `RENDER_EXTERNAL_URL`.
2.  **Frontend**: Create a Static Site for `client`.
    *   Build Command: `npm install && npm run build`
    *   Publish Directory: `dist`
    *   Env Vars: Add `VITE_API_URL` pointing to your backend URL.

This project includes a **Self-Healing mechanism** (`/health` route) that prevents the server from sleeping on Render's free tier.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
