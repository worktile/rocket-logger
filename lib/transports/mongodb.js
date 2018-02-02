const util = require('util');
const winston = require('winston');
const os = require("os");
const mongodb = require('mongodb');
const {LEVEL, MESSAGE} = require('triple-beam');
const META = Symbol.for("meta");

class MongoDB extends winston.Transport {

    constructor(options) {
        super(options);
        if (!options.mongodbServer) {
            throw new Error('You should provide mongodbServer to log to.');
        }
        this.options = options;
        this.collection = (options.collection || 'logs');
        this.errorCollection = (options.errorCollection || 'errors');
        this.mongodbOptions = options.mongodbOptions;
        if (!this.mongodbOptions) {
            this.mongodbOptions = {
                poolSize: 2,
                autoReconnect: true
            };
        }
        this.label = options.label || "default";
        this._logQueue = [];
        this.connectMongoDD();
    }

    async connectMongoDD() {
        try {
            const client = await mongodb.connect(this.options.mongodbServer, this.mongodbOptions);
            this.logDb = client.db(client.s.options.dbName);
            await this.processLogQueue();
        } catch (error) {
            console.error('winston-mongodb: error initialing logger', error);
        }
    }

    async processLogQueue() {
        this._logQueue.forEach(operation => {
            this[operation.method].apply(this, operation.args);
        });
        delete this._logQueue;
    }

    log(info, callback) {
        if (this.logDb) {
            process.nextTick(() => {
                const meta = info[META];
                const entry = Object.assign({
                    level: info.level,
                    timestamp: new Date().getTime(),
                    message: info.message,
                    meta: meta,
                    hostname: os.hostname(),
                    label: this.label,
                    oid: meta && meta.oid
                });
                const collectionName = info.level === "error" ? this.errorCollection : this.collection;
                this.logDb.collection(collectionName).insertOne(entry).then(() => {
                    this.emit('logged');
                    callback(null, true);
                }).catch(error => {
                    this.emit('error', error);
                    console.error(error);
                    callback(error);
                });
            });
        } else {
            this._logQueue.push({method: 'log', args: arguments});
            return;
        }
    }
}

winston.transports.MongoDB = MongoDB;

module.exports = MongoDB;