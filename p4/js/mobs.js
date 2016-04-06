/**
 * TODO: monster class that moves every tick to objectives in the following priority:
 * - goal (if unblocked)
 * - turrets (if unblocked)
 * - walls
 * @constructor
 * @param {THREE.Object3D} model - The model to use for the monster.
 *                                 It should be looking down the z axis.
 * @param {float} speed - The speed in world units per second.
 * @param {float} dps - The damage per second done to obstacles.
 * @param {THREE.Vector2} start - Start coordinate in the xz-plane.
 * @param {THREE.Vector2} target - Target coordinate to path to in the xz-plane.
 */
var Monster = function(model, speed, dps, start, target) {
  this.model = model;
  this.position = start;
  this.target = target;
  this.speed = speed;
  this.dps = dps;
  this.path = [];
}

Monster.prototype = {
  /**
   * @param {float} dt - Delta time (in seconds) since the last game update.
   */
  update: function(dt) {
    // Move simply in the direction of the target.
    var direction = this.target.sub(this.position).normalize();
    this.position = this.position.add(direction.multiplyScalar(this.speed * dt));
    console.log(direction);

    this.model.position.set(this.position.x, 1, this.position.y);
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

var DebugMonster = function DebugMonster(start, target) {
  var geometry = new THREE.SphereGeometry(0.5);
  var material = new THREE.MeshLambertMaterial({color: 0xff0000});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(5, 1, 0);
  Monster.call(this, mesh, 1.75, 0.25, start, target);
}

DebugMonster.prototype = Object.create(Monster.prototype);
DebugMonster.prototype.constructor = DebugMonster;
DebugMonster.prototype.update = function(dt) {
  Monster.prototype.update.call(this, dt);
  this.model.rotateX(dt);
}

// Creates a new 'wave'; a phase of the game with a given difficulty.
// Difficulty is a simple integer value indicating the current wave.
// If unset, difficulty defaults to zero (the initial wave).
var Wave = function(scene, difficulty) {
  this.scene = scene;
  this.started = false;
  this.difficulty = difficulty || 0;
  this.monsters = [new DebugMonster(new THREE.Vector2().set(-5, -5), new THREE.Vector2().set(0, 0))];
}

Wave.prototype = {
  start: function() {
    console.assert(!this.started, "Wave already started.");
    this.monsters.forEach(function(monster) {
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
