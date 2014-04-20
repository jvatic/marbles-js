//= require ./core
//= require_self

(function () {

"use strict";

Marbles.HTTP.Middleware.WithCredentials = {
	willSendRequest: function (request) {
		try {
			request.xhr.withCredentials = true;
		} catch (e) {
			setTimeout(function () {
				throw e;
			}, 0);
		}
	}
};

})();
