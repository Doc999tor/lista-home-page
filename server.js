const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const SUPPORT_CRM_TIMEOUT_MS = Number.parseInt(
  process.env.SUPPORT_CRM_TIMEOUT_MS || process.env.FIREBERRY_TIMEOUT_MS || "20000",
  10
);
const SUPPORT_FORWARD_TIMEOUT_MS = Number.parseInt(
  process.env.SUPPORT_FORWARD_TIMEOUT_MS || process.env.LEADS_TIMEOUT_MS || "10000",
  10
);
const SUPPORT_FORWARD_URL =
  process.env.SUPPORT_FORWARD_URL || process.env.LEADS_URL || "https://atzma.im/home/support-QzXp8v";
const SUPPORT_CURL_TEMPLATE_PATH = path.join(__dirname, "support.curl");
const CONTACT_US_FORWARD_URL =
  process.env.CONTACT_US_FORWARD_URL || "https://atzma.im/home/leads-9rY3cq";
const CONTACT_US_CURL_TEMPLATE_PATH = path.join(__dirname, "contact_us.curl");
const ENABLE_TEMP_CORS = process.env.ENABLE_TEMP_CORS !== "false";
const TEMP_CORS_ORIGIN = process.env.TEMP_CORS_ORIGIN || "*";
const REQUEST_LOGGING_ENABLED = process.env.REQUEST_LOGGING_ENABLED !== "false";
const REQUEST_LOG_EXCLUDE_HEALTHCHECKS = process.env.REQUEST_LOG_EXCLUDE_HEALTHCHECKS !== "false";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

if (REQUEST_LOGGING_ENABLED) {
  app.use((req, res, next) => {
    const startTime = process.hrtime.bigint();
    const requestId = req.header("x-request-id") || crypto.randomUUID();

    res.setHeader("X-Request-Id", requestId);

    res.on("finish", () => {
      if (REQUEST_LOG_EXCLUDE_HEALTHCHECKS && req.path.startsWith("/healthz")) {
        return;
      }

      const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
      console.log("api_request", {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Number(elapsedMs.toFixed(2)),
        ip: req.ip,
        user_agent: req.get("user-agent") || "",
      });
    });

    next();
  });
}

// TEMP CORS BLOCK (remove when no longer needed)
if (ENABLE_TEMP_CORS) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", TEMP_CORS_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  });
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

let parsedSupportCurlTemplatePromise = null;
let parsedContactUsCurlTemplatePromise = null;

function splitHeaderLine(line) {
  const separatorIdx = line.indexOf(":");
  if (separatorIdx < 1) {
    return null;
  }

  const key = line.slice(0, separatorIdx).trim();
  const value = line.slice(separatorIdx + 1).trim();
  return key ? [key, value] : null;
}

async function getParsedSupportCurlTemplate() {
  if (!parsedSupportCurlTemplatePromise) {
    parsedSupportCurlTemplatePromise = fs.readFile(SUPPORT_CURL_TEMPLATE_PATH, "utf8").then((content) => {
      const urlMatch = content.match(/curl\s+'([^']+)'/);
      const bodyMatch = content.match(/--data-raw\s+'([\s\S]*?)'/);
      const headerMatches = [...content.matchAll(/-H\s+'([^']+)'/g)];

      if (!urlMatch || !bodyMatch) {
        throw new Error("Unable to parse support.curl template");
      }

      const headers = {};
      for (const match of headerMatches) {
        const headerPair = splitHeaderLine(match[1]);
        if (!headerPair) {
          continue;
        }

        const [key, value] = headerPair;
        if (key.toLowerCase() === "content-length") {
          continue;
        }
        headers[key] = value;
      }

      return {
        url: urlMatch[1],
        bodyTemplate: bodyMatch[1],
        headers,
      };
    });
  }

  return parsedSupportCurlTemplatePromise;
}

async function getParsedContactUsCurlTemplate() {
  if (!parsedContactUsCurlTemplatePromise) {
    parsedContactUsCurlTemplatePromise = fs.readFile(CONTACT_US_CURL_TEMPLATE_PATH, "utf8").then((content) => {
      const urlMatch = content.match(/curl\s+'([^']+)'/);
      const bodyMatch = content.match(/--data-raw\s+'([\s\S]*?)'/);
      const headerMatches = [...content.matchAll(/-H\s+'([^']+)'/g)];

      if (!urlMatch || !bodyMatch) {
        throw new Error("Unable to parse contact_us.curl template");
      }

      const headers = {};
      for (const match of headerMatches) {
        const headerPair = splitHeaderLine(match[1]);
        if (!headerPair) {
          continue;
        }

        const [key, value] = headerPair;
        if (key.toLowerCase() === "content-length") {
          continue;
        }
        headers[key] = value;
      }

      return {
        url: urlMatch[1],
        bodyTemplate: bodyMatch[1],
        headers,
      };
    });
  }

  return parsedContactUsCurlTemplatePromise;
}

function withTimeoutSignal(timeoutMs) {
  return AbortSignal.timeout(timeoutMs);
}

async function fetchWithDetails(url, options, name) {
  try {
    const response = await fetch(url, options);
    const bodyText = await response.text();
    return { ok: true, response, bodyText };
  } catch (error) {
    console.error("outbound_fetch_error", {
      target: name,
      url,
      message: error?.message,
      cause: error?.cause?.message || null,
      code: error?.cause?.code || null,
    });

    return {
      ok: false,
      error: {
        message: error?.message || "fetch failed",
        cause: error?.cause?.message || null,
        code: error?.cause?.code || null,
      },
    };
  }
}

function normalizeQueryParams(rawQuery) {
  const queryParams = {};

  for (const [key, value] of Object.entries(rawQuery || {})) {
    if (Array.isArray(value)) {
      const normalizedArray = value
        .map((item) => String(item ?? "").trim())
        .filter((item) => item !== "");

      if (normalizedArray.length > 0) {
        queryParams[key] = normalizedArray;
      }
      continue;
    }

    const normalizedValue = String(value ?? "").trim();
    if (normalizedValue !== "") {
      queryParams[key] = normalizedValue;
    }
  }

  return queryParams;
}

function hasGoogleAdsQueryParams(queryParams) {
  if (!queryParams || typeof queryParams !== "object") {
    return false;
  }

  const googleAdsParamKeys = new Set(["gad_campaignid", "wbraid", "gclid", "gbraid", "dclid"]);
  return Object.keys(queryParams).some((key) => googleAdsParamKeys.has(String(key).toLowerCase()));
}

function getCommonRequestFields(body, req) {
  return {
    business_name: String(body?.business_name ?? "").trim(),
    phone: String(body?.phone ?? "").trim(),
    description: String(body?.description ?? "").trim(),
    email: String(body?.email ?? "").trim(),
    query_params: normalizeQueryParams(req?.query),
    referrer_header: req?.get?.("referer") ? req.get("referrer") : undefined,
  };
}

function buildTemplateBody(templateBody, requestData) {
  const consentTemplateValue = requestData.consent ? "1" : "";
  const sourceTemplateValue = String(requestData?.source ?? "");

  return templateBody
    .replace(/\{business_name\}/g, encodeURIComponent(requestData.business_name))
    .replace(/\{phone\}/g, encodeURIComponent(requestData.phone))
    .replace(/\{description\}/g, encodeURIComponent(requestData.description))
    .replace(/\{email\}/g, encodeURIComponent(requestData.email))
    .replace(
      /\{referrer_header\}/g,
      encodeURIComponent(String(requestData?.query_params?.referrer_header ?? ""))
    )
    .replace(/\{source\}/g, encodeURIComponent(sourceTemplateValue))
    .replace(/\{consent\}/g, encodeURIComponent(consentTemplateValue));
}

app.get("/healthz-gn5bre", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/support", async (req, res) => {
  const supportRequest = getCommonRequestFields(req.body, req);
  console.log({ supportRequest });

  if (!supportRequest.phone) {
    return res.status(400).json({
      success: false,
      message: "Phone is required",
    });
  }

  try {
    const supportTemplate = await getParsedSupportCurlTemplate();
    const supportCrmBody = buildTemplateBody(supportTemplate.bodyTemplate, supportRequest);
    console.log(supportCrmBody);

    const [supportCrmResult, supportForwardResult] = await Promise.all([
      fetchWithDetails(supportTemplate.url, {
        method: "POST",
        headers: supportTemplate.headers,
        body: supportCrmBody,
        signal: withTimeoutSignal(SUPPORT_CRM_TIMEOUT_MS),
      }, "support_crm"),
      fetchWithDetails(SUPPORT_FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportRequest),
        signal: withTimeoutSignal(SUPPORT_FORWARD_TIMEOUT_MS),
      }, "support_forward"),
    ]);

    if (!supportCrmResult.ok || !supportForwardResult.ok) {
      return res.status(500).json({
        success: false,
        message: "Unexpected error while forwarding submission",
        support_crm_error: supportCrmResult.ok ? null : supportCrmResult.error,
        support_forward_error: supportForwardResult.ok ? null : supportForwardResult.error,
      });
    }

    const supportCrmResponse = supportCrmResult.response;
    const supportForwardResponse = supportForwardResult.response;
    const supportCrmText = supportCrmResult.bodyText;
    const supportForwardText = supportForwardResult.bodyText;

    if (!supportCrmResponse.ok || !supportForwardResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to forward submission",
        support_crm: {
          status: supportCrmResponse.status,
          body: supportCrmText,
        },
        support_forward: {
          status: supportForwardResponse.status,
          body: supportForwardText,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "נשלח בהצלחה",
      },
      support_crm: {
        status: supportCrmResponse.status,
      },
      support_forward: {
        status: supportForwardResponse.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error while forwarding submission",
      error: error.message,
    });
  }
});

app.post("/contact_us", async (req, res) => {
  const rawConsent = req.body?.consent;
  const normalizedConsent = String(rawConsent ?? "")
    .trim()
    .toLowerCase();
  const consent =
    rawConsent === true ||
    rawConsent === 1 ||
    normalizedConsent === "1" ||
    normalizedConsent === "true" ||
    normalizedConsent === "on" ||
    normalizedConsent === "yes";

  const contactUsRequest = getCommonRequestFields(req.body, req);
  contactUsRequest.consent = consent;
  contactUsRequest.source = hasGoogleAdsQueryParams(contactUsRequest.query_params) ? "18" : "11";
  console.log({ contactUsRequest });

  if (!contactUsRequest.phone) {
    return res.status(400).json({
      success: false,
      message: "Phone is required",
    });
  }

  try {
    const contactUsTemplate = await getParsedContactUsCurlTemplate();
    const contactUsCrmBody = buildTemplateBody(contactUsTemplate.bodyTemplate, contactUsRequest);
    console.log(contactUsCrmBody);

    const [contactUsCrmResult, contactUsForwardResult] = await Promise.all([
      fetchWithDetails(contactUsTemplate.url, {
        method: "POST",
        headers: contactUsTemplate.headers,
        body: contactUsCrmBody,
        signal: withTimeoutSignal(SUPPORT_CRM_TIMEOUT_MS),
      }, "contact_us_crm"),
      fetchWithDetails(CONTACT_US_FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactUsRequest),
        signal: withTimeoutSignal(SUPPORT_FORWARD_TIMEOUT_MS),
      }, "contact_us_forward"),
    ]);

    if (!contactUsCrmResult.ok || !contactUsForwardResult.ok) {
      return res.status(500).json({
        success: false,
        message: "Unexpected error while forwarding submission",
        contact_us_crm_error: contactUsCrmResult.ok ? null : contactUsCrmResult.error,
        contact_us_forward_error: contactUsForwardResult.ok ? null : contactUsForwardResult.error,
      });
    }

    const contactUsCrmResponse = contactUsCrmResult.response;
    const contactUsForwardResponse = contactUsForwardResult.response;
    const contactUsCrmText = contactUsCrmResult.bodyText;
    const contactUsForwardText = contactUsForwardResult.bodyText;

    if (!contactUsCrmResponse.ok || !contactUsForwardResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to forward submission",
        contact_us_crm: {
          status: contactUsCrmResponse.status,
          body: contactUsCrmText,
        },
        contact_us_forward: {
          status: contactUsForwardResponse.status,
          body: contactUsForwardText,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "נשלח בהצלחה",
      },
      contact_us_crm: {
        status: contactUsCrmResponse.status,
        body: contactUsCrmText,
      },
      contact_us_forward: {
        status: contactUsForwardResponse.status,
        body: contactUsForwardText,
      },
    });
  } catch (error) {
    console.error("contact_us_unhandled_error", {
      message: error?.message,
      cause: error?.cause?.message || null,
    });
    return res.status(500).json({
      success: false,
      message: "Unexpected error while forwarding submission",
      error: error?.message || "unknown_error",
      cause: error?.cause?.message || null,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Support endpoint listening on :${PORT}`);
});
