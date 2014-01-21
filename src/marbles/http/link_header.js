//= require ../core
//= require_self

(function () {

	var LINK_SPLITTER = /,[\s\r\n]*?</;
	var LINK_MATCHER = /<([^>]+)>((?:[\s\r\n]|.)*)/;
	var ATTR_SPLITTER = /[\s\r\n]*;[\s\r\n]*/;
	var ATTR_MATCHER = /([^=]+)=['"]?([^'"]+)['"]?/;

	Marbles.HTTP = Marbles.HTTP || {};
	Marbles.HTTP.LinkHeader = {
		parse: function (linkHeaderStr) {
			var links = [];
			var ref = linkHeaderStr.split(LINK_SPLITTER);
			var i, _len, match, link;
			var j, _r, _l;
			for (i = 0, _len = ref.length; i < _len; i++) {
				match = ref[i].match(LINK_MATCHER);
				if (!match) {
					continue;
				}

				link = {
					href: match[1]
				};
				_r = match[2].split(ATTR_SPLITTER);
				for (j = 0, _l = _r.length; j < _l; j++) {
					match = _r[j].match(ATTR_MATCHER);
					if (!match) {
						continue;
					}

					link[match[1]] = match[2];
				}

				links.push(link);
			}

			return links;
		}
	};

})();
