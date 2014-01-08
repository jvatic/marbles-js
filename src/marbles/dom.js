//= require ./core
//= require_self

var DOM = Marbles.DOM = Marbles.DOM || {};

/*
 * Events
 */

var _add_event_listener_fn_name = 'addEventListener';
if (typeof HTMLElement.prototype.addEventListener !== 'function') {
	_add_event_listener_fn_name = 'attachEvent';
}

var _remove_event_listener_fn_name = 'removeEventListener';
if (typeof HTMLElement.prototype.removeEventListener !== 'function') {
	_remove_event_listener_fn_name = 'detachEvent';
}

DOM.on = function (el, events, callback, capture) {
	if (capture == null) {
		capture = false;
	}

	for (var i = 0, _ref = events.split(' '), _len = _ref.length; i < _len; i++) {
		el[_add_event_listener_fn_name](_ref[0], callback, capture);
	}
	return el;
}

DOM.once = function (el, events, callback, capture) {
	if (capture == null) {
		capture = false;
	}

	_callback = function () {
		callback.apply(this, arguments);
		DOM.removeEventListener(el, events, capture);
	}

	this.addEventListener(el, events, _callback, capture);
}

DOM.off = function (el, events, callback, capture) {
	if (capture == null) {
		capture = false;
	}

	for (var i = 0, _ref = events.split(' '), _len = _ref.length; i < _len; i++) {
		el[_remove_event_listener_fn_name](event, callback, capture);
	}
}
