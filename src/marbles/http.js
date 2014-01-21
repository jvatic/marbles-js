//= require ./core
//= require ./utils
//= require ./uri
//= require_self

(function () {

	Marbles.HTTP = function (options) {
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
		request.open();
		request.send();
		return request;
	};

	var Request = Marbles.Utils.createClass({
		displayName: 'Marbles.HTTPRequest',

		mixins: [Marbles.Events],

		willInitialize: function (options) {
			if (!options) {
				options = {};
			}

			this.middleware = options.middleware || [];

			this.method = options.method || 'GET';
			this.method = this.method.toUpperCase();

			this.uri = new Marbles.URI(options.url, options.params || [{}]);

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
			delete this.constructor.activeRequests[this.id];
		},

		setXMLHTTPRequest: function () {
			this.xhr = new XMLHttpRequest();
			this.xhr.onreadystatechange = this.handleReadyStateChange.bind(this);
		},

		setXMLHTTPRequestHeaders: function () {
			for (var key in this.requestHeaders) {
				this.xhr.setRequestHeader(key, this.requestHeaders[key]);
			}
		},

		handleReadyStateChange: function () {
			if (this.xhr.readyState !== 4) {
				return;
			}

			this.trigger('before:complete', this.xhr);

			var responseData = this.responseData || this.xhr.response;
			if (this.xhr.status >= 200 && this.xhr.status < 400) {
				this.trigger('success', responseData, this.xhr);
			} else {
				this.trigger('failure', responseData, this.xhr);
			}

			this.trigger('complete', responseData, this.xhr);
		},

		open: function () {
			this.setXMLHTTPRequest();
			var url = this.uri.toString();
			var async = true;
			var ret = this.xhr.open(this.method, url, async);
			this.trigger('open', this.method, url, async);
			return ret;
		},

		send: function () {
			if (this.xhr.readyState === 4) {
				return;
			}

			var send = function () {
				this.trigger('before:send');
				if (this.multipart === true) {
					if (typeof this.xhr.sendAsBinary !== 'function') {
						throw Error(this.constructor.displayName +': '+ this.xhr.constructor.name +'.prototype.sendAsBinary is not a function!');
					}
					this.xhr.sendAsBinary(this.requestBody);
				} else {
					this.xhr.send(this.requestBody);
				}
				this.trigger('after:send');
			}.bind(this);

			if (this.body && Array.isArray(this.body)) {
				this.setRequestHeader('Content-Type', 'multipart/form-data; boundary='+ this.constructor.MULTIPART_BOUNDARY);
				this.multipart = true;
				this.buildMultipartRequestBody(send);
			} else {
				send();
			}
		},

		buildMultipartRequestBody: function (done) {
			var startBoundary = "--"+ this.constructor.MULTIPART_BOUNDARY +"\r\n";
			var closeBoundary = "--"+ this.constructor.MULTIPART_BOUNDARY +"--";
			var parts = [];
			var numPendingParts = this.body.length;

			function readAsBinaryString(blob, callback) {
				var reader = new FileReader();
				reader.onload = function (e) {
					callback(e.target.result);
				};
				reader.readAsBinaryString(blob);
			}

			function addPart(data) {
				if (data) {
					parts.push(data);
				}
				numPendingParts--;

				if (numPendingParts === 0) {
					this.body = startBoundary;
					this.body += parts.join(startBoundary);
					this.body += closeBoundary;
					done();
				}
			}

			function buildAndAddPart(part) {
				var name = part[0];
				var blob = part[1];
				var filename = part[2];
				var data = [
					'Content-Disposition: form-data; name="'+ name +'"; filename="'+ filename +'"',
					'Content-Type: '+ (blob.type || 'application/octet-stream'),
					'Content-Length: '+ blob.size,
				].join('\r\n');

				readAsBinaryString(blob, function(str) {
					data += str +'\r\n';
					addPart(data);
				});
			}

			for (var i = 0, _len = this.body.length; i < _len; i++) {
				buildAndAddPart(this.body[i]);
			}
		}
	});

	Marbles.HTTPRequest = Request;

	Request.MULTIPART_BOUNDARY = "-----------REQUEST_PART";

	Request.activeRequests = {};

})();
