const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]{7,18}$/;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanInterests(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    secretKey
  };
}

function getSupabaseHeaders(secretKey) {
  const headers = {
    apikey: secretKey,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  };

  // New Supabase sb_publishable_/sb_secret_ keys are not JWTs, so they must not
  // be sent as "Authorization: Bearer ...". Legacy anon/service_role keys are
  // JWTs and still use the Authorization header.
  if (!secretKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${secretKey}`;
  }

  return headers;
}

module.exports = async function waitlistHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Method not allowed." });
  }

  let body;

  try {
    body = await parseJsonBody(request);
  } catch {
    return sendJson(response, 400, {
      message: "Please send a valid waitlist form."
    });
  }

  const fullName = cleanString(body.fullName || body.name);
  const email = cleanString(body.email).toLowerCase();
  const phone = cleanString(body.phone);
  const university = cleanString(body.university);
  const yearSemester = cleanString(body.yearSemester || body.year);
  const interestAreas = cleanInterests(body.interestAreas || body.interests);

  if (fullName.length < 2) {
    return sendJson(response, 400, { message: "Please enter your full name." });
  }

  if (!emailPattern.test(email)) {
    return sendJson(response, 400, {
      message: "Please enter a valid email address."
    });
  }

  if (!phonePattern.test(phone)) {
    return sendJson(response, 400, {
      message: "Please enter a valid phone number."
    });
  }

  const supabase = getSupabaseConfig();

  if (!supabase) {
    return sendJson(response, 503, {
      message: "The waitlist database is not configured yet."
    });
  }

  const supabaseResponse = await fetch(
    `${supabase.url}/rest/v1/waitlist_subscribers`,
    {
      method: "POST",
      headers: getSupabaseHeaders(supabase.secretKey),
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        university: university || null,
        year_semester: yearSemester || null,
        interest_areas: interestAreas,
        source: "agendier-launch-site"
      })
    }
  );

  if (supabaseResponse.ok) {
    return sendJson(response, 201, {
      message: "You are on the waitlist."
    });
  }

  let supabaseError = {};

  try {
    supabaseError = await supabaseResponse.json();
  } catch {
    supabaseError = { message: supabaseResponse.statusText };
  }

  if (supabaseResponse.status === 409 || supabaseError.code === "23505") {
    return sendJson(response, 200, {
      message: "You are already on the waitlist."
    });
  }

  console.error("Waitlist insert failed", {
    status: supabaseResponse.status,
    code: supabaseError.code,
    message: supabaseError.message
  });

  return sendJson(response, 500, {
    message: "We could not save your waitlist request. Please try again."
  });
};
