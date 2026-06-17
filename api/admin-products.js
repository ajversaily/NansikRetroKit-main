// Protected endpoint — admin can save, update, or delete products
// Password check: req.headers["x-admin-password"] must equal ADMIN_PASSWORD env var
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Password gate
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || req.headers["x-admin-password"] !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  // DELETE a product
  if (req.method === "DELETE") {
    const { id } = body;
    if (!id) return res.status(400).json({ error: "Missing product id." });

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Could not delete product." });
    return res.status(200).json({ success: true });
  }

  // POST = create or update (upsert)
  if (req.method === "POST") {
    const { id, name, price, description, image, images } = body;

    if (!id || !name || !price) {
      return res.status(400).json({ error: "id, name, and price are required." });
    }

    const record = {
      id,
      name,
      price: parseFloat(price),
      description: description || "",
      image: image || "",
      images: Array.isArray(images) ? images : (image ? [image] : [])
    };

    const { data, error } = await supabase
      .from("products")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Could not save product." });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed." });
};
