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

	"use strict";

	/**
	 * @memberof Marbles
	 * @class
	 * @see Marbles.Router
	 * @desc You should never need to explicitly instantiate this class
	 */
	var History = Marbles.Utils.createClass({
		displayName: 'Marbles.History',

		mixins: [Marbles.QueryParams],

		willInitialize: function () {
			this.started = false;
			this.handlers = [];
			this.options = {};
			this.path = null;
			this.prevPath = null;

			this.handlePopState = this.handlePopState.bind(this);
		},

		// register route handler
		// handlers are checked in the reverse order
		// they are defined, so if more than one
		// matches, only the one defined last will
		// be called
		route: function (route, name, callback, paramNames, opts, router) {
			if (typeof callback !== 'function') {
				throw new Error(this.constructor.displayName + ".prototype.route(): callback is not a function: "+ JSON.stringify(callback));
			}

			if (typeof route.test !== 'function') {
				throw new Error(this.constructor.displayName + ".prototype.route(): expected route to be a RegExp: "+ JSON.stringify(route));
			}

			this.handlers.push({
				route: route,
				name: name,
				paramNames: paramNames,
				callback: callback,
				opts: opts,
				router: router
			});
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
				throw new Error("Marbles.history has not been started or is set to a different instance");
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

			if (path[0] === "/") {
				// trim / prefix
				path = path.substring(1);
			}

			if (options.params) {
				path = this.pathWithParams(path, options.params);
			}

			if (path === this.path && !options.force) {
				// we are already there and handler is not forced
				return;
			}

			path = this.pathWithRoot(path);

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
				this.loadURL({ replace: options.replace });
			}
		},

		pathWithParams: function (path, params) {
			if (params.length === 0) {
				return path;
			}

			// clone params array
			params = [].concat(params);
			// we mutate the first param obj, so clone that
			params[0] = Marbles.Utils.extend({}, params[0]);

			// expand named params in path
			path = path.replace(/:([^\/]+)/g, function (m, key) {
				var paramObj = params[0];
				if (paramObj.hasOwnProperty(key)) {
					var val = paramObj[key];
					delete paramObj[key];
					return encodeURIComponent(val);
				} else {
					return ":"+ key;
				}
			});

			// add remaining params to query string
			var queryString = this.serializeParams(params);
			if (queryString.length > 1) {
				if (path.indexOf('?') !== -1) {
					path = path +'&'+ queryString.substring(1);
				} else {
					path = path + queryString;
				}
			}

			return path;
		},

		pathWithRoot: function (path) {
			// add path root if it's not already there
			var root = this.options.root;
			if (root && path.substr(0, root.length) !== root) {
				if (root.substring(root.length-1) !== '/' && path.substr(0, 1) !== '/') {
					// add path seperator if not present in root or path
					path = '/' + path;
				}
				path = root + path;
			}
			return path;
		},

		getURLFromPath: function (path, params) {
			if (params && params.length !== 0) {
				path = this.pathWithParams(path, params);
			}
			return window.location.protocol +'//'+ window.location.host + this.pathWithRoot(path);
		},

		// start pushState handling
		start: function (options) {
			if (Marbles.history && Marbles.history.started) {
				throw new Error("Marbles.history has already been started");
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

			this.dispatcher = options.dispatcher || Marbles.Dispatcher;

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

		getHandler: function (path) {
			path = path || this.getPath();
			var handler = null;
			for (var i = 0, _len = this.handlers.length; i < _len; i++) {
				if (this.handlers[i].route.test(path)) {
					handler = this.handlers[i];
					break;
				}
			}
			return handler;
		},

		// Attempt to find handler for current path
		// returns matched handler or null
		loadURL: function (options) {
			options = options || {};
			var prevPath = this.path;
			var prevParams = this.pathParams;
			if ( !options.replace ) {
				this.prevPath = prevPath;
				this.prevParams = prevParams;
			}

			var path = this.path = this.getPath();
			var parts = path.match(this.constructor.regex.routeParts);
			path = parts[1];
			var params = this.deserializeParams(parts[2] || '');
			this.pathParams = params;

			var prevHandler;
			if (this.path !== this.prevPath) {
				prevHandler = this.getHandler(prevPath);
			}
			var handler = this.getHandler(path);

			var __handlerAbort = false;
			var handlerAbort = function () {
				__handlerAbort = true;
			};

			if (prevHandler) {
				var handlerUnloadEvent = {
					handler: prevHandler,
					nextHandler: handler,
					path: prevPath,
					nextPath: path,
					params: prevParams,
					nextParams: params,
					abort: handlerAbort
				};
				if (prevHandler.router.beforeHandlerUnlaod) {
					prevHandler.router.beforeHandlerUnlaod.call(prevHandler.router, handlerUnloadEvent);
				}

				if ( !__handlerAbort ) {
					this.trigger('handler:before-unload', handlerUnloadEvent);
				}
			}

			if (handler && !__handlerAbort) {
				var router = handler.router;
				params = Marbles.QueryParams.combineParams(params, router.extractNamedParams.call(router, handler.route, path, handler.paramNames));
				var event = {
					handler: handler,
					path: path,
					params: params,
					abort: handlerAbort
				};
				if (handler.router.beforeHandler) {
					handler.router.beforeHandler.call(handler.router, event);
				}

				if ( !__handlerAbort ) {
					this.trigger('handler:before', event);
				}

				if ( !__handlerAbort ) {
					handler.callback.call(router, params, handler.opts);
					this.trigger('handler:after', {
						handler: handler,
						path: path,
						params: params
					});
				}
			}
			return handler;
		},

		trigger: function (eventName, args) {
			return this.dispatcher.dispatch(Marbles.Utils.extend({
				source: "Marbles.History",
				name: eventName
			}, args));
		}

	});

	Marbles.History = History;

	History.regex = {
    routeStripper: /^[\/]/,
    routeParts: /^([^?]*)(?:\?(.*))?$/ // 1: path, 2: params
	};

	/**
	 * @memberof Marbles.History
	 * @func
	 * @param {Object} options
	 * @desc Starts listenening to pushState events and calls route handlers when appropriate
	 * @example
	 *	Marbles.History.start({
	 *		root: "/", // if your app is mounted anywhere other than the domain root, enter the path prefix here
	 *		pushState: true, // set to `false` in the unlikely event you wish to disable pushState (falls back to manipulating window.location)
	 *		dispatcher: Marbles.Dispatcher // The Dispatcher all events are passed to
	 *	})
	 */
	History.start = function () {
		if (!Marbles.history) {
			Marbles.history = new Marbles.History();
		}
		return Marbles.history.start.apply(Marbles.history, arguments);
	};

})();
