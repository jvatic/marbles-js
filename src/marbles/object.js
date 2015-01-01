import Utils from "./utils";
import Accessors from "./accessors";
import Events from "./events";

/**
 * @deprecated
 * @see Marbles.State
 * @see Marbles.Store
 * @name Object
 * @memberof Marbles
 * @class
 */
var MarblesObject = Utils.createClass({
	displayName: 'Marbles.Object',

	mixins: [Accessors, Events],

	willInitialize: function (attrs) {
		this.parseAttributes(attrs);
	},

	parseAttributes: function (attrs) {
		for (var k in attrs) {
			if (attrs.hasOwnProperty(k)) {
				this.set(k, attrs[k]);
			}
		}
	}
});

export default MarblesObject;
