# Vercel Deployment Settings

## ⚠️ IMPORTANT: Manual Configuration Required

Do NOT use `vercel.json` - configure these settings in the Vercel Dashboard:

### Project Settings:
1. **Root Directory**: `client`
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Environment Variables:
Add in Vercel Dashboard → Settings → Environment Variables:
- **Key**: `VITE_API_URL`
- **Value**: `https://your-render-backend.onrender.com/api`
- **Environment**: Production, Preview, Development (select all)

### Steps:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click "Configure Project"
4. Set **Root Directory** to `client` (IMPORTANT!)
5. Framework will auto-detect as Vite
6. Add the environment variable above
7. Click Deploy

That's it! Vercel will handle the rest.
