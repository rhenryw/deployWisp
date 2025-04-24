"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wispFrameParser = wispFrameParser;
exports.connectPacketParser = connectPacketParser;
exports.continuePacketMaker = continuePacketMaker;
exports.closePacketMaker = closePacketMaker;
exports.dataPacketMaker = dataPacketMaker;
const Types_js_1 = require("./Types.js");
function wispFrameParser(data) {
    const uint8arrayView = new Uint8Array(data);
    const dataView = new DataView(uint8arrayView.buffer);
    const type = dataView.getUint8(0);
    let streamID = dataView.getUint32(1, true);
    let payload = uint8arrayView.slice(5, uint8arrayView.byteLength);
    return {
        type,
        streamID,
        payload,
    };
}
function connectPacketParser(payload) {
    const dataview = new DataView(payload.buffer);
    const streamType = dataview.getUint8(0);
    const port = dataview.getUint16(1, true);
    const hostname = new TextDecoder("utf8").decode(dataview.buffer.slice(3, dataview.buffer.byteLength));
    return {
        dataview,
        streamType,
        port,
        hostname,
    };
}
function continuePacketMaker(wispFrame, queue) {
    const initialPacket = new DataView(new Uint8Array(9).buffer);
    initialPacket.setUint8(0, Types_js_1.PACKET_TYPE.CONTINUE);
    initialPacket.setUint32(1, wispFrame.streamID, true);
    initialPacket.setUint32(5, queue, true);
    return initialPacket.buffer;
}
function closePacketMaker(wispFrame, reason) {
    const closePacket = new DataView(new Uint8Array(9).buffer);
    closePacket.setUint8(0, Types_js_1.PACKET_TYPE.CLOSE);
    closePacket.setUint32(1, wispFrame.streamID, true);
    closePacket.setUint8(5, reason);
    return closePacket.buffer;
}
function dataPacketMaker(wispFrame, data) {
    const dataPacketHeader = new DataView(new Uint8Array(5).buffer);
    dataPacketHeader.setUint8(0, Types_js_1.PACKET_TYPE.DATA);
    dataPacketHeader.setUint32(1, wispFrame.streamID, true);
    return Buffer.concat([Buffer.from(dataPacketHeader.buffer), data]);
}
exports.default = {
    wispFrameParser,
    connectPacketParser,
    continuePacketMaker,
    closePacketMaker,
    dataPacketMaker,
};
//# sourceMappingURL=Packets.js.map