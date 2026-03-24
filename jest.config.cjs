/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true , tsconfig: {module: "ESNext",moduleResolution: "bundler"}}] },
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
};
