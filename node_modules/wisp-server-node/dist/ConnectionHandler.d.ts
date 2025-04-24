import { IncomingMessage } from "node:http";
import WebSocket from "ws";
import { Socket } from "node:net";
import { WispOptions } from "./Types.js";
export declare function routeRequest(wsOrIncomingMessage: WebSocket | IncomingMessage, socket?: Socket, head?: Buffer, options?: WispOptions): Promise<void>;
declare const _default: {
    routeRequest: typeof routeRequest;
};
export default _default;
