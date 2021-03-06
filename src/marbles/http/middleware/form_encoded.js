/* @flow weak */
import QueryParams from "../../query_params";

var CONTENT_TYPE = 'application/x-www-form-urlencoded';

/**
 * @memberof Marbles.HTTP.Middleware
 * @desc Serializes the request body if the Content-Type header matches. Deserializes the response body if the Content-Type header matches.
 */
var FormEncoded = {
	willSendRequest: function (request) {
		if (request.multipart) {
			return;
		}

		if (!request.requestBody) {
			return;
		}

		var contentType = request.getRequestHeader('Content-Type');
		if (contentType !== CONTENT_TYPE) {
			return;
		}

		var params = request.requestBody;
		if (!Array.isArray(params)) {
			params = [params];
		}
		request.requestBody = QueryParams.serializeParams(params).substring(1);
	},

	didReceiveResponse: function (request) {
		var contentType = request.getResponseHeader('Content-Type');
		if (contentType !== CONTENT_TYPE) {
			return;
		}

		var response = request.xhr.response;
		var responseData = null;
		if (!response || typeof response !== 'string') {
			return;
		}

		if (!Array.isArray(responseData)) {
			responseData = [responseData];
		}

		request.responseData = QueryParams.deserializeParams(responseData);
	}
};

export { CONTENT_TYPE };
export default FormEncoded;
