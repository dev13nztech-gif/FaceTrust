# FaceTrust Multi-page Vercel Demo

## Deploy to Vercel
1. Extract this ZIP and push its contents to a GitHub repository (or import the folder using Vercel CLI).
2. In Vercel: Add New > Project > Import repository.
3. Framework Preset: **Other**. Root Directory: project root.
4. Build Command: **leave empty**; Output Directory: **leave empty** (static HTML).
5. Deploy. URLs: `/`, `/customer/`, `/customer-service/`, `/enrollment/`, `/attendance/`, `/workflow-home/`, `/architecture/`, `/investment/`.

Local preview: `python -m http.server 8000` in project directory, then visit http://localhost:8000. Open via server, not file://, because URLs are site-root relative.

### Notes
- This is a non-production demo; scenarios are simulated and biometric processing is NOT performed.
- Session Storage saves simulated employee rows and service context in the same browser tab/session only. No real enrollment or verification.
- Client-side access checks on the service dashboard are only for demo navigation and provide NO bank security.
- For production, customer authorization must be server-enforced, securely audited, and authenticated.
- No CPU/GPU capacity calculator is included.


## Responsive release
- Desktop (>=1025px): persistent sidebar; widescreen cards.
- Tablet (701–1024px): accessible hamburger drawer and multi-column sections.
- Phone (<=700px): stacked forms/cards, touch-friendly 44px controls, scrollable tables and constrained modals.
- Small phone (<=380px): reduced gutters and single-column stats.
- All eight routes retain their existing modal redirects and simulation behavior.

Test locally: `python -m http.server 3000`, then open `http://localhost:3000`. Try Chrome DevTools device toolbar at widths 320, 375, 768, 1024, 1440.


## V6 camera capture update
- Camera is enabled on `/customer/`, `/attendance/`, and `/enrollment/`.
- Click **Open Camera**, approve browser permission, then **Capture Photo**. Retake and Stop Camera are supported.
- Real camera preview and local frame capture; verification, liveness and enrollment remain **simulated**. Photos are not uploaded or persisted in session storage.
- Camera access requires secure origin (`https://` on Vercel, or `http://localhost` locally); opening `index.html` directly or a LAN HTTP IP may prevent access.
- To run: `python -m http.server 3000` from the website root, open `http://localhost:3000`.

## V7: Camera auto capture

On Customer Authentication, Employee Enrollment and Employee Attendance, the camera requests permission automatically on page load. One face must turn right, left and center; then a still image is automatically captured without a dedicated capture button. Uses MediaPipe Face Mesh loaded from jsDelivr CDN (requires internet and HTTPS/localhost). If camera access is denied the user must enable permission and tap Restart Camera. Head movement tracking is an interactive demo and **is not secure presentation attack detection or real authentication**. Verification scenario decisions remain explicitly simulated. On low-power phones pose thresholds may require tuning; test the turn direction on the actual mirrored preview. No camera image is uploaded.


## Version 8 — Animated Camera Guidance
When the camera begins, a glowing face oval, moving scan line and large animated direction cue appear over the live preview. The cue automatically moves through RIGHT → LEFT → STRAIGHT based on the existing landmark detector, highlighting completed steps. Capture occurs automatically after the third validated pose. The device's camera permission still requires browser approval. Camera detection is only a demo heuristic, not production-grade liveness security. No server-side face recognition is performed. Animation respects prefers-reduced-motion.

## V9 — Corrected Head Direction
The pose classifier's LEFT/RIGHT yaw mapping is flipped to align the on-screen movement guidance with the selfie mirror view. RIGHT now requires the corresponding real-world head turn, not the opposite direction. Applied to Customer Authentication, Employee Enrollment, and Attendance through shared `assets/app.js`. Browser hardware validation remains necessary.
