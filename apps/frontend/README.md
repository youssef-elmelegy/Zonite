# Zonite Frontend

Real-time multiplayer block-claiming game frontend. Built with Vite, React 18, and Socket.io.

## Setup

```bash
npm install
npm run dev  # Start development server
npm run build  # Build for production
npm run start  # Start Express server (production)
```

## Environment Variables

See `.env.example` for required environment variables.

```bash
VITE_API_URL=<backend-api-url>
VITE_SOCKET_URL=<backend-socket-url>
```

## Deployment (Heroku)

The app is configured for Heroku deployment:

- `Procfile` defines the start command
- `.slugignore` optimizes slug size
- Node 22 LTS is pinned via `.nvmrc`

### Deploy to Heroku:

```bash
heroku create <app-name>
git push heroku main
```

Set environment variables on Heroku:

```bash
heroku config:set VITE_API_URL=<your-api-url> VITE_SOCKET_URL=<your-socket-url>
```

## Project Structure

- `src/` - React components and pages
- `dist/` - Built production assets
- `server.js` - Express server for serving the built frontend
- `vite.config.ts` - Vite configuration
