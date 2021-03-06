
const RocketLogger = require("../lib/index");
const MONGODB_SERVER = "mongodb://localhost:27017/wt-log";
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const helper = require("../lib/helper");
const fs = require("fs");

describe("rocket-logger", () => {

    describe("console transport", () => {
        const logger = RocketLogger.create({
            console: true
        });

        it("test info console", async () => {
            logger.info("this is log message");
            logger.error("this is error message");
            logger.error(new Error("Type invalid"));
            logger.info("this is log message with meta", {
                name: "workiile",
                description: "workiile description"
            });
        });
    });

    describe("db transport", () => {
        let dbClient = null;
        let db = null;

        before(async () => {
            dbClient = await MongoClient.connect(MONGODB_SERVER, {
                poolSize: 1
            });
            db = dbClient.db(dbClient.s.options.dbName);
            await db.collection("logs").remove({});
            await db.collection("errors").remove({});
            await db.collection("custom-logs").remove({});
        });

        after(async () => {
            dbClient.close();
        });

        const dbOptions = {
            mongodbServer: MONGODB_SERVER,
            label: "wt-web"
        };

        const logger = RocketLogger.create({
            db: dbOptions
        });

        const getLogs = (collectionName = "logs") => {
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const logs = await db.collection(collectionName).find({}).toArray();
                    resolve(logs);
                }, 100);
            });
        };

        const assertMessageAndGetLog = (message, logs) => {
            const log = logs.find((log) => {
                return log.message === message;
            });
            assert.notEqual(log, null);
            return log;
        };

        it("info simple message", async () => {
            const message = "this is log message";
            logger.info(message);
            const logs = await getLogs();
            assert.equal(helper.isArray(logs), true);
            assert.equal(logs.length > 0, true);
            const log = assertMessageAndGetLog(message, logs);
            assert.equal(log.level, "info");
            assert.equal(log.label, dbOptions.label);
        });

        it("info simple message with meta string", async () => {
            const message = "this is log message with meta string";
            const meta = "meta for this";
            logger.info(message, meta);
            const logs = await getLogs();
            assert.equal(helper.isArray(logs), true);
            assert.equal(logs.length > 0, true);
            const log = assertMessageAndGetLog(message, logs);
            assert.equal(log.level, "info");
            assert.equal(log.label, dbOptions.label);
            assert.equal(log.meta._metaMessage, meta);
        });

        it("info simple message with meta object", async () => {
            const message = "this is log message with meta object";
            const meta = {
                name: "log meta",
                description: "log meta description"
            };
            logger.info(message, meta);
            const logs = await getLogs();
            assert.equal(helper.isArray(logs), true);
            assert.equal(logs.length > 0, true);
            const log = assertMessageAndGetLog(message, logs);
            assert.equal(log.level, "info");
            assert.equal(log.label, dbOptions.label);
            assert.equal(log.meta.name, meta.name);
            assert.equal(log.meta.description, meta.description);
        });

        it("error simple message", async () => {
            const message = "this is error message";
            logger.error(message);
            const errorLogs = await getLogs("errors");
            assert.equal(helper.isArray(errorLogs), true);
            assert.equal(errorLogs.length > 0, true);
            const log = assertMessageAndGetLog(message, errorLogs);
            assert.equal(log.level, "error");
            assert.equal(log.label, dbOptions.label);
        });

        it("error message with meta object", async () => {
            const message = "this is error message with meta object";
            const meta = {
                error_message: "error message",
                stack: "yes this is stack"
            };
            logger.error(message, meta);
            const errorLogs = await getLogs("errors");
            assert.equal(helper.isArray(errorLogs), true);
            assert.equal(errorLogs.length > 0, true);
            const log = assertMessageAndGetLog(message, errorLogs);
            assert.equal(log.level, "error");
            assert.equal(log.label, dbOptions.label);
            assert.notEqual(log.meta, null);
            assert.equal(log.meta.error_message, meta.error_message);
            assert.equal(log.meta.stack, meta.stack);
        });

        it("error with new Error", async () => {
            const message = "this is custom error message";
            const error = new Error(message);
            error.action = "test";
            logger.error(error);
            const errorLogs = await getLogs("errors");
            assert.equal(helper.isArray(errorLogs), true);
            assert.equal(errorLogs.length > 0, true);
            const log = assertMessageAndGetLog(message, errorLogs);
            assert.equal(log.level, "error");
            assert.equal(log.label, dbOptions.label);
            assert.notEqual(log.meta, null);
            assert.notEqual(log.meta.stack, null);
            assert.equal(log.meta.action, error.action);
        });

        it("error log new Error with meta", async () => {
            const message = "this is custom error message with meta";
            const meta = {
                action: "AddUser",
                user: "why520crazy"
            };
            const error = new Error(message);
            logger.error(error, meta);
            const errorLogs = await getLogs("errors");
            assert.equal(helper.isArray(errorLogs), true);
            assert.equal(errorLogs.length > 0, true);
            const log = assertMessageAndGetLog(message, errorLogs);
            assert.equal(log.level, "error");
            assert.equal(log.label, dbOptions.label);
            assert.notEqual(log.meta, null);
            assert.notEqual(log.meta.stack, null);
            assert.equal(log.meta.action, meta.action);
            assert.equal(log.meta.user, meta.user);
        });

        it("log to my custom collection", async () => {
            const dbOptions = {
                mongodbServer: MONGODB_SERVER,
                collection: "custom-logs",
                errorCollection: "custom-logs",
            };

            const logger = RocketLogger.create({
                db: dbOptions
            });
            const message = "this is custom logger message";
            logger.info(message);
            const logs = await getLogs(dbOptions.collection);
            assert.notEqual(logs, null);
            assert.equal(logs.length > 0, true);
            assert.notEqual(logs[0], null);
            assert.equal(logs[0].message, message);
        });
    });

    describe("file transport", () => {

        const fileTransportOptions = {
            filename: "access.log",
            errorFileName: "error.log",
            dirname: "logs"
        };
        const logger = RocketLogger.create({
            file: fileTransportOptions
        });
        const logFilePath = `${fileTransportOptions.dirname}/${fileTransportOptions.filename}`;
        const errorLogFilePath = `${fileTransportOptions.dirname}/${fileTransportOptions.errorFileName}`;

        before(async () => {
            fs.truncateSync(logFilePath);
            fs.truncateSync(errorLogFilePath);
        });

        const getLatestLog = function (content) {
            const logs = content.toString().split("\n");
            assert.notEqual(logs, null);
            assert.equal(logs.length > 0, true);
            return logs[logs.length - 2];
        };

        const awaitSomeTime = (ms = 100) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        };

        const assertAndGetLog = async () => {
            await awaitSomeTime();
            const content = await fs.readFileSync(logFilePath);
            return getLatestLog(content);
        };

        const assertAndGetErrorLog = async () => {
            await awaitSomeTime();
            const content = await fs.readFileSync(errorLogFilePath);
            return getLatestLog(content);
        };


        it("info simple message", async () => {
            const message = "this is log message";
            logger.info(message);
            const log = await assertAndGetLog();
            assert.equal(log, `{"level":"info","message":"this is log message"}`);
        });

        it("info simple message with meta", async () => {
            const message = "this is log message with meta";
            logger.info(message, {action: "addUser"});
            const log = await assertAndGetLog();
            assert.equal(log, `{"action":"addUser","level":"info","message":"this is log message with meta"}`);
        });


        it("error simple message", async () => {
            const message = "this is error message";
            logger.error(message);
            const errorLog = await assertAndGetErrorLog();
            assert.equal(errorLog, `{"level":"error","message":"this is error message"}`);
        });

        it("error simple message with meta", async () => {
            const message = "this is error message with meta";
            logger.error(message, {meta: "addUser"});
            const errorLog = await assertAndGetErrorLog();
            assert.equal(errorLog, `{"meta":"addUser","level":"error","message":"this is error message with meta"}`);
        });

        it("error Object Error", async () => {
            const message = "this is custom error message";
            const error = new Error(message);
            error.name = "error name";
            logger.error(error);
            const errorLog = await assertAndGetErrorLog();
            const logObject = JSON.parse(errorLog);
            assert.equal(logObject.level, "error");
            assert.equal(logObject.message, message);
            assert.notEqual(logObject.stack, null);
            assert.equal(logObject.name, error.name);
        });

        it("error Object Error with meta", async () => {
            const message = "this is custom error message with meta";
            const error = new Error(message);
            const meta = {
                name: "errorName",
                desc: "error desc"
            };
            logger.error(error, meta);
            const errorLog = await assertAndGetErrorLog();
            const logObject = JSON.parse(errorLog);
            assert.equal(logObject.level, "error");
            assert.equal(logObject.message, message);
            assert.notEqual(logObject.stack, null);
            assert.equal(logObject.name, meta.name);
            assert.equal(logObject.desc, meta.desc);
        });
    });
});
