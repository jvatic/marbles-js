//= require ./core
//= require ./events
//= require ./utils
//= require ./query_params
//= require_self

/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js History *
 * * * * * * * * * * * * * * * * * *
 */

(function () {

	var History = Marbles.Utils.createClass({
		displayName: 'Marbles.History',

		mixins: [Marbles.Events, Marbles.QueryParams],

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
				options = {};
			}
			if (!options.hasOwnProperty('trigger')) {
				options.trigger = true;
			}
			if (!options.hasOwnProperty('replace')) {
				options.replace = false;
			}
			if (!options.hasOwnProperty('force')) {
				options.force = false;
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
			if (!options.hasOwnProperty('trigger')) {
				options.trigger = true;
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
				window.addEventListener('popstate', this.handlePopState, false);
			}

			this.started = true;
			this.trigger('start');

			if (options.trigger) {
				this.loadURL();
			}
		},

		// stop pushState handling
		stop: function () {
			if (this.options.pushState) {
				window.removeEventListener('popstate', this.handlePopState, false);
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
