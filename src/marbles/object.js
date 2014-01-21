//= require ./core
//= require ./utils
//= require ./accessors
//= require ./events
//= require_self

Marbles.Object = Marbles.Utils.createClass({
	displayName: 'Marbles.Object',

	mixins: [Marbles.Accessors, Marbles.Events],

	willInitialize: function (attrs) {
		this.parseAttributes(attrs);
	},

	parseAttributes: function (attrs) {
		for (var k in attrs) {
			this.set(k, attrs[k]);
		}
	}
});
