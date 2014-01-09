//= require ./core
//= require ./events
//= require ./utils
//= require_self

/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js History *
 * * * * * * * * * * * * * * * * * *
 */

(function () {

	var History = Marbles.Utils.createClass({
		displayName: 'Marbles.History',

		mixins: [Marbles.Events],

		willInitialize: function () {
			this.started = false;
			this.handlers = [];
			this.options = {};
			this.path = null;

			this.handlePopState = this.handlePopState.bind(this);
		},

		// register route handler
		// handlers are checked in the reverse order
		// they are defined, so if more than one
		// matches, only the one defined last will
		// be called
		route: function (route, callback) {
			if (typeof callback !== 'function') {
				throw Error(this.constructor.displayName + ".prototype.route(): callback is not a function: "+ JSON.stringify(callback));
			}

			if (typeof route.test !== 'function') {
				throw Error(this.constructor.displayName + ".prototype.route(): expected route to be a RegExp: "+ JSON.stringify(route));
			}

			this.handlers.unshift({ route: route, callback: callback });
		},

		// navigate to given path via pushState
		// if available/enabled or by mutation
		// of window.location.href
		//
		// pass options.trigger = false to prevent
		// route handler from being called
		//
		// pass options.replaceState = true to
		// replace the current history item
		//
		// pass options.force = true to force
		// handler to be called even if path is
		// already loaded
		navigate: function (path, options) {
			if (Marbles.history !== this || !this.started) {
				throw Error("Marbles.history has not been started or is set to a different instance");
			}

			if (!options) {
				options = {
					trigger: true,
					replace: false,
					force: false
				};
			}

			if (path === this.path && !options.force) {
				// we are already there and handler is not forced
				return;
			}

			// add path root if it's not already there
			var root = this.options.root;
			if (root && path.substr(0, root.length) !== root) {
				if (root.substring(root.length-1) !== '/' && path.substr(0, 1) !== '/') {
					// add path seperator if not present in root or path
					path = '/' + path;
				}
				path = this.options.root + path;
			}

			if (!this.options.pushState) {
				// pushState is unavailable/disabled
				window.location.href = path;
				return;
			}

			// push or replace state
			var method = 'pushState';
			if (options.replace) {
				method = 'replaceState';
			}
			window.history[method]({}, document.title, path);

			if (options.trigger) {
				// cause route handler to be called
				this.loadURL();
			}
		},

		// start pushState handling
		start: function (options) {
			if (Marbles.history && Marbles.history.started) {
				throw Error("Marbles.history has already been started");
			}

			if (!options) {
				options = {};
			}

			if (!Marbles.history) {
				Marbles.history = this;
			}

			this.options = Marbles.Utils.extend({root: '/', pushState: true}, options);
			this.path = this.getPath();

			if (this.options.pushState) {
				// set pushState to false if it's not supported
				this.options.pushState = !!(window.history && window.history.pushState);
			}

			if (this.options.pushState) {
				// init back button binding
				Marbles.DOM.on(window, 'popstate', this.handlePopState, this);
			}

			this.started = true;
			this.trigger('start');

			if (!options.silent) {
				this.loadURL();
			}
		},

		// stop pushState handling
		stop: function () {
			if (this.options.pushState) {
				Marbles.DOM.off(window, 'popstate', this.handlePopState, this);
			}
			this.started = false;
			this.trigger('stop');
		},

		getPath: function () {
			var path = window.location.pathname;
			if (window.location.search) {
				path += window.location.search;
			}

			var root = this.options.root.replace(/([^\/])\/$/, '$1');

			if (path.indexOf(root) !== -1) {
				// trim root from path
				path = path.substr(root.length);
			}

			return path.replace(this.constructor.regex.routeStripper, '');
		},

		// transforms a query string into an
		// array of param objects (the first
		// occurance of each param will be
		// placed at index 0, the second at
		// index 1, and so on).
		deserializeParams: function (query) {
			if (query.substr(0, 1) === '?') {
				query = query.substring(1).split('&');
			} else {
				query = query.split('&');
			}

			var params = [{}];
			for (var i = 0, _len = query.length; i < _len; i++) {
				var q = query[i].split('='),
						key = decodeURIComponent(q[0]),
						val = decodeURIComponent(q[1] || '').replace('+', ' ').trim(); // + doesn't decode

				if (!val) {
					// ignore empty values
					continue;
				}

				if (val.indexOf(',') !== -1) {
					// decode comma delemited values into arrays
					val = val.split(',');
				}

				// loop through param objects until we find one without key
				for (var j = 0, _l = params.length; i < _l; i++) {
					if (params[0].hasOwnProperty(key)) {
						if (i === _len-1) {
							// create additional param objects as needed
							params.push({});
							_l++;
						}
						continue;
					} else {
						params[0][key] = val;
					}
				}
			}

			return params;
		},

		// transforms an array of param objects
		// into a query string.
		serializeParams: function (params) {
			var query = [];
			for (var i = 0, _len = params.length; i < _len; i++) {
				for (var key in params[i]) {
					var val = (params[i][key] || '').trim();

					if (!val) {
						// ignore empty values
						continue;
					}

					if (typeof val === 'object' && val.hasOwnProperty('length')) {
						// encode arrays as comma delemited strings
						val = val.join(',');
					}

					query.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
				}
			}

			return "?" + query.join('&');
		},

		handlePopState: function () {
			this.checkURL();
		},

		// check if path has changed
		checkURL: function () {
			var current = this.getPath();
			if (current === this.path) {
				// path is the same, do nothing
				return;
			}
			this.loadURL();
		},

		// Attempt to find handler for current path
		// returns matched handler or null
		loadURL: function () {
			var path = this.path = this.getPath();
			var parts = path.match(this.constructor.regex.routeParts);
			path = parts[1];
			var params = this.deserializeParams(parts[2] || '');

			var handler = null;
			for (var i = 0, _len = this.handlers.length; i < _len; i++) {
				if (this.handlers[i].route.test(path)) {
					handler = this.handlers[i];
					break;
				}
			}
			if (handler) {
				this.trigger('handler:before', handler, path, params);
				handler.callback(path, params);
				this.trigger('handler:after', handler, path, params);
			}
			return handler;
		},

	});

	Marbles.History = History;

	History.regex = {
    routeStripper: /^[\/]/,
    routeParts: /^([^?]*)(?:\?(.*))?$/ // 1: path, 2: params
	};

	History.start = function () {
		if (!Marbles.history) {
			Marbles.history = new Marbles.History();
		}
		return Marbles.history.start.apply(Marbles.history, arguments);
	};

})();
