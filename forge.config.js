const path = require('path');
const fs = require('fs');
const ncp = require('ncp').ncp;

module.exports = {
  packagerConfig: {
    icon: "./src/Assets/icon.icns",
    asar: true,
    name: "dot",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'dot', // Replace with your app name
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};