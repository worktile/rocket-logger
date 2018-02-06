import { FileTransportOptions, ConsoleTransportOptions } from "winston";

declare class RocketLogger {
    static create(options?: RocketLogger.RocketLoggerOptions): RocketLogger;

    log(level: string, message: string | Error | object, meta?: object | string): void;

    error(message: string | Error, meta?: Error | object | string): void;

    debug(message: string, meta?: object): void;

    info(message: string, meta?: object): void;

    warn(message: string, meta?: object): void;
}

export = RocketLogger;

declare namespace RocketLogger {
    export interface ExtendFileTransportOptions extends FileTransportOptions {
        errorFileName?: string
    }
    
    export interface MongoDBTransportOptions {
        mongodbServer: string;
        collection: string;
        errorCollection: string;
        mongodbOptions: any;
        label: string;
    }
    
    export interface RocketLoggerOptions {
        file?: ExtendFileTransportOptions | boolean;
        db?: MongoDBTransportOptions | boolean;
        console?: ConsoleTransportOptions | boolean;
    }
    
}

