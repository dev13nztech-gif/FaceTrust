# FaceTrust + FMS Local Demo Integration

This folder combines the original FaceTrust static website with working calls to your existing FMS FastAPI engine. It needs a small extra FMS router (`FMS_BACKEND_ADDON/demo_local.py`) to save face templates to a **local SQLite database**. No Supabase is needed for this demo. This is NOT a production banking authorization system.

## Setup on Windows PowerShell

1. Copy `FMS_BACKEND_ADDON/demo_local.py` into `D:\Dev\faceMatch-server-improved\app\routes\demo_local.py`.
2. Edit `D:\Dev\faceMatch-server-improved\app\main.py`:
   - Change `from app.routes import face` to `from app.routes import face, demo_local`
   - Immediately after `app.include_router(face.router, prefix="/face", tags=["Face Recognition"])` add `app.include_router(demo_local.router)`.
3. In the existing `.env`, set `FRONTEND_URL=http://127.0.0.1:3000` and `FACE_MODEL_PROVIDERS=CPUExecutionProvider` and `FACE_MODEL_CTX_ID=-1`. Do not share your `.env`.
4. Start the FMS backend from its root: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001`
5. In a **second** terminal, CD into this FaceTrust folder and run `py -3.11 -m http.server 3000 --bind 127.0.0.1`.
6. Open `http://127.0.0.1:3000` (do not double-click index.html). Refresh with Ctrl+F5 if you see cached demo code.
7. Customer Enrollment: enter an ID/name/branch and upload a clear face photo (or capture using camera); acknowledge consent; enroll.
8. Customer Authentication: enter same ID, capture the SAME person's face via camera, then Verify with FMS AI. Try a different person's face for rejection.
9. Employee Enrollment and Attendance work in the same way; successful attendance also writes a record to local SQLite.
10. To inspect enrollments and attendance, SQLite file is `D:\Dev\faceMatch-server-improved\facetrust_local_demo.sqlite3`. `GET http://127.0.0.1:8001/demo/attendance` lists real demo attendance rows.

## Safety and limitations
- Consent and access restrictions are demo-only; do not expose these ports to the internet or use with real banking customers.
- Liveness is explicitly DISABLED in this local test, because stored-photo enrollment and a single-frame capture don't prove presence. Head-turn animation is *not* verified by the backend.
- The front end's scenario buttons, static sample rows and some descriptive labels still describe simulations; those controls have NO effect on the actual FMS result. Remove or redesign them before pilot use.
- Face embeddings are sensitive biometric data. Use consented test volunteers, delete the local SQLite file after testing, and add proper login, authorization, encryption, auditability, quality checks, multi-face rejection, anti-spoofing and server-side session controls before any production use.
- Current `Verified Customer Service` gating is browser-only, not secure authentication. Do not wire it to actual bank transactions.
- `FACE_MODEL_PROVIDERS` controls InsightFace providers; for the current machine CPU mode avoids the missing CUDA runtime DLL.
- If port 3000 is occupied, stop the other process or update both frontend port and FMS `.env` FRONTEND_URL.
