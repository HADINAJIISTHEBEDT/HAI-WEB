"use strict";

var http = require("http");
var { spawn, exec } = require("child_process");
var path = require("path");

var CONTROL_PORT = 5501;
var WEB_PORT = 5500;
var root = __dirname;
var webProc = null;

function sendJson(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function killPort(port, done) {
  var cmd =
    'for /f "tokens=5" %a in (\'netstat -ano ^| findstr ":' +
    port +
    '" ^| findstr "LISTENING"\') do @taskkill /PID %a /F';
  exec(cmd, { cwd: root, windowsHide: true }, function () {
    if (typeof done === "function") done();
  });
}

function stopWeb(done) {
  if (webProc && !webProc.killed) {
    try {
      webProc.kill();
    } catch (error) {}
    webProc = null;
  }
  killPort(WEB_PORT, done);
}

function startWeb(done) {
  stopWeb(function () {
    setTimeout(function () {
      webProc = spawn("npx", ["--yes", "serve", "-l", String(WEB_PORT), "."], {
        cwd: root,
        shell: true,
        windowsHide: true,
        stdio: "ignore"
      });
      webProc.on("exit", function () {
        webProc = null;
      });
      if (typeof done === "function") done();
    }, 400);
  });
}

var server = http.createServer(function (req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  var url = (req.url || "").split("?")[0];

  if (url === "/status") {
    sendJson(res, 200, { ok: true, control: true, webPort: WEB_PORT });
    return;
  }

  if (url === "/run" && (req.method === "POST" || req.method === "GET")) {
    startWeb(function () {
      sendJson(res, 200, {
        ok: true,
        action: "run",
        message: "Website starting on http://localhost:" + WEB_PORT
      });
    });
    return;
  }

  if (url === "/stop" && (req.method === "POST" || req.method === "GET")) {
    stopWeb(function () {
      sendJson(res, 200, { ok: true, action: "stop", message: "Website stopped." });
    });
    return;
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

server.listen(CONTROL_PORT, "127.0.0.1", function () {
  console.log("HAI control ready on http://127.0.0.1:" + CONTROL_PORT);
  console.log("Endpoints: /run  /stop  /status");
  startWeb(function () {
    console.log("Website: http://localhost:" + WEB_PORT);
  });
});
