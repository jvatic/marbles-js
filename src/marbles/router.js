//= require ./history
//= require ./utils
//= require_self

/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js Router  *
 * * * * * * * * * * * * * * * * * *
 */
(function () {

	"use strict";

	/**
	 * @memberof Marbles
	 * @class
	 * @see Marbles.History
	 * @example
	 *	var MyRouter = Marbles.Router.createClass({
	 *		displayName: "MyRouter",
	 *
	 *		// routes are evaluated in the order they are defined
	 *		routes: [
	 *			{ path: "posts", handler: "posts" },
	 *
	 *			// :id will be available in the params
	 *			{ path: "posts/:id", handler: "posts" },
	 *
	 *			// * will be available in the params as `splat`
	 *			{ path: "posts/:id/*", handler: "posts" },
	 *		],
	 *
	 *		posts: function (params, opts) {
	 *			// params is an array of objects,
	 *			// params[0] should be all you need unless
	 *			// you have multiple params of the same name
	 *
	 *			// opts contains any extra properties given in a route object
	 *		}
	 *	});
	 *	new MyRouter(); // bring it to life
	 */
	var Router = Marbles.Utils.createClass({
		displayName: 'Marbles.Router',

		mixins: [Marbles.Events],

		willInitialize: function () {
			this.bindRoutes();
		},

		navigate: function (path, options) {
			return Marbles.history.navigate(path, options);
		},

		// register route handler
		// handler will be called with an array
		// of param objects, the first of which
		// will contain any named params
		route: function (route, handler, opts) {
			if (!Marbles.history) {
				Marbles.history = new Marbles.History();
			}

			var paramNames = [];
			if (typeof route.test !== 'function') {
				paramNames = this.routeParamNames(route);
				route = this.routeToRegExp(route);
			}

			var name;
			if (typeof handler === 'function') {
				name = handler.name || handler.displayName || null;
			} else {
				name = handler;
				handler = this[handler];
			}

			Marbles.history.route(route, name, function (path, params) {
				params = Marbles.QueryParams.combineParams(params, this.extractNamedParams(route, path, paramNames));

				handler.apply(this, [params, opts]);
				this.trigger('route', route, params, opts);
				Marbles.history.trigger('route', this, route, params, opts);

				return this;
			}.bind(this), opts);
		},

		bindRoutes: function () {
			var ctor = this.constructor;
			if (!ctor.routes) {
				throw new Error("You need to define "+ ctor.displayName || ctor.name +".routes");
			}

			var opts, k;
			for (var i = 0, _ref = ctor.routes, _len = _ref.length; i < _len; i++) {
				opts = {};
				for (k in _ref[i]) {
					if (_ref[i].hasOwnProperty(k) && k !== "path" && k !== "handler") {
						opts[k] = _ref[i][k];
					}
				}
				this.route(_ref[i].path, _ref[i].handler, opts);
			}
		},

		routeToRegExp: function (route) {
			if (route[0] === "/") {
				// trim / prefix
				route = route.substring(1);
			}

			var ctor = this.constructor;
			route = route.replace(ctor.regex.escape, '\\$&').
										replace(ctor.regex.namedParam, '([^\/]+)').
										replace(ctor.regex.splatParam, '(.*?)');
			return new RegExp('^' + route + '$');
		},

		routeParamNames: function (route) {
			var ctor = this.constructor;
			var paramNames = [];
			var _ref = route.match(ctor.regex.namedParam);
			if (_ref && _ref.length) {
				for (var i = 0, _len = _ref.length; i < _len; i++) {
					paramNames.push(_ref[i].slice(1));
				}
			}
			_ref = route.match(ctor.regex.splatParam);
			if (_ref && _ref.length) {
				for (i = 0, _len = _ref.length; i < _len; i++) {
					paramNames.push("splat" + (i > 0 ? i+1 : ""));
				}
			}
			return paramNames;
		},

		extractNamedParams: function (route, path, paramNames) {
			var values = [],
					params = {};

			for (var i = 0, _ref = this.extractParams(route, path), _len = _ref.length; i < _len; i++) {
				values.push(decodeURIComponent(_ref[i]));
			}

			for (i = 0, _len = paramNames.length; i < _len; i++) {
				params[paramNames[i]] = values[i];
			}

			return params;
		},

		extractParams: function (route, path) {
			return route.exec(path).slice(1);
		}

	});

	Marbles.Router = Router;

	Router.regex = {
    namedParam: /:\w+/g,
    splatParam: /\*\w*/g,
    escape: /[-[\]{}()+?.,\\^$|#\s]/g
	};

	Router.routes = [];

	Router.createClass = function (proto) {
		if (!proto.hasOwnProperty('displayName')) {
			proto.displayName = this.displayName;
		}
		var routes = this.routes;
		if (proto.hasOwnProperty('routes')) {
			routes = proto.routes;
			delete proto.routes;
		}
		proto.parentClass = this;
		var ctor =  Marbles.Utils.createClass(proto);
		ctor.routes = routes;
		return ctor;
	};

})();
