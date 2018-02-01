module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "parser": "babel-eslint",
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "globals": {
        "it": true,
        "after": true,
        "before": true,
        "describe": true
    },
    "rules": {
        "no-console": 0,
        "linebreak-style": [
            "error",
            "unix"
        ],
        //"quotes": [
        //    "error"
        //],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars": 0
    }
};