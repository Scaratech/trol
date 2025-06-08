import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateBlockedKeyword, generateBlockedUrl } from "./utils.js";
import { config } from "./config.js";

dotenv.config();

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const LOG_PATH = path.join(__dirname, "..", "access.log");

let TOKENS = new Set((process.env.TOKENS || "").split(",").map(t => t.trim()));
const MASTER_TOKEN = process.env.MASTER_TOKEN;

const getIP = (req: express.Request): string => {
    return req.headers["cf-connecting-ip"] as string ||
        req.headers["x-forwarded-for"] as string ||
        req.socket.remoteAddress || "0.0.0.0";
};

const timestamp = () => {
    const date = new Date();
    return `[${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear().toString().slice(2)} : ${date.getHours()}-${date.getMinutes()}_${date.getSeconds()}]`;
};

const writeLog = (line: string) => {
    fs.appendFileSync(LOG_PATH, `${timestamp()} ${line}\n`);
};

const logRequest = (req: express.Request, status: number) => {
    if (!req.path.startsWith("/api/")) return;

    const ip = getIP(req);
    const ua = req.headers["user-agent"] || "UNKNOWN_UA";
    const logLine = `@ ${ip} @ ${ua} | ${req.path} (${status})`;

    writeLog(logLine);
};

app.use("/", express.static(path.join(__dirname, "..", "public")));

app.get("/config", (_req, res) => {
  res.send(config);
});

app.get("/ip", (req, res) => {
    res.send({ ip: getIP(req) });
});

const checkToken = (req: express.Request): boolean =>
    TOKENS.has(req.headers.authorization || "");

const checkMaster = (req: express.Request): boolean =>
    req.headers.authorization === MASTER_TOKEN;

//@ts-ignore
app.post("/api/site", async (req, res) => {
    let status = 500;

    try {
        if (!checkToken(req)) {
            writeLog(`Unauthorized token attempt: ${req.headers.authorization}`);
            status = 401;
            return res.sendStatus(status);
        }

        const { email, url, ip } = req.body;
        writeLog(`/api/site payload: email=${email}, url=${url}, ip=${ip}`);

        const blockUrl = generateBlockedUrl(email, url, ip);
        writeLog(`Block URL: ${blockUrl}`);

        fetch(blockUrl).catch(err => {
            writeLog(`fetch() failed: ${err}`);
        });

        status = 200;
        res.sendStatus(status);
    } catch (err) {
        writeLog(`Error in /api/site: ${err}`);
        res.sendStatus(500);
    }

    logRequest(req, status);
});

//@ts-ignore
app.post("/api/safesearch", async (req, res) => {
    let status = 500;

    try {
        if (!checkToken(req)) {
            writeLog(`Unauthorized token attempt: ${req.headers.authorization}`);
            status = 401;
            return res.sendStatus(status);
        }

        const { email, keyword, ip } = req.body;
        writeLog(`/api/safesearch payload: email=${email}, keyword=${keyword}, ip=${ip}`);

        const blockUrl = generateBlockedKeyword(email, keyword, ip);
        writeLog(`Block URL: ${blockUrl}`);

        fetch(blockUrl).catch(err => {
            writeLog(`fetch() failed: ${err}`);
        });

        status = 200;
        res.sendStatus(status);
    } catch (err) {
        writeLog(`Error in /api/safesearch: ${err}`);
        res.sendStatus(500);
    }

    logRequest(req, status);
});

//@ts-ignore
app.post("/api/genToken", (req, res) => {
    if (!checkMaster(req)) return res.sendStatus(401);

    try {
        const newToken = crypto.randomUUID();
        TOKENS.add(newToken);

        const updatedTokens = Array.from(TOKENS).join(",");
        const envPath = path.join(__dirname, "..", ".env");

        const env = fs.readFileSync(envPath, "utf-8").split("\n").map(line =>
            line.startsWith("TOKENS=") ? `TOKENS=${updatedTokens}` : line
        ).join("\n");

        fs.writeFileSync(envPath, env);
        res.status(200).json({ token: newToken });
        logRequest(req, 200);
    } catch (err) {
        writeLog(`Error generating token: ${err}`);
        res.sendStatus(500);
        logRequest(req, 500);
    }
});

//@ts-ignore
app.post("/api/delToken", (req, res) => {
    if (!checkMaster(req)) return res.sendStatus(401);

    try {
        const { token } = req.body;
        TOKENS.delete(token);

        const updatedTokens = Array.from(TOKENS).join(",");
        const envPath = path.join(__dirname, "..", ".env");

        const env = fs.readFileSync(envPath, "utf-8").split("\n").map(line =>
            line.startsWith("TOKENS=") ? `TOKENS=${updatedTokens}` : line
        ).join("\n");

        fs.writeFileSync(envPath, env);
        res.sendStatus(200);
        logRequest(req, 200);
    } catch (err) {
        writeLog(`Error deleting token: ${err}`);
        res.sendStatus(500);
        logRequest(req, 500);
    }
});

//@ts-ignore
app.get("/api/logs", (req, res) => {
    if (!checkMaster(req)) return res.sendStatus(401);

    try {
        res.status(200).sendFile(LOG_PATH);
        logRequest(req, 200);
    } catch (err) {
        writeLog(`Error serving logs: ${err}`);
        res.sendStatus(500);
        logRequest(req, 500);
    }
});

app.listen(PORT, () => {
    writeLog(`Server running on port ${PORT}`);
});
