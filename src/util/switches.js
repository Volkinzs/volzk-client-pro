const { app } = require("electron");

function applySwitches(settings) {
  if (settings.unlimited_fps) {
    app.commandLine.appendSwitch("disable-frame-rate-limit");
    app.commandLine.appendSwitch("disable-gpu-vsync");
  }
  if (settings.in_process_gpu) {
    app.commandLine.appendSwitch("in-process-gpu");
  }

  // AMD GPU specific flags
  if (settings.amd_vaapi) {
    app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder");
  }
  if (settings.amd_opengl) {
    app.commandLine.appendSwitch("use-gl", "desktop");
  }
  if (settings.accelerated_video) {
    app.commandLine.appendSwitch("enable-accelerated-video-decode");
  }
  if (settings.disable_gpu_compositing) {
    app.commandLine.appendSwitch("disable-gpu-compositing");
  }

  app.commandLine.appendSwitch("high-dpi-support", "1");
  app.commandLine.appendSwitch("ignore-gpu-blacklist");
  app.commandLine.appendSwitch("enable-gpu-rasterization");
  app.commandLine.appendSwitch("enable-zero-copy");

  // === ANTI-DETECTION SWITCHES ===
  app.commandLine.appendSwitch("disable-web-security");           // Bypass CORS restrictions
  app.commandLine.appendSwitch("disable-site-isolation-trials");  // Reduce fingerprint surface
  app.commandLine.appendSwitch("disable-features", "IsolateOrigins,site-per-process");
  app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled"); // Hide automation
  app.commandLine.appendSwitch("user-data-dir", "/tmp/volzk-session");  // Isolated session (clean slate)
  app.commandLine.appendSwitch("no-sandbox");                     // Required for some anti-detection
  // === END ANTI-DETECTION ===

  app.allowRendererProcessReuse = true;
}

module.exports = {
  applySwitches,
};
