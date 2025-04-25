/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "client": () => (/* reexport */ client_namespaceObject),
  "packet": () => (/* reexport */ packet_namespaceObject),
  "server": () => (/* reexport */ server_namespaceObject)
});

// NAMESPACE OBJECT: ./src/packet.mjs
var packet_namespaceObject = {};
__webpack_require__.r(packet_namespaceObject);
__webpack_require__.d(packet_namespaceObject, {
  "ClosePayload": () => (ClosePayload),
  "ConnectPayload": () => (ConnectPayload),
  "ContinuePayload": () => (ContinuePayload),
  "DataPayload": () => (DataPayload),
  "WispBuffer": () => (WispBuffer),
  "WispPacket": () => (WispPacket),
  "close_reasons": () => (close_reasons),
  "packet_classes": () => (packet_classes),
  "packet_types": () => (packet_types),
  "stream_types": () => (stream_types)
});

// NAMESPACE OBJECT: ./src/client/index.mjs
var client_namespaceObject = {};
__webpack_require__.r(client_namespaceObject);
__webpack_require__.d(client_namespaceObject, {
  "ClientConnection": () => (ClientConnection),
  "WispWebSocket": () => (WispWebSocket),
  "_wisp_connections": () => (_wisp_connections)
});

// NAMESPACE OBJECT: ./src/server/index.mjs
var server_namespaceObject = {};
__webpack_require__.r(server_namespaceObject);
__webpack_require__.d(server_namespaceObject, {
  "ServerConnection": () => (ServerConnection),
  "ServerStream": () => (ServerStream),
  "options": () => (options),
  "parse_real_ip": () => (parse_real_ip),
  "routeRequest": () => (routeRequest)
});

;// CONCATENATED MODULE: external "ws"
const external_ws_namespaceObject = require("ws");
;// CONCATENATED MODULE: external "crypto"
const external_crypto_namespaceObject = require("crypto");
;// CONCATENATED MODULE: external "node:http"
const external_node_http_namespaceObject = require("node:http");
;// CONCATENATED MODULE: external "node:net"
const external_node_net_namespaceObject = require("node:net");
;// CONCATENATED MODULE: external "node:dgram"
const external_node_dgram_namespaceObject = require("node:dgram");
;// CONCATENATED MODULE: external "node:dns/promises"
const promises_namespaceObject = require("node:dns/promises");
;// CONCATENATED MODULE: ./src/compat.mjs
//this file contains references to external node modules
//it gets replaced with ./compat_browser.mjs when being bundled for the web








;// CONCATENATED MODULE: ./src/packet.mjs
//shared packet parsing / serialization code

const text_encoder = new TextEncoder();
const encode_text = text_encoder.encode.bind(text_encoder);
const text_decoder = new TextDecoder();
const decode_text = text_decoder.decode.bind(text_decoder);

class WispBuffer {
  constructor(data) {
    if (data instanceof Uint8Array) {
      this.from_array(data);
    }
    else if (typeof data === "number") {
      this.from_array(new Uint8Array(data));
    }
    else if (typeof data === "string") {
      this.from_array(encode_text(data));
    }
    else {
      console.trace();
      throw "invalid data type passed to wisp buffer constructor";
    }
  }

  from_array(bytes) {
    this.size = bytes.length;
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer); 
  }

  concat(buffer) {
    let new_buffer = new WispBuffer(this.size + buffer.size);
    new_buffer.bytes.set(this.bytes, 0);
    new_buffer.bytes.set(buffer.bytes, this.size);
    return new_buffer;
  }

  slice(index, size) {
    let bytes_slice = this.bytes.slice(index, size);
    return new WispBuffer(bytes_slice);
  }
}

class WispPacket {
  static min_size = 5;
  constructor({type, stream_id, payload, payload_bytes }) {
    this.type = type;
    this.stream_id = stream_id;
    this.payload_bytes = payload_bytes;
    this.payload = payload;
  }
  static parse(buffer) {
    return new WispPacket({
      type: buffer.view.getUint8(0),
      stream_id: buffer.view.getUint32(1, true),
      payload_bytes: buffer.slice(5)
    });
  }
  static parse_all(buffer) {
    if (buffer.size < WispPacket.min_size) {
      throw "packet too small";
    }
    let packet = WispPacket.parse(buffer);
    let payload_class = packet_classes[packet.type];
    if (typeof payload_class === "undefined") {
      throw "invalid packet type";
    }
    if (packet.payload_bytes.size < payload_class.size) {
      throw "payload too small";
    }
    packet.payload = payload_class.parse(packet.payload_bytes);
    return packet;
  }
  serialize() {
    let buffer = new WispBuffer(5);
    buffer.view.setUint8(0, this.type);
    buffer.view.setUint32(1, this.stream_id, true);
    buffer = buffer.concat(this.payload.serialize());
    return buffer;
  }
}

class ConnectPayload {
  static min_size = 3;
  static type = 0x01;
  static name = "CONNECT";
  constructor({stream_type, port, hostname}) {
    this.stream_type = stream_type;
    this.port = port;
    this.hostname = hostname;
  }
  static parse(buffer) {
    return new ConnectPayload({
      stream_type: buffer.view.getUint8(0),
      port: buffer.view.getUint16(1, true),
      hostname: decode_text(buffer.slice(3).bytes)
    });
  }
  serialize() {
    let buffer = new WispBuffer(3);
    buffer.view.setUint8(0, this.stream_type);
    buffer.view.setUint16(1, this.port, true);
    buffer = buffer.concat(new WispBuffer(this.hostname));
    return buffer;
  }
}

class DataPayload {
  static min_size = 0;
  static type = 0x02;
  static name = "DATA";
  constructor({data}) {
    this.data = data;
  }
  static parse(buffer) {
    return new DataPayload({
      data: buffer
    });
  }
  serialize() {
    return this.data;
  }
}

class ContinuePayload {
  static type = 0x03;
  static name = "CONTINUE";
  constructor({buffer_remaining}) {
    this.buffer_remaining = buffer_remaining;
  }
  static parse(buffer) {
    return new ContinuePayload({
      buffer_remaining: buffer.view.getUint32(0, true),
    });
  }
  serialize() {
    let buffer = new WispBuffer(4);
    buffer.view.setUint32(0, this.buffer_remaining, true);
    return buffer;
  }
}

class ClosePayload {
  static min_size = 1;
  static type = 0x04;
  static name = "CLOSE";
  constructor({reason}) {
    this.reason = reason;
  }
  static parse(buffer) {
    return new ClosePayload({
      reason: buffer.view.getUint8(0),
    });
  }
  serialize() {
    let buffer = new WispBuffer(1);
    buffer.view.setUint8(0, this.reason);
    return buffer;
  }
}

const packet_classes = [
  undefined,
  ConnectPayload, 
  DataPayload, 
  ContinuePayload, 
  ClosePayload
]

const packet_types = {
  CONNECT: 0x01,
  DATA: 0x02,
  CONTINUE: 0x03,
  CLOSE: 0x04
}

const stream_types = {
  TCP: 0x01,
  UDP: 0x02
}

const close_reasons = {
  //client/server close reasons
  Unknown: 0x01,
  Voluntary: 0x02,
  NetworkError: 0x03,

  //server only close reasons
  InvalidInfo: 0x41, 
  UnreachableHost: 0x42,
  NoResponse: 0x43,
  ConnRefused: 0x44,
  TransferTimeout: 0x47,
  HostBlocked: 0x48,
  ConnThrottled: 0x49,

  //client only close reasons
  ClientError: 0x81
}
;// CONCATENATED MODULE: ./src/client/connection.mjs




class ClientStream {
  constructor(hostname, port, websocket, buffer_size, stream_id, connection, stream_type) {
    this.hostname = hostname;
    this.port = port;
    this.ws = websocket;
    this.buffer_size = buffer_size;
    this.stream_id = stream_id;
    this.connection = connection;
    this.stream_type = stream_type;
    this.send_buffer = [];
    this.open = true;

    this.onopen = () => {};
    this.onclose = () => {};
    this.onmessage = () => {};
  }

  send(data) {
    //note: udp shouldn't buffer anything
    if (this.buffer_size > 0 || !this.open || this.stream_type === stream_types.UDP) {
      //construct and send a DATA packet
      let packet = new WispPacket({
        type: packet_types.DATA,
        stream_id: this.stream_id,
        payload: new DataPayload({
          data: new WispBuffer(data)
        })
      });
      this.ws.send(packet.serialize().bytes);
      this.buffer_size--;
    }
    else { //server is slow, don't send data yet
      this.send_buffer.push(data);
    }
  }

  //handle receiving a CONTINUE packet
  continue_received(buffer_size) {
    this.buffer_size = buffer_size;
    //send buffered data now
    while (this.buffer_size > 0 && this.send_buffer.length > 0) {
      this.send(this.send_buffer.shift());
    }
  }

  //construct and send a CLOSE packet
  close(reason = 0x01) {
    if (!this.open) return;
    let packet = new WispPacket({
      type: packet_types.CLOSE,
      stream_id: stream_id,
      payload: new ClosePayload({
        reason: reason
      })
    });
    this.ws.send(packet.serialize().bytes);
    this.open = false;
    delete this.connection.active_streams[this.stream_id];
  }
}

class ClientConnection {
  constructor(wisp_url) {
    if (!wisp_url.endsWith("/")) {
      throw "wisp endpoints must end with a trailing forward slash";
    }

    this.wisp_url = wisp_url;
    this.max_buffer_size = null;
    this.active_streams = {};
    this.connected = false;
    this.connecting = false;
    this.next_stream_id = 1;

    this.onopen = () => {};
    this.onclose = () => {};
    this.onerror = () => {};
    this.onmessage = () => {};

    this.connect_ws();
  }

  connect_ws() {
    this.ws = new external_ws_namespaceObject.WebSocket(this.wisp_url);
    this.ws.binaryType = "arraybuffer";
    this.connecting = true;

    this.ws.onerror = () => {
      this.on_ws_close();
      this.onerror();
    };
    this.ws.onclose = () => {
      this.on_ws_close();
      this.onclose();
    };
    this.ws.onmessage = (event) => {
      this.on_ws_msg(event);
      if (this.connecting) {
        this.connected = true;
        this.connecting = false;
        this.onopen();
      }
    };
  }

  close_stream(stream, reason) {
    stream.onclose(reason);
    delete this.active_streams[stream.stream_id];
  }

  on_ws_close() {
    this.connected = false;
    this.connecting = false;
    for (let stream_id of Object.keys(this.active_streams)) {
      this.close_stream(this.active_streams[stream_id], 0x03);
    }
  }

  create_stream(hostname, port, type="tcp") {
    let stream_type = type === "udp" ? 0x02 : 0x01;
    let stream_id = this.next_stream_id++;
    let stream = new ClientStream(hostname, port, this.ws, this.max_buffer_size, stream_id, this, stream_type);
    this.active_streams[stream_id] = stream;
    stream.open = this.connected;

    //construct CONNECT packet
    let packet = new WispPacket({
      type: packet_types.CONNECT,
      stream_id: stream_id,
      payload: new ConnectPayload({
        stream_type: stream_type,
        port: port,
        hostname: hostname
      })
    });
    this.ws.send(packet.serialize().bytes);
    return stream;
  }

  on_ws_msg(event) {
    let buffer = new WispBuffer(new Uint8Array(event.data));
    if (buffer.size < WispPacket.min_size) {
      console.warn(`wisp client warning: received a packet which is too short`);
      return;
    }
    let packet = WispPacket.parse_all(buffer);
    let stream = this.active_streams[packet.stream_id];

    if (typeof stream === "undefined" && (packet.stream_id !== 0 || packet.type !== packet_types.CONTINUE)) {
      console.warn(`wisp client warning: received a ${packet_classes[packet.type].name} packet for a stream which doesn't exist`);
      return;
    }

    if (packet.type === packet_types.DATA) { //DATA packets
      stream.onmessage(packet.payload_bytes.bytes);
    }

    else if (packet.type === packet_types.CONTINUE && packet.stream_id == 0) { //initial CONTINUE packet
      this.max_buffer_size = packet.payload.buffer_remaining;
    }

    else if (packet.type === packet_types.CONTINUE) { //other CONTINUE packets
      stream.continue_received(packet.payload.buffer_size);
    }

    else if (packet.type === packet_types.CLOSE) { //CLOSE packets
      this.close_stream(stream, packet.payload.reason);
    }

    else {
      console.warn(`wisp client warning: receive an invalid packet of type ${packet.type}`);
    }
  }
}


;// CONCATENATED MODULE: ./src/client/polyfill.mjs


//polyfill the DOM Websocket API so that applications using wsproxy can easily use wisp with minimal changes

const RealCloseEvent = (globalThis.CloseEvent || Event);
const _wisp_connections = {};

class WispWebSocket extends EventTarget {
  constructor(url, protocols) {
    super();
    this.url = url;
    this.protocols = protocols
    this.binaryType = "blob";
    this.stream = null;
    this.connection = null;

    //legacy event handlers
    this.onopen = () => {};
    this.onerror = () => {};
    this.onmessage = () => {};
    this.onclose = () => {};

    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    this._ready_state = this.CONNECTING;

    //parse the wsproxy url
    let url_split = this.url.split("/");
    let wsproxy_path = url_split.pop().split(":");
    this.host = wsproxy_path[0];
    this.port = parseInt(wsproxy_path[1]);
    this.real_url = url_split.join("/") + "/";

    this.init_connection();
  }

  on_conn_close() {
    this._ready_state = this.CLOSED;
    if (_wisp_connections[this.real_url]) {
      this.onerror(new Event("error"));
      this.dispatchEvent(new Event("error"));
    }
    delete _wisp_connections[this.real_url];
  }

  init_connection() {
    //create the stream
    this.connection = _wisp_connections[this.real_url];

    if (!this.connection) {
      this.connection = new ClientConnection(this.real_url);
      this.connection.onopen = () => {
        this.init_stream();
      };
      this.connection.onclose = () => {
        this.on_conn_close()
      };
      this.connection.onerror = () => {
        this.on_conn_close()
      };
      _wisp_connections[this.real_url] = this.connection;
    }
    else if (!this.connection.connected) {
      let old_onopen = this.connection.onopen;
      this.connection.onopen = () => {
        old_onopen();
        this.init_stream();
      };
    }
    else {
      this.connection = _wisp_connections[this.real_url];
      this.init_stream();
    }
  }

  init_stream() {
    this._ready_state = this.OPEN;
    this.stream = this.connection.create_stream(this.host, this.port);

    this.stream.onmessage = (raw_data) => {
      let data;
      if (this.binaryType == "blob") {
        data = new Blob(raw_data);
      }
      else if (this.binaryType == "arraybuffer") {
        data = raw_data.buffer;
      }
      else {
        throw "invalid binaryType string";
      }
      let msg_event = new MessageEvent("message", {data: data});
      this.onmessage(msg_event);
      this.dispatchEvent(msg_event);
    };

    this.stream.onclose = (reason) => {
      this._ready_state = this.CLOSED;
      let close_event = new RealCloseEvent("close", {code: reason}); 
      this.onclose(close_event);
      this.dispatchEvent(close_event);
    };

    let open_event = new Event("open");
    this.onopen(open_event);
    this.dispatchEvent(open_event);
  }

  send(data) {
    let data_array;

    if (data instanceof Uint8Array) {
      data_array = data;  
    }
    else if (typeof data === "string") {
      data_array = new TextEncoder().encode(data);
    }
    else if (data instanceof Blob) {
      data.arrayBuffer().then(array_buffer => {
        this.send(array_buffer);
      });
      return;
    }
    else if (data instanceof ArrayBuffer) {
      data_array = new Uint8Array(data);
    }
    //dataview objects or any other typedarray
    else if (ArrayBuffer.isView(data)) {
      data_array = new Uint8Array(data.buffer);
    }
    else {
      throw "invalid data type to be sent";
    }

    if (!this.stream) {
      throw "websocket is not ready";
    }
    this.stream.send(data_array);
  }

  close() {
    this.stream.close(0x02);
  }

  get bufferedAmount() {
    let total = 0;
    for (let msg of this.stream.send_buffer) {
      total += msg.length;
    }
    return total;
  }

  get extensions() {
    return "";
  }

  get protocol() {
    return "binary";
  }

  get readyState() {
    return this._ready_state;
  }
}
;// CONCATENATED MODULE: ./src/client/index.mjs


;// CONCATENATED MODULE: ./src/logging.mjs
const DEBUG = 0;
const INFO = 1;
const WARN = 2;
const ERROR = 3;
const NONE = 4;
let log_level = INFO;

function get_timestamp() {
  let [date, time] = new Date().toJSON().split("T");
  date = date.replaceAll("-", "/");
  time = time.split(".")[0];
  return `[${date} - ${time}]`;
}

function set_level(level) {
  log_level = level;
}

function debug(...messages) {
  if (log_level > DEBUG) return;
  console.debug(get_timestamp() + " debug:", ...messages);
}

function info(...messages) {
  if (log_level > INFO) return;
  console.info(get_timestamp() + " info:", ...messages);
}

function log(...messages) {
  if (log_level > INFO) return;
  console.log(get_timestamp() + " log:", ...messages);
}

function warn(...messages) {
  if (log_level > WARN) return;
  console.warn(get_timestamp() + " warn:", ...messages);
}

function logging_error(...messages) {
  if (log_level > ERROR) return;
  console.error(get_timestamp() + " error:", ...messages);
}


;// CONCATENATED MODULE: ./src/server/options.mjs
const options = {
  //destination hostname restrictions
  hostname_blacklist: null,
  hostname_whitelist: null,
  port_blacklist: null,
  port_whitelist: null,
  allow_direct_ip: true,
  allow_private_ips: false,
  allow_loopback_ips: false,
  
  //client connection restrictions
  client_ip_blacklist: null, //not implemented!
  client_ip_whitelist: null, //not implemented!
  stream_limit_per_host: -1,
  stream_limit_total: -1,
  allow_udp_streams: true,
  allow_tcp_streams: true,

  //dns options
  dns_ttl: 120,
  dns_method: "lookup",
  dns_servers: null,
  dns_result_order: "verbatim",

  //misc options
  parse_real_ip: true,
  parse_real_ip_from: ["127.0.0.1"]
}


;// CONCATENATED MODULE: ./src/websocket.mjs
//async websocket wrapper for both node and the browser



function get_conn_id() {
  return external_crypto_namespaceObject.randomUUID().split("-")[0];
}

//an async websocket wrapper
class AsyncWebSocket {
  send_buffer_size = 32*1024*1024;
  
  constructor(ws) {
    this.ws = ws;
    this.connected = false;
    this.data_queue = new AsyncQueue(1);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.connected = true;
        resolve();
      }
      this.ws.onmessage = (event) => {
        this.data_queue.put(event.data);
      }
      this.ws.onclose = () => {
        if (!this.connected) reject();
        else this.data_queue.close();
      }
      if (this.ws.readyState === this.ws.OPEN) {
        this.connected = true;
        resolve();
      }
    });
  }

  async recv() {
    return await this.data_queue.get();
  }

  async send(data) {
    this.ws.send(data);
    if (this.ws.bufferedAmount <= this.send_buffer_size) {
      return;
    }

    //if the send buffer is too full, throttle the upload
    while (true) {
      if (this.ws.bufferedAmount <= this.send_buffer_size / 2) {
        break;
      }
      await new Promise((resolve) => {setTimeout(resolve, 10)});
    }
  }

  close(code, reason) {
    this.ws.close(code, reason);
    this.data_queue.close();
  }

  get buffered_amount() {
    return this.ws.bufferedAmount;
  }
}

//an async fifo queue
class AsyncQueue {
  constructor(max_size) {
    this.max_size = max_size;
    this.queue = [];
    this.put_callbacks = [];
    this.get_callbacks = [];
  }

  put_now(data) {
    this.queue.push(data);
    this.get_callbacks.shift()?.();
  }

  async put(data) {
    if (this.size <= this.max_size) {
      this.put_now(data);
      return;
    }

    //wait until there is a place to put the item
    await new Promise((resolve) => {
      this.put_callbacks.push(resolve);
    });
    this.put_now(data);
  }

  get_now() {
    this.put_callbacks.shift()?.();
    return this.queue.shift();
  }

  async get() {
    if (this.size > 0) {
      return this.get_now();
    }

    //wait until there is an item available in the queue
    await new Promise((resolve) => {
      this.get_callbacks.push(resolve);
    });
    return this.get_now();
  }

  close() {
    this.queue = [];
    let callback;
    //resolve all pending operations
    while (callback = this.get_callbacks.shift())
      callback();
    while (callback = this.put_callbacks.shift())
      callback();
  }

  get size() {
    return this.queue.length;
  }
}
;// CONCATENATED MODULE: ./src/server/net.mjs





//wrappers for node networking apis
//in the browser these can be redefined to allow for custom transports

const is_node = (typeof process !== "undefined");

const dns_cache = new Map();
let dns_servers = null;
let resolver = null;

function assert_on_node() {
  if (!is_node) {
    throw "not running on node.js";
  }
}

//wrapper for node resolver methods
//resolve4 and resolve6 need to be wrapped to work around a nodejs bug
function resolve4(hostname) {
  return resolver.resolve4(hostname);
}
function resolve6(hostname) {
  return resolver.resolve6(hostname);
}
async function resolve_with_fallback(resolve_first, resolve_after, hostname) {
  try {
    return (await resolve_first(hostname))[0];
  }
  catch {
    return (await resolve_after(hostname))[0];
  }
}  

//a wrapper for the actual dns lookup
async function perform_lookup(hostname) {
  //resolve using dns.resolve4 / dns.resolve6, which bypasses the system dns
  if (options.dns_method === "lookup") {
    let result = await promises_namespaceObject.lookup(hostname, {order: options.dns_result_order}); 
    return result.address;
  }

  //resolve using dns.resolve4 / dns.resolve6, which bypasses the system dns
  else if (options.dns_method === "resolve") {
    //we need to make a new resolver at first run because setServers doesn't work otherwise
    if (!resolver) resolver = new promises_namespaceObject.Resolver();

    //set custom dns servers if needed
    if (options.dns_servers !== dns_servers) {
      debug("Setting custom DNS servers to: " + options.dns_servers.join(", "));
      resolver.setServers(options.dns_servers);
      dns_servers = options.dns_servers;
    }

    if (options.dns_result_order === "verbatim" || options.dns_result_order === "ipv6first") 
      return await resolve_with_fallback(resolve6, resolve4, hostname);
    else if (options.dns_result_order === "ipv4first")
      return await resolve_with_fallback(resolve4, resolve6, hostname);
    else
      throw new Error("Invalid result order. options.dns_result_order must be either 'ipv6first', 'ipv4first', or 'verbatim'.");
  }

  //use a custom function for dns resolution
  else if (typeof options.dns_method === "function") {
    return await options.dns_method(hostname);
  }

  throw new Error("Invalid DNS method. options.dns_method must either be 'lookup' or 'resolve'.");
}

//perform a dns lookup and use the cache
async function lookup_ip(hostname) {
  if (!is_node) { //we cannot do the dns lookup on the browser
    return hostname;
  }

  let ip_level = external_node_net_namespaceObject.isIP(hostname);
  if (ip_level === 4 || ip_level === 6) {
    return hostname; //hostname is already an ip address
  }

  //remove stale entries from the cache
  let now = Date.now();
  for (let [entry_hostname, cache_entry] of dns_cache) {
    let ttl = now - cache_entry.time;
    if (ttl > options.dns_ttl) {
      dns_cache.delete(entry_hostname);
    }
  }

  //look in the cache first before using the system resolver
  let cache_entry = dns_cache.get(hostname);
  if (cache_entry) {
    if (cache_entry.error) 
      throw cache_entry.error
    return cache_entry.address;
  }

  //try to perform the actual dns lookup and store the result
  let address;
  try {
    address = await perform_lookup(hostname);
    debug(`Domain resolved: ${hostname} -> ${address}`);
    dns_cache.set(hostname, {time: Date.now(), address: address});
  }
  catch (e) {
    dns_cache.set(hostname, {time: Date.now(), error: e});
    throw e;
  }

  return address;
}

//async tcp and udp socket wrappers
class NodeTCPSocket {
  constructor(hostname, port) {
    assert_on_node();
    this.hostname = hostname;
    this.port = port;
    this.recv_buffer_size = 128;

    this.socket = null;
    this.paused = false;
    this.connected = false;
    this.data_queue = new AsyncQueue(this.recv_buffer_size);
  }

  async connect() {
    let ip = await lookup_ip(this.hostname);
    await new Promise((resolve, reject) => {
      this.socket = new external_node_net_namespaceObject.Socket();
      this.socket.setNoDelay(true);
      this.socket.on("connect", () => {
        this.connected = true;
        resolve();
      });
      this.socket.on("data", (data) => {
        this.data_queue.put(data);
      });
      this.socket.on("close", (error) => {
        if (error && !this.connected) reject();
        else this.data_queue.close();
        this.socket = null;
      });
      this.socket.on("error", (error) => {
        warn(`tcp stream to ${this.hostname} ended with error - ${error}`);
      });
      this.socket.on("end", () => {
        if (!this.socket) return;
        this.socket.destroy();
        this.socket = null;
      });
      this.socket.connect({
        host: ip,
        port: this.port
      });
    });
  }

  async recv() {
    return await this.data_queue.get();
  }

  async send(data) {
    await new Promise((resolve) => {
      this.socket.write(data, resolve);
    });
  }

  async close() {
    if (!this.socket) return;
    this.socket.end();
    this.socket = null;
  }

  pause() {
    if (this.data_queue.size >= this.data_queue.max_size) {
      this.socket.pause();
      this.paused = true;
    }
  }
  resume() {
    if (!this.socket) return;
    if (this.paused) {
      this.socket.resume();
      this.paused = false;
    }
  }
}

class NodeUDPSocket {
  constructor(hostname, port) {
    assert_on_node();
    this.hostname = hostname;
    this.port = port;

    this.connected = false;
    this.recv_buffer_size = 128;
    this.data_queue = new AsyncQueue(this.recv_buffer_size);
  }

  async connect() {
    let ip = await lookup_ip(this.hostname);
    let ip_level = external_node_net_namespaceObject.isIP(ip);
    await new Promise((resolve, reject) => {
      this.socket = external_node_dgram_namespaceObject.createSocket(ip_level === 6 ? "udp6" : "udp4");
      this.socket.on("connect", () => {
        resolve();
      });
      this.socket.on("message", (data) => {
        this.data_queue.put(data);
      });
      this.socket.on("error", () => {
        if (!this.connected) reject();
        this.data_queue.close();
        this.socket = null;
      });
      this.socket.connect(this.port, ip);
    });
  }

  async recv() {
    return await this.data_queue.get();
  }

  async send(data) {
    this.socket.send(data);
  }

  async close() {
    if (!this.socket) return;
    this.socket.close();
    this.socket = null;
  }

  pause() {}
  resume() {}
}
;// CONCATENATED MODULE: external "ipaddr.js"
const external_ipaddr_js_namespaceObject = require("ipaddr.js");
;// CONCATENATED MODULE: ./src/server/filter.mjs






class AccessDeniedError extends Error {}

//helper functions for the whitelist/blacklist logic
function check_port_range(entry, port) {
  return (entry === port) || (entry[0] <= port && entry[1] >= port)
}
function check_whitelist(entries, filter) {
  let matched = false;
  for (let entry of entries) {
    if (filter(entry)) {
      matched = true;
      break
    }
  }
  return !matched;
}
function check_blacklist(entries, filter) {
  for (let entry of entries) {
    if (filter(entry))
      return true;
    }
  return false;
}

function check_ip_range(ip, range) {
  return range.includes(ip.range());
}

//check if an ip is blocked
function is_ip_blocked(ip_str) {
  if (!external_ipaddr_js_namespaceObject.isValid(ip_str)) 
    return false;
  let ip = external_ipaddr_js_namespaceObject.parse(ip_str);

  let loopback_ranges = ["loopback", "unspecified"];
  let private_ranges = ["broadcast", "linkLocal", "carrierGradeNat", "private", "reserved"];

  if (!options.allow_loopback_ips && check_ip_range(ip, loopback_ranges)) 
    return true;
  if (!options.allow_private_ips && check_ip_range(ip, private_ranges)) 
    return true;
  return false;
}

//returns the close reason if the connection should be blocked
async function is_stream_allowed(connection, type, hostname, port) {
  //check if tcp or udp should be blocked
  if (!options.allow_tcp_streams && type === stream_types.TCP)
    return close_reasons.HostBlocked;
  if (!options.allow_udp_streams && type === stream_types.UDP)
    return close_reasons.HostBlocked;

  //check the hostname whitelist/blacklist
  if (options.hostname_whitelist) {
    if (check_whitelist(options.hostname_whitelist, (entry) => entry.test(hostname)))
      return close_reasons.HostBlocked;
  }
  else if (options.hostname_blacklist) {
    if (check_blacklist(options.hostname_blacklist, (entry) => entry.test(hostname)))
      return close_reasons.HostBlocked;
  }

  //check if the port is blocked
  if (options.port_whitelist) {
    if (check_whitelist(options.port_whitelist, (entry) => check_port_range(entry, port))) 
      return close_reasons.HostBlocked;
  }
  else if (options.port_blacklist) {
    if (check_blacklist(options.port_blacklist, (entry) => check_port_range(entry, port)))
      return close_reasons.HostBlocked;
  }

  //check if the destination ip is blocked
  let ip_str = hostname;
  if (external_ipaddr_js_namespaceObject.isValid(hostname)) {
    if (!options.allow_direct_ip)
      return close_reasons.HostBlocked;
  }
  else {
    try { //look up the ip to make sure that the resolved address is allowed
      ip_str = await lookup_ip(hostname);
    }
    catch {}
  }
  if (is_ip_blocked(ip_str)) 
    return close_reasons.HostBlocked;

  //don't check stream counts if there isn't an associated wisp connection (with wsproxy for example)
  if (!connection) 
    return 0;

  //check for stream count limits
  if (options.stream_limit_total !== -1 && Object.keys(connection.streams).length >= options.stream_limit_total) 
    return close_reasons.ConnThrottled;
  if (options.stream_limit_per_host !== -1) {
    let streams_per_host = 0;
    for (let stream of connection.streams) {
      if (stream.socket.hostname === hostname) {
        streams_per_host++;
      }
    }
    if (streams_per_host >= options.stream_limit_per_host)
      return close_reasons.ConnThrottled;
  }

  return 0;
}
;// CONCATENATED MODULE: ./src/server/connection.mjs






class ServerStream {
  static buffer_size = 128;

  constructor(stream_id, conn, socket) {
    this.stream_id = stream_id;
    this.conn = conn;
    this.socket = socket;    
    this.send_buffer = new AsyncQueue(ServerStream.buffer_size);
    this.packets_sent = 0;
  }

  async setup() {
    await this.socket.connect();

    //start the proxy tasks in the background
    this.tcp_to_ws().catch((error) => {
      logging_error(`(${this.conn.conn_id}) a tcp/udp to ws task encountered an error - ${error}`);
      this.close();
    });
    this.ws_to_tcp().catch((error) => {
      logging_error(`(${this.conn.conn_id}) a ws to tcp/udp task encountered an error - ${error}`);
      this.close();
    });
  }

  async tcp_to_ws() {
    while (true) {
      let data = await this.socket.recv();
      if (data == null) {
        break;
      }

      this.socket.pause();
      let packet = new WispPacket({
        type: DataPayload.type,
        stream_id: this.stream_id,
        payload: new DataPayload({
          data: new WispBuffer(new Uint8Array(data))
        })
      });
      await this.conn.ws.send(packet.serialize().bytes);
      this.socket.resume();
    }
    await this.conn.close_stream(this.stream_id, close_reasons.Voluntary);
  }

  async ws_to_tcp() {
    while (true) {
      let data = await this.send_buffer.get();
      if (data == null) {
        break; //stream closed
      }
      await this.socket.send(data);

      this.packets_sent++;
      if (this.packets_sent % (ServerStream.buffer_size / 2) !== 0) {
        continue;
      }
      let packet = new WispPacket({
        type: ContinuePayload.type,
        stream_id: this.stream_id,
        payload: new ContinuePayload({
          buffer_remaining: ServerStream.buffer_size - this.send_buffer.size
        })
      });
      this.conn.ws.send(packet.serialize().bytes);
    }
    await this.close();
  }

  async close(reason = null) {
    this.send_buffer.close();
    this.socket.close();
    if (reason == null) return;

    let packet = new WispPacket({
      type: ClosePayload.type,
      stream_id: this.stream_id,
      payload: new ClosePayload({
        reason: reason
      })
    });
    await this.conn.ws.send(packet.serialize().bytes);
  }

  async put_data(data) {
    await this.send_buffer.put(data);
  }
}

class ServerConnection {
  constructor(ws, path, {TCPSocket, UDPSocket, ping_interval} = {}) {
    this.ws = new AsyncWebSocket(ws);
    this.path = path;
    this.TCPSocket = TCPSocket || NodeTCPSocket;
    this.UDPSocket = UDPSocket || NodeUDPSocket;
    this.ping_interval = ping_interval || 30;
    
    this.ping_task = null;
    this.streams = {};
    this.conn_id = get_conn_id();
  }

  async setup() {
    info(`setting up new wisp connection with id ${this.conn_id}`);

    await this.ws.connect();
    let packet = new WispPacket({
      type: ContinuePayload.type,
      stream_id: 0,
      payload: new ContinuePayload({
        buffer_remaining: ServerStream.buffer_size
      })
    });
    await this.ws.send(packet.serialize().bytes);

    if (typeof this.ws.ws.ping !== "function") {
      return;  
    }
    this.ping_task = setInterval(() => {
      debug(`(${this.conn_id}) sending websocket ping`);
      this.ws.ws.ping();
    }, this.ping_interval * 1000);
  }

  create_stream(stream_id, type, hostname, port) {
    let SocketImpl = type === stream_types.TCP ? this.TCPSocket : this.UDPSocket;
    let socket = new SocketImpl(hostname, port);
    let stream = new ServerStream(stream_id, this, socket);
    this.streams[stream_id] = stream;

    //start connecting to the destination server in the background
    (async () => {
      let close_reason = await is_stream_allowed(this, type, hostname, port);
      if (close_reason) {
        warn(`(${this.conn_id}) refusing to create a stream to ${hostname}:${port}`);
        await this.close_stream(stream_id, close_reason, true);
        return;
      }
      try {
        await stream.setup();
      }
      catch (error) {
        warn(`(${this.conn_id}) creating a stream to ${hostname}:${port} failed - ${error}`);
        await this.close_stream(stream_id, close_reasons.NetworkError);
      }
    })();
  }

  async close_stream(stream_id, reason = null, quiet = false) {
    let stream = this.streams[stream_id];
    if (stream == null) {
      return;
    }
    if (reason && !quiet) {
      info(`(${this.conn_id}) closing stream to ${stream.socket.hostname} for reason ${reason}`);
    }
    await stream.close(reason);
    delete this.streams[stream_id];
  }

  route_packet(buffer) {
    let packet = WispPacket.parse_all(buffer);
    let stream = this.streams[packet.stream_id];

    if (stream == null && packet.type == DataPayload.type) {
      warn(`(${this.conn_id}) received a DATA packet for a stream which doesn't exist`);
      return;
    }

    if (packet.type === ConnectPayload.type) {
      let type_info = packet.payload.stream_type === stream_types.TCP ? "TCP" : "UDP";
      info(`(${this.conn_id}) opening new ${type_info} stream to ${packet.payload.hostname}:${packet.payload.port}`);
      this.create_stream(
        packet.stream_id, 
        packet.payload.stream_type, 
        packet.payload.hostname.trim(), 
        packet.payload.port
      )
    }

    else if (packet.type === DataPayload.type) {
      stream.put_data(packet.payload.data.bytes);
    }

    else if (packet.type == ContinuePayload.type) {
      warn(`(${this.conn_id}) client sent a CONTINUE packet, this should never be possible`);
    }

    else if (packet.type == ClosePayload.type) {
      this.close_stream(packet.stream_id, packet.reason);
    }
  }

  async run() {
    while (true) {
      let data;
      data = await this.ws.recv();
      if (data == null) {
        break; //websocket closed
      }
      
      try {
        this.route_packet(new WispBuffer(new Uint8Array(data)));
      }
      catch (error) {
        warn(`(${this.conn_id}) routing a packet failed - ${error}`);
      }
    }
    
    //clean up all streams when the websocket is closed
    for (let stream_id of Object.keys(this.streams)) {
      await this.close_stream(stream_id);
    }
    clearInterval(this.ping_task);
    info(`(${this.conn_id}) wisp connection closed`);
  }
}
;// CONCATENATED MODULE: ./src/server/wsproxy.mjs






class WSProxyConnection {
  constructor(ws, path) {
    let [hostname, port] = path.split("/").pop().split(":");
    this.hostname = hostname.trim();
    this.port = parseInt(port);
    this.ws = new AsyncWebSocket(ws);
  }

  async setup() {
    await this.ws.connect();

    //check that the destination host/ip is allowed
    let err_code = await is_stream_allowed(null, stream_types.TCP, this.hostname, this.port);
    if (err_code !== 0) {
      info(`Refusing to create a wsproxy connection to ${this.hostname}:${this.port}`);
      this.ws.close();
      throw new AccessDeniedError();
    }

    //connect to the tcp host after we are certain that it's safe to do so
    this.socket = new NodeTCPSocket(this.hostname, this.port);
    await this.socket.connect();

    //start the proxy tasks in the background
    this.tcp_to_ws().catch((error) => {
      logging_error(`a tcp to ws task (wsproxy) encountered an error - ${error}`);
    });
    this.ws_to_tcp().catch((error) => {
      logging_error(`a ws to tcp task (wsproxy) encountered an error - ${error}`);
    });
  }

  async tcp_to_ws() {
    while (true) {
      let data = await this.socket.recv();
      if (data == null) {
        break;
      }
      this.socket.pause();
      await this.ws.send(data);
      this.socket.resume();
    }
    await this.ws.close();
  }

  async ws_to_tcp() {
    while (true) {
      let data;
      data = await this.ws.recv();
      if (data == null) {
        break; //websocket closed
      }
      await this.socket.send(data);
    }
    await this.socket.close();
  }
}
;// CONCATENATED MODULE: ./src/server/http.mjs









let ws_server = null;
if (is_node) {
  ws_server = new external_ws_namespaceObject.WebSocketServer({ noServer: true });
}

function parse_real_ip(headers, client_ip) {
  if (options.parse_real_ip && options.parse_real_ip_from.includes(client_ip)) {
    if (headers["x-forwarded-for"]) {
      return headers["x-forwarded-for"].split(",")[0].trim();
    }
    else if (headers["x-real-ip"]) {
      return headers["x-real-ip"];
    }
  }
  return client_ip;
}

function routeRequest(request, socket, head, options={}) {
  assert_on_node();

  if (request instanceof external_node_http_namespaceObject.IncomingMessage) {
    ws_server.handleUpgrade(request, socket, head, (ws) => {
      create_connection(ws, request.url, request, options);
    });
  }
  else if (request instanceof external_ws_namespaceObject.WebSocket) {
    create_connection(ws, "/", {}), options;
  }
}

async function create_connection(ws, path, request, conn_options) {
  let client_ip = request.socket.address().address;
  let real_ip = parse_real_ip(request.headers, client_ip);
  info(`new connection on ${path} from ${real_ip}`);
  
  try {
    if (path.endsWith("/")) {
      let wisp_conn = new ServerConnection(ws, path, conn_options);
      await wisp_conn.setup();
      await wisp_conn.run();
    }
  
    else {
      let wsproxy = new WSProxyConnection(ws, path, conn_options);
      await wsproxy.setup();
    }  
  }

  catch (error) {
    ws.close();
    if (error instanceof AccessDeniedError) return;
    logging_error("Uncaught server error:\n" + error.stack);
  }
}
;// CONCATENATED MODULE: ./src/server/index.mjs



;// CONCATENATED MODULE: ./src/index.mjs



var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;