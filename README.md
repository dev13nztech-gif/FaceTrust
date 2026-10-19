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
