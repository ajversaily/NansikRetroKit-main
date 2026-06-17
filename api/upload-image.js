// Receives the image as base64 JSON, decodes it, and uploads directly to Supabase Storage.
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "x-admin-password, content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || req.headers["x-admin-password"] !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  // Read and parse body manually (Vercel doesn't always pre-parse)
  let body = req.body || {};
  if (!body.base64) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch (_) {}
  }

  const { base64, fileType, fileName } = body;
  if (!base64 || !fileType) {
    return res.status(400).json({ error: "base64 and fileType are required." });
  }

  // Strip the data URL prefix if present (e.g. "data:image/jpeg;base64,...")
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const fileBuffer = Buffer.from(raw, "base64");

  const ext = (fileType.split("/")[1] || "jpg").replace(/[^a-z0-9]/g, "").toLowerCase() || "jpg";
  const path = `product-${Date.now()}.${ext}`;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, fileBuffer, { contentType: fileType, upsert: false });

  if (error) return res.status(500).json({ error: "Upload failed: " + error.message });

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl });
};
