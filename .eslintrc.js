module.exports = {
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "./tsconfig.json"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "rules": {
        "@typescript-eslint/explicit-function-return-type": 0,
        '@typescript-eslint/no-use-before-define': 0,

        // Only allow unused vars/params prefixed with underscores, as a special case where we intentionally want an
        // unused variable kept for readability.
        '@typescript-eslint/no-unused-vars': ['error', { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    }
}