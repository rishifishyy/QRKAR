const http = require("node:http");

const fs = require("node:fs");

const path = require("node:path");

const root = __dirname;

const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
};

const server = http.createServer((req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
        res.writeHead(400);
        return res.end("Bad request");
    }
    const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end("Forbidden");
    }
    fs.readFile(file, (error, data) => {
        if (error) {
            res.writeHead(404);
            return res.end("Not found");
        }
        res.writeHead(200, {
            "Content-Type": types[path.extname(file)] || "application/octet-stream",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        });
        res.end(data);
    });
});

server.listen(4173, "127.0.0.1", () => console.log("QRकर is running at http://127.0.0.1:4173"));

server.on("error", error => {
    console.error(error.code === "EADDRINUSE" ? "Port 4173 is already in use. Close the other server and retry." : error.message);
    process.exit(1);
});
