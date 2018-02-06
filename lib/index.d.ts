import { Transports } from "winston";

// interface Transports {
//     File: FileTransportInstance;
//     Console: ConsoleTransportInstance;
//     Loggly: WinstonModuleTrasportInstance;
//     DailyRotateFile: DailyRotateFileTransportInstance;
//     Http: HttpTransportInstance;
//     Memory: MemoryTransportInstance;
//     Webhook: WebhookTransportInstance;
// }

interface FileTransportOptions extends Transports.FileTransportOptions {
    errorFileName?: string
}

interface MongoDBTransportOptions {
    mongodbServer: string;
    collection: string;
    errorCollection: string;
    mongodbOptions: any;
    label: string;
}

interface RocketLoggerOptions {
    file?: FileTransportOptions | boolean;
    db?: MongoDBTransportOptions | boolean;
    console?: Transports.ConsoleTransportOptions | boolean;
}
declare class RocketLogger {
    static create(options: RocketLoggerOptions): RocketLogger;

    log(level: string, message: string | Error | object, meta?: object | string): void;

    error(message: string | Error, meta?: Error | object | string);

    debug(message: string, meta?: object);

    info(message: string, meta?: object);

    warn(message: string, meta?: object);
}