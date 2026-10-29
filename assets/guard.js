"use strict";
// Client-side UX gate. This is NOT a replacement for server-side access control.
(async function protectPage(){
  const login = '/login/';
  const next = location.pathname + location.search;
  const redirect = () => location.replace(login+'?next='+encodeURIComponent(next));
  try {
    if (!window.supabaseAuth) return redirect();
    const {data,error} = await window.supabaseAuth.auth.getUser();
    if (error || !data?.user) return redirect();
    const {data: sessionData, error: sessionError} = await window.supabaseAuth.auth.getSession();
    if (sessionError || !sessionData?.session) return redirect();
    // Remain invisible until both the identity and session exist.
    document.documentElement.classList.add('ft-authorized');
    window.supabaseAuth.auth.onAuthStateChange((event) => {
      if(event === 'SIGNED_OUT') { document.documentElement.classList.remove('ft-authorized'); redirect(); }
    });
  } catch(e) { redirect(); }
})();
