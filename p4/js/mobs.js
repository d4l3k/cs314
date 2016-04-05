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
 */
var Monster = function(model, speed, dps) {
  this.speed = speed;
  this.path = []
}

Monster.prototype = {
  /**
   * @param {float} dt - Delta time (in seconds) since the last game update.
   */
  update: function(dt) {
    // TODO: should move incrementally through each grid cell in the path designated by
    // this.path.
  },
  /**
   * Called when the world grid has been updated.
   * Route is recalculated.
   */
  gridUpdate: function() {
    // Recalculate path to objective using BFS.
    // Guaranteed optimiality under our loveable little grid.
    var frontier = [[this.gridPosition]];
    var goalPath = null;
    while (frontier.length > 0) {
      var path = frontier.shift(); // FIFO
      var lastNode = path[path.length - 1];
      // Always fixate on the goal node if there is a path to it.
      if (lastNode.isGoal()) {
        goalPath = path;
        break;
      }
      // TODO: add n, w, s, e blocks. cycle check in O(n) because computers are fast
    }
  }
}

// Creates a new 'wave'; a phase of the game with a given difficulty.
// Difficulty is a simple integer value indicating the current wave.
// If unset, difficulty defaults to zero (the initial wave).
var Wave = function(difficulty) {
  this.started = false;
  this.difficulty = difficulty || 0;
  this.monsters = [];
}

Wave.prototype = {
  start: function() {

  },
  update: function(dt) {
    // TODO: spawn, update monsters
  }
}
