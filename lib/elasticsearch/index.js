"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchTransport = void 0;
const transformer_1 = require("./transformer");
const Transport = require("winston-transport");
const bulk = [];
class ElasticsearchTransport extends Transport {
    constructor(options) {
        super(options);
        this.dataStreamName = options.dateStreamName;
        this.esClient = options.client;
        this.schedule();
    }
    log(info, callback) {
        //  尽量不阻塞正常方法
        setTimeout(() => {
            const entry = transformer_1.transformer(info);
            this.append(entry);
            callback();
        }, 0);
    }
    append(logData) {
        bulk.push(logData);
        if (bulk.length > 100) {
            this.tick();
        }
    }
    tick() {
        if (bulk.length === 0) {
            return;
        }
        const newBulk = bulk.splice(0);
        const body = [];
        for (const doc of newBulk) {
            // Name of the data stream, index, or index alias to perform the action on.
            body.push({ create: { _index: this.dataStreamName } }, doc);
        }
        this.esClient
            .bulk({ body })
            .then(response => {
            const res = response.body;
            if (res && res.errors && res.items) {
                res.items.forEach((item, itemIndex) => {
                    if (item.index && item.index.error) {
                        const operation = Object.keys(item)[0];
                        // 暂时对错误只错打印处理
                        console.error(`log to es error ${JSON.stringify({
                            error: item[operation].error,
                            document: body[itemIndex * 2 + 1]
                        })}`);
                    }
                });
            }
        })
            .catch(e => {
            console.error(`save log to es error ${e}`);
        });
    }
    schedule() {
        // 保证每两秒最少执行一次，防止期间崩溃时候日志丢失
        setInterval(() => {
            this.tick();
        }, 2000);
    }
}
exports.ElasticsearchTransport = ElasticsearchTransport;
