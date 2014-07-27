//= require ../../core
//= require_self

/**
 * @memberof Marbles
 * @namespace HTTP.Middleware
 * @see Marbles.HTTP
 *
 * @example
 *	var MyMiddleware = {
 *		willSendRequest: function (request) {
 *			// do something
 *		},
 *
 *		didReceiveResponse: function (request) {
 *			// do something
 *		}
 *	};
 */
Marbles.HTTP.Middleware = Marbles.HTTP.Middleware || {};
