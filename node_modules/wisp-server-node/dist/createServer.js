"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionHandler_js_1 = __importDefault(require("./ConnectionHandler.js"));
const node_http_1 = __importDefault(require("node:http"));
const Types_js_1 = require("./Types.js");
const httpServer = node_http_1.default.createServer().listen(process.env.PORT || 3000);
httpServer.on("upgrade", (req, socket, head) => {
    ConnectionHandler_js_1.default.routeRequest(req, socket, head, {
        logLevel: Types_js_1.LOG_LEVEL.DEBUG,
        pingInterval: 30
    });
});
//# sourceMappingURL=createServer.js.map