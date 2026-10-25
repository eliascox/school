const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Block watching apps/web/.next to prevent crash during Next.js builds
config.resolver.blockList = [
  /.*[/\\]apps[/\\]web[/\\]\.next[/\\].*/,
];

module.exports = config;
