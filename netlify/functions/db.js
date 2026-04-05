const { createClient } = require("@supabase/supabase-js");

const USER_KEY = "nathan_vega";
const EMPTY = { contacts: [], notes: [], tasks: [], events: [] };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "DB not configured" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { action, data } = body;

  if (action === "load") {
    try {
      const { data: row, error } = await supabase
        .from("crm_data")
        .select("data")
        .eq("user_key", USER_KEY)
        .single();
      if (error || !row) return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(EMPTY) };
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(row.data || EMPTY) };
    } catch {
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(EMPTY) };
    }
  }

  if (action === "save") {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid data" }) };
    }
    try {
      await supabase.from("crm_data").upsert({
        user_key: USER_KEY,
        data,
        updated_at: new Date().toISOString()
      });
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Save failed" }) };
    }
  }

  return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Unknown action" }) };
};
