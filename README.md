# FaceTrust V10 — Customer / Employee Services

Static Vercel-ready multipage website.

Customer services: `/customer-home/` -> `/customer-enrollment/` or `/customer/`; successful authentication -> `/customer-service/`.

Employee services: `/workflow-home/` -> `/enrollment/` or `/attendance/`; success popups return to employee services.

Camera auto-start requires permission and HTTPS/localhost. Head motion flow remains animated and auto-captures. Webcam pose guide depends on external browser libraries. Real biometric enrollment, liveness verification and matching are NOT implemented; accept/reject is a scenario simulation. SessionStorage holds illustrative profiles only.

Run: `python -m http.server 3000` from project root. Deploy to Vercel with preset Other, root `./`, no build.


## V11 changes
- Separate **CUSTOMER SERVICES** and **EMPLOYEE SERVICES** navigation groups on every page.
- Fixed active link for `/customer-enrollment/` (no longer Employee Enrollment).
- Customer Enrollment accepts JPG/PNG/WebP (max 5 MB, min 160×160) and shows preview, with camera as an alternative.
- Image stays client-side; no actual biometric template is created, and no image is transmitted to an API.

## V12: Sidebar scrolling
Sidebar scrolls independently on desktop using a sticky full-height container, and within the off-canvas drawer on tablets/phones. All links and sections are accessible; footer no longer overlays menu items.

## V13 — Sidebar and verified-only service
- The sidebar has independent vertical scrolling on desktop, tablet and mobile (from V12).
- Verified Customer Service menu is hidden by default on all pages, and becomes visible only after successful simulated customer authentication.
- Failed/rejected authentication hides it again.
- Attempting to open `/customer-service/` without the demo session authorization redirects to `/customer/`.
- Access state is stored in browser sessionStorage for demo only; it must never be used to secure real banking services.


## V14: re-verification after leaving Verified Customer Service
- Once you leave `/customer-service/` (sidebar, dashboard, browser Back, refresh or navigation), demo customer verification authorization is revoked.
- Browser Back/Forward cached service pages redirect to `/customer/` unless there is a fresh accepted verification.
- A successful customer verification is necessary for each new visit to the service page.
- This is a front-end demonstration only, not secure banking authentication or authorization.


## V15 Attendance Report
- New `/attendance-report/` responsive route under Employee Services and Employee Dashboard.
- Date range, employee ID and action filters, event summaries and CSV export.
- Successful attendance simulations write date/time to sessionStorage. Previous events without date remain visible but are labeled appropriately.
- Two illustrative sample rows clearly labeled as sample, not real attendance.
- No backend; CSV export and records are demo-only.
