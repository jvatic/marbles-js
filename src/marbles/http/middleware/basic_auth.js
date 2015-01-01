/**
 * @memberof Marbles.HTTP.Middleware
 * @param {String} user
 * @param {String} password
 * @desc Returns middleware for setting `Authorize` header
 */
var BasicAuth = function (user, password) {
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

export default BasicAuth;
