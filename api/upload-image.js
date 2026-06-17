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

  // Vercel doesn't always pre-parse the body — read and parse it manually
  let parsedBody = req.body || {};
  if (!parsedBody.fileName) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      parsedBody = JSON.parse(Buffer.concat(chunks).toString());
    } catch (_) {}
  }
  const { fileName, fileType } = parsedBody;
  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName and fileType are required." });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Use a clean timestamp + extension only — avoids any Supabase path validation issues
  const ext = (fileName.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const path = `product-${Date.now()}.${ext}`;

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
