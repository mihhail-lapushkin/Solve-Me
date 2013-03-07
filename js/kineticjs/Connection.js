Kinetic.Connection = function(config) {
	config.drawFunc = this.drawFunc;

	Kinetic.Shape.call(this, config);
};

Kinetic.Connection.prototype = {
	drawFunc: function(context) {
		context.fillStyle = this.attrs.color;
		context.strokeStyle = this.attrs.stroke;

		var circles = this.getCircles();
		var c1 = circles[0], c2 = circles[1];
		var x1 = c1.getX(), y1 = c1.getY(), r1 = c1.getRadius();
		var x2 = c2.getX(), y2 = c2.getY(), r2 = c2.getRadius();
		var markerRadius = this.attrs.stretchMarker.radius;
		var minMarkers = Math.max(this.attrs.stretchMarker.minCount, 2);
		var maxPadding = this.attrs.stretchMarker.maxStretch;
		var markerDiameter = markerRadius * 2;

		// find the points where the joining line intersects circles
		var l = new Line(x1, y1, x2, y2);
		var ip1 = l.intersectCircle(x1, y1, r1 - markerDiameter);
		var ip2 = l.intersectCircle(x2, y2, r2 - markerDiameter);
		var minDist = Number.MAX_VALUE, minP1, minP2;

		// find the right points(closest to each other)
		ip1.forEach(function(p1) {
			ip2.forEach(function(p2) {
				var d = p1.distance(p2);
				if (d < minDist) {
					minDist = d;
					minP1 = p1;
					minP2 = p2;
				}
			});
		});

		x1 = minP1.x;
		y1 = minP1.y;
		x2 = minP2.x;
		y2 = minP2.y;

		var d = minDist;
		var dx = x2 - x1, dy = y2 - y1;
		var fitsMarkers = d / markerDiameter;
		var fitsMarkersInt = Math.floor(fitsMarkers);
		var markersShown = fitsMarkersInt - fitsMarkersInt % 2; // show only
																// even number
																// of markers

		if (markersShown < 2)
			return;

		var initialPadding = 0.5; // before first marker
		var extraInitialPadding = 0;
		var padding = 0; // between markers

		// don't begin stretching until we have at least this much markers
		// available
		if (markersShown < minMarkers) {
			extraInitialPadding = fitsMarkers % 2 / 2;
			// we have some extra space, so let's begin stretching
		} else {
			markersShown = minMarkers;
			padding = (fitsMarkers - markersShown) / (markersShown + 1);

			// don't stretch more than needed
			if (padding >= maxPadding) {
				// see how much extra space we have
				extraInitialPadding = maxPadding + (padding - maxPadding) * (markersShown + 1) / 2;

				// see how many extra markers can we fit
				while (extraInitialPadding > maxPadding * 2) {
					markersShown += 2;
					extraInitialPadding -= maxPadding * 2;
				}

				padding = maxPadding;
				// continue stretching
			} else {
				extraInitialPadding = padding;
			}
		}

		initialPadding += extraInitialPadding;

		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.closePath();
		context.stroke();

		for ( var i = 0, sx = dx / fitsMarkers, sy = dy / fitsMarkers; i < markersShown; i++) {
			var j = i * (1 + padding) + initialPadding;

			context.beginPath();
			context.arc(x1 + j * sx, y1 + j * sy, markerRadius, 0, Math.PI * 2, true);
			context.closePath();
			context.fill();
			context.stroke();
		}
	},
		
	getCircles: function() {
		return this.attrs.circles;
	},

	hasCircle: function(c) {
		var circles = this.getCircles();

		return circles[0] == c || circles[1] == c;
	}
};

Kinetic.Global.extend(Kinetic.Connection, Kinetic.Shape);