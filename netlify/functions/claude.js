exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { model, max_tokens, messages, system } = body;

  if (!model || !max_tokens || !Array.isArray(messages)) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "API not configured" }) };
  }

  const payload = { model, max_tokens, messages };
  if (system) payload.system = system;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return {
    statusCode: response.status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
