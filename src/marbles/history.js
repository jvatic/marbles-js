/* @flow weak */
import Utils from "./utils";
import Dispatcher from "./dispatcher";
import QueryParams from "./query_params";

/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js History *
 * * * * * * * * * * * * * * * * * *
 */

var pathWithParams = function (path, params) {
	if (params.length === 0) {
		return path;
	}

	// clone params array
	params = [].concat(params);
	// we mutate the first param obj, so clone that
	params[0] = Utils.extend({}, params[0]);

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
	var queryString = QueryParams.serializeParams(params);
	if (queryString.length > 1) {
		if (path.indexOf('?') !== -1) {
			path = path +'&'+ queryString.substring(1);
		} else {
			path = path + queryString;
		}
	}

	return path;
};

/**
 * @memberof Marbles
 * @class
 * @see Marbles.Router
 */
var History = Utils.createClass({
	displayName: 'Marbles.History',

	willInitialize: function () {
		this.started = false;
		this.handlers = [];
		this.options = {};
		this.path = null;
		this.prevPath = null;

		this.handlePopState = this.handlePopState.bind(this);
	},

	// register router
	register: function (router) {
		router.history = this;
		router.routes.forEach(function (route) {
			this.route(
				route.route,
				route.name,
				route.handler,
				route.paramNames,
				route.opts,
				router
			);
		}.bind(this));
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
		if (!this.started) {
			throw new Error("history has not been started");
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
			path = pathWithParams(path, options.params);
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

		var promise = Promise.resolve();
		if (options.trigger) {
			// cause route handler to be called
			promise = this.loadURL({ replace: options.replace });
		}
		return promise;
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
			path = pathWithParams(path, params);
		}
		return window.location.protocol +'//'+ window.location.host + this.pathWithRoot(path);
	},

	/**
	 * @func
	 * @param {Object} options
	 * @desc Starts listenening to pushState events and calls route handlers when appropriate
	 * @example
	 *	import History from "marbles/history";
	 *	new History().start({
	 *		root: "/", // if your app is mounted anywhere other than the domain root, enter the path prefix here
	 *		pushState: true, // set to `false` in the unlikely event you wish to disable pushState (falls back to manipulating window.location)
	 *		dispatcher: Marbles.Dispatcher // The Dispatcher all events are passed to
	 *	});
	 */
	start: function (options) {
		if (this.started) {
			throw new Error("history has already been started");
		}

		if (!options) {
			options = {};
		}
		if (!options.hasOwnProperty('trigger')) {
			options.trigger = true;
		}

		this.dispatcher = options.dispatcher || Dispatcher;

		this.context = options.context || {};

		this.options = Utils.extend({root: '/', pushState: true}, options);
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
		return this.trigger('start').then(function () {
			if (options.trigger) {
				return this.loadURL();
			}
		}.bind(this));
	},

	// stop pushState handling
	stop: function () {
		if (this.options.pushState) {
			window.removeEventListener('popstate', this.handlePopState, false);
		}
		this.started = false;
		return this.trigger('stop');
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
			return Promise.resolve();
		}
		return this.loadURL();
	},

	getHandler: function (path) {
		path = path || this.getPath();
		path = path.split('?')[0];
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
		var params = QueryParams.deserializeParams(parts[2] || '');
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
		var router;

		var runBeforeUnload = function () {
			var promise = Promise.resolve();
			if (prevHandler) {
				var handlerUnloadEvent = {
					handler: prevHandler,
					nextHandler: handler,
					path: prevPath,
					nextPath: path,
					params: prevParams,
					nextParams: params,
					abort: handlerAbort,
					context: this.context
				};
				if (prevHandler.router.beforeHandlerUnload) {
					prevHandler.router.beforeHandlerUnload.call(prevHandler.router, handlerUnloadEvent);
				}

				if ( !__handlerAbort ) {
					promise = this.trigger('handler:before-unload', handlerUnloadEvent);
				}
			}
			return promise;
		}.bind(this);

		var runBefore = function () {
			var promise = Promise.resolve();
			if ( !handler || __handlerAbort ) {
				return promise;
			}
			router = handler.router;
			params = QueryParams.combineParams(params, router.extractNamedParams.call(router, handler.route, path, handler.paramNames));
			var event = {
				handler: handler,
				path: path,
				params: params,
				abort: handlerAbort,
				context: this.context
			};
			if (handler.router.beforeHandler) {
				handler.router.beforeHandler.call(handler.router, event);
			}

			if ( !__handlerAbort ) {
				promise = this.trigger('handler:before', event);
			}
			return promise;
		}.bind(this);

		var runHandler = function () {
			if ( !handler || __handlerAbort ) {
				return Promise.resolve();
			}
			return handler.callback.call(router, params, handler.opts, this.context);
		}.bind(this);

		var runAfter = function () {
			if ( !handler || __handlerAbort ) {
				return Promise.resolve();
			}
			return this.trigger('handler:after', {
				handler: handler,
				path: path,
				params: params
			});
		}.bind(this);

		return runBeforeUnload().then(runBefore).then(runHandler).then(runAfter);
	},

	trigger: function (eventName, args) {
		return this.dispatcher.dispatch(Utils.extend({
			source: "Marbles.History",
			name: eventName
		}, args));
	}

});

History.regex = {
	routeStripper: /^[\/]/,
	routeParts: /^([^?]*)(?:\?(.*))?$/ // 1: path, 2: params
};

export { pathWithParams };
export default History;
