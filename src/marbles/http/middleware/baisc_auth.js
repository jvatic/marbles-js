//= require ./core
//= require_self

(function () {

"use strict";

/**
 * @memberof Marbles.HTTP.Middleware
 * @param {String} user
 * @param {String} password
 * @desc Returns middleware for setting `Authorize` header
 */
Marbles.HTTP.Middleware.BasicAuth = function (user, password) {
	var authHeader = "Basic "+ window.btoa((user || "") +":"+ (password || ""));
	return {
		willSendRequest: function (request) {
			try {
				request.setRequestHeader("Authorization", authHeader);
			} catch (e) {
				setTimeout(function () {
					throw e;
				}, 0);
			}
		}
	};
};

})();
