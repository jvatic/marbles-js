//= require ./core
//= require_self

Marbles.HTTP.Middleware.WithCredentials = {
	willSendRequest: function (request) {
		request.xhr.withCredentials = true;
	}
};
