/**
 * @memberof Marbles.HTTP.Middleware
 * @desc Sets `withCredentials = true` on the XMLHttpRequest object
 */
var WithCredentials = {
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

export default WithCredentials;
