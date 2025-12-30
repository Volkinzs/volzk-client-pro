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
  app.allowRendererProcessReuse = true;
}

module.exports = {
  applySwitches,
};
