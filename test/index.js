// const winston = require("winston");
// const MongoDBTransport = require("../lib/transports/mongodb");
// const rawFormat = require('../lib/formats/raw');

// const logger = winston.createLogger({
//     level: 'info',
//     format: rawFormat(),
//     // format: winston.format.simple(),
//     transports: [
//         new winston.transports.MongoDB({
//             mongodbServer: "mongodb://localhost:27017/wt-log"
//         }),
//         new winston.transports.Console({
//         })
//     ]
// });
// logger.info("hello world", {action: "action"});


const RocketLogger = require("../lib/index");

const logger = RocketLogger.create({
    console: true
});

logger.info("this is info");
logger.info("this is info1");
logger.info("this is info", {en: 111});