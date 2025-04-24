export type WispFrame = {
    type: PACKET_TYPE;
    streamID: number;
    payload: Uint8Array;
};
export declare enum PACKET_TYPE {
    CONNECT = 1,
    DATA = 2,
    CONTINUE = 3,
    CLOSE = 4
}
export declare enum STREAM_TYPE {
    TCP = 1,
    UDP = 2
}
export declare enum LOG_LEVEL {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export type WispOptions = {
    logLevel: LOG_LEVEL;
    pingInterval: number;
};
