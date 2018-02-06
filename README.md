# 🚀 rocket-logger
a sample logger wrapper base on [winston 3.x](https://github.com/winstonjs/winston)

## Features

1. support log to MongoDB;
1. quickly create owner logger by configuration options;

## Installation

`npm install @worktile/rocket-logger --save`

## Usage
```
const options = {
    db: {
        mongodbServer: "mongodb://localhost:27017/wt-log",
        collection: "", // default logs
        errorCollection: "", // default errors
        mongodbOptions: {}, // Mongodb connect options
    },
    console: true,
    file: {
        filename: "access.log",
        errorFileName: "error.log",
        dirname: "logs",
        maxsize: 1024 * 1024 * 10,
        maxFiles: 10
    }
};
const logger = RocketLogger.create(options);

logger.debug("this is debug message");
logger.info("this is info message");
logger.warn("this is warn message");
logger.error("this is error message");
logger.info("this is info message", {
    action: "add user"
});

logger.error("this is error message", new Error("Custom Error"));
logger.error(new Error("Custom Error"));
logger.error(new Error("Custom Error"), {
    action: "Get Custom Data"
});

```
