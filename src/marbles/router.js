//= require ./history
//= require ./utils
//= require_self

/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js Router  *
 * * * * * * * * * * * * * * * * * *
 */

(function () {

	var Router = Marbles.Utils.createClass({
		displayName: 'Marbles.Router',

		mixins: [Marbles.Events],

		willInitialize: function (options) {
			this.bindRoutes();
		},

		navigate: function (path, options) {
			return Marbles.history.navigate(path, options);
		},

		route: function (route, handler) {
			if (!Marbles.history) {
				Marbles.history = new Marbles.History();
			}

			var paramNames = [];
			if (typeof route.test !== 'function') {
				paramNames = this.routeParamNames(route);
				route = this.routeToRegExp(route);
			}

			if (typeof handler !== 'function') {
				handler = this[handler];
			}

			Marbles.history.route(route, function (path, params) {
				Marbles.Utils.extend(params, this.extractNamedParams(route, path, paramNames));

				var args = [params];
				handler.apply(this, args);
				this.trigger.apply(this, ['route:' + name].concat(args));
				Marbles.history.trigger('route', this, name, args);

				return this;
			}.bind(this));
		},

		bindRoutes: function () {
			var ctor = this.constructor;
			if (!ctor.routes) {
				throw Error("You need to define "+ ctor.displayName || ctor.name +".routes");
			}

			for (var i = 0, _ref = ctor.routes, _len = _ref.length; i < _len; i++) {
				this.route(_ref[i].path, _ref[i].handler);
			}
		},

		routeToRegExp: function (route) {
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
			return paramNames;
		},

		extractNamedParams: function (route, path, paramNames) {
			var values = [],
					params = {};

			for (var i = 0, _ref = this.extractParams(route, path), _len = _ref.length; i < _len; i++) {
				values.push(decodeURIComponent(_ref[i]));
			}

			for (i = 0, _len = paramNames; i < _len; i++) {
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

})();
