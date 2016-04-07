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
 */
var Monster = function(model, map, acceleration, maxSpeed, dps, start, target, collisionRadius) {
  this.model = model;
  this.map = map;
  this.position = start;
  this.target = target;
  this.acceleration = acceleration;
  this.maxSpeed = maxSpeed;
  this.velocity = new THREE.Vector3().set(0, 0, 0);
  this.dps = dps;
  this.collisionRadius = collisionRadius;
  this.path = [];
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
    const maxCollisions = 5;
    var collider;
    for (numCollisions = 0; (collider = this.map.collidesWith(this, new THREE.Vector3().addVectors(this.position, this.velocity)))
                            && numCollisions < maxCollisions; numCollisions++) {
      // FIXME: switch to targetEntity.
      //if (collider == this.target) {
      //}
      // TODO: project along normal, negate.
      var normal = new THREE.Vector3().subVectors(this.position, collider.model.position);
      this.velocity.negate();
    }

    this.position.add(this.velocity);

    // FIXME: fix plane constraint y=1
    this.model.position.set(this.position.x, this.position.y, this.position.z);

    if (this.target.distanceTo(this.position) <= this.collisionRadius) {
      // TODO: end game or something, placeholder for now
      this.position.set(Math.random() * 10 - 5, this.position.y, Math.random() * 10 - 5);
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
  var geometry = new THREE.SphereGeometry(radius);
  var material = new THREE.MeshLambertMaterial({color: 0xff0000});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(5, 1, 0);
  Monster.call(this, mesh, map, 0.1, 0.5, 0.25, start, target, radius);
}

DebugMonster.prototype = Object.create(Monster.prototype);
DebugMonster.prototype.constructor = DebugMonster;
DebugMonster.prototype.update = function(dt) {
  Monster.prototype.update.call(this, dt);
  this.model.rotateX(5 * dt);
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
	];
}

Wave.prototype = {
  start: function() {
    console.assert(!this.started, "Wave already started.");
    this.monsters.forEach(function(monster) {
      this.map.addEntity(monster);
      this.scene.add(monster.model);
    });
  },
  update: function(dt) {
    // TODO: spawn, update monsters
    this.monsters.forEach(function(monster) {
      monster.update(dt);
    });
  }
}
