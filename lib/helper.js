const errorTag = "[object Error]";
const arrayTag = "[object Array]";
const objectProto = Object.prototype;
const objToString = objectProto.toString;

module.exports = {
    isObject(value) {
        var type = typeof value;
        return !!value && (type == 'object' || type == 'function');
    },
    isString(value) {
        return typeof value == 'string';
    },
    isError(value) {
        return value && value.message && objToString.call(value) === errorTag;
    },
    isArray(value) {
        return value && value.length && objToString.call(value) === arrayTag;
    }
};