const http = require("node:http");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { server: createWisp, logging } = require("@mercuryworkshop/wisp-js/server");

logging.set_level(logging.INFO);

const wispNormal = createWisp();
wispNormal.options.port_whitelist = [80, 443];

const torAgent = new SocksProxyAgent("socks5h://127.0.0.1:9050");

const wispTor = createWisp();
wispTor.options.proxy = {
  http: torAgent,
  https: torAgent,
  ws: torAgent,
  wss: torAgent
};
wispTor.options.dns = "proxy";
wispTor.options.port_whitelist = [80, 443];
wispTor.options.fail_closed = true;

const normalServer = http.createServer();
const torServer = http.createServer();

normalServer.on("upgrade", (req, socket, head) => {
  wispNormal.routeRequest(req, socket, head);
});

torServer.on("upgrade", (req, socket, head) => {
  wispTor.routeRequest(req, socket, head);
});

normalServer.listen(8080, "0.0.0.0", () => {
  console.log("WISP normal → :8080");
});

torServer.listen(8081, "0.0.0.0", () => {
  console.log("WISP Tor → :8081");
});
