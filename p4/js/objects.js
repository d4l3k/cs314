const WALL_COLOR = 0x3d3d3d;
const WALL_SIDE_COLOR = 0x999999;

const TURRET_BASE_COLOR = WALL_COLOR;
const TURRET_BARREL_COLOR = WALL_SIDE_COLOR;
const TURRET_LASER_COLOR = 0xff0000;

const BULLET_COLOR = 0xffff00;

function Wall() {
  this.geometry = new THREE.BoxGeometry( 0.5, 1, 0.5 );
  this.material = new THREE.MeshLambertMaterial( { color: WALL_COLOR } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;
  this.collisionRadius = 0.75;
  this.health = Wall.prototype.maxHealth;

  var sideGeometry = new THREE.BoxGeometry( 0.5, 1, 0.3 );
  var sideMaterial = new THREE.MeshLambertMaterial( { color: WALL_SIDE_COLOR } );
	for (var i=0; i<4; i++) {
		var angle = Math.PI*i/2;
		var x = Math.sin(angle)/4;
		var z = Math.cos(angle)/4;
		var side = new THREE.Mesh( sideGeometry, sideMaterial );
		side.position.x = x;
		side.position.z = z;
		side.position.y = -0.2;
		side.rotateY(Math.PI/2 + angle);
		this.object.add(side);
	}
}
Wall.prototype = {
  name: 'Wall',
  description: 'A basic wall for stopping monsters.',
  cost: 100,
  destroyCost: 25,
  maxHealth: 25,
  damage: function(damage) {
    this.health = Math.max(0, this.health - damage);
    this.object.scale.x = this.health/Wall.prototype.maxHealth;
    this.object.scale.z = this.health/Wall.prototype.maxHealth;
    if (this.health <= 0) {
      // TODO: clean this up, maybe run some destructor callbacks (e.g. for UI)
      this.map.removeEntity(this);
      this.object.remove();
    }
  }
};

function Turret() {
  // Configuration
  this.targetSpeed = 20; // m/s
  this.fireRate = 4; // shots/s
  this.bulletSpeed = 30; // m/s
  this.collisionRadius = 0.2;

  // Geometry
  this.object = new THREE.Object3D();
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;

  var geometry = new THREE.BoxGeometry( 0.2, 0.5, 0.2 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BASE_COLOR } );
  var base = new THREE.Mesh( geometry, material );
  base.position.y = -0.25;
  this.object.add(base);

  this.gun = new THREE.Object3D();
  this.object.add(this.gun);

  var geometry = new THREE.BoxGeometry( 0.3, 0.75, 0.3 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BARREL_COLOR } );
  var barrel = new THREE.Mesh( geometry, material );
  barrel.position.z=0.20;
  barrel.rotateX(Math.PI/2);
  this.gun.add(barrel);

  var geometry = new THREE.BoxGeometry( 0.03, 10000, 0.03 );
  var material = new THREE.MeshBasicMaterial( { color: TURRET_LASER_COLOR, fog: false } );
  var laser = new THREE.Mesh( geometry, material );
  laser.position.y += 5000;
  barrel.add(laser);

  // Default values
  this.targetPos = new THREE.Vector3(0,0,0);
  this.lastFired = 0;
}
Turret.prototype = {
  name: 'Turret',
  description: 'Shoots at enemies. Pew pew!',
  cost: 1000,
  destroyCost: 250,
  interceptPoint: function(enemy) {
    var p = enemy.object.position;
    var x=p.x, y=p.y, z=p.z;
    var v = enemy.velocity;
    var a=v.x, b=v.y, c=v.z;
    var m = this.object.position;
    var d=m.x, e=m.y, f=m.z;
    var s = this.bulletSpeed;

    // seconds to hit
    var t = (Math.sqrt((2*a*d-2*a*x+2*b*e-2*b*y+2*c*f-2*c*z)^2-4*(-a^2-b^2-c^2+s^2)*(-d^2+2*d*x-e^2+2*e*y-f^2+2*f*z-x^2-y^2-z^2))-2*a*d+2*a*x-2*b*e+2*b*y-2*c*f+2*c*z)/(2*(-a^2-b^2-c^2+s^2));

    var target = p.clone().add(v.clone().multiplyScalar(t));
    return target;
  },
  update: function(delta, now) {
    var target = nearestEnemy(new THREE.Vector3(0,0,0)); //this.object.position);
    var pos;
    if (target) {
      //pos = target.object.position.clone();
      pos = this.interceptPoint(target);
    } else {
      pos = this.object.position.clone().add(new THREE.Vector3(0,1,0));
    }
    var diff = pos.clone().sub(this.targetPos);
    var step = this.targetSpeed*delta;
    var length = diff.length();
    if (length > step) {
      diff.multiplyScalar(step/length);
    }
    this.targetPos.add(diff);
    var localPos = this.object.worldToLocal(this.targetPos.clone());
    this.gun.lookAt(localPos);

    if (target && length < 0.5 && (now - this.lastFired) > 1/this.fireRate) { // on target and can fire
      this.lastFired = now;
      var dir = this.targetPos.clone().sub(this.object.position);
      dir.multiplyScalar(this.bulletSpeed/dir.length());
      new Bullet(this.object.position, dir);
    }
  },
};
function Particle(position, velocity, color, size) {
  this.constructor(position, velocity, color, size);
}
Particle.prototype = {
  constructor: function(position, velocity, color, size){
    this.velocity = velocity.clone();
    this.distanceTraveled = 0;
    this.maxDistance = 6;
    this.acceleration = new THREE.Vector3(0,-9.8,0);

    var geometry = new THREE.BoxGeometry( size, size, size );
    var material = new THREE.MeshBasicMaterial( { color: color, fog: false } );
    this.object = new THREE.Mesh( geometry, material );
    this.object.position.copy(position);
    this.object.controller = this;
    scene.add(this.object);
    objects.push(this.object);

    this.collisionRadius = size/2;
  },
  update: function(delta, now) {
    if (this.distanceTraveled > this.maxDistance) {
      this.destroy();
    }
    var diff = this.velocity.clone().multiplyScalar(delta);
    this.distanceTraveled += diff.length();
    this.object.position.add(diff);
    if (this.acceleration) {
      this.velocity.add(this.acceleration.clone().multiplyScalar(delta));
    }
    // bounce off ground
    if (this.object.position.y < floor.position.y) {
      this.velocity.y *= -0.8;
    }
    var scale = this.maxDistance - this.distanceTraveled;
    if (scale < 1 && scale >= 0) {
      this.object.geometry.scale(scale, scale, scale);
    }
  },
  destroy: function() {
    scene.remove(this.object);

    // remove from objects array
    objects.splice(objects.indexOf(this.object), 1);
  },
};

function Bullet(position, velocity) {
  Particle.prototype.constructor.call(this, position, velocity, BULLET_COLOR, 0.2);
  this.maxDistance = 80;
  this.acceleration = null;
}
Bullet.prototype = {
  damage: 1,
  update: function(delta, now) {
    Particle.prototype.update.call(this, delta, now);

    var collidesWith = map.collidesWith(this, this.object.position);
    if (collidesWith && collidesWith.damage) {
      collidesWith.damage(this.damage);
      this.destroy();
    }
  },
  destroy: Particle.prototype.destroy,
};

