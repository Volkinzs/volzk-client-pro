const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { version } = require("../../package.json");

class Menu {
  constructor() {
    this.settings = ipcRenderer.sendSync("get-settings");
    this.menuCSS = fs.readFileSync(
      path.join(__dirname, "../assets/css/menu.css"),
      "utf8"
    );
    this.menuHTML = fs.readFileSync(
      path.join(__dirname, "../assets/html/menu.html"),
      "utf8"
    );
    this.menu = this.createMenu();
    this.localStorage = window.localStorage;
    this.menuToggle = this.menu.querySelector(".menu");
    this.tabToContentMap = {
      ui: this.menu.querySelector("#ui-options"),
      game: this.menu.querySelector("#game-options"),
      performance: this.menu.querySelector("#performance-options"),
      client: this.menu.querySelector("#client-options"),
      scripts: this.menu.querySelector("#scripts-options"),
      skins: this.menu.querySelector("#skins-options"),
      cheats: this.menu.querySelector("#cheats-options"),
      about: this.menu.querySelector("#about-client"),
    };
  }

  createMenu() {
    const menu = document.createElement("div");
    menu.innerHTML = this.menuHTML;
    menu.id = "juice-menu";
    menu.style.cssText =
      "z-index: 99999999; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);";
    const menuCSS = document.createElement("style");
    menuCSS.innerHTML = this.menuCSS
    menu.prepend(menuCSS);
    document.body.appendChild(menu);
    return menu;
  }

  init() {
    this.setVersion();
    this.setUser();
    this.setKeybind();
    this.setTheme();
    this.handleKeyEvents();
    this.initMenu();
    this.handleMenuKeybindChange();
    this.handleMenuInputChanges();
    this.handleMenuSelectChanges();
    this.handleTabChanges();
    this.handleDropdowns();
    this.handleSearch();
    this.handleButtons();
    this.localStorage.getItem("juice-menu-tab")
      ? this.handleTabChange(
        this.menu.querySelector(
          `[data-tab="${this.localStorage.getItem("juice-menu-tab")}"]`
        )
      )
      : this.handleTabChange(this.menu.querySelector(".juice.tab"));
  }

  setVersion() {
    this.menu.querySelectorAll(".ver").forEach((element) => {
      element.innerText = `v${version}`;
    });
  }

  setUser() {
    const user = JSON.parse(this.localStorage.getItem("current-user"));
    if (user) {
      this.menu.querySelector(".user").innerText = `${user.name}#${user.shortId}`;
    }
  }

  setKeybind() {
    this.menu.querySelector(
      ".keybind"
    ).innerText = `Press ${this.settings.menu_keybind} to toggle menu`;
    if (!this.localStorage.getItem("juice-menu")) {
      this.localStorage.setItem(
        "juice-menu",
        this.menuToggle.getAttribute("data-active")
      );
    } else {
      this.menuToggle.setAttribute(
        "data-active",
        this.localStorage.getItem("juice-menu")
      );
    }
  }

  setTheme() {
    this.menu
      .querySelector(".menu")
      .setAttribute("data-theme", this.settings.menu_theme);
  }

  handleKeyEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.code === this.settings.menu_keybind) {
        const isActive = this.menuToggle.getAttribute("data-active") === "true";
        if (!isActive) {
          document.exitPointerLock();
        }
        this.menuToggle.setAttribute("data-active", !isActive);
        this.localStorage.setItem("juice-menu", !isActive);
      }
    });
  }

  initMenu() {
    const inputs = this.menu.querySelectorAll("input[data-setting]");
    const textareas = this.menu.querySelectorAll("textarea[data-setting]");
    const selects = this.menu.querySelectorAll("select[data-setting]");
    inputs.forEach((input) => {
      const setting = input.dataset.setting;
      const type = input.type;
      const value = this.settings[setting];
      if (type === "checkbox") {
        input.checked = value;
      } else {
        input.value = value;
      }
    });

    selects.forEach((select) => {
      const setting = select.dataset.setting;
      const value = this.settings[setting];
      select.value = value;
    });

    textareas.forEach((textarea) => {
      const setting = textarea.dataset.setting;
      const value = this.settings[setting];
      textarea.value = value;
    });
  }

  handleMenuKeybindChange() {
    const changeKeybindButton = this.menu.querySelector(".change-keybind");
    changeKeybindButton.innerText = this.settings.menu_keybind;
    changeKeybindButton.addEventListener("click", () => {
      changeKeybindButton.innerText = "Press any key";
      const listener = (e) => {
        this.settings.menu_keybind = e.code;
        changeKeybindButton.innerText = e.code;
        ipcRenderer.send("update-setting", "menu_keybind", e.code);

        const event = new CustomEvent("juice-settings-changed", {
          detail: { setting: "menu_keybind", value: e.code },
        });
        document.dispatchEvent(event);

        this.menu.querySelector(
          ".keybind"
        ).innerText = `Press ${this.settings.menu_keybind} to toggle menu`;
        document.removeEventListener("keydown", listener);
      };
      document.addEventListener("keydown", listener);
    });
  }

  handleMenuInputChange(input) {
    const setting = input.dataset.setting;
    const type = input.type;
    const value = type === "checkbox" ? input.checked : input.value;
    this.settings[setting] = value;
    ipcRenderer.send("update-setting", setting, value);
    const event = new CustomEvent("juice-settings-changed", {
      detail: { setting: setting, value: value },
    });
    document.dispatchEvent(event);
  }

  handleMenuInputChanges() {
    const inputs = this.menu.querySelectorAll("input[data-setting]");
    const textareas = this.menu.querySelectorAll("textarea[data-setting]");
    inputs.forEach((input) => {
      input.addEventListener("change", () => this.handleMenuInputChange(input));

      // Real-time update for range inputs
      if (input.type === "range") {
        input.addEventListener("input", () => {
          this.handleMenuInputChange(input);
          // Update zoom label
          if (input.id === "zoom_level") {
            const zoomValue = this.menu.querySelector("#zoom-value");
            if (zoomValue) zoomValue.textContent = input.value;
          }
        });
      }
    });

    textareas.forEach((textarea) => {
      textarea.addEventListener("change", () =>
        this.handleMenuInputChange(textarea)
      );
    });
  }

  handleMenuSelectChange(select) {
    const setting = select.dataset.setting;
    const value = select.value;
    this.settings[setting] = value;
    ipcRenderer.send("update-setting", setting, value);
    const event = new CustomEvent("juice-settings-changed", {
      detail: { setting: setting, value: value },
    });
    if (setting === "menu_theme") {
      this.setTheme();
    }
    document.dispatchEvent(event);
  }

  handleMenuSelectChanges() {
    const selects = this.menu.querySelectorAll("select[data-setting]");
    selects.forEach((select) => {
      select.addEventListener("change", () =>
        this.handleMenuSelectChange(select)
      );
    });

    // Preset handlers for hitmarker and killicon
    this.handlePresets();
  }

  handlePresets() {
    const hitmarkerPreset = this.menu.querySelector("#hitmarker_preset");
    const hitmarkerInput = this.menu.querySelector("[data-setting='hitmarker_link']");
    const killiconPreset = this.menu.querySelector("#killicon_preset");
    const killiconInput = this.menu.querySelector("[data-setting='killicon_link']");

    if (hitmarkerPreset && hitmarkerInput) {
      hitmarkerPreset.addEventListener("change", () => {
        if (hitmarkerPreset.value) {
          hitmarkerInput.value = hitmarkerPreset.value;
          this.handleMenuInputChange(hitmarkerInput);
        }
      });
    }

    if (killiconPreset && killiconInput) {
      killiconPreset.addEventListener("change", () => {
        if (killiconPreset.value) {
          killiconInput.value = killiconPreset.value;
          this.handleMenuInputChange(killiconInput);
        }
      });
    }
  }

  handleTabChanges() {
    const tabs = this.menu.querySelectorAll(".juice.tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.handleTabChange(tab));
    });
  }

  handleTabChange(tab) {
    const tabs = this.menu.querySelectorAll(".juice.tab");
    const tabName = tab.dataset.tab;

    this.localStorage.setItem("juice-menu-tab", tabName);

    const contents = this.menu.querySelectorAll(".juice.options");
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });
    contents.forEach((content) => {
      content.classList.remove("active");
    });
    tab.classList.add("active");
    this.tabToContentMap[tab.dataset.tab].classList.add("active");
  }

  handleDropdowns() {
    const dropdowns = this.menu.querySelectorAll(".dropdown");
    dropdowns.forEach((dropdown) => {
      const dropdownTop = dropdown.querySelector(".dropdown .top");
      dropdownTop.addEventListener("click", () => {
        dropdown.classList.toggle("active");
      });
    });
  }

  handleSearch() {
    const searchInput = this.menu.querySelector(".juice.search");
    const settings = this.menu.querySelectorAll(".option:not(.custom)");
    searchInput.addEventListener("input", () => {
      const searchValue = searchInput.value.toLowerCase();
      settings.forEach((setting) => {
        setting.style.display = setting.textContent
          .toLowerCase()
          .includes(searchValue)
          ? "flex"
          : "none";

        const parent = setting.parentElement;
        if (parent.classList.contains("option-group")) {
          const children = parent.children;
          const visibleChildren = Array.from(children).filter(
            (child) => child.style.display === "flex"
          );
          parent.style.display = visibleChildren.length ? "flex" : "none";
        }
      });
    });
  }

  handleButtons() {
    const openSwapperFolder = this.menu.querySelector("#open-swapper-folder");
    openSwapperFolder.addEventListener("click", () => {
      ipcRenderer.send("open-swapper-folder");
    });

    const openScriptsFolder = this.menu.querySelector("#open-scripts-folder");
    openScriptsFolder.addEventListener("click", () => {
      ipcRenderer.send("open-scripts-folder");
    });

    const restartClient = this.menu.querySelector("#restart-client");
    restartClient.addEventListener("click", () => {
      ipcRenderer.send("restart-client");
    });

    const clearCache = this.menu.querySelector("#clear-cache");
    clearCache.addEventListener("click", () => {
      ipcRenderer.sendSync("clear-cache");
      const text = clearCache.querySelector(".text");
      text.innerText = "Cache Cleared!";
      setTimeout(() => {
        text.innerText = "Clear Cache";
      }, 2000);
    });

    // Skin Preview (Image-based)
    const initSkinPreview = () => {
      const container = this.menu.querySelector('#threejs-container');
      if (!container) return;

      const path = require('path');
      const fs = require('fs');

      // Restore saved skin from settings
      let selectedSkin = this.settings.current_skin || null;

      // Create preview image element
      const previewImg = document.createElement('img');
      previewImg.id = 'skin-preview-img';
      previewImg.style.cssText = 'width:100%;height:100%;object-fit:contain;image-rendering:pixelated;border-radius:4px;';
      previewImg.alt = 'Skin Preview';

      // If there's a saved skin, show it
      if (selectedSkin && fs.existsSync(selectedSkin)) {
        previewImg.src = `file://${selectedSkin}`;
        // Update skin name display
        const skinBasename = path.basename(selectedSkin).replace('-texture.png', '');
        const nameEl = this.menu.querySelector('#current-skin-name');
        if (nameEl) nameEl.textContent = skinBasename;
      }
      container.appendChild(previewImg);

      // Available skins from assets folder
      const skinsPath = path.join(__dirname, '../assets/skins');
      const skinGrid = this.menu.querySelector('#skin-grid');

      // Load skins into grid
      if (skinGrid && fs.existsSync(skinsPath)) {
        const skins = fs.readdirSync(skinsPath).filter(f => f.endsWith('-texture.png'));

        skins.forEach(skinFile => {
          const skinName = skinFile.replace('-texture.png', '');
          const skinPath = path.join(skinsPath, skinFile);

          const skinItem = document.createElement('div');
          skinItem.className = 'skin-item';
          skinItem.style.backgroundImage = `url(file://${skinPath})`;
          skinItem.dataset.skin = skinName;
          skinItem.dataset.path = skinPath;
          skinItem.innerHTML = `<span class="skin-label">${skinName}</span>`;

          // Mark as selected if it's the saved skin
          if (selectedSkin && skinPath === selectedSkin) {
            skinItem.classList.add('selected');
          }

          skinItem.addEventListener('click', () => {
            // Remove selected from others
            skinGrid.querySelectorAll('.skin-item').forEach(s => s.classList.remove('selected'));
            skinItem.classList.add('selected');
            selectedSkin = skinPath;

            // Update current skin name
            const nameEl = this.menu.querySelector('#current-skin-name');
            if (nameEl) nameEl.textContent = skinName;

            // Update preview image
            if (previewImg) {
              previewImg.src = `file://${skinPath}`;
            }
          });

          skinGrid.appendChild(skinItem);
        });
      }

      // Open skins folder
      const openSkinsFolder = this.menu.querySelector('#open-skins-folder');
      if (openSkinsFolder) {
        openSkinsFolder.addEventListener('click', () => {
          ipcRenderer.send('open-skins-folder');
        });
      }

      // Load custom skin
      const loadCustomBtn = this.menu.querySelector('#load-custom-skin');
      const customInput = this.menu.querySelector('#custom-skin-input');
      if (loadCustomBtn && customInput) {
        loadCustomBtn.addEventListener('click', () => customInput.click());
        customInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const nameEl = this.menu.querySelector('#current-skin-name');
            if (nameEl) nameEl.textContent = file.name;
            selectedSkin = file.path;
            if (previewImg) {
              previewImg.src = `file://${file.path}`;
            }
          }
        });
      }

      // Apply skin - copies to swapper folder
      const applySkin = this.menu.querySelector('#apply-skin');
      if (applySkin) {
        applySkin.addEventListener('click', () => {
          if (selectedSkin) {
            const os = require('os');
            const documentsPath = path.join(os.homedir(), 'Documents', 'JuiceClient', 'swapper', 'assets', 'media');

            // Create directory if needed
            if (!fs.existsSync(documentsPath)) {
              fs.mkdirSync(documentsPath, { recursive: true });
            }

            // Copy skin texture to swapper folder (replace default skin)
            try {
              const destPath = path.join(documentsPath, 'character-texture.png');
              fs.copyFileSync(selectedSkin, destPath);

              this.settings.current_skin = selectedSkin;
              ipcRenderer.send('update-setting', 'current_skin', selectedSkin);

              const text = applySkin.querySelector('.text');
              text.innerText = 'Reload to Apply!';
              setTimeout(() => {
                text.innerText = 'Apply Skin';
                // Prompt reload
                if (confirm('Skin applied! Reload page to see changes?')) {
                  location.reload();
                }
              }, 1000);
            } catch (e) {
              console.error('Failed to copy skin:', e);
              alert('Failed to apply skin: ' + e.message);
            }
          }
        });
      }

      // Reset skin
      const resetSkin = this.menu.querySelector('#reset-skin');
      if (resetSkin) {
        resetSkin.addEventListener('click', () => {
          selectedSkin = null;
          this.settings.current_skin = '';
          ipcRenderer.send('update-setting', 'current_skin', '');
          const nameEl = this.menu.querySelector('#current-skin-name');
          if (nameEl) nameEl.textContent = 'Default';
          skinGrid.querySelectorAll('.skin-item').forEach(s => s.classList.remove('selected'));
          const text = resetSkin.querySelector('.text');
          text.innerText = 'Reset!';
          setTimeout(() => text.innerText = 'Reset', 2000);
        });
      }
    };

    initSkinPreview();

    const importSettings = this.menu.querySelector("#import-settings");
    importSettings.addEventListener("click", () => {
      const modal = this.createModal(
        "Import settings",
        "Paste your settings here to import them"
      );

      const bottom = modal.querySelector(".bottom");

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Paste settings here";
      bottom.appendChild(input);

      const confirm = document.createElement("button");
      confirm.innerText = "Confirm";
      confirm.classList.add("juice-button");
      confirm.addEventListener("click", () => {
        try {
          if (!input.value) return;

          const settings = JSON.parse(input.value);
          for (const key in settings) {
            this.settings[key] = settings[key];
            ipcRenderer.send("update-setting", key, settings[key]);

            const event = new CustomEvent("juice-settings-changed", {
              detail: { setting: key, value: settings[key] },
            });
            document.dispatchEvent(event);

            this.initMenu();
          }
          modal.remove();
        } catch (error) {
          console.error("Error importing settings:", error);
        }
      });

      bottom.appendChild(confirm);

      this.menu.querySelector(".menu").appendChild(modal);
    });

    const exportSettings = this.menu.querySelector("#export-settings");
    exportSettings.addEventListener("click", () => {
      const modal = this.createModal(
        "Export settings",
        "Copy your settings here to export them"
      );

      const bottom = modal.querySelector(".bottom");

      const textarea = document.createElement("textarea");
      textarea.value = JSON.stringify(this.settings, null, 2);
      bottom.appendChild(textarea);

      const copy = document.createElement("button");
      copy.innerText = "Copy";
      copy.classList.add("juice-button");
      copy.addEventListener("click", () => {
        navigator.clipboard.writeText(textarea.value);
      });

      bottom.appendChild(copy);

      this.menu.querySelector(".menu").appendChild(modal);
    });

    let clickCounter = 0;
    const resetJuiceSettings = this.menu.querySelector("#reset-juice-settings");
    resetJuiceSettings.addEventListener("click", () => {
      clickCounter++;
      if (clickCounter === 1) {
        resetJuiceSettings.style.background = "rgba(var(--red), 0.25)";
        const text = resetJuiceSettings.querySelector(".text");
        text.innerText = "Are you sure?";

        const description = resetJuiceSettings.querySelector(".description");
        description.innerText =
          "This will restart the client and reset all settings. Click again to confirm";
      } else if (clickCounter === 2) {
        ipcRenderer.send("reset-juice-settings");
      }
    });

    const remoteToStaticLinks = this.menu.querySelector(
      "#remote-to-static-links"
    );
    remoteToStaticLinks.addEventListener("click", async () => {
      const localStorageKeys = [
        "SETTINGS___SETTING/CROSSHAIR___SETTING/STATIC_URL___SETTING",
        "SETTINGS___SETTING/SNIPER___SETTING/SCOPE_URL___SETTING",
        "SETTINGS___SETTING/BLOCKS___SETTING/TEXTURE_URL___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG1___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG2___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG3___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG4___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG5___SETTING",
        "SETTINGS___SETTING/SKYBOX___SETTING/TEXTURE_IMG6___SETTING",
      ];

      const juiceKeys = ["css_link", "hitmarker_link", "killicon_link"];

      const encodeImage = async (url) => {
        if (!url || url === "") return "";

        try {
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`Invalid response: ${response.status}`);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error(`Error fetching or converting ${url}:`, error);
        }
      };

      for (const key of localStorageKeys) {
        const url = localStorage.getItem(key).replace(/"/g, "");
        const data = await encodeImage(url);
        localStorage.setItem(key, data);
      }

      for (const key of juiceKeys) {
        const url = this.settings[key];
        const data = await encodeImage(url);
        this.settings[key] = data;
        ipcRenderer.send("update-setting", key, data);

        const event = new CustomEvent("juice-settings-changed", {
          detail: { setting: key, value: this.settings[key] },
        });
        document.dispatchEvent(event);

        this.initMenu();
      }
    });
  }

  createModal(title, description) {
    const modal = document.createElement("div");
    modal.id = "modal";

    modal.innerHTML = `
    <div class="content">
      <div class="close">
        <i class="fas fa-times"></i>
      </div>
      <div class="top">
        <span class="title">${title}</span>
        <span class="description">${description}</span>
      </div>
      <div class="bottom">
      </div>
    </div>
    `;

    const close = modal.querySelector(".close");
    close.addEventListener("click", () => modal.remove());

    modal.addEventListener("click", (e) => {
      if (e.target.id === "modal") modal.remove();
    });

    return modal;
  }
}

module.exports = Menu;
