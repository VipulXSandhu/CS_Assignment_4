
const express = require("express");
const { execFile } = require("child_process");
const net = require("net");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/vulnerable", (req, res) => {
    const ip = req.body.ip;

    const command = "ping -c 1 " + ip;

    const { exec } = require("child_process");

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        res.json({
            output: stdout || stderr || error?.message || "No output"
        });
    });
});

app.post("/secure", (req, res) => {
    const ip = req.body.ip;

    if (typeof ip !== "string" || net.isIP(ip) !== 4) {
        return res.status(400).json({
            output: "Blocked: Invalid IP address."
        });
    }

    execFile("ping", ["-c", "1", ip], { timeout: 5000 }, (error, stdout, stderr) => {
        res.json({
            output: stdout || stderr || error?.message || "No output"
        });
    });
});

app.listen(3000, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:3000");
});
