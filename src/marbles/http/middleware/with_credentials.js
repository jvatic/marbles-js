//= require ./core
//= require_self

(function () {

"use strict";

/**
 * @memberof Marbles.HTTP.Middleware
 * @desc Sets `withCredentials = true` on the XMLHttpRequest object
 */
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
