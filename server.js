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

function getSupportRequestFields(body) {
  const nestedFormFields = body?.form_fields || {};

  return {
    business_name: String(
      body?.business_name ??
        body?.fullname ??
        nestedFormFields.fullname ??
        nestedFormFields.business_name ??
        ""
    ).trim(),
    phone: String(
      body?.phone ?? body?.phone_num ?? nestedFormFields.phone_num ?? nestedFormFields.phone ?? ""
    ).trim(),
    description: String(
      body?.description ??
        body?.issue_description ??
        nestedFormFields.issue_description ??
        nestedFormFields.description ??
        ""
    ).trim(),
    email: String(body?.email ?? nestedFormFields.email ?? "").trim(),
  };
}

function buildTemplateBody(templateBody, requestData) {
  return templateBody
    .replace(/\{business_name\}/g, encodeURIComponent(requestData.business_name))
    .replace(/\{phone\}/g, encodeURIComponent(requestData.phone))
    .replace(/\{description\}/g, encodeURIComponent(requestData.description))
    .replace(/\{email\}/g, encodeURIComponent(requestData.email));
}

app.get("/healthz-gn5bre", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/support", async (req, res) => {
  const supportRequest = getSupportRequestFields(req.body);
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

    const [supportCrmResponse, supportForwardResponse] = await Promise.all([
      fetch(supportTemplate.url, {
        method: "POST",
        headers: supportTemplate.headers,
        body: supportCrmBody,
        signal: withTimeoutSignal(SUPPORT_CRM_TIMEOUT_MS),
      }),
      fetch(SUPPORT_FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportRequest),
        signal: withTimeoutSignal(SUPPORT_FORWARD_TIMEOUT_MS),
      }),
    ]);

    const supportCrmText = await supportCrmResponse.text();
    const supportForwardText = await supportForwardResponse.text();
    console.log(supportCrmResponse);
    console.log(supportForwardResponse);
    console.log({ supportCrmText, supportForwardText });

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
  const contactUsRequest = getSupportRequestFields(req.body);
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

    const [contactUsCrmResponse, contactUsForwardResponse] = await Promise.all([
      fetch(contactUsTemplate.url, {
        method: "POST",
        headers: contactUsTemplate.headers,
        body: contactUsCrmBody,
        signal: withTimeoutSignal(SUPPORT_CRM_TIMEOUT_MS),
      }),
      fetch(CONTACT_US_FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactUsRequest),
        signal: withTimeoutSignal(SUPPORT_FORWARD_TIMEOUT_MS),
      }),
    ]);

    const contactUsCrmText = await contactUsCrmResponse.text();
    const contactUsForwardText = await contactUsForwardResponse.text();
    console.log(contactUsCrmResponse);
    console.log(contactUsForwardResponse);
    console.log({ contactUsCrmText, contactUsForwardText });

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
      },
      contact_us_forward: {
        status: contactUsForwardResponse.status,
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

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Support endpoint listening on :${PORT}`);
});
