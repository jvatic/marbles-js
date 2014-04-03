//= require ./core
//= require_self

(function () {

"use strict";

Marbles.HTTP.Middleware.SerializeJSON = {
	willSendRequest: function (request) {
		if (request.multipart) {
			return;
		}

		var contentType = request.getRequestHeader('Content-Type');
		if (!/\bjson/i.test(contentType)) {
			return;
		}

		var requestBody = request.requestBody;
		request.requestBody = requestBody ? JSON.stringify(requestBody) : null;
	},

	didReceiveResponse: function (request) {
		var contentType = request.getResponseHeader('Content-Type');
		if (!/\bjson/i.test(contentType)) {
			return;
		}

		var responseData = request.xhr.response;
		request.responseData = null;
		if (responseData) {
			try {
				request.responseData = JSON.parse(responseData);
			} catch (err) {
				request.terminate(err);
			}
		}
	}
};

})();
