module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom-thirteen',
    verbose: true,
    transformIgnorePatterns: [],
    setupFiles: [
        "jsdom-worker",
    ],
    transform: {
        ".*(?:xml|glsl)$": "<rootDir>/tests/loaders/string.js",
        ".*(?:ts|tsx|js|xml|glsl)$": "ts-jest",
    },

};