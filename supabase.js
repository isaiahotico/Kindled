import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://rhlrrpvehirrbyatphgq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHJycHZlaGlycmJ5YXRwaGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MjQ0MTYsImV4cCI6MjA4MDUwMDQxNn0.MD0RJK-dzVihMuIhftCsDIh8Swj24gIqb6g4-DPYsw4"
);
