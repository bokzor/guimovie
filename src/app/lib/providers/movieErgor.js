(function(App) {
    'use strict';
    var querystring = require('querystring');
    var request = require('request');
    var Q = require('q');
    var inherits = require('util').inherits;


    var statusMap = {
        0: 'Not Airing Yet',
        1: 'Currently Airing',
        2: 'Ended'
    };

    var URL = 'http://localhost:8092/movie/';
    var movieErgor = function() {
        movieErgor.super_.call(this);
    };

    inherits(movieErgor, App.Providers.Generic);

    var queryTorrents = function(filters) {
        // http://ptp.haruhichan.com/list.php?page=0&sort=rank&order=desc&limit=50&state=1
        var deferred = Q.defer();

        var params = {};
        params.sort = 'popularity';
        params.limit = '50';
        params.type = 'All';
        params.page = (filters.page ? filters.page - 1 : 0);

        if (filters.keywords) {
            params.search = filters.keywords.replace(/\s/g, '% ');
        }

        var genres = filters.genre;
        if (genres && (genres !== 'All')) {
            params.genres = genres;
        }

        switch (filters.order) {
            case 1:
                params.order = 'desc';
                break;
            case -1:
                /* falls through */
            default:
                params.order = 'asc';
                break;
        }

        if (filters.sorter && filters.sorter !== 'popularity') {
            params.sort = filters.sorter;
        }

        if (filters.type && filters.type !== 'All') {
            if (filters.type === 'Movies') {
                params.type = 'movie';
            } else {
                params.type = filters.type.toLowerCase();
            }
        }

        // XXX(xaiki): haruchichan currently doesn't support filters
        var url = URL + '?' + querystring.stringify(params).replace(/%25%20/g, '%20');
        win.info('Request to HARUHICHAN API');
        win.debug(url);
        request({
            url: url,
            json: true
        }, function(error, response, data) {

            if (error || response.statusCode >= 400) {
                deferred.reject(error);
            } else if (!data || (data.error && data.error !== 'No movies found')) {
                var err = data ? data.error : 'No data returned';
                win.error('API error:', err);
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });

        return deferred.promise;
    };


    var formatForPopcorn = function(items) {

        var results = _.map(items, function(item) {
            var img = 'http://img.omdbapi.com/?i=' + item.imdb + '&apikey=6792a7f';
            var type = 'movie';
            var ret = {
                images: {
                    poster: img,
                    fanart: img,
                    banner: img
                },
                haru_id: item.imdb.slice(2),
                imdb_id: item.imdb,
                slug: item.title.toLowerCase().replace(/\s/g, '-'),
                title: item.title,
                year: item.year,
                type: type,
            };
            return ret;
        });


        return {
            results: results,
            hasMore: true
        };
    };

    // Single element query
    var queryTorrent = function(torrent_id, prev_data) {
        console.log(torrent_id);
        return Q.Promise(function(resolve, reject) {
            var id = torrent_id;
            var url = URL + 'detail?id=' + id;

            win.info('Request to HARUHICHAN API');
            win.debug(url);
            request({
                url: url,
                json: true
            }, function(error, response, data) {
                console.log('eroor');

                if (error || response.statusCode >= 400) {
                    reject(error);
                } else if (!data || (data.error && data.error !== 'No data returned')) {
                    var err = data ? data.error : 'No data returned';
                    win.error('API error:', err);
                    reject(err);
                    console.log('eroor');
                } else {
                    console.log('eroor2');
                    // we cache our new element
                    resolve(formatDetailForPopcorn(data, prev_data));
                }
            });
        });
    };

    var movieTorrents = function(id, dl) {
        var torrents = {};
        _.each(dl, function(item) {
            var quality = item.quality.match(/[0-9]+p/)[0];
            torrents[quality] = {
                seeds: 0,
                peers: 0,
                url: item.magnet,
                health: 'good'
            };
        });

        return torrents;
    };

    var showTorrents = function(id, dl) {
        var torrents = {};
        _.each(dl, function(item) {
            var quality = item.quality.match(/[0-9]+p/)[0];
            var match = item.name.match(/[\s_]([0-9]+(-[0-9]+)?|CM|OVA)[\s_]/);
            if (!match) {
                console.error('could not match', item.name);
                return;
            }
            var episode = match[1];
            if (!torrents[episode]) {
                torrents[episode] = {};
            }
            torrents[episode][quality] = {
                seeds: 0,
                peers: 0,
                url: item.magnet,
                health: 'good'
            };
        });
        return _.map(torrents, function(torrents, s) {
            return {
                title: 'Episode ' + s,
                torrents: torrents,
                season: 1,
                episode: Number(s.split('-')[0]),
                overview: 'we still don\'t have single episodes overview for anime… sorry',
                tvdb_id: id + '-1-' + s
            };
        });
    };

    var formatDetailForPopcorn = function(item, prev) {
        var img = item.malimg;
        var type = prev.type;
        var genres = prev.genres;

        var ret = _.extend(prev, {
            country: 'Japan',
            genre: genres,
            genres: genres,
            num_seasons: 1,
            runtime: prev.runtime,
            synopsis: item.movie.overview,
            rating: { // FIXME
                hated: 0,
                loved: 0,
                votes: 0,
                percentage: Math.round(item.score) * 10
            },
            images: {
                poster: img,
                fanart: img,
                banner: img
            },
            year: prev.year,
            type: type
        });

        if (type === 'movie') {
            ret = _.extend(ret, {
                rating: item.score,
                subtitle: undefined,
                torrents: movieTorrents(item.id, item.episodes),
            });
        } else {
            ret = _.extend(ret, {
                episodes: showTorrents(item.id, item.episodes)
            });
        }

        console.log('haruhiret', ret);
        return ret;
    };

    movieErgor.prototype.extractIds = function(items) {
        return _.pluck(items.results, 'haru_id');
    };

    movieErgor.prototype.fetch = function(filters) {
        return queryTorrents(filters)
            .then(formatForPopcorn);
    };

    movieErgor.prototype.detail = function(torrent_id, prev_data) {
        return queryTorrent(torrent_id, prev_data);
    };

    App.Providers.movieErgor = movieErgor;

})(window.App);