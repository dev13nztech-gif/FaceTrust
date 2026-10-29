# FaceTrust → Vercel → Cloudflare → Windows FMS → Supabase

## What is ready
- Static website with Supabase login page `/login/`, authenticated API calls, original design retained.
- `FMS_BACKEND_PATCH/public_gateway.py`: allowlists only necessary demo routes and `/healthz` for the tunnel.
- `assets/config.js`: tunnel URL to fill in; no secret embedded.

## Before using
- Existing `app/main.py` must register `demo_local.router` with `Depends(require_authorized_user)`, and `.env` must have the Supabase URL, publishable key, secret key and `FMS_ALLOWED_USER_IDS`.
- Backend `FRONTEND_URL=https://facetrust-six.vercel.app`; configure Supabase Auth allowed redirect URLs for this origin if needed.
- The login does not grant broad administrative rights; the FMS backend checks its allowlist.
- `demo_local.py` currently disables liveness and uses threshold 0.5: test only, never real banking authentication.

## Step A — Backend restricted API
Copy `FMS_BACKEND_PATCH/public_gateway.py` to `D:\Dev\faceMatch-server-improved\public_gateway.py`.
Stop previous Uvicorn (Ctrl+C), then run:
```powershell
cd D:\Dev\faceMatch-server-improved
.\.venv\Scripts\Activate.ps1
python -m uvicorn public_gateway:app --host 127.0.0.1 --port 8001
```
Check localhost:8001/healthz returns 200; /docs and /face/generate-embedding return 404; /demo/db-status without token returns 401.

## Step B — temporary HTTPS tunnel (only for controlled testing)
In another PowerShell:
```powershell
cloudflared tunnel --url http://127.0.0.1:8001
```
Copy the **random HTTPS hostname** from output (e.g. https://random.trycloudflare.com). Do not use the example hostname. This endpoint is publicly reachable while running; the gateway narrows routes, but the service must still be treated as an internet-exposed demo. Stop with Ctrl+C when finished. For stable real operation, use a named Cloudflare Tunnel with your domain and stronger edge security.

## Step C — update frontend config
Open `assets/config.js` and replace `https://REPLACE-WITH-YOUR-TUNNEL.trycloudflare.com` with the actual HTTPS URL (no trailing slash). Do not include `/demo`.

## Step D — Vercel existing project deploy
From the **new frontend folder** (not `FMS_BACKEND_PATCH`, not Windows FMS):
```powershell
npm install -g vercel
vercel login
vercel link
vercel --prod
```
At `vercel link`, choose the **existing** project that owns `facetrust-six.vercel.app`; do not create a new project. Test `https://facetrust-six.vercel.app/login/`.

## Step E — workflow
Login using the approved Supabase Auth user (the UID must be in `FMS_ALLOWED_USER_IDS`). Enroll at `/customer-enrollment/` or `/enrollment/`, verify at `/customer/` or `/attendance/`. Check `public.fms_enrollments` and `public.fms_attendance` in Supabase. Use fake/test-only identities with consent.

## Troubleshooting
- `Failed to fetch`: wrong tunnel URL, tunnel stopped, CORS, DNS or internet.
- `401`: not signed in/session expired.
- `403`: UID not in FMS allowlist.
- `404` through tunnel: only allowed routes exposed; check URL and method.
- `503`: Supabase or model/storage failure.
- Camera needs HTTPS and browser permission (Vercel provides HTTPS).
- The original UI contains static simulation labels and local session tables; they are illustrative, not a server-enforced service security barrier.
- Tunnel URL changes when temporary tunnel restarts; edit config and redeploy, or use a stable named tunnel.
- Never put `SUPABASE_SECRET_KEY` in frontend files.
