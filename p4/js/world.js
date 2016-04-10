/**
 * Creates a new game state, possessing a tile system for constructables as
 * well as a free floating point entity set.
 * @constructor
 * @param {THREE.Vector3} origin - the top-left origin of the grid in the xz-plane
 */
var Map = function(origin, width, height, cellSize) {
  this.origin = origin;
  this.width = width;
  this.height = height;
  this.cellSize = cellSize;
  this.grid = new Array(width * height);
  for (i = 0; i < width * height; i++) {
    this.grid[i] = [];
  }
  this.entities = [];
}

Map.prototype = {
  /**
   * Returns all constructs at the given grid coordinates.
   */
  constructsAt: function(x, y) {
    console.assert(x >= 0 && x < this.width && y >= 0 && y < this.height,
                   "grid location (" + x + "," + y + ") undefined");
    return this.grid[Math.floor(x + this.width * y)];
  },

  /**
   * Add a construct to the given cell.
   */
  pushConstruct: function(construct, x, y) {
    this.constructsAt(x - this.origin.x, y - this.origin.y).push(construct);
  },

  addEntity: function(entity) {
    // FIXME: assume entities have collisionRadius and collisionHandlers set.
    this.entities.push(entity);
    entity.map = this;
  },

  removeEntity: function(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
    entity.map = null;
  },

  // Returns the first object in the scene that collides with the provided entity.
  collidesWith: function(entity, newPosition) {
    if (!entity.prop)
      return null;

    return this.entities.find(function(e) {
      if (e === entity)
        return false;
      if (!e.prop)
        return false;
      if (!e.prop.collisionRadius || e.prop.collisionRadius == 0)
        return false;
      return e.prop.position.distanceTo(newPosition) <= (e.prop.collisionRadius + entity.prop.collisionRadius);
    });
  },

  /**
   * Converts world coordinates to floating point grid coordinates.
   * @return {THREE.Vector2} - grid coordinates
   */
  worldToGrid: function(x, y) {
    return new THREE.Vector2((x - this.origin.x)/this.cellSize,
                             (y - this.origin.y)/this.cellSize);

  }
}
