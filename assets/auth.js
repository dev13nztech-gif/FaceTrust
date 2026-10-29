"use strict";
const SUPABASE_URL = "https://kyhrpwexigqzsihjulxi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S9V7Bkd1_pbd-IhCbgigFw_PUoMJxCr";
const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.supabaseAuth = supabaseAuth;
async function getFmsToken(){
  const {data,error}=await supabaseAuth.auth.getSession();
  if(error)throw new Error(error.message);
  if(!data.session){
    const next=encodeURIComponent(location.pathname);
    location.assign('/login/?next='+next);
    throw new Error('Login required. Redirecting to login.');
  }
  return data.session.access_token;
}
async function loginFms(email,password){
  const {data,error}=await supabaseAuth.auth.signInWithPassword({email,password});
  if(error)throw new Error(error.message);
  return data.user;
}
async function logoutFms(){
  const {error}=await supabaseAuth.auth.signOut();
  if(error)throw new Error(error.message);
  sessionStorage.removeItem('facetrustDemo');
  location.replace('/login/');
}
// Convenience for demo users; backend always enforces actual authorization.
window.addEventListener('DOMContentLoaded',async()=>{
  const parent=document.querySelector('.sidefoot');
  if(!parent)return;
  const {data}=await supabaseAuth.auth.getSession();
  const a=document.createElement('a');
  a.style.cssText='display:block;margin-top:12px;color:inherit;text-decoration:underline';
  if(data.session){a.textContent='Sign out';a.href='#';a.addEventListener('click',e=>{e.preventDefault();logoutFms()});}
  else{a.textContent='Sign in to use FMS';a.href='/login/';}
  parent.appendChild(a);
});
