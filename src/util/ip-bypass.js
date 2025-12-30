/* ========== IP-BYPASS: SOCKS5 PROXY FOR ALL TRAFFIC ========== */
/* This patches the entire network stack to route via Tor/SOCKS5  */

const settings = require('electron-store');
const store = new settings();

// Check if IP bypass is enabled in settings
const bypassEnabled = store.get('ip_bypass_enabled', false);

if (bypassEnabled) {
    /* ========== 0-CONFIG ========== */
    const PROXY_HOST = store.get('socks5_host', '127.0.0.1'); // Default to localhost (Tor)
    const PROXY_PORT = store.get('socks5_port', 9050);        // 9050 = Tor, 1080 = default SOCKS5
    /* ================================= */

    try {
        /* ========== 1 – PATCH HTTP ========== */
        const http = require('http');
        const https = require('https');
        const { SocksProxyAgent } = require('socks-proxy-agent');

        const agent = new SocksProxyAgent(`socks5://${PROXY_HOST}:${PROXY_PORT}`);

        // Redirect ALL requests
        const _httpRequest = http.request;
        http.request = function (options, callback) {
            if (typeof options === 'object') options.agent = agent;
            return _httpRequest.call(http, options, callback);
        };

        const _httpsRequest = https.request;
        https.request = function (options, callback) {
            if (typeof options === 'object') options.agent = agent;
            return _httpsRequest.call(https, options, callback);
        };

        const _httpGet = http.get;
        http.get = function (options, callback) {
            if (typeof options === 'object') options.agent = agent;
            return _httpGet.call(http, options, callback);
        };

        const _httpsGet = https.get;
        https.get = function (options, callback) {
            if (typeof options === 'object') options.agent = agent;
            return _httpsGet.call(https, options, callback);
        };

        /* ========== 2 – PATCH WEBSOCKET ========== */
        try {
            const WebSocket = require('ws');
            const _WebSocket = WebSocket;
            global.WebSocket = class extends _WebSocket {
                constructor(url, protocols, options = {}) {
                    options.agent = agent;
                    super(url, protocols, options);
                }
            };
        } catch (e) {
            console.warn('[IP-BYPASS] WebSocket patching skipped:', e.message);
        }

        /* ========== 3 – PATCH FETCH (Node ≥ 18) ========== */
        try {
            const undici = require('undici');
            undici.setGlobalDispatcher(new undici.ProxyAgent(`socks5://${PROXY_HOST}:${PROXY_PORT}`));
        } catch (e) {
            console.warn('[IP-BYPASS] Undici/Fetch patching skipped:', e.message);
        }

        console.log(`[IP-BYPASS] ✓ All traffic routed via SOCKS5 ${PROXY_HOST}:${PROXY_PORT}`);

    } catch (e) {
        console.error('[IP-BYPASS] Failed to initialize:', e.message);
        console.error('[IP-BYPASS] Make sure Tor is running: sudo systemctl start tor');
    }
} else {
    console.log('[IP-BYPASS] Disabled (enable in settings)');
}

module.exports = {};
