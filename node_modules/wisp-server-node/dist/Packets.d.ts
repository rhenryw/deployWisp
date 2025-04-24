import { WispFrame } from "./Types.js";
export declare function wispFrameParser(data: Buffer): WispFrame;
export declare function connectPacketParser(payload: Uint8Array): {
    dataview: DataView;
    streamType: number;
    port: number;
    hostname: string;
};
export declare function continuePacketMaker(wispFrame: WispFrame, queue: number): ArrayBuffer;
export declare function closePacketMaker(wispFrame: WispFrame, reason: number): ArrayBuffer;
export declare function dataPacketMaker(wispFrame: WispFrame, data: any): Buffer;
declare const _default: {
    wispFrameParser: typeof wispFrameParser;
    connectPacketParser: typeof connectPacketParser;
    continuePacketMaker: typeof continuePacketMaker;
    closePacketMaker: typeof closePacketMaker;
    dataPacketMaker: typeof dataPacketMaker;
};
export default _default;
