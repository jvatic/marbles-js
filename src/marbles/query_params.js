/* @flow weak */
/**
 * @memberof Marbles
 * @mixin
 */
var QueryParams = {
	/**
	 * @method
	 * @param {String} queryString
	 * @returns {Array} params
	 * @desc transforms a query string into an array of param objects (the first occurance of each param will be placed at index 0, the second at index 1, and so on).
	 * @example
	 *	Marbles.QueryParams.deserializeParams("?a=1&b=2&c=3");
	 *	//=> [{a: 1, b:2, c:3}]
	 * @example
	 *	Marbles.QueryParams.deserializeParams("a=1&b=2&c=3");
	 *	//=> [{a: 1, b:2, c:3}]
	 * @example
	 *	Marbles.QueryParams.deserializeParams("?a=1&a=2&b=3&c=4&c=5");
	 *	//=> [{a: 1, b:3, c:4}, {a: 2, c: 5}]
	 */
	deserializeParams: function (query) {
		if (query.substr(0, 1) === '?') {
			query = query.substring(1).split('&');
		} else {
			query = query.split('&');
		}

		var params = [{}];
		for (var i = 0, _len = query.length; i < _len; i++) {
			var q = query[i].split('='),
					key = decodeURIComponent(q[0]),
					val = decodeURIComponent(q[1] || '').replace('+', ' ').trim(); // + doesn't decode

			if (typeof val === 'string' && !val) {
				// ignore empty values
				continue;
			}

			if (val.indexOf(',') !== -1) {
				// decode comma delemited values into arrays
				val = val.split(',');
			}

			// loop through param objects until we find one without key
			for (var j = 0, _l = params.length; j < _l; j++) {
				if (params[j].hasOwnProperty(key)) {
					if (j === _l-1) {
						// create additional param objects as needed
						params.push({});
						_l++;
					}
					continue;
				} else {
					params[j][key] = val;
					break;
				}
			}
		}

		return params;
	},

	/**
	 * @method
	 * @desc Combines the first params array with the contents of all the others. Duplicate params are pushed into the next param object they do not comflict with. The mutated params array is returned.
	 * @param {Array} params An array of param objects
	 * @param {...Object} others Any number of param objects
	 * @retuns {Array} params
	 */
	combineParams: function (params) {
		var others = Array.prototype.slice.call(arguments, 1);

		function addValue(key, val) {
			// loop through param objects until we find one without key
			for (var i = 0, _len = params.length; i < _len; i++) {
				if (params[i].hasOwnProperty(key)) {
					if (i === _len-1) {
						// create additional param objects as needed
						params.push({});
						_len++;
					}
					continue;
				} else {
					params[i][key] = val;
					break;
				}
			}
		}

		var key;
		for (var i = 0, _len = others.length; i < _len; i++) {
			for (key in others[i]) {
				if (others[i].hasOwnProperty(key)) {
					addValue(key, others[i][key]);
				}
			}
		}

		return params;
	},

	/**
	 * @method
	 * @desc Combines the first params array with the contents of all the others. Duplicate params are overwritten if they are at the same params index.
	 * @param {Array} params An array of param objects
	 * @param {...Object} others Any number of param objects
	 * @retuns {Array} params
	 */
	replaceParams: function (params) {
		var others = Array.prototype.slice.call(arguments, 1);

		function replaceValue(index, key, val) {
			params[index] = params[index] || {};
			params[index][key] = val;
		}

		var key;
		for (var i = 0, _len = others.length; i < _len; i++) {
			for (key in others[i]) {
				if (others[i].hasOwnProperty(key)) {
					replaceValue(i, key, others[i][key]);
				}
			}
		}

		return params;
	},

	/**
	 * @method
	 * @desc Transforms an array of param objects into a query string.
	 * @param {Array} params An array of param objects
	 * @retuns {String} queryString
	 * @example
	 *	Marbles.QueryParams.serializeParams([{a:1, b:2}, {a:3, b:4}]);
	 *	//= "?a=1&b=2&a=3&b=4"
	 */
	serializeParams: function (params) {
		var query = [];
		for (var i = 0, _len = params.length; i < _len; i++) {
			for (var key in params[i]) {
				if (params[i].hasOwnProperty(key)) {
					var val = params[i][key];

					if ((typeof val === 'string' && !val) || val === undefined || val === null) {
						// ignore empty values
						continue;
					}

					if (typeof val === 'object' && val.hasOwnProperty('length')) {
						// encode arrays as comma delemited strings
						val = val.join(',');
					}

					query.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
				}
			}
		}

		return "?" + query.join('&');
	}
};

export default QueryParams;
