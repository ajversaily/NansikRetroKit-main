// Protected endpoint — uploads an image to Supabase Storage, returns the public URL
const { createClient } = require("@supabase/supabase-js");

// Vercel parses multipart/form-data automatically when bodyParser is off
export const config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "x-admin-password");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || req.headers["x-admin-password"] !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    // Read raw body chunks
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    // Parse the multipart boundary from Content-Type header
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) return res.status(400).json({ error: "Missing multipart boundary." });
    const boundary = "--" + boundaryMatch[1];

    // Split body into parts by boundary
    const parts = rawBody.toString("binary").split(boundary);
    let fileBuffer = null;
    let fileName = "upload.jpg";
    let mimeType = "image/jpeg";

    for (const part of parts) {
      if (!part.includes('filename=')) continue;
      const nameMatch = part.match(/filename="([^"]+)"/);
      const typeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
      if (nameMatch) fileName = nameMatch[1];
      if (typeMatch) mimeType = typeMatch[1].trim();

      // File data starts after the double CRLF following headers
      const headerEnd = part.indexOf("\r\n\r\n");
      if (headerEnd === -1) continue;
      const fileData = part.slice(headerEnd + 4, part.lastIndexOf("\r\n"));
      fileBuffer = Buffer.from(fileData, "binary");
      break;
    }

    if (!fileBuffer) return res.status(400).json({ error: "No file found in request." });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Upload to the "product-images" bucket
    const path = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, fileBuffer, { contentType: mimeType, upsert: false });

    if (uploadError) return res.status(500).json({ error: "Upload failed: " + uploadError.message });

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);

    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: "Server error during upload." });
  }
};
