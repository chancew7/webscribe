const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8081",
    chromeWebSecurity: false,
    supportFile: false,
    specPattern: 'tests/cypress_tests/*.spec.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
    },
  },
});
