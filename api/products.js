// Public endpoint — returns all products from Supabase
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const featuredOnly = req.query && req.query.featured === "true";

  let query = supabase.from("products").select("*");
  if (featuredOnly) query = query.eq("featured", true);
  query = query.order("sort_order", { ascending: true, nullsFirst: false })
               .order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message, code: error.code, details: error.details });
  }

  return res.status(200).json(data);
};
