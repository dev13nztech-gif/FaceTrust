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
