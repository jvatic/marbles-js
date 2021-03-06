/* @flow weak */
import Utils from "./utils";
import Transaction from "./transaction";
import CIDMapping from "./id_mapping";
import Accessors from "./accessors";
import Events from "./events";

/**
 * @deprecated Use the Store instead
 * @see Marbles.Store
 * @memberof Marbles
 * @class
 */
var Model = Utils.createClass({
	displayName: 'Marbles.Model',

	mixins: [
		// Add some properties to ctor
		{
			ctor: {
				modelName: 'model',
				cidScope: ['modelName'],
				cidMappingScope: ['id'],
				JSONKeys: 'all'
			}
		},

		// Make ctor and proto evented
		{
			ctor: Events,
			proto: Events
		},

		// Extend ptoto with accessor methods
		Accessors,

		// Extend proto with transaction method
		Transaction,

		// CIDMapping extends both ctor and proto
		CIDMapping
	],

	willInitialize: function (attrs, options) {
		if (!attrs) {
			attrs = {};
		}

		if (!options) {
			options = {};
		}

		if (options.cid) {
			this.cid = options.cid;
		}

		this.initCIDMapping();

		this.transaction(function () {
			this.parseAttributes(attrs);
		});

		return this;
	},

	parseAttributes: function (attrs) {
		for (var k in attrs) {
			if (attrs.hasOwnProperty(k)) {
				this.set(k, attrs[k], {keypath: false});
			}
		}
	},

	toJSON: function () {
		var keys, attrs = {}, i, _len, k;

		if (this.constructor.JSONKeys === 'all') {
			keys = Object.keys(this);
		} else {
			keys = this.constructor.JSONKeys;
		}

		for (i = 0, _len = keys.length; i < _len; i++) {
			k = keys[i];
			if (this.hasOwnProperty(k)) {
				attrs[k] = this[k];
			}
		}

		return attrs;
	}
});

export default Model;
