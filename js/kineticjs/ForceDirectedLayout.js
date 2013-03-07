(function(w, log, pow, sqrt) {
	w.ForceDirectedLayout = function(config) {
		for (var prop in config) {
	        this[prop] = config[prop];
		}

		var that = this;
		
		this._onStep = function() {
			that.currentStep++;

			that.circles.forEach(function(v) {
				that.circles.forEach(function(u) {
					if (u != v) {
						var dx = v.getX() - u.getX();
						var dy = v.getY() - u.getY();
						var d2 = pow(dx, 2) + pow(dy, 2);
						var d = sqrt(d2);
						var dxd = dx / d, dyd = dy / d;

						// apply attractive force across the connection
						if (v.ownsConnectionWith(u)) {
							var attractiveForce = log(pow(d, that.gravity) / (v.connections() + u.connections()));
							var moveX = attractiveForce * dxd, moveY = attractiveForce * dyd;

							v.move(-moveX, -moveY);
							u.move(moveX, moveY);
						}

						// apply repulsive force between every node
						var repulsiveForce = that.antiGravity * v.getScore() * u.getScore() / d2;
						var df = (v.getRadius() + u.getRadius() + that.antiGravityEffectiveReach) - d;

						if (df > 0)
							repulsiveForce *= log(df);

						v.move(repulsiveForce * dxd, repulsiveForce * dyd);
					}
				});
				
				var p = that.padding;
				var r = v.getRadius();
				var x = v.getX();
				var y = v.getY();
				var minXY = r + p;
				var maxX = that.width - r - p;
				var maxY = that.height - r - p;

				if (x < minXY) {
					v.setX(minXY);
				} else if (x > maxX) {
					v.setX(maxX);
				}

				if (y < minXY) {
					v.setY(minXY);
				} else if (y > maxY) {
					v.setY(maxY);
				}
			});

			if (that.animate) {
				that.redrawFunc();
			}

			if (that.currentStep == that.finalStep) {
				that.anim.stop();
				that.onComplete();
			}
		}
		
		this.anim = new Kinetic.Animation({ func: this._onStep });
	}
	
	w.ForceDirectedLayout.prototype = {
		run : function(steps, animate) {
			this.currentStep = 0;
			this.finalStep = steps;
			this.animate = animate;
	
			if (animate) {
				this.anim.start();
			} else {
				this._onStep.repeat(steps);
				this.redrawFunc();
				this.onComplete();
			}
		}
	}
})(window, Math.log, Math.pow, Math.sqrt);