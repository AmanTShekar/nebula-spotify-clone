# Deployment Guide

## Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `server` directory as the root directory
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set Environment Variables in Render Dashboard**
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spotify-clone-v4
   JWT_SECRET=super_secret_key_nebula_123
   SPOTIFY_CLIENT_ID=(optional - leave blank to use YouTube fallback)
   SPOTIFY_CLIENT_SECRET=(optional - leave blank to use YouTube fallback)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. **Get your Render backend URL**
   - After deployment, copy the URL (e.g., `https://your-app.onrender.com`)

---

## Frontend Deployment (Vercel)

1. **Update `client/.env` with your Render backend URL**
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com/api
   ```

2. **Deploy to Vercel**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel`
   - Follow the prompts

   OR

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set Root Directory to `client`
   - Add Environment Variable:
     - Key: `VITE_API_URL`
     - Value: `https://your-render-backend-url.onrender.com/api`

3. **Build Settings (Vercel will auto-detect, but verify)**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist all IPs (0.0.0.0/0) for Render access
4. Get your connection string and add it to Render environment variables

---

## Post-Deployment

1. Test your backend: `https://your-render-backend.onrender.com/`
2. Test your frontend: `https://your-vercel-app.vercel.app/`
3. Create an admin user using the scripts in `server/scripts/`

---

## Troubleshooting

- **CORS errors**: Make sure `client/.env` has the correct Render backend URL
- **Database connection**: Verify MongoDB Atlas connection string and IP whitelist
- **Build failures**: Check logs in Render/Vercel dashboards
- **Environment variables**: Ensure all required vars are set in both platforms
