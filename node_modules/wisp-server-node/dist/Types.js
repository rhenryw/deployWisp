"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVEL = exports.STREAM_TYPE = exports.PACKET_TYPE = void 0;
var PACKET_TYPE;
(function (PACKET_TYPE) {
    PACKET_TYPE[PACKET_TYPE["CONNECT"] = 1] = "CONNECT";
    PACKET_TYPE[PACKET_TYPE["DATA"] = 2] = "DATA";
    PACKET_TYPE[PACKET_TYPE["CONTINUE"] = 3] = "CONTINUE";
    PACKET_TYPE[PACKET_TYPE["CLOSE"] = 4] = "CLOSE";
})(PACKET_TYPE || (exports.PACKET_TYPE = PACKET_TYPE = {}));
var STREAM_TYPE;
(function (STREAM_TYPE) {
    STREAM_TYPE[STREAM_TYPE["TCP"] = 1] = "TCP";
    STREAM_TYPE[STREAM_TYPE["UDP"] = 2] = "UDP";
})(STREAM_TYPE || (exports.STREAM_TYPE = STREAM_TYPE = {}));
var LOG_LEVEL;
(function (LOG_LEVEL) {
    LOG_LEVEL[LOG_LEVEL["DEBUG"] = 0] = "DEBUG";
    LOG_LEVEL[LOG_LEVEL["INFO"] = 1] = "INFO";
    LOG_LEVEL[LOG_LEVEL["WARN"] = 2] = "WARN";
    LOG_LEVEL[LOG_LEVEL["ERROR"] = 3] = "ERROR";
    LOG_LEVEL[LOG_LEVEL["NONE"] = 4] = "NONE";
})(LOG_LEVEL || (exports.LOG_LEVEL = LOG_LEVEL = {}));
//# sourceMappingURL=Types.js.map