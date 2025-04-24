"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const Types_js_1 = require("../Types.js");
class Logger {
    constructor(logLevel) {
        this.logLevel = logLevel;
    }
    getTimestamp() {
        let [date, time] = new Date().toJSON().split("T");
        date = date.replaceAll("-", "/");
        time = time.split(".")[0];
        return `[${date} - ${time}]`;
    }
    debug(...messages) {
        if (this.logLevel > Types_js_1.LOG_LEVEL.DEBUG)
            return;
        console.debug(this.getTimestamp() + " debug:", ...messages);
    }
    info(...messages) {
        if (this.logLevel > Types_js_1.LOG_LEVEL.INFO)
            return;
        console.info(this.getTimestamp() + " info:", ...messages);
    }
    log(...messages) {
        if (this.logLevel > Types_js_1.LOG_LEVEL.INFO)
            return;
        console.log(this.getTimestamp() + " log:", ...messages);
    }
    warn(...messages) {
        if (this.logLevel > Types_js_1.LOG_LEVEL.WARN)
            return;
        console.warn(this.getTimestamp() + " warn:", ...messages);
    }
    error(...messages) {
        if (this.logLevel > Types_js_1.LOG_LEVEL.ERROR)
            return;
        console.error(this.getTimestamp() + " error:", ...messages);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map