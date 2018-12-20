module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  transformIgnorePatterns: [],
  transform: {".*": "ts-jest"},
  globals: {
      "ts-jest": {
          tsConfig: {
              allowJs: true
          }
      }
  }
};