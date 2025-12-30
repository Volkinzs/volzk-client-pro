const { BrowserWindow, ipcMain, app, shell } = require("electron");
const { default_settings, allowed_urls } = require("../util/defaults.json");
const { registerShortcuts } = require("../util/shortcuts");
const { applySwitches } = require("../util/switches");
const DiscordRPC = require("../addons/rpc");
const path = require("path");
const Store = require("electron-store");
const fs = require("fs");

const store = new Store();
if (!store.has("settings")) {
  store.set("settings", default_settings);
}

const settings = store.get("settings");

for (const key in default_settings) {
  if (
    !settings.hasOwnProperty(key) ||
    typeof settings[key] !== typeof default_settings[key]
  ) {
    settings[key] = default_settings[key];
    store.set("settings", settings);
  }
}

if (!allowed_urls.includes(settings.base_url)) {
  settings.base_url = default_settings.base_url;
  store.set("settings", settings);
}

ipcMain.on("get-settings", (e) => {
  e.returnValue = settings;
});

ipcMain.on("update-setting", (e, key, value) => {
  settings[key] = value;
  store.set("settings", settings);
});

ipcMain.on("open-swapper-folder", () => {
  const swapperPath = path.join(
    app.getPath("documents"),
    "JuiceClient/swapper/assets"
  );

  if (!fs.existsSync(swapperPath)) {
    fs.mkdirSync(swapperPath, { recursive: true });
    shell.openPath(swapperPath);
  } else {
    shell.openPath(swapperPath);
  }
});

ipcMain.on("open-scripts-folder", () => {
  const scriptsPath = path.join(
    app.getPath("documents"),
    "JuiceClient/scripts"
  );

  if (!fs.existsSync(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
    shell.openPath(scriptsPath);
  } else {
    shell.openPath(scriptsPath);
  }
});

ipcMain.on("reset-juice-settings", () => {
  store.set("settings", default_settings);
  app.relaunch();
  app.quit();
});

ipcMain.on("restart-client", () => {
  app.relaunch();
  app.quit();
});

ipcMain.on("clear-cache", async (e) => {
  const ses = require("electron").session.defaultSession;
  await ses.clearCache();
  await ses.clearStorageData({
    storages: ["appcache", "cookies", "filesystem", "indexdb", "localstorage", "shadercache", "websql", "serviceworkers", "cachestorage"]
  });
  e.returnValue = true;
});

ipcMain.on("open-skins-folder", () => {
  const skinsPath = path.join(
    app.getPath("documents"),
    "JuiceClient/skins"
  );

  if (!fs.existsSync(skinsPath)) {
    fs.mkdirSync(skinsPath, { recursive: true });
  }
  shell.openPath(skinsPath);
});

let gameWindow;

applySwitches(settings);

const createWindow = () => {
  gameWindow = new BrowserWindow({
    fullscreen: settings.auto_fullscreen,
    icon: path.join(__dirname, "../assets/img/icon.png"),
    title: "Volzk Client PRO",
    width: 1280,
    height: 720,
    show: false,
    backgroundColor: "#141414",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      preload: path.join(__dirname, "../preload/game.js"),
    },
    // Spoof User-Agent to evade checks
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  // Auto Proxy Logic (Bypass IP Ban)
  if (settings.auto_proxy) {
    // List of public proxies (Mix of US/EU/BR to ensure connectivity)
    const publicProxies = [
      "http://20.206.106.192:80",
      "http://20.210.113.32:80",
      "http://51.158.154.173:3128",
      "http://51.159.115.233:3128",
      "http://198.199.86.11:8080",
      "http://165.22.236.21:80",
      "http://143.198.228.243:80"
    ];

    const randomProxy = publicProxies[Math.floor(Math.random() * publicProxies.length)];

    console.log('[Volzk] Enabling Auto Proxy to bypass IP Ban...');
    gameWindow.webContents.session.setProxy({ proxyRules: randomProxy })
      .then(() => console.log('[Volzk] Auto Proxy SET:', randomProxy))
      .catch(err => console.error('[Volzk] Proxy error:', err));
  }

  const scriptsPath = path.join(
    app.getPath("documents"),
    "JuiceClient",
    "scripts"
  );
  if (!fs.existsSync(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
  }

  ipcMain.on("get-scripts-path", (e) => {
    e.returnValue = scriptsPath;
  });

  gameWindow.webContents.on("new-window", (e, url) => {
    e.preventDefault();
    require("electron").shell.openExternal(url);
  });

  gameWindow.webContents.on("did-navigate-in-page", (e, url) => {
    gameWindow.webContents.send("url-change", url);

    if (settings.discord_rpc && gameWindow.DiscordRPC) {
      const base_url = settings.base_url;
      const stateMap = {
        [`${base_url}`]: "In the lobby",
        [`${base_url}hub/leaderboard`]: "Viewing the leaderboard",
        [`${base_url}hub/clans/champions-league`]:
          "Viewing the clan leaderboard",
        [`${base_url}hub/clans/my-clan`]: "Viewing their clan",
        [`${base_url}hub/market`]: "Viewing the market",
        [`${base_url}hub/live`]: "Viewing videos",
        [`${base_url}hub/news`]: "Viewing news",
        [`${base_url}hub/terms`]: "Viewing the terms of service",
        [`${base_url}store`]: "Viewing the store",
        [`${base_url}servers/main`]: "Viewing main servers",
        [`${base_url}servers/parkour`]: "Viewing parkour servers",
        [`${base_url}servers/custom`]: "Viewing custom servers",
        [`${base_url}quests/hourly`]: "Viewing hourly quests",
        [`${base_url}friends`]: "Viewing friends",
        [`${base_url}inventory`]: "Viewing their inventory",
      };

      let state;

      if (stateMap[url]) {
        state = stateMap[url];
      } else if (url.startsWith(`${base_url}games/`)) {
        state = "In a match";
      } else if (url.startsWith(`${base_url}profile/`)) {
        state = "Viewing a profile";
      } else {
        state = "In the lobby";
      }

      gameWindow.DiscordRPC.setState(state);
    }
  });

  gameWindow.loadURL(settings.base_url);
  gameWindow.webContents.setUserAgent(
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.116 Safari/537.36 Electron/10.4.7 JuiceClient/${app.getVersion()}`
  );
  gameWindow.removeMenu();
  gameWindow.maximize();

  gameWindow.once("ready-to-show", () => {
    gameWindow.show();
  });

  registerShortcuts(gameWindow);

  gameWindow.on("page-title-updated", (e) => e.preventDefault());

  gameWindow.on("closed", () => {
    ipcMain.removeAllListeners("get-settings");
    ipcMain.removeAllListeners("update-setting");
    gameWindow = null;
  });
};

const initGame = () => {
  createWindow();
  if (settings.discord_rpc) {
    gameWindow.DiscordRPC = new DiscordRPC();
  }
};

module.exports = {
  initGame,
};
