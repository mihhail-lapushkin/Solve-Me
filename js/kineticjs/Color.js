(function(fl) {
	var normalizeRGB = function(c) {
		if (c > 255)
			return 255;
		if (c < 0)
			return 0;
	
		return c;
	}
	
	Color = function(r, g, b) {
		return {
			red : normalizeRGB(r),
			green : normalizeRGB(g),
			blue : normalizeRGB(b)
		}
	}
	
	Color.toString = function(c) {
		return 'rgb(' + fl(c.red) + ',' + fl(c.green) + ',' + fl(c.blue) + ')';
	}
})(Math.floor);