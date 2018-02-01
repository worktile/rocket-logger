
const RocketLogger = require("../lib/index");
const MONGODB_SERVER = "mongodb://localhost:27017/wt-log";
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const helper = require("../lib/helper");

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
        let db = null;

        before(async () => {
            const client = await MongoClient.connect(MONGODB_SERVER, {
                poolSize: 1
            });
            db = client.db(client.s.options.dbName);
            await db.collection("logs").remove({});
            await db.collection("errors").remove({});
        });

        after(async () => {
            // db.close();
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
                }, 300);
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
    });

});
