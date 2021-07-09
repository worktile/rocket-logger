import * as winston from "winston";
import { ElasticsearchTransport } from "./elasticsearch";
import * as elasticsearch from "@elastic/elasticsearch";
import * as _ from "lodash";

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

export class LoggerConfig {
    file: any;
    level: string;
    label: string;
    console: boolean;
    es: any
}

export class RocketLogger {

    private options: LoggerConfig;

    private defaultLogger: winston.Logger;

    private errorLogger: winston.Logger;

    constructor(config: LoggerConfig) {
        this.options = Object.assign(DEFAULT_OPTIONS, config);
        const loggerOptions: winston.LoggerOptions = {};
        const errorLoggerOptions: winston.LoggerOptions = {};

        if (this.options.file) {
            loggerOptions.format = winston.format.logstash();
            loggerOptions.transports = [
                new winston.transports.File(
                    Object.assign({}, this.options.file, {
                        level: "info"
                    })
                )
            ];

            errorLoggerOptions.format = winston.format.logstash();
            errorLoggerOptions.transports = [
                new winston.transports.File(
                    Object.assign({}, this.options.file, {
                        filename: this.options.file.errorFileName,
                        level: "error"
                    })
                )
            ];
        }

        if (this.options.es) {
            const esClient = new elasticsearch.Client(this.options.es);
            // errorLoggerOptions.format = loggerOptions.format = winston.format.logstash();
            errorLoggerOptions.transports = loggerOptions.transports = [
                new ElasticsearchTransport({
                    level: this.options.level,
                    client: esClient,
                    dateStreamName: "wt_logs_gaea"
                })
            ];
        }

        if (this.options.console) {
            if (_.isArray(loggerOptions.transports) && loggerOptions.transports.length) {
                loggerOptions.transports.push(new winston.transports.Console());
            } else {
                errorLoggerOptions.transports = loggerOptions.transports = [new winston.transports.Console()];
            }
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

    getWinstonLoggerMeta(meta: any) {
        if (_.isObject(meta) as any) {
            meta.label = this.options.label;
            return meta;
        } else if (meta) {
            return {
                _metaMessage: meta
            };
        } else {
            return null;
        }
    }

    log(level, message, meta) {
        if (level === "error") {
            this.error(message, meta);
        } else {
            this.defaultLogger.log(level, message, this.getWinstonLoggerMeta(meta));
        }
    }

    public error(message, error?: any) {
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
            } else if (error) {
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
            } else {
                meta = this.getWinstonLoggerMeta(error);
            }
        } else {
            console.warn(`error first argument must be string or error, now is ${message}`);
            if (_.isObject(message)) {
                rawMessage = JSON.stringify(message);
            } else {
                rawMessage = message;
            }
            if (_.isError(error)) {
                meta = this.parseErrorToMeta(error);
            } else if (error) {
                meta = error;
            }
        }
        this.errorLogger.error(rawMessage, meta);
    }

    public debug(message, meta?: any) {
        this.log("debug", message, meta);
    }

    public info(message, meta?: any) {
        this.log("info", message, meta);
    }

    public warn(message, meta?: any) {
        this.log("warn", message, meta);
    }
}
