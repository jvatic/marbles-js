//= require ./core
//= require_self

(function () {

"use strict";

Marbles.HTTP.Middleware.WithCredentials = {
	willSendRequest: function (request) {
		request.xhr.withCredentials = true;
	}
};

})();
