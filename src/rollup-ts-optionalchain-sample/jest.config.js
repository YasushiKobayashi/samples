const jest = require('../../jest.config');

jest.moduleNameMapper = { ...jest.moduleNameMapper, '@/(.*)$': '<rootDir>/src/$1' };

module.exports = jest;
