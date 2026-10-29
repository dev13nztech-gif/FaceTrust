# FaceTrust — Login required on all pages

## Included
- Supabase login at `/login/`
- Client-side login check before showing Overview or any of the 10 other site pages
- Successful login redirects to the original requested path, or `/` Overview
- Logout revokes client-side access and redirects to login
- Existing authenticated FMS `/demo` calls and tunnel URL are preserved

## Deploy into your EXISTING Vercel project
1. Extract this ZIP into `D:\Dev\FaceTrust-Vercel-Login` (or another folder).
2. Run `cd D:\Dev\FaceTrust-Vercel-Login`.
3. Run `npm install -g vercel` if CLI is missing, then `vercel login` and `vercel link`. Pick EXISTING `facetrust-six` project.
4. Confirm `.vercel/project.json` identifies the right project before `vercel --prod`.
5. Ensure local `public_gateway:app` and `cloudflared` are still running, since the quick tunnel URL is temporary.
6. Run `vercel --prod`. Test incognito at https://facetrust-six.vercel.app/; should redirect to `/login/`. Log in with the approved Supabase user and expect Overview. Verify enrollment from a consented test subject.

## Critical security limitation
The code performs client-side gating, NOT server-side protection of static HTML/assets. A technically knowledgeable visitor may still fetch HTML files, even though the UI hides them. Do NOT claim this fulfills strict 'cannot view anything without logging in' security.
For true site-level access control on a static Vercel deployment, enable **Settings > Deployment Protection > Vercel Authentication > All Deployments** (available on all Vercel plans as of Sep 2026). This adds a SECOND login with a permitted Vercel account, on top of the Supabase demo login, but blocks source access pre-authentication. See https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan
A single-Supabase-login-only, server-enforced gate would require restructuring this static site with a server-side session cookie and middleware/SSR; not included in this package.

## Operational cautions
- Keep the FastAPI gateway on 127.0.0.1, not 0.0.0.0; backend must validate Supabase bearer tokens.
- Restarting a Cloudflare Quick Tunnel changes its URL; update `assets/config.js` then redeploy.
- Liveness is disabled in this demonstration; don't use real bank/customer biometrics or production workflows.
- Keep API keys containing `sb_secret_` out of frontend files.
