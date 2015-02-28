(function(App) {
    'use strict';
    var querystring = require('querystring');
    var request = require('request');
    var Q = require('q');
    var inherits = require('util').inherits;

    var URL = false;

    function Yts() {
        Yts.super_.call(this);
    }

    inherits(Yts, App.Providers.Generic);

    var queryTorrents = function(filters) {

        var deferred = Q.defer();

        var params = {};
        params.sort = 'seeds';
        params.limit = '50';

        if (filters.keywords) {
            params.keywords = filters.keywords;
        }

        if (filters.genre) {
            params.genre = filters.genre;
        }

        if (filters.order) {
            var order = 'desc';
            if (filters.order === 1) {
                order = 'asc';
            }
            params.order = order;
        }

        if (filters.sorter && filters.sorter !== 'popularity') {
            params.sort = filters.sorter;
        }

        if (filters.page) {
            params.page = filters.page;
        }

        if (Settings.movies_quality !== 'all') {
            params.quality = Settings.movies_quality;
        }

        var url = 'http://api.guimovie.tv/movie/?' + querystring.stringify(params).replace(/%E2%80%99/g, '%27');

        win.debug(url);
        request({
            url: url,
            json: true
        }, function(error, response, data) {
            if (error || response.statusCode >= 400) {
                deferred.reject(error);
            } else if (!data || (data.error && data.error !== 'No movies found')) {
                var err = data ? data.error : 'No data returned';
                win.error('YTS error:', err);
                deferred.reject(err);
            } else {
                deferred.resolve(data || []);
            }
        });

        return deferred.promise;
    };

    var formatForPopcorn = function(items) {
        var results = {};
        var movieFetch = {};
        movieFetch.results = [];
        movieFetch.hasMore = (Number(items.length) > 1 ? true : false);
        _.each(items, function(movie) {
            //var img = 'http://img.omdbapi.com/?i=' + movie.imdb + '&apikey=6792a7f';
            var img = 'http://image.tmdb.org/t/p/w130/' + movie.image;
            //var largeCover = 'http://img.omdbapi.com/?i=' + movie.imdb + '&apikey=6792a7f';
            var largeCover = 'http://image.tmdb.org/t/p/w300/' + movie.image;
            var backdrop = 'http://image.tmdb.org/t/p/w1000/' + movie.backdrop;
            var imdb = movie.imdb;
            var genre = movie.genres.length > 0 ? movie.genres[0] : '';

            // Calc torrent health
            /*
            var seeds = movie.TorrentSeeds;
            var peers = movie.TorrentPeers;

            var torrents = {};
            torrents[movie.Quality] = {
                url: movie.TorrentUrl.replace(/^https?:\/\/yts\..*\//, AdvSettings.get('ytsAPI').url).replace('/api', ''), // make sure the url is correct, in case a proxy is used
                magnet: movie.TorrentMagnetUrl,
                size: movie.SizeByte,
                filesize: movie.Size,
                seed: seeds,
                peer: peers
            }; */

            var ptItem = results[imdb];
            if (!ptItem) {
                ptItem = {
                    imdb_id: imdb,
                    title: movie.title,
                    year: movie.year,
                    trailer: movie.video,
                    genre: genre,
                    rating: movie.rating,
                    backdrop: backdrop,
                    image: img,
                    poster: largeCover,
                    torrents: {},
                    type: 'movie',
                    runtime: movie.runtime,
                };
                movieFetch.results.push(ptItem);
            } else {
                //_.extend(ptItem.torrents, torrents);
            }

            results[imdb] = ptItem;
        });
        return movieFetch;
    };

    // Single element query
    var queryTorrent = function(torrent_id, old_data) {
        return Q.Promise(function(resolve, reject) {
            var params = {
                id: torrent_id
            };
            var url = 'http://api.guimovie.tv/movie/detail?' + querystring.stringify(params).replace(/%E2%80%99/g, '%27');

            win.info('Request to YTS API');
            win.debug(url);
            request({
                url: url,
                json: true
            }, function(error, response, data) {
                if (error || response.statusCode >= 400) {
                    reject(error);
                } else if (!data || (data.error && data.error !== 'No movies found')) {
                    var err = data ? data.error : 'No data returned';
                    win.error('YTS error:', err);
                    reject(err);
                } else {
                    var torrents = data.torrents || {};
                    old_data.synopsis = data.movie.overview;
                    old_data.torrents = _.extend(old_data.torrents, torrents);
                    console.log(old_data);
                    resolve(old_data);
                }
            });
        });
    };

    Yts.prototype.extractIds = function(items) {
        return _.pluck(items.results, 'imdb_id');
    };

    Yts.prototype.fetch = function(filters) {
        return queryTorrents(filters)
            .then(formatForPopcorn);
    };

    Yts.prototype.detail = function(torrent_id, old_data) {
        return queryTorrent(torrent_id, old_data);
    };


    App.Providers.Yts = Yts;

})(window.App);