/* eslint-disable @typescript-eslint/no-var-requires */
const http = require("node:http");
const wisp = require("wisp-server-node");

const httpServer = http.createServer();

httpServer.on("upgrade", (req, socket, head) => {
    // please include the trailing slash
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else {
        // Redirect to https://rhw.one
        socket.write(
            "HTTP/1.1 302 Found\r\n" +
            "Location: https://rhw.one\r\n" +
            "Connection: close\r\n" +
            "\r\n"
        );
        socket.end();
    }
});

httpServer.on("listening", () => {
    console.log("HTTP server listening");
});

httpServer.listen({
    port: 8080,
});
