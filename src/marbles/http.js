/* @flow weak */
import Utils from "./utils";
import Events from "./events";
import URI from "./uri";

/**
 * @memberof Marbles
 * @class
 * @name Marbles.HTTPRequest
 * @params {Object} options
 * @see Marbles.HTTP
 */
var Request = Utils.createClass({
	displayName: 'Marbles.HTTPRequest',

	mixins: [Events],

	willInitialize: function (options) {
		if (!options) {
			options = {};
		}

		this.middleware = options.middleware || [];

		this.method = options.method || 'GET';
		this.method = this.method.toUpperCase();

		this.uri = new URI(options.url, options.params || [{}]);

		this.requestHeaders = options.headers || {};

		this.requestBody = options.body || null;

		if (this.method === 'GET' || this.method === 'HEAD') {
			this.id = this.method +':'+ this.uri.toString();

			// the same request is already in progress
			if (this.constructor.activeRequests[this.id]) {
				return this.constructor.activeRequests[this.id];
			}

			this.on('before:send', this.trackRequest, this);
			this.on('complete', this.untrackRequest, this);
			this.on('terminated', this.untrackRequest, this);
		}

		this.on('before:send', this.callRequestMiddleware, this);
		this.on('before:send', this.setXMLHTTPRequestHeaders, this);

		this.on('before:complete', this.callResponseMiddleware, this);
		this.on('complete', this.untrackRequest, this);

		this.on('before:send', function () {
			var completeResolve, completeReject;
			this.completePromise = new Promise(function (rs, rj) {
				completeResolve = rs;
				completeReject = rj;
			});
			var onComplete = function (res, xhr) {
				this.off('terminated', onTerminated, this);
				this.completePromise = null;
				completeResolve([res, xhr]);
			};
			var onTerminated = function (err) {
				this.off('complete', onComplete, this);
				this.completePromise = null;
				completeReject(err);
			};
			this.once('complete', onComplete, this);
			this.once('terminated', onTerminated, this);
		}, this);
		this.completePromise = null;
	},

	then: function () {
		var promise = this.completePromise || new Promise(function (resolve, reject) {
			reject(new Error("Request not started!"));
		});
		return promise.then.apply(promise, arguments);
	},

	catch: function () {
		var promise = this.completePromise || new Promise(function (resolve, reject) {
			reject(new Error("Request not started!"));
		});
		return promise.catch.apply(promise, arguments);
	},

	setRequestHeader: function (key, val) {
		this.requestHeaders[key] = val;
	},

	getRequestHeader: function (key) {
		return this.requestHeaders[key];
	},

	getResponseHeader: function (key) {
		return this.xhr.getResponseHeader(key);
	},

	terminate: function (err) {
		this.terminated = true;
		this.trigger('terminated', err);
	},

	resend: function (err) {
		this.terminate(err || 'resend');
		this.open();
		this.send();
	},

	callRequestMiddleware: function () {
		for (var i = 0, _ref = this.middleware, _len = _ref.length; i < _len; i++) {
			if (this.terminated) {
				break;
			}
			if (typeof _ref[i].willSendRequest === 'function') {
				_ref[i].willSendRequest(this);
			}
		}
	},

	callResponseMiddleware: function () {
		for (var i = 0, _ref = this.middleware, _len = _ref.length; i < _len; i++) {
			if (this.terminated) {
				break;
			}
			if (typeof _ref[i].didReceiveResponse === 'function') {
				_ref[i].didReceiveResponse(this);
			}
		}
	},

	trackRequest: function () {
		this.constructor.activeRequests[this.id] = this;
	},

	untrackRequest: function () {
		if (this.constructor.activeRequests.hasOwnProperty(this.id)) {
			delete this.constructor.activeRequests[this.id];
		}
	},

	setXMLHTTPRequest: function () {
		this.xhr = new XMLHttpRequest();
		this.xhr.onreadystatechange = this.handleReadyStateChange.bind(this);
	},

	setXMLHTTPRequestHeaders: function () {
		for (var key in this.requestHeaders) {
			if (this.requestHeaders.hasOwnProperty(key)) {
				this.xhr.setRequestHeader(key, this.requestHeaders[key]);
			}
		}
	},

	handleReadyStateChange: function () {
		if (this.xhr.readyState !== 4) {
			return;
		}

		this.trigger('before:complete', this.xhr);

		var responseData = this.responseData || this.xhr.response;
		if (this.xhr.status >= 200 && this.xhr.status < 400 && this.xhr.status !== 0) {
			this.trigger('success', responseData, this.xhr);
		} else {
			this.trigger('failure', responseData, this.xhr);
		}

		this.trigger('complete', responseData, this.xhr);
	},

	open: function () {
		// The request is already open
		if (this.xhr && this.xhr.readyState !== 4) {
			return;
		}

		this.setXMLHTTPRequest();
		var url = this.uri.toString();
		var async = true;
		this.xhr.open(this.method, url, async);
		this.trigger('open', this.method, url, async);
	},

	send: function () {
		if (this.xhr.readyState !== 1) {
			return;
		}

		this.trigger('before:send');
		try {
			this.xhr.send(this.requestBody);
		} catch (e) {
			setTimeout(function () {
				throw e;
			}, 0);
		}
		this.trigger('after:send');
	}
});

Request.activeRequests = {};

/**
 * @memberof Marbles
 * @func
 * @params {Object} options
 * @returns {Marbles.HTTPRequest} request
 * @see Marbles.HTTP.Middleware
 * @example
 *	Marbles.HTTP({
 *		method: "POST",
 *		url: "http://example.com/posts",
 *		params: [{
 *			a: 1
 *		}],
 *		body: { title: "My Post", content: "Lorem ipsum..." },
 *		middleware: [
 *			Marbles.HTTP.Middleware.SerializeJSON
 *		],
 *		headers: {
 *			"Content-Type": "application/json",
 *		}
 *	}).then(function (args) {
 *		var res = args[0];
 *		var xhr = args[1];
 *		// request complete
 *		// do something
 *	}).catch(function (err) {
 *		// request terminated
 *		// do something
 *	});
 */
var HTTP = function (options) {
	var request = new Request({
		method: options.method,
		url: options.url,
		params: options.params,
		body: options.body,
		headers: options.headers,
		middleware: options.middleware
	});
	if (typeof options.callback === 'function') {
		request.once('complete', options.callback);
	}
	if ( !request.xhr ) {
		request.open();
		request.send();
	}
	return request;
};

export { Request, HTTP };
export default HTTP;
