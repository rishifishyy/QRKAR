"use strict";

const $ = id => document.getElementById(id);

qrcode.stringToBytes = value => Array.from((new TextEncoder).encode(value));

let activeURL = "", activeSVG = "", activeQR = null;

function normalizeURL(value) {
    const raw = String(value).trim();
    if (!raw) throw new Error("Enter a website address first.");
    if (/\s/.test(raw)) throw new Error("Remove spaces from the website address.");
    if (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error("Use an HTTP or HTTPS website address.");
    const onion = /(^|\.)[^/]*\.onion(?=[:/?#]|$)/i.test(raw.replace(/^https?:\/\//i, ""));
    const complete = /^https?:\/\//i.test(raw) ? raw : `${onion ? "http" : "https"}://${raw}`;
    let parsed;
    try {
        parsed = new URL(complete);
    } catch {
        throw new Error("That address doesn’t look right. Try https://example.com.");
    }
    if (!parsed.hostname || !parsed.hostname.includes(".") && parsed.hostname !== "localhost" || parsed.username || parsed.password) throw new Error("Enter a valid website domain without login credentials.");
    if ((new TextEncoder).encode(complete).length > 2e3) throw new Error("This link is too long. Use a link under 2,000 bytes.");
    return {
        url: complete,
        onion: parsed.hostname.toLowerCase().endsWith(".onion")
    };
}

function generate(value) {
    const {url: url, onion: onion} = normalizeURL(value);
    const qr = qrcode(0, "M");
    qr.addData(url, "Byte");
    try {
        qr.make();
    } catch {
        throw new Error("This link is too long for a QR code. Try a shorter link.");
    }
    const svg = qr.createSvgTag({
        cellSize: 8,
        margin: 32,
        scalable: true
    });
    $("qr-output").innerHTML = svg;
    const rendered = $("qr-output").querySelector("svg");
    rendered.setAttribute("role", "img");
    rendered.setAttribute("aria-label", "QR code for " + url);
    rendered.setAttribute("width", "1536");
    rendered.setAttribute("height", "1536");
    activeSVG = (new XMLSerializer).serializeToString(rendered);
    activeURL = url;
    activeQR = qr;
    $("destination").textContent = url;
    $("badge").textContent = onion ? "ONION LINK" : "WEBSITE LINK";
    $("status").textContent = "Ready to scan. Your QR code is saved locally when downloaded.";
    $("error").textContent = "";
    $("png").disabled = $("svg").disabled = false;
    return {
        url: url,
        onion: onion
    };
}

$("qr-form").addEventListener("submit", event => {
    event.preventDefault();
    try {
        generate($("url").value);
    } catch (error) {
        $("error").textContent = error.message;
        $("url").setAttribute("aria-invalid", "true");
        return;
    }
    $("url").removeAttribute("aria-invalid");
});

$("url").addEventListener("input", () => {
    $("error").textContent = "";
    $("url").removeAttribute("aria-invalid");
    if (activeURL) {
        $("png").disabled = $("svg").disabled = true;
        $("status").textContent = "Link changed. Generate again to update your QR code.";
    }
});

function download(blob, extension) {
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `qrkar.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 5e3);
}

$("svg").addEventListener("click", () => download(new Blob([ activeSVG ], {
    type: "image/svg+xml"
}), "svg"));

$("png").addEventListener("click", () => {
    const count = activeQR.getModuleCount(), cell = Math.max(8, Math.floor(1536 / (count + 8)));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = (count + 8) * cell;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) if (activeQR.isDark(row, col)) ctx.fillRect((col + 4) * cell, (row + 4) * cell, cell, cell);
    canvas.toBlob(blob => {
        if (blob) download(blob, "png"); else $("status").textContent = "Could not export PNG. Try SVG instead.";
    }, "image/png");
});

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    $("theme-label").textContent = theme === "dark" ? "Light mode" : "Dark mode";
    $("theme-icon").textContent = theme === "dark" ? "☀" : "☾";
    $("theme").setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    try {
        localStorage.setItem("qrkar-theme", theme);
    } catch {}
}

let savedTheme;

try {
    savedTheme = localStorage.getItem("qrkar-theme");
} catch {}

setTheme(savedTheme === "light" ? "light" : "dark");

$("theme").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

if (document.modelContext?.registerTool) {
    try {
        Promise.resolve(document.modelContext.registerTool({
            name: "generate_website_qr",
            description: "Generate a QR code for an HTTP, HTTPS, or onion website address and update the visible preview.",
            inputSchema: {
                type: "object",
                properties: {
                    url: {
                        type: "string"
                    }
                },
                required: [ "url" ],
                additionalProperties: false
            },
            annotations: {
                readOnlyHint: false,
                untrustedContentHint: true
            },
            execute(input) {
                if (typeof input?.url !== "string") throw new Error("A URL string is required.");
                const result = generate(input.url);
                $("url").value = input.url;
                return result;
            }
        })).catch(() => {});
    } catch {}
}
