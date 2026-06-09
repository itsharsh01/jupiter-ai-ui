# Jupiter AI UI

React + TypeScript frontend for GovernAI. Talks to the [govern-ai-agent](../govern-ai-agent) API.

## Development

```powershell
cd jupiter-ai-ui
npm install
npm run dev
```

Open http://localhost:5173. In dev, Vite proxies `/api` to the local API on port 8800 (start the API from `govern-ai-agent` first).

Optional: set `VITE_API_URL` in `.env` to point at a remote API instead of the proxy. See [`.env.example`](.env.example).

## Deployment (Google App Engine)

**Project:** `jupiter-ai-498513`  
**UI URL:** https://ui-dot-jupiter-ai-498513.uc.r.appspot.com  
**API URL:** https://jupiter-ai-498513.uc.r.appspot.com

The production build reads `VITE_API_URL` from [`.env.production`](.env.production) (already set to the deployed API).

### Deploy UI

```powershell
.\scripts\deploy.ps1
```

Or:

```powershell
npm run deploy
```

Or manually:

```powershell
npm run build
gcloud app deploy app.yaml --project=jupiter-ai-498513
```

`npm run build` must run before deploy — `dist/` is gitignored and uploaded as static files by App Engine service `ui`.

### Verify

Open https://ui-dot-jupiter-ai-498513.uc.r.appspot.com and log in with the demo credentials configured on the API (`GOVERN_AUTH_DEMO_EMAIL` / `GOVERN_AUTH_DEMO_PASSWORD`).
