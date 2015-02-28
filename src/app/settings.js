var Q = require('q'),
    os = require('os'),
    path = require('path'),
    _ = require('underscore'),
    data_path = require('nw.gui').App.dataPath;

/** Default settings **/
var Settings = {};

// User interface
Settings.language = '';
Settings.coversShowRating = false;
Settings.watchedCovers = 'fade';
Settings.showAdvancedSettings = false;
Settings.version = '0.0.1';

Settings.postersMinWidth = 134;
Settings.postersMaxWidth = 294;
Settings.postersMinFontSize = 0.8;
Settings.postersMaxFontSize = 1.3;
Settings.postersSizeRatio = (196 / 134);
Settings.postersWidth = Settings.postersMinWidth;
Settings.postersJump = [134, 154, 174, 194, 214, 234, 254, 274, 294];

//Playback
Settings.alwaysFullscreen = false;
Settings.playNextEpisodeAuto = true;

// Advanced UI
Settings.alwaysOnTop = false;
Settings.theme = 'Official_-_Flat_X_theme';
Settings.ratingStars = true; //trigger on click in details
Settings.startScreen = 'Movies';
Settings.lastTab = '';

// Movies
Settings.moviesShowQuality = false;
Settings.movies_quality = 'all';

// Subtitles
Settings.subtitle_language = 'none';
Settings.subtitle_size = '28px';
Settings.subtitle_color = '#ffffff';
Settings.subtitle_shadows = 'true';

// More options
Settings.httpApiPort = 8008;
Settings.httpApiUsername = 'popcorn';
Settings.httpApiPassword = 'popcorn';

// User settings (not set here, just init'd)
Settings.traktUsername = '';
Settings.traktPassword = '';
Settings.traktTvVersion = '0.0.2';
Settings.syncOnStart = false;

// Advanced options
Settings.connectionLimit = 100;
Settings.dhtLimit = 500;
Settings.streamPort = 0; // 0 = Random
Settings.tmpLocation = path.join(os.tmpDir(), 'Guimovie');
Settings.databaseLocation = path.join(data_path, 'data');
Settings.deleteTmpOnClose = true;
Settings.automaticUpdating = true;
Settings.events = true;
Settings.allowTorrentStorage = false;

Settings.vpn = false;
Settings.vpnUsername = '';
Settings.vpnPassword = '';

Settings.tvshowAPI = {
    url: 'https://guimovie.tv/',
    ssl: true,
    fingerprint: 'F7:10:44:29:13:7B:6E:69:11:7A:20:5A:D2:14:0E:2C:94:C1:B2:25',
    fallbacks: []
};

Settings.updateEndpoint = {
    url: 'https://guimovie.tv/',
    fingerprint: 'F7:10:44:29:13:7B:6E:69:11:7A:20:5A:D2:14:0E:2C:94:C1:B2:25',
    fallbacks: []
};

Settings.ytsAPI = {
    url: 'https://guimovie.tv/',
    fingerprint: 'F7:10:44:29:13:7B:6E:69:11:7A:20:5A:D2:14:0E:2C:94:C1:B2:25',
    fallbacks: []
};

// App Settings
Settings.version = '1.0.0';
Settings.dbversion = '0.1.0';
Settings.font = 'tahoma';
Settings.defaultWidth = Math.round(window.screen.availWidth * 0.8);
Settings.defaultHeight = Math.round(window.screen.availHeight * 0.8);

// Miscellaneous

Settings.tv_detail_jump_to = 'next';


var ScreenResolution = {
    get SD() {
        return window.screen.width < 1280 || window.screen.height < 720;
    },
    get HD() {
        return window.screen.width >= 1280 && window.screen.width < 1920 || window.screen.height >= 720 && window.screen.height < 1080;
    },
    get FullHD() {
        return window.screen.width >= 1920 && window.screen.width < 2000 || window.screen.height >= 1080 && window.screen.height < 1600;
    },
    get UltraHD() {
        return window.screen.width >= 2000 || window.screen.height >= 1600;
    },
    get QuadHD() {
        return window.screen.width >= 3000 || window.screen.height >= 1800;
    },
    get Standard() {
        return window.devicePixelRatio <= 1;
    },
    get Retina() {
        return window.devicePixelRatio > 1;
    }
};

var AdvSettings = {

    get: function(variable) {
        if (typeof Settings[variable] !== 'undefined') {
            return Settings[variable];
        }

        return false;
    },

    set: function(variable, newValue) {
        Database.writeSetting({
            key: variable,
            value: newValue
        })
            .then(function() {
                Settings[variable] = newValue;
            });
    },

    setup: function() {
        AdvSettings.performUpgrade();
        return AdvSettings.getHardwareInfo();
    },

    getHardwareInfo: function() {
        if (/64/.test(process.arch)) {
            AdvSettings.set('arch', 'x64');
        } else {
            AdvSettings.set('arch', 'x86');
        }

        switch (process.platform) {
            case 'darwin':
                AdvSettings.set('os', 'mac');
                break;
            case 'win32':
                AdvSettings.set('os', 'windows');
                break;
            case 'linux':
                AdvSettings.set('os', 'linux');
                break;
            default:
                AdvSettings.set('os', 'unknown');
                break;
        }

        return Q();
    },

    checkApiEndpoints: function(endpoints) {
        return Q.all(_.map(endpoints, function(endpoint) {
            return AdvSettings.checkApiEndpoint(endpoint);
        }));
    },

    checkApiEndpoint: function(endpoint, defer) {
        var tls = require('tls'),
            http = require('http'),
            uri = require('url');

        defer = defer || Q.defer();

        if (endpoint.skip) {
            win.debug('Skipping endpoint check for %s', endpoint.url);
            return Q();
        }

        var url = uri.parse(endpoint.url);
        win.debug('Checking %s endpoint', url.hostname);

        if (endpoint.ssl === false) {
            http.get({
                hostname: url.hostname,
                port: url.port || 80,
                agent: false
            }, function(res) {
                res.on('data', function(body) {
                    res.removeAllListeners('data');
                    // Doesn't match the expected response
                    if (!_.isRegExp(endpoint.fingerprint) || !endpoint.fingerprint.test(body.toString('utf8'))) {
                        win.warn('[%s] Endpoint fingerprint %s does not match %s',
                            url.hostname,
                            endpoint.fingerprint,
                            body.toString('utf8'));
                        if (endpoint.fallbacks.length) {
                            var fallback = endpoint.fallbacks.shift();
                            endpoint.ssl = undefined;
                            _.extend(endpoint, fallback);

                            AdvSettings.checkApiEndpoint(endpoint, defer);
                            return;
                        } else {
                            // TODO: should reject here!
                        }
                    }

                    defer.resolve();
                });
            }).on('error', function(error) {
                if (endpoint.fallbacks.length) {
                    var fallback = endpoint.fallbacks.shift();
                    endpoint.ssl = undefined;
                    _.extend(endpoint, fallback);

                    AdvSettings.checkApiEndpoint(endpoint, defer);
                } else {
                    // TODO: should reject here!
                    defer.resolve();
                }
            }).setTimeout(5000);
        } else {
            tls.connect(url.port || 443, url.hostname, {
                servername: url.hostname,
                rejectUnauthorized: false
            }, function() {
                this.setTimeout(0);
                this.removeAllListeners('error');
                console.log(this.getPeerCertificate().fingerprint);

                if (!this.authorized ||
                    this.authorizationError ||
                    this.getPeerCertificate().fingerprint !== endpoint.fingerprint) {
                    // "These are not the certificates you're looking for..."
                    // Seems like they even got a certificate signed for us :O
                    win.warn('[%s] Endpoint fingerprint %s does not match %s',
                        url.hostname,
                        endpoint.fingerprint,
                        this.getPeerCertificate().fingerprint);
                    if (endpoint.fallbacks.length) {
                        var fallback = endpoint.fallbacks.shift();
                        endpoint.ssl = undefined;
                        _.extend(endpoint, fallback);

                        AdvSettings.checkApiEndpoint(endpoint, defer);
                    } else {
                        defer.resolve();
                    }
                } else {
                    defer.resolve();
                }
                this.end();
            }).on('error', function(err) {
                this.setTimeout(0);
                // No SSL support. That's convincing >.<
                win.warn('[%s] Endpoint does not support SSL, failing',
                    url.hostname);
                if (endpoint.fallbacks.length) {
                    var fallback = endpoint.fallbacks.shift();
                    endpoint.ssl = undefined;
                    _.extend(endpoint, fallback);

                    AdvSettings.checkApiEndpoint(endpoint, defer);
                } else {
                    // TODO: Should probably reject here
                    defer.resolve();
                }
                this.end();
            }).on('timeout', function() {
                this.removeAllListeners('error');
                // Connection timed out, we'll say its not available
                win.warn('[%s] Endpoint timed out, failing',
                    url.hostname);
                if (endpoint.fallbacks.length) {
                    var fallback = endpoint.fallbacks.shift();
                    endpoint.ssl = undefined;
                    _.extend(endpoint, fallback);

                    AdvSettings.checkApiEndpoint(endpoint, defer);
                } else {
                    // TODO: Should probably reject here
                    defer.resolve();
                }
                this.end();
            }).setTimeout(5000); // Set 5 second timeout
        }

        return defer.promise;
    },

    performUpgrade: function() {
        // This gives the official version (the package.json one)
        gui = require('nw.gui');
        var currentVersion = gui.App.manifest.version;

        if (currentVersion !== AdvSettings.get('version')) {
            // Nuke the DB if there's a newer version
            // Todo: Make this nicer so we don't lose all the cached data
            var cacheDb = openDatabase('cachedb', '', 'Cache database', 50 * 1024 * 1024);

            cacheDb.transaction(function(tx) {
                tx.executeSql('DELETE FROM subtitle');
                tx.executeSql('DELETE FROM metadata');
            });

            // Add an upgrade flag
            window.__isUpgradeInstall = true;
        }
        AdvSettings.set('version', currentVersion);
        AdvSettings.set('releaseName', gui.App.manifest.releaseName);
    },
};