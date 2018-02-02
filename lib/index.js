const winston = require("winston");
const MongoDBTransport = require("./transports/mongodb");
const rawFormat = require("./formats/raw");
const helper = require("./helper");

const DEFAULT_OPTIONS = {
    file: {
        filename: "combined.log",
        errorFileName: "error.log",
        dirname: "logs",
        // maxsize: 1024 * 1024 * 10,
        // maxFiles: 10,
    },
    db: {
        mongodbServer: "",
    },
    console: {
        colorize: true
    },
    level: "info"
};

class RocketLogger {

    constructor(options) {
        this.options = options;

        if (this.options.file) {
            const fileOptions = Object.assign({}, DEFAULT_OPTIONS.file, this.options.file);
            this.defaultLogger = winston.createLogger({
                level: this.getLevel('file'),
                format: winston.format.json(),
                transports: [
                    new winston.transports.File(fileOptions)
                ]
            });
            this.errorLogger = winston.createLogger({
                level: "error",
                format: winston.format.json(),
                transports: [
                    new winston.transports.File(fileOptions)
                ]
            });
        }

        if (this.options.db) {
            this.defaultLogger = this.errorLogger = winston.createLogger({
                level: this.getLevel('db'),
                format: rawFormat(),
                transports: [
                    new MongoDBTransport(this.options.db)
                ]
            });
        }

        if (this.options.console) {
            this.defaultLogger = this.errorLogger = winston.createLogger({
                level: this.getLevel('console'),
                // format: winston.format.simple(),
                format: rawFormat(),
                transports: [
                    new winston.transports.Console(this.options.console)
                ]
            });
        }

    }

    static create(options) {
        return new RocketLogger(options);
    }

    getLevel(transportName) {
        if (transportName && this.options[transportName] && this.options[transportName].level) {
            return this.options[transportName].level;
        } else {
            return this.options.level;
        }
    }

    log(level, message, meta) {
        this.defaultLogger.log(level, message, this.getWinstonLoggerMeta(meta));
    }

    parseErrorToMeta(error) {
        const names = Object.getOwnPropertyNames(error);
        const meta = {};
        names.forEach((name) => {
            if (name !== "message") {
                meta[name] = error[name];
            }
        });
        return meta;
    }

    getWinstonLoggerMeta(meta) {
        if (helper.isObject(meta)) {
            return meta;
        } else if (meta) {
            return {
                _metaMessage: meta
            };
        } else {
            return null;
        }
    }

    error(message, error) {
        let meta = null;
        let rawMessage = null;
        // 第一次参数是 Error，把 Error.message 当做 message，
        // 第二个参数是 meta 数据，合并 Error 的属性到 meta 对象中, meta 兼容字符串
        if (helper.isError(message)) {
            const rawError = message;
            rawMessage = rawError.message;
            meta = this.parseErrorToMeta(rawError);
            if (helper.isObject(error)) {
                Object.assign(meta, error);
            } else if (error) {
                Object.assign(meta, {
                    _metaMessage: error
                });
            }
        }
        // 第一个参数是 message，第二个是 Error
        else if (helper.isString(message)) {
            rawMessage = message;
            if (helper.isError(error)) {
                meta = this.parseErrorToMeta(error);
            } else {
                meta = this.getWinstonLoggerMeta(error);
            }
        } else {
            console.warn(`error first argument must be string or error, now is ${message}`);
            if (helper.isObject(message)) {
                rawMessage = JSON.stringify(message);
            } else {
                rawMessage = message;
            }
            if (helper.isError(error)) {
                meta = this.parseErrorToMeta(error);
            } else if (error) {
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

module.exports = RocketLogger;