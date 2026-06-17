// Returns a signed upload URL so the browser can PUT the image directly to Supabase Storage.
// This avoids multipart parsing on the server entirely.
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

  const { fileName, fileType } = req.body || {};
  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName and fileType are required." });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Sanitise the filename before using it as a storage path
  const safe = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const path = `${Date.now()}-${safe}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: "Could not create upload URL: " + error.message });

  // Also return the public URL so the browser knows where the image will live
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);

  return res.status(200).json({
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    token: data.token,
    path
  });
};
