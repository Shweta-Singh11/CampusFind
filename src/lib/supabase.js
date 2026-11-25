import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
supabase.auth.getSession().then(({ data, error }) => {
  console.log("Supabase connection:", error ? error : "Connected");
});

supabase
  .from("public_found_items")
  .select("item_id, item_name, category")
  .limit(5)
  .then(({ data, error }) => {
    if (error) {
      console.error("PUBLIC VIEW TEST FAILED:", error.message);
    } else {
      console.log("PUBLIC VIEW TEST SUCCESS:", data);
    }
  });
