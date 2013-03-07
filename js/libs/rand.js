Rand = (function() {
	var n = 0xefc8249d;

	var mash = function(data) {
		data = data.toString();

		for ( var i = 0; i < data.length; i++) {
			n += data.charCodeAt(i);
			var h = 0.02519603282416938 * n;
			n = h >>> 0;
			h -= n;
			h *= n;
			n = h >>> 0;
			h -= n;
			n += h * 0x100000000;
		}

		return (n >>> 0) * 2.3283064365386963e-10;
	}

	var s0 = s1 = s2 = mash(' ');
	var seed = Date.now();
	var c = 1;

	s0 -= mash(seed);
	s1 -= mash(seed);
	s2 -= mash(seed);

	mash = null;

	if (s0 < 0)
		s0 += 1;
	if (s1 < 0)
		s1 += 1;
	if (s2 < 0)
		s2 += 1;

	var r = function() {
		var t = 2091639 * s0 + c * 2.3283064365386963e-10;
		s0 = s1;
		s1 = s2;
		return s2 = t - (c = t | 0);
	}

	var randFloat = function() {
		return r() + (r() * 0x200000 | 0) * 1.1102230246251565e-16;
	}

	var result = function(min, max) {
		return min + randFloat() * (max - min);
	}

	result.i = function(min, max) {
		if (!max) {
			max = min;
			min = 0;
		}

		return Math.floor(min + randFloat() * (max - min + 1));
	}

	result.b = function() {
		return randFloat() < 0.5;
	}

	return result;
})();