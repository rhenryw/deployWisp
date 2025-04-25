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
  "packet": () => (/* reexport */ packet_namespaceObject)
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


;// CONCATENATED MODULE: ./src/entrypoints/client.mjs


var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;