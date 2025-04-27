const { server: wisp, logging } = require("@mercuryworkshop/wisp-js/server");
const http = require("node:http");

const PORT = 8080; 

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("wisp server js rewrite");
});

logging.set_level(logging.DEBUG);
wisp.options.port_whitelist = [
  [5000, 6000],
  80,
  443
];

server.on("upgrade", (req, socket, head) => {
  wisp.routeRequest(req, socket, head);
});

server.on("listening", () => {
  console.log(`HTTP server listening on ${PORT}`);
});

server.listen(PORT, "0.0.0.0");
