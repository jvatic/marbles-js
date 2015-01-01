import BasicAuth from "./middleware/basic_auth";
import FormEncoded from "./middleware/form_encoded";
import SerializeJSON from "./middleware/serialize_json";
import WithCredentials from "./middleware/with_credentials";

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

var Middleware = {
	BasicAuth: BasicAuth,
	FormEncoded: FormEncoded,
	SerializeJSON: SerializeJSON,
	WithCredentials: WithCredentials
};

export default Middleware;
