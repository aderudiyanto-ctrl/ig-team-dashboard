export default async function handler(req, res) {
    const KEY = process.env.WINDSOR_API_KEY;
    if (!KEY) {
          res.status(500).json({ error: "WINDSOR_API_KEY environment variable is not set in Vercel." });
          return;
    }
    const ALLOWED = new Set(["instagram"]);
    const connector = (req.query.connector || "instagram").toString();
    if (!ALLOWED.has(connector)) {
          res.status(400).json({ error: "Connector not allowed." });
          return;
    }
    const fields = (req.query.fields || "").toString();
    if (!fields) {
          res.status(400).json({ error: "Missing required fields parameter." });
          return;
    }
    const params = new URLSearchParams();
    params.set("api_key", KEY);
    params.set("fields", fields);
    params.set("_renderer", "json");
    for (const k of ["date_preset", "date_from", "date_to"]) {
          if (req.query[k]) params.set(k, req.query[k].toString());
    }
    const base = "https://connectors.windsor.ai/" + encodeURIComponent(connector);
    const url = base + "?" + params.toString();
    try {
          const upstream = await fetch(url);
          const textBody = await upstream.text();
          let json;
          try { json = JSON.parse(textBody); }
          catch (e) {
                  res.status(502).json({ error: "Windsor.ai returned a non-JSON response (check your API key)." });
                  return;
          }
          const data = json.data || json.result || json;
          res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
          res.status(200).json({ result: Array.isArray(data) ? data : [] });
    } catch (e) {
          res.status(502).json({ error: "Failed to reach Windsor.ai: " + String(e) });
    }
}
