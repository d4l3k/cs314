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
  this.collisionRadius = 0.5;

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
};

function Turret() {
  // Configuration
  this.targetSpeed = 10; // m/s
  this.fireRate = 4; // shots/s
  this.bulletSpeed = 20; // m/s
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
  update: function(delta, now) {
    var target = nearestEnemy(this.object.position);
    var pos;
    if (target) {
      pos = target.object.position.clone();
    } else {
      pos = new THREE.Vector3(0,5,0);
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

    if (length < 0.1 && (now - this.lastFired) > 1/this.fireRate) { // on target and can fire
      this.lastFired = now;
      var dir = this.targetPos.clone().sub(this.object.position);
      dir.multiplyScalar(this.bulletSpeed/dir.length());
      new Bullet(this.object.position, dir);
    }
  },
};

function Bullet(position, direction) {
  this.direction = direction.clone();
  this.distanceTraveled = 0;
  this.maxDistance = 80;

  var geometry = new THREE.BoxGeometry( .2, .2, .2 );
  var material = new THREE.MeshBasicMaterial( { color: BULLET_COLOR, fog: false } );
  this.object = new THREE.Mesh( geometry, material );
  this.object.position.copy(position);
  this.object.controller = this;
  scene.add(this.object);
  objects.push(this.object);
}
Bullet.prototype = {
  update: function(delta, now) {
    if (this.distanceTraveled > this.maxDistance) {
      this.destroy();
    }
    var diff = this.direction.clone().multiplyScalar(delta);
    this.distanceTraveled += diff.length();
    this.object.position.add(diff);
  },
  destroy: function() {
    scene.remove(this.object);

    // remove from objects array
    objects.splice(objects.indexOf(this.object), 1);
  },
};
