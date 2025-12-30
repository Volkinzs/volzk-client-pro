// IP Bypass must be loaded FIRST to patch network stack
require("./util/ip-bypass");
require("v8-compile-cache");
const { app } = require("electron");
const { initSplash } = require("./windows/splash");
const { initResourceSwapper } = require("./addons/swapper");

app.on("ready", () => {
  initSplash();
  initResourceSwapper();
});

app.on("window-all-closed", () => app.quit());
