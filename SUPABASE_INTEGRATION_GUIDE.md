# FaceTrust + FMS + Supabase (localhost-only)

1. In https://supabase.com/dashboard select project `kyhrpwexigqzsihjulxi`, SQL Editor, execute `SUPABASE_SCHEMA.sql`.
2. In Supabase > Settings > API Keys obtain a **secret key** (`sb_secret_...`). Do not paste it into a chat, frontend, browser or repository. Publishable key is not a replacement for server secret.
3. In `D:\Dev\faceMatch-server-improved\.env` append or update:
   ```
   SUPABASE_URL=https://kyhrpwexigqzsihjulxi.supabase.co
   SUPABASE_SECRET_KEY=<your-private-secret-key>
   FRONTEND_URL=http://127.0.0.1:3000
   FACE_MODEL_PROVIDERS=CPUExecutionProvider
   FACE_MODEL_CTX_ID=-1
   ```
4. Backup `app/main.py`; copy `FMS_BACKEND_ADDON/demo_local.py` to `D:\Dev\faceMatch-server-improved\app\routes\demo_local.py`.
5. In `app/main.py`, change `from app.routes import face` to `from app.routes import face, demo_local`; after the existing `app.include_router(face.router, ...)`, add `app.include_router(demo_local.router)`.
6. PowerShell #1:
   ```powershell
   cd D:\Dev\faceMatch-server-improved
   .\.venv\Scripts\Activate.ps1
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
   ```
7. Open `http://127.0.0.1:8001/demo/db-status`; expected `connected: true`. If false, check schema, environment, secret key and backend logs.
8. Extract web files to `D:\Dev\FaceTrust`, then PowerShell #2:
   ```powershell
   cd D:\Dev\FaceTrust
   py -3.11 -m http.server 3000 --bind 127.0.0.1
   ```
9. Open `http://127.0.0.1:3000` > Customer Enrollment > enroll ID `CUST001` + photo; inspect `fms_enrollments` via Supabase Table Editor. Then Customer Authentication > use same ID + newly captured face. Verify calls FMS and loads the reference from Supabase. Employee flow also writes to `fms_attendance` on successful verification.

CAUTION: This is a localhost-only experimental demo, NOT a secure biometric authorization system. The routes have no authorization and demo verification has liveness disabled. Do not bind to 0.0.0.0 or deploy publicly. No raw face photo is stored in the database; embeddings are sensitive biometric data. Test only with consenting subjects, apply retention and deletion controls before broader testing.
