(function(pow, sqrt) {
	// Point object
	Point = function(x, y) {
		this.x = x;
		this.y = y;
	}
	
	Point.prototype = {
		distance : function(p) {
			return sqrt(pow(this.x - p.x, 2) + pow(this.y - p.y, 2));
		}
	}
	
	// Line object
	Line = function(x1, y1, x2, y2) {
		if (x2 == x1) {
			this.m = 0;
			this.c = x1;
			this.isParallelToY = true;
		} else {
			this.m = (y2 - y1) / (x2 - x1);
			this.c = y1 - x1 * this.m;
			this.isParallelToY = false;
		}
	}
	
	Line.prototype = {
		_calcPointFromQuadEqParams : function(x, y, plusMinusSqrtOfDiscrim) {
			var m = this.m;
			var c = this.c;
			var xx = ((m * (y - c) + x) + plusMinusSqrtOfDiscrim) / (pow(m, 2) + 1);
		
			return new Point(xx, m * xx + c);
		},
	
		intersectCircle : function(x, y, r) {
			if (this.isParallelToY) {
				return [ new Point(x, y - r), new Point(x, y + r) ];
			} else {
				var m = this.m;
				var c = this.c;
				var discrim = pow(m * (c - y) - x, 2) - (pow(m, 2) + 1)
						* (pow(x, 2) - pow(r, 2) + (c - y) * (c - y));
		
				if (discrim == 0)
					return [ this._calcPointFromQuadEqParams(x, y, 0) ];
				else if (discrim > 0) {
					var sqrtOfDiscrim = sqrt(discrim);
		
					return [ this._calcPointFromQuadEqParams(x, y, sqrtOfDiscrim),
							this._calcPointFromQuadEqParams(x, y, -sqrtOfDiscrim) ];
				}
			}
		}
	}
})(Math.pow, Math.sqrt);