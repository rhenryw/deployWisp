import { LOG_LEVEL } from "../Types.js";
export declare class Logger {
    logLevel: number;
    constructor(logLevel: LOG_LEVEL);
    getTimestamp(): string;
    debug(...messages: any): void;
    info(...messages: any): void;
    log(...messages: any): void;
    warn(...messages: any): void;
    error(...messages: any): void;
}
