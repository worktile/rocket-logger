const winston = require("winston");
const MongoDBTransport = require("../lib/transports/mongodb");
const assert = require("assert");
const MongoClient = require("mongodb").MongoClient;
const rawFormat = require("../lib/formats/raw");

const MONGODB_SERVER = "mongodb://localhost:27017/wt-log";

const logger = winston.createLogger({
    level: 'info',
    format: rawFormat(),
    transports: [
        new winston.transports.MongoDB({
            mongodbServer: MONGODB_SERVER,
            label: "wt-web"
        })
    ]
});

describe("mongodb-transport", function () {

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

    it('should log text info to db', async () => {
        const message = "hello world";
        logger.info(message);
        await new Promise((resolve) => {
            setTimeout(async () => {
                const infoLogs = await db.collection("logs").find({}).toArray();
                assert.equal(infoLogs.length >= 1, true);
                const infoLog = infoLogs.find((info) => {
                    return info.message === message;
                });
                assert.notEqual(infoLog, null);
                assert.equal(infoLog.message, message);
                assert.equal(infoLog.level, "info");
                assert.equal(infoLog.label, "wt-web");
                resolve();
            }, 200);
        });
    });

    it('should log meta info to db', async () => {
        const message = "hello world meta";
        const meta = {
            name: "info name",
            description: "info description"
        };
        logger.info(message, meta);
        await new Promise((resolve) => {
            setTimeout(async () => {
                const infoLogs = await db.collection("logs").find({}).toArray();
                assert.equal(infoLogs.length >= 1, true);
                const infoLog = infoLogs.find((info) => {
                    return info.message === message;
                });
                assert.notEqual(infoLog, null);
                assert.equal(infoLog.message, message);
                assert.equal(infoLog.level, "info");
                assert.equal(infoLog.label, "wt-web");
                resolve();
            }, 200);
        });
    });

    it('should log meta text info to db', async () => {
        const message = "hello world meta";
        logger.info(message);
        await new Promise((resolve) => {
            setTimeout(async () => {
                const infoLogs = await db.collection("logs").find({}).toArray();
                assert.equal(infoLogs.length >= 1, true);
                const infoLog = infoLogs.find((info) => {
                    return info.message === message;
                });
                assert.notEqual(infoLog, null);
                assert.equal(infoLog.message, message);
                assert.equal(infoLog.level, "info");
                assert.equal(infoLog.label, "wt-web");
                resolve();
            }, 200);
        });
    });
});