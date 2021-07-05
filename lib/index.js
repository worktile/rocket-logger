"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketLogger = exports.LoggerConfig = void 0;
const winston = require("winston");
const elasticsearch_1 = require("./elasticsearch");
const elasticsearch = require("@elastic/elasticsearch");
const _ = require("lodash");
const DEFAULT_OPTIONS = {
    file: {
        filename: "access.log",
        errorFileName: "error.log",
        dirname: "logs",
        maxsize: 1024 * 1024 * 10,
        maxFiles: 10
    },
    level: "info",
    label: "unknown"
};
class LoggerConfig {
}
exports.LoggerConfig = LoggerConfig;
class RocketLogger {
    constructor(config) {
        this.options = Object.assign(DEFAULT_OPTIONS, config);
        const loggerOptions = {};
        const errorLoggerOptions = {};
        if (this.options.file) {
            loggerOptions.format = winston.format.logstash();
            loggerOptions.transports = [
                new winston.transports.File(Object.assign({}, this.options.file, {
                    level: "info"
                }))
            ];
            errorLoggerOptions.format = winston.format.logstash();
            errorLoggerOptions.transports = [
                new winston.transports.File(Object.assign({}, this.options.file, {
                    filename: this.options.file.errorFileName,
                    level: "error"
                }))
            ];
        }
        if (this.options.es) {
            const esClient = new elasticsearch.Client(this.options.es);
            // errorLoggerOptions.format = loggerOptions.format = winston.format.logstash();
            errorLoggerOptions.transports = loggerOptions.transports = [
                new elasticsearch_1.ElasticsearchTransport({
                    level: this.options.level,
                    client: esClient,
                    dateStreamName: "wt_logs_gaea"
                })
            ];
        }
        if (this.options.console) {
            errorLoggerOptions.format = loggerOptions.format = winston.format.combine(winston.format.colorize(), winston.format.simple());
            errorLoggerOptions.transports = loggerOptions.transports = [new winston.transports.Console()];
        }
        this.defaultLogger = winston.createLogger(loggerOptions);
        // to split error log to a difference store
        this.errorLogger = winston.createLogger(errorLoggerOptions);
    }
    parseErrorToMeta(error) {
        const names = Object.getOwnPropertyNames(error);
        const meta = {};
        names.forEach(name => {
            if (name !== "message") {
                meta[name] = error[name];
            }
        });
        return meta;
    }
    getWinstonLoggerMeta(meta) {
        if (_.isObject(meta)) {
            meta.label = this.options.label;
            return meta;
        }
        else if (meta) {
            return {
                _metaMessage: meta
            };
        }
        else {
            return null;
        }
    }
    log(level, message, meta) {
        if (level === "error") {
            this.error(message, meta);
        }
        else {
            this.defaultLogger.log(level, message, this.getWinstonLoggerMeta(meta));
        }
    }
    error(message, error) {
        let meta = null;
        let rawMessage = null;
        // 第一次参数是 Error，把 Error.message 当做 message，
        // 第二个参数是 meta 数据，合并 Error 的属性到 meta 对象中, meta 兼容字符串
        if (_.isError(message)) {
            const rawError = message;
            rawMessage = rawError.message;
            meta = this.parseErrorToMeta(rawError);
            if (_.isObject(error)) {
                Object.assign(meta, error);
            }
            else if (error) {
                Object.assign(meta, {
                    _metaMessage: error
                });
            }
        }
        // 第一个参数是 message，第二个是 Error
        else if (_.isString(message)) {
            rawMessage = message;
            if (_.isError(error)) {
                meta = this.parseErrorToMeta(error);
            }
            else {
                meta = this.getWinstonLoggerMeta(error);
            }
        }
        else {
            console.warn(`error first argument must be string or error, now is ${message}`);
            if (_.isObject(message)) {
                rawMessage = JSON.stringify(message);
            }
            else {
                rawMessage = message;
            }
            if (_.isError(error)) {
                meta = this.parseErrorToMeta(error);
            }
            else if (error) {
                meta = error;
            }
        }
        this.errorLogger.error(rawMessage, meta);
    }
    debug(message, meta) {
        this.log("debug", message, meta);
    }
    info(message, meta) {
        this.log("info", message, meta);
    }
    warn(message, meta) {
        this.log("warn", message, meta);
    }
}
exports.RocketLogger = RocketLogger;
