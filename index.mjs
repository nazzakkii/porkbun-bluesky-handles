import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const DOMAIN = process.env.DOMAIN;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

// Add CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const apiCreateHandle = async ({ handle, did }) => {
  const response = await fetch(
    `https://api.porkbun.com/api/json/v3/dns/create/${DOMAIN}`,
    {
      method: "POST",
      body: JSON.stringify({
        apikey: API_KEY,
        secretapikey: API_SECRET,
        name: `_atproto.${handle}`,
        type: "TXT",
        content: `did:plc:${did}`,
        ttl: 600,
      }),
    }
  ).catch((error) => {
    console.error(error);
    return {
      status: "ERROR",
      message: "Failed to create handle",
    };
  });
  return response.json();
};

const apiCheckHandleAvailable = async ({ handle, did }) => {
  try {
    const response = await fetch(
      `https://api.porkbun.com/api/json/v3/dns/retrieveByNameType/${DOMAIN}/TXT/_atproto.${handle}`,
      {
        method: "POST",
        body: JSON.stringify({
          apikey: API_KEY,
          secretapikey: API_SECRET,
          name: `_atproto.${handle}`,
          type: "TXT",
        }),
      }
    );

    const data = await response.json();
    console.log("response", data);
    if (data.status === "SUCCESS") {
      const recordExists = data.records?.some(
        (record) =>
          record.name === `_atproto.${handle}.${DOMAIN}` &&
          record.type === "TXT"
      );

      return {
        status: recordExists ? "ERROR" : "SUCCESS",
        message: recordExists
          ? "Handle is not available"
          : "Handle is available",
      };
    } else {
      return {
        status: "ERROR",
        message: "Failed to check DNS records",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      status: "ERROR",
      message: "Failed to check handle availability",
    };
  }
};

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/config", (_, res) => {
  res.json({ domain: DOMAIN });
});

app.post("/check-handle", async (req, res) => {
  const { handle, did } = req.body;
  const response = await apiCheckHandleAvailable({ handle, did });
  res.json(response);
});

app.post("/create-handle", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      status: "ERROR",
      message: "Request body is missing",
    });
  }

  const { handle, did } = req.body;

  if (!handle) {
    return res.status(400).json({
      status: "ERROR",
      message: "Handle is required in request body",
    });
  }

  try {
    const response = await apiCheckHandleAvailable({ handle, did });
    if (response.status === "SUCCESS") {
      const createResponse = await apiCreateHandle({ handle, did });

      if (createResponse.status === "SUCCESS") {
        res.json({
          status: "SUCCESS",
          message: "Handle created successfully",
          data: createResponse,
        });
      } else {
        res.json({
          status: "ERROR",
          message: "Failed to create handle",
        });
      }
    } else {
      res.json({
        status: "ERROR",
        message: "Handle is not available",
      });
    }
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log("API Credentials:", {
    domain: DOMAIN,
    apiKey: API_KEY ? "Present" : "Missing",
    apiSecret: API_SECRET ? "Present" : "Missing",
  });

  console.log(`Server running at port: ${PORT}`);
});
