/**
 * TODO: monster class that moves every tick to objectives in the following priority:
 * - goal (if unblocked)
 * - turrets (if unblocked)
 * - walls
 * @constructor
 * @param {THREE.Object3D} model - The model to use for the monster.
 *                                 It should be looking down the z axis.
 * @param {float} acceleration - Acceleration in world units per second.
 * @param {float} maxSpeed - The maximum speed in world units per second on the xz-plane.
 * @param {float} dps - The damage per second done to obstacles.
 * @param {THREE.Vector2} start - Start coordinate in the xz-plane.
 * @param {THREE.Vector2} target - Target coordinate to path to in the xz-plane.
 * @param {float} collisionRadius - Radius to collide with game objects (using spherical collision detection).
 * @param {float} bounciness - Linear bounciness factor of velocity to negate on collision.
 */
var Monster = function(model, map, acceleration, maxSpeed, dps, start, target, collisionRadius, bounciness) {
  this.object = model;
  this.map = map;
  this.acceleration = acceleration;
  this.maxSpeed = maxSpeed;

  var self = this;
  this.prop = new Prop(this, map, start, collisionRadius,
      function (pos) {
        self.object.position.copy(pos);
      },
      function (entity, dt) {
        if (entity.onDamage && !(entity instanceof Monster)) {
          entity.onDamage(self.dps * dt, dt);
        }
      }, 0.3);
  this.target = target;
  this.dps = dps;
  this.health = this.maxHealth;
}

Monster.prototype = {
  /**
   * @param {float} dt - Delta time (in seconds) since the last game update.
   */
  update: function(dt) {
    if (this.target.distanceTo(this.prop.position) <= this.prop.collisionRadius) {
      // TODO: end game or something, placeholder for now
      var x = Math.random() * 30 - 10,
          z = Math.random() * 30 - 10;
      var y = floorY(x, z) + this.prop.collisionRadius / 2;
      this.prop.position.set(x, y, z);

      addHealth(-this.healthDamage);
    }

    // Move simply in the direction of the target.
    var direction = new THREE.Vector3().subVectors(this.target, this.prop.position).normalize();
    // Lazily ensure we don't exceed the max speed.
    if (this.prop.velocity.clone().projectOnPlane(new THREE.Vector3(0, 1, 0)).length() < this.maxSpeed) {
      this.prop.applyForce(direction.multiplyScalar(this.acceleration * dt));
    }

    this.prop.update(dt);
    this.object.lookAt(this.prop.velocity);
  },
  maxHealth: 25,
  cost: 200,
  score: 1,
  healthDamage: 1,
  onDamage: function(damage) {
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      addMoney(this.cost);
      addScore(this.score);
      this.destroy();
    }
  },
  destroy: function() {
    wave.removeMonster(this);

    // explosion effects
    var obj = this.object;
    var j = 0;
    function particle() {
      for (var i=0; i<50; i++) {
        var dir = new THREE.Vector3(2*Math.random()-1, Math.random()*4, 2*Math.random()-1);
        dir.multiplyScalar(6/dir.length());
        var color = (Math.random() > 0.5) ? 0xff0000 : 0xffff00;
        var p = new Particle(obj.position, dir, color, 0.05);
        p.maxLife = 3;
      }

      j += 1;
      if (j < 5) {
        setTimeout(particle, 1);
      }
    }
    particle();
  },
}

var DebugMonster = function DebugMonster(map, start, target) {
  const radius = 0.5;
  var geometry = new THREE.SphereGeometry(radius, 32);
  var texture = THREE.ImageUtils.loadTexture( "textures/globe.png" );
  var material = new THREE.MeshPhongMaterial({map: texture});
  var mesh = new THREE.Mesh(geometry, material);
  var light = new THREE.PointLight(0xff0000, 0.5, 2);
  mesh.add(light);
  mesh.position.set(5, 1, 0);
  this.rotation = 0;
  Monster.call(this, mesh, map, 2, 4, 5, start, target, radius);
}

DebugMonster.prototype = Object.create(Monster.prototype);
DebugMonster.prototype.constructor = DebugMonster;
DebugMonster.prototype.update = function(dt) {
  Monster.prototype.update.call(this, dt);
  this.rotation += 5 * dt;
  this.object.rotateX(this.rotation);
}

// Creates a new 'wave'; a phase of the game with a given difficulty.
// Difficulty is a simple integer value indicating the current wave.
// If unset, difficulty defaults to zero (the initial wave).
var Wave = function(scene, map, spawnHeight, callbacks, difficulty) {
  this.scene = scene;
  this.map = map;
  this.spawnHeight = spawnHeight;
  this.started = false;
  this.callbacks = callbacks;
  this.difficulty = difficulty || 1;
  this.monsters = [];
}

Wave.prototype = {
  start: function() {
    console.assert(!this.started, "Wave already started.");
    this.started = true;
    if (this.callbacks.begin) {
      this.callbacks.begin(this);
    }

    const SPAWN_DISTANCE = 15;
    for (i = 0; i < this.difficulty; i++) {
      // Spawn monster a random direction from the origin.
      // Can spawn from at least 2*SPAWN_DISTANCE away.
      var position = new THREE.Vector3().set(2 * Math.random() - 1, 0, 2 * Math.random() - 1)
                                        .normalize()
                                        .multiplyScalar((Math.random() + 1) * SPAWN_DISTANCE);
      position.y = this.spawnHeight;
      var monster = new DebugMonster(map, position, new THREE.Vector3().set(0, 1, 0));
      this.monsters.push(monster);
      this.map.addEntity(monster);
      this.scene.add(monster.object);
    }
  },
  update: function(dt) {
    // TODO: spawn, update monsters
    this.monsters.forEach(function(monster) {
      monster.update(dt);
    });
  },
  removeMonster: function(monster) {
    this.map.removeEntity(monster);
    this.scene.remove(monster.object);
    this.monsters.splice(this.monsters.indexOf(monster), 1);
    if (this.callbacks.end && this.monsters.length == 0) {
      // Wave has ended!
      this.callbacks.end(this);
    }
  },
  next: function() {
    while (this.monsters.length > 0) {
      this.removeMonster(this.monsters[0]);
    }
    return new Wave(this.scene, this.map, this.spawnHeight, this.callbacks, this.difficulty + 1);
  }
}
