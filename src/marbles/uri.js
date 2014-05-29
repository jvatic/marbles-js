//= require ./core
//= require ./utils
//= require ./query_params

(function () {

	"use strict";

	var URI = Marbles.Utils.createClass({
		displayName: 'Marbles.URI',

		mixins: [Marbles.QueryParams],

		willInitialize: function (url, params) {
			this.url = url.trim();
			this.params = params || [{}];

			this.parse();

			this.isURI = true;
		},

		toString: function () {
			var portString = '';
			if (this.port !== 443 && this.port !== 80) {
				portString = ':'+ this.port;
			}

			var schemeString = '';
			if (this.scheme) {
				schemeString = this.scheme + '://';
			}

			var queryString = this.serializeParams(this.params);
			if (queryString === '?') {
				queryString = '';
			}

			var hashString = '';
			if (this.hash) {
				hashString = '#'+ this.hash;
			}

			return (schemeString + this.hostname + portString + this.path + queryString + hashString).replace(/\/$/, '');
		},

		assertEqual: function (uriOrString) {
			var uri = uriOrString;
			if (uriOrString.isURI !== true) {
				uri = new this.constructor(uriOrString);
			}

			return (uri.scheme === this.scheme) && (uri.hostname === this.hostname) && (uri.port === this.port) && (uri.path === this.path) && (uri.params === this.params) && (uri.hash === this.hash);
		},

		parse: function () {
			var m = this.url.match(this.constructor.REGEX);
			this.hostname = m[2] || this.defaultHost();
			this.scheme = (m[1] || this.defaultScheme()).replace(/:\/\/$/, '');
			this.port = Number(m[3]) || this.defaultPort();
			this.path = m[4] || '';
			if (m[5]) {
				var params = this.deserializeParams(m[5]);
				this.replaceParams.apply(this, [this.params].concat(params));
			}
			this.hash = m[6];
		},

		defaultScheme: function () {
			if (typeof window !== 'undefined') {
				return window.location.protocol + '//';
			} else {
				if (this.hostname) {
					return 'http://';
				} else {
					return '';
				}
			}
		},

		defaultHost: function () {
			if (typeof window !== 'undefined') {
				return window.location.hostname;
			} else {
				return '';
			}
		},

		defaultPort: function () {
			if (this.hostname === this.defaultHost() && typeof window !== 'undefined' && window.location.port) {
				return window.location.port;
			} else if (this.scheme === 'https') {
				return 443;
			} else {
				return 80;
			}
		}
	});

	Marbles.URI = URI;

	URI.REGEX = /^(https?:\/\/)?([^\/]+(:\d+)?)?([^\?#]+)?(\?[^#]+)?(#.+)?$/; // $1 = scheme, $2 = hostname, $3 = port, $4 = path, $5 = query, $6 = hash
})();
