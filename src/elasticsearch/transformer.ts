import isObject from "lodash.isobject";

export const transformer = function(logData) {
    const transformed: any = {};
    transformed["@timestamp"] = logData.timestamp ? logData.timestamp : new Date().toISOString();
    transformed.message = logData.message;
    transformed.level = logData.level;
    transformed.label = logData.label || "unknown";

    delete logData.message;
    delete logData.level;
    delete logData.label;

    // 针对meta中一些复杂数据进行处理，防止es动态 mapping 过多字段
    // 非预期的字段统一放到 extends中进行处理
    if (logData) {
        try {
            const meta = logData;
            const newMeta: any = {};

            const allowKeys = [
                "ip",
                "path",
                "action",
                "apiMemoryUsed",
                "client",
                "referer",
                "ua",
                "url",
                "error",
                "stack",
                "date",
                "endInNode",
                "error",
                "oid",
                "pid",
                "hostname",
                "resTime",
                "startReqResTime",
                "statusCode",
                "teamId",
                "uid",
                "method"
            ];
            const convertToTextKey = ["request", "meta", "response", "sso_user", "config", "reminder", "team"];
            const ext: any = {};
            for (const key of Object.keys(meta)) {
                if (allowKeys.includes(key)) {
                    newMeta[key] = meta[key];
                } else if (convertToTextKey.includes(key)) {
                    if (isObject(meta[key])) {
                        newMeta[key] = JSON.stringify(meta[key]);
                    } else {
                        newMeta[key] = meta[key];
                    }
                } else {
                    ext[key] = meta[key];
                }
            }
            newMeta.ext = JSON.stringify(ext);
            transformed.meta = newMeta;
        } catch (error) {
            transformed.message = JSON.stringify(logData.meta);
        }
    }

    return transformed;
};
