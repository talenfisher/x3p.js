module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    transformIgnorePatterns: [],
    transform: {
        ".*(?:xml)$": "<rootDir>/tests/loaders/string.js",
        ".*(?:ts|tsx|js|xml)$": "ts-jest",
    },

};