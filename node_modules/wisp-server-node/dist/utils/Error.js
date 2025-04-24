"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkErrorCode = checkErrorCode;
function checkErrorCode(err) {
    switch (err.code) {
        case "ECONNRESET":
            return 0x02;
        case "EHOSTUNREACH":
            return 0x42;
        case "ETIMEDOUT":
            return 0x43;
        case "ECONNREFUSED":
            return 0x44;
        default:
            return 0x03;
    }
}
//# sourceMappingURL=Error.js.map