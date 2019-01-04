module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    transformIgnorePatterns: [],
    transform: {
        ".*(?:xml|glsl)$": "<rootDir>/tests/loaders/string.js",
        ".*(?:ts|tsx|js|xml|glsl)$": "ts-jest",
    },

};