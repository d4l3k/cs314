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
  this.bounciness = bounciness || 1;
  this.gravity = new THREE.Vector3().set(0, -0.1, 0);
  this.health = this.maxHealth;
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
    this.velocity.add(this.gravity.clone().multiplyScalar(dt));

    // Bounce if we hit the floor.
    var minY = floorY(this.position.x, this.position.z) + this.collisionRadius / 2;
    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = this.bounciness * dt;
    }

    // cheap a posteriori collision detection
    // does not stop things going very fast
    var collidedObjects = []; // keep track of collided objects so we don't recurse too much
    for (;;) {
      var newPosition = new THREE.Vector3().addVectors(this.position, this.velocity);

      if(!this.map) {
        break;
      }

      var collider = this.map.collidesWith(this, newPosition);
      if (!collider || collidedObjects.indexOf(collider) != -1) {
        break;
      }
      collidedObjects.push(collider);

      var dist = new THREE.Vector3().subVectors(newPosition, collider.object.position);
      var normal = new THREE.Vector3().copy(dist).normalize();
      // Project the negated velocity onto the normal between the cylindrical colliders.
      var bounceVector = new THREE.Vector3().copy(this.velocity)
                                            .negate()
                                            .projectOnVector(normal);
      this.velocity.addScaledVector(bounceVector, this.bounciness);

      // We want to bounce at least out of the object's bounds so that we don't cluster.
      // Bounce away from the object as a baseline in case they're clipping each other already.
      this.velocity.addScaledVector(bounceVector.normalize(),
                                    (1 - (dist.length() / (this.collisionRadius + collider.collisionRadius))));

      if (collider.damage) {
        collider.damage(this.dps * dt);
      }
    }

    this.position.add(this.velocity);

    // FIXME: fix plane constraint y=1
    //var y = floorY(this.position.x, this.position.z) + this.collisionRadius / 2;
    this.object.position.set(this.position.x, this.position.y, this.position.z);

    if (this.target.distanceTo(this.position) <= this.collisionRadius) {
      // TODO: end game or something, placeholder for now
      var x = Math.random() * 30 - 10,
          z = Math.random() * 30 - 10;
      var y = floorY(x, z) + this.collisionRadius / 2;
      this.position.set(x, y, z);

      addHealth(-this.healthDamage);
    }
  },
  maxHealth: 25,
  cost: 200,
  score: 1,
  healthDamage: 1,
  damage: function(damage) {
    this.health = Math.max(0, this.health - damage);
    if (this.health === 0) {
      addMoney(this.cost);
      addScore(this.score);
      this.destroy();
    }
  },
  destroy: function() {
    wave.removeMonster(this);
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
  Monster.call(this, mesh, map, 0.1, 0.5, 5, start, target, radius);
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
  this.spawnHeight = spawnHeight;
  this.started = false;
  this.difficulty = difficulty || 1;
  this.monsters = [];
  const SPAWN_DISTANCE = 15;
  for (i = 0; i < difficulty; i++) {
    // Spawn monster a random direction from the origin.
    // Can spawn from at least 2*SPAWN_DISTANCE away.
    var position = new THREE.Vector3().set(2 * Math.random() - 1, 0, 2 * Math.random() - 1)
                                      .normalize()
                                      .multiplyScalar((Math.random() + 1) * SPAWN_DISTANCE);
    position.y = this.spawnHeight;
    this.monsters.push(new DebugMonster(map, position, new THREE.Vector3().set(0, 1, 0)));
  }
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
  },
  removeMonster: function(monster) {
    this.map.removeEntity(monster);
    this.scene.remove(monster.object);
    this.monsters.splice(this.monsters.indexOf(monster), 1);
  },
  next: function() {
    while (this.monsters.length > 0) {
      this.removeMonster(this.monsters[0]);
    }
    return new Wave(this.scene, this.map, this.spawnHeight, this.difficulty + 1);
  }
}
