/**
 * TODO: monster class that moves every tick to objectives in the following priority:
 * - goal (if unblocked)
 * - turrets (if unblocked)
 * - walls
 * @constructor
 * @param {THREE.Object3D} model - The model to use for the monster.
 *                                 It should be looking down the z axis.
 * @param {float} acceleration - Acceleration in world units per second.
 * @param {float} maxSpeed - The maximum speed in world units per second.
 * @param {float} dps - The damage per second done to obstacles.
 * @param {THREE.Vector2} start - Start coordinate in the xz-plane.
 * @param {THREE.Vector2} target - Target coordinate to path to in the xz-plane.
 * @param {float} collisionRadius - Radius to collide with game objects (using spherical collision detection).
 * @param {float} bounciness - Linear bounciness factor of velocity to negate on collision.
 */
var Monster = function(model, map, acceleration, maxSpeed, dps, start, target, collisionRadius, bounciness) {
  this.object = model;
  this.map = map;
  this.position = start;
  this.target = target;
  this.acceleration = acceleration;
  this.maxSpeed = maxSpeed;
  this.velocity = new THREE.Vector3().set(0, 0, 0);
  this.dps = dps;
  this.collisionRadius = collisionRadius;
  this.path = [];
  this.bounciness = bounciness || 2;
}

Monster.prototype = {
  /**
   * @param {float} dt - Delta time (in seconds) since the last game update.
   */
  update: function(dt) {
    const friction = 0.5; // velocity dampening per second.
    // Move simply in the direction of the target.
    // TODO: acceleration, pathfinding, gravity, collision detection- so much to do!
    var direction = new THREE.Vector3().subVectors(this.target, this.position).normalize();
    this.velocity.multiplyScalar(1 - friction * dt); // Apply friction to prevent orbiting.
    this.velocity.add(direction.multiplyScalar(this.acceleration * dt));
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }

    // cheap a posteriori collision detection
    // does not stop things going very fast
    const maxCollisions = 100;
    for (numCollisions = 0; numCollisions < maxCollisions; numCollisions++) {
      var newPosition = new THREE.Vector3().addVectors(this.position, this.velocity);
      var collider = this.map.collidesWith(this, newPosition);
      if (!collider)
        break;

      var normal = new THREE.Vector3().subVectors(newPosition, collider.object.position)
                                      .projectOnPlane(new THREE.Vector3(0, 1, 0))
                                      .normalize();
      // Project the negated velocity onto the normal between the cylindrical colliders.
      var bounceVector = new THREE.Vector3().copy(this.velocity)
                                            .negate()
                                            .projectOnVector(normal);
      this.velocity.addScaledVector(bounceVector, this.bounciness);
    }

    this.position.add(this.velocity);

    // FIXME: fix plane constraint y=1
    var y = floorY(this.position.x, this.position.z) + this.collisionRadius / 2;
    this.object.position.set(this.position.x, y, this.position.z);

    if (this.target.distanceTo(this.position) <= this.collisionRadius) {
      // TODO: end game or something, placeholder for now
      var x = Math.random() * 30 - 10,
          z = Math.random() * 30 - 10;
      var y = floorY(x, z) + this.collisionRadius / 2;
      this.position.set(x, y, z);
    }
  },
  /**
   * Called when the world grid has been updated.
   * Route is recalculated.
   */
  gridUpdate: function() {
    /* XXX: screw collision detection in the grid
     *      these balls are going to roll
     *      and they won't stop
     *      for anybody
     *      - acomminos
     *
    // Recalculate path to objective using BFS.
    // Guaranteed optimiality under our loveable little grid.
    var frontier = [[this.gridCell]];
    var goalPath = null;
    while (frontier.length > 0) {
      var path = frontier.shift(); // FIFO
      var lastNode = path[path.length - 1];
      // Always fixate on the goal node if there is a path to it.
      if (lastNode.isGoal()) {
        goalPath = path;
        break;
      }
      if (lastNode.isDestructible()) {
        // TODO: pick the closest destructible
      }
      // TODO: add n, w, s, e blocks. cycle check in O(n) because computers are fast
      grid.adjacentsOf(lastNode).forEach(function(adj) {
        if (path.indexOf(adj)) { // cycle check

        }
      });
    }
    */
  }
}

var DebugMonster = function DebugMonster(map, start, target) {
  const radius = 0.5;
  var geometry = new THREE.SphereGeometry(radius, 32);
  var material = new THREE.MeshPhongMaterial({color: 0xff0000});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(5, 1, 0);
  Monster.call(this, mesh, map, 0.1, 0.5, 0.25, start, target, radius);
}

DebugMonster.prototype = Object.create(Monster.prototype);
DebugMonster.prototype.constructor = DebugMonster;
DebugMonster.prototype.update = function(dt) {
  Monster.prototype.update.call(this, dt);
  this.object.rotateX(5 * dt);
}

// Creates a new 'wave'; a phase of the game with a given difficulty.
// Difficulty is a simple integer value indicating the current wave.
// If unset, difficulty defaults to zero (the initial wave).
var Wave = function(scene, map, spawnHeight, difficulty) {
  this.scene = scene;
  this.map = map;
  this.started = false;
  this.difficulty = difficulty || 0;
  this.monsters = [
		new DebugMonster(map, new THREE.Vector3().set(-5, 1, -5), new THREE.Vector3().set(0, 1, 0)),
		new DebugMonster(map, new THREE.Vector3().set(5, 1, 5), new THREE.Vector3().set(0, 1, 0)),
		new DebugMonster(map, new THREE.Vector3().set(-5, 1, 5), new THREE.Vector3().set(0, 1, 0)),
		new DebugMonster(map, new THREE.Vector3().set(5, 1, -5), new THREE.Vector3().set(0, 1, 0)),
	];
}

Wave.prototype = {
  start: function() {
    console.assert(!this.started, "Wave already started.");
    this.monsters.forEach(function(monster) {
      this.map.addEntity(monster);
      this.scene.add(monster.object);
    });
  },
  update: function(dt) {
    // TODO: spawn, update monsters
    this.monsters.forEach(function(monster) {
      monster.update(dt);
    });
  }
}
