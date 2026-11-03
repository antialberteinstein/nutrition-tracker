/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts?(x)"],
  collectCoverageFrom: ["src/domain/**/*.ts", "src/schemas/**/*.ts"],
};
