'use strict';

module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testEnvironment: 'node',
  transform: {
    [/^.+\.tsx?$/.source]: 'ts-jest',
  },
  testRegex: [
    /.\/tests\/.+\.test\.ts$/.source,
    /.\/tests\/eslint-scope\/[^/]+\.test\.ts$/.source,
  ],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageReporters: ['text-summary', 'lcov'],
};