# QRकर

A local QR generator for regular websites and `.onion` links. Dark and light themes, animated backgrounds, PNG and SVG downloads. Your links stay in your browser.

## Run locally

Install [Node.js](https://nodejs.org/) (18 or newer), then:

```sh
git clone https://github.com/rishifishyy/QRKAR.git
cd QRKAR
node server.cjs
```

Open [127.0.0.1:4173](http://127.0.0.1:4173). No npm install needed. Keep the terminal open; press Ctrl+C to stop.

On Windows, you can also double-click `start.cmd`.

## Use

Paste a URL, click **Generate QR code**, then download PNG or SVG. Use the header buttons to change the theme or turn motion off.

Domains without a protocol use HTTPS; `.onion` domains use HTTP. Scanning an onion link requires Tor Browser to open the destination. Generating a code does not check whether a website is online.

QR encoding uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), bundled under the [MIT license](vendor/LICENSE.txt).
