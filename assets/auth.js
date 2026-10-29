
"use strict";

const SUPABASE_URL =
  "https://kyhrpwexigqzsihjulxi.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_S9V7Bkd1_pbd-IhCbgigFw_PUoMJxCr";

const supabaseAuth = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function getFmsToken() {
  const { data, error } = await supabaseAuth.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Please log in before using FMS.");
  }

  return data.session.access_token;
}

async function loginFms(email, password) {
  const { data, error } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

async function logoutFms() {
  await supabaseAuth.auth.signOut();
}
