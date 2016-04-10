const WALL_COLOR = 0x3d3d3d;
const WALL_SIDE_COLOR = 0x999999;

const TURRET_BASE_COLOR = WALL_COLOR;
const TURRET_BARREL_COLOR = WALL_SIDE_COLOR;
const TURRET_LASER_COLOR = 0xff0000;

const BULLET_COLOR = 0xffff00;

/**
 * A prop is a movable, collidable world entity using a spherical collider.
 * Possesses velocity with dampening, updates position each frame.
 * It should have exclusive control over a movable object's position.
 * Velocity is stored in world units per second.
 * onMove: function(position)
 * onCollide: function(prop, dt)
 */
function Prop(entity, map, position, collisionRadius, onMove, onCollide, bounciness, gravity, friction) {
  this.entity = entity;
  this.map = map;
  this.position = position;
  this.collisionRadius = collisionRadius;
  this.bounciness = bounciness !== undefined ? bounciness : 1;
  this.velocity = new THREE.Vector3().set(0, 0, 0);
  this.gravity = gravity || new THREE.Vector3().set(0, -3, 0);
  this.onMove = onMove;
  this.onCollide = onCollide;
  this.friction = 0.5;
  this.velocityTransform = new THREE.Matrix4();
}

Prop.prototype = {
  applyForce: function(f) {
    this.velocity.add(f);
  },
  update: function(dt) {
    this.velocity.multiplyScalar(1 - this.friction * dt); // Apply friction to prevent orbiting.
    this.velocity.add(this.gravity.clone().multiplyScalar(dt));

    // Bounce if we hit the floor.
    var minY = floorY(this.position.x, this.position.z) + this.collisionRadius / 2;
    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = this.bounciness;
    }

    // cheap a posteriori collision detection
    // does not stop things going very fast
    var collidedObjects = []; // keep track of collided objects so we don't recurse too much
    for (;;) {
      var newPosition = this.position.clone().addScaledVector(this.velocity, dt);

      if(!this.map || !this.collisionRadius) {
        break;
      }

      var entity = this.map.collidesWith(this.entity, newPosition)
                           .find(function(e) { return collidedObjects.indexOf(e) == -1; });

      if (!entity)
        break; // Nothing left to collide against, returning.

      collidedObjects.push(entity);

      var collider = entity.prop; // By definition, all collidables must have a prop.

      var dist = new THREE.Vector3().subVectors(newPosition, collider.position);
      var normal = new THREE.Vector3().copy(dist).normalize();
      if (normal.length() == 0)
        normal.y = 1; // Default to pushing things up.

      // Project the negated velocity onto the normal between the cylindrical colliders.
      var bounceVector = new THREE.Vector3().copy(this.velocity)
                                            .negate()
                                            .projectOnVector(normal);
      this.velocity.addScaledVector(bounceVector, 1 + this.bounciness);
      // Exert normal force on the collider.
      this.velocity.addScaledVector(normal, (this.collisionRadius + collider.collisionRadius) - dist.length());

      // We want to bounce at least out of the object's bounds so that we don't cluster.
      // Bounce away from the object as a baseline in case they're clipping each other already.
      // XXX: this doesn't always work great. works well for walls but not balls
      /*
      this.position.addScaledVector(normal, (collider.collisionRadius + this.collisionRadius) -
                                            collider.position.distanceTo(newPosition));
      */

      if (collider.onCollide) {
        collider.onCollide(this.entity, dt);
      }
      if (this.onCollide) {
        this.onCollide(entity, dt);
      }
    }

    var transformedVelocity = this.velocity.clone().applyMatrix4(this.velocityTransform);
    this.position.addScaledVector(transformedVelocity, dt);

    if (this.onMove) {
      this.onMove(this.position);
    }
  }
}

function Wall(x, y) {
  this.geometry = new THREE.BoxGeometry( 0.5, 1, 0.5 );
  this.material = new THREE.MeshLambertMaterial( { color: WALL_COLOR } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.x = x;
  this.object.position.y = cursorElevation() + 0.5;
  this.object.position.z = y;
  this.health = Wall.prototype.maxHealth;

  var self = this;
  this.prop = new Prop(this, map, this.object.position.clone(), 0.5, function(pos) {
    self.object.position.copy(self.prop.position);
  }, function() {}, 0); // Negative bounciness means no momentum transfer.
  this.prop.velocityTransform = new THREE.Matrix4().set(
      0, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0);

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
  repairCost: 50,
  destroyCost: 25,
  maxHealth: 50,
  update: function(dt) {
    this.prop.update(dt);
  },
  onDamage : function(damage, dt) {
    // Shoot particles out of the wall when it gets damaged.
    var dir = new THREE.Vector3(2*Math.random()-1, this.object.position.y, 2*Math.random()-1);
    dir.multiplyScalar(2/dir.length());
    var color = (Math.random() > 0.5) ? 0xcccccc : 0x333333;
    var p = new Particle(this.object.position, dir, color, 0.08, false);
    p.maxLife = 1.5;

    // console.log(this.health);
    this.health = Math.max(0, this.health - damage);
    // this.object.scale.x = Math.max(this.health/Wall.prototype.maxHealth, 0.25);
    this.object.scale.y = Math.max(this.health/Wall.prototype.maxHealth, 0.25);
    if (this.health <= 0) {
      // TODO: clean this up, maybe run some destructor callbacks (e.g. for UI)
      map.removeEntity(this);
      scene.remove(this.object);
      objects.splice(objects.indexOf(this.object), 1);
    }

  }
};

function Turret(x, y) {
  const RADIUS = 0.1;
  // Configuration
  this.targetSpeed = Math.PI*2; // 2*pi rads/s
  this.fireRate = 2; // shots/s
  this.bulletSpeed = 30; // m/s

  // Geometry
  this.object = new THREE.Object3D();
  this.object.controller = this;
  this.object.position.x = x;
  this.object.position.y = cursorElevation() + 0.5;
  this.object.position.z = y;

  var self = this;
  this.prop = new Prop(this, map, this.object.position.clone(), RADIUS, function(pos) {
    self.object.position.copy(pos);
  });
  this.prop.bounciness = 0;
  // Fix on xz-plane.
  this.prop.velocityTransform = new THREE.Matrix4().set(
      0, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0);

  this.gun = new THREE.Object3D();
  this.object.add(this.gun);

  var geometry = new THREE.BoxGeometry( RADIUS, 0.75, RADIUS );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BASE_COLOR } );
  var base = new THREE.Mesh( geometry, material );
  base.position.y = 0.25;
  this.gun.add(base); 
  
  var geometry = new THREE.BoxGeometry( 0.25, 0.20, 0.75 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BARREL_COLOR } );
  var stock = new THREE.Mesh( geometry, material );
  stock.position.z = 0.1;
  stock.position.y = 0.25;
  // stock.rotateX(Math.PI/2);
  base.add(stock);
  
  var geometry = new THREE.CylinderGeometry( 0.07, 0.07, 0.8, 32 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BARREL_COLOR } );
  var barrel = new THREE.Mesh( geometry, material );
  // barrel.position.x = -0.05;
  barrel.position.y = 0;
  barrel.position.z = 0.35;
  barrel.rotateX(Math.PI/2);
  stock.add(barrel);
  
  var geometry = new THREE.CylinderGeometry( 0.04, 0.04, 0.8, 32 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BASE_COLOR } );
  var scope = new THREE.Mesh( geometry, material );
  scope.position.z = -0.15;
  scope.position.y = -0.1;
  // scope.rotateX(Math.PI/2);
  barrel.add(scope);
  
  var geometry = new THREE.CylinderGeometry( 0.15, 0.15, 0.15, 32 );
  var material = new THREE.MeshLambertMaterial( { color: TURRET_BARREL_COLOR } );
  var magazine = new THREE.Mesh( geometry, material );
  magazine.position.x = 0.15;
  magazine.position.z = -0.15;
  magazine.position.y = 0.1;
  magazine.rotateX(Math.PI/2);
  stock.add(magazine);
  
  var magazine2 = magazine.clone();
  magazine2.position.x = -0.15;
  stock.add(magazine2);

  var geometry = new THREE.BoxGeometry( 0.05, 0.75, 0.05 );
  var material = new THREE.MeshBasicMaterial( { color: TURRET_LASER_COLOR, fog: false } );
  this.laser = new THREE.Mesh( geometry, material );
  scope.add(this.laser);

  // Default values
  this.targetPos = new THREE.Vector3(0,0,0);
  this.lastFired = 0;

  this.updateLaser(0);
}

Turret.prototype = {
  name: 'Turret',
  description: 'Shoots at enemies. Pew pew!',
  cost: 1000,
  repairCost: -1,
  destroyCost: 250,
  setLaserLength: function(length) {
    if (length <= 0) {
      length = 0.1;
    }
    this.laser.position.y = length/2;
    this.laser.scale.y = length;
  },
  updateLaser: function(now) {
    if (!this.lastUpdatedLaser) {
      this.lastUpdatedLaser = 0;
    }
    if (now-this.lastUpdatedLaser <= 0.25) {
      return;
    }
    this.lastUpdatedLaser = now;

    var intersectable = [];
    ((wave||{}).monsters||[]).forEach(function(mob) {
      intersectable.push(mob.object);
    });
    (objects||[]).forEach(function(object) {
      if (object && object.controller instanceof Bullet) {
        return;
      }
      intersectable.push(object);
    });
    var dir = this.targetPos.clone().sub(this.object.position).normalize();
    raycaster.set(this.object.position, dir);
    var intersects = raycaster.intersectObjects(intersectable, true);
    var self = this;
    var distance = 100;
    intersects.slice(0,2).forEach(function(intersect) {
      var obj = topLevelObject(intersect.object);
      if (obj === self.object) {
        return;
      }
      if (intersect.distance < distance) {
        distance = intersect.distance;
      }
    });
    this.setLaserLength(distance);
  },
  interceptPoint: function(enemy, delta) {
    var p = enemy.prop.position;
    var x=p.x, y=p.y, z=p.z;
    var v = enemy.prop.velocity;
    var a=v.x, b=v.y, c=v.z;
    var m = this.object.position;
    var d=m.x, e=m.y, f=m.z;
    var s = this.bulletSpeed;

    return p.clone().addScaledVector(v, delta + p.distanceTo(m)/s);

    /*
    // seconds to hit
    var t = (Math.sqrt((2*a*d-2*a*x+2*b*e-2*b*y+2*c*f-2*c*z)^2-4*(-a^2-b^2-c^2+s^2)*(-d^2+2*d*x-e^2+2*e*y-f^2+2*f*z-x^2-y^2-z^2))-2*a*d+2*a*x-2*b*e+2*b*y-2*c*f+2*c*z)/(2*(-a^2-b^2-c^2+s^2));

    return p.clone().addScaledVector(v,t);
    */
  },
  update: function(delta, now) {
    var target = nearestEnemy(this.object.position);
    var pos;
    if (target) {
      //pos = target.object.position.clone();
      pos = this.interceptPoint(target, delta);
    } else {
      var dir = this.object.position.clone().normalize();
      dir.y = 0;
      pos = this.object.position.clone().add(dir);
    }
    var diff = pos.clone().sub(this.targetPos);
    var length = diff.length();
    var step = this.targetSpeed*length*delta;
    if (length > step) {
      diff.multiplyScalar(step/length);
    }
    this.targetPos.add(diff);
    var localPos = this.object.worldToLocal(this.targetPos.clone());
    this.gun.lookAt(localPos);

    if (target) {
      this.updateLaser(now);
    } else {
      this.setLaserLength(0);
    }

    if (target && length < 0.5 && (now - this.lastFired) > 1/this.fireRate) { // on target and can fire
      this.lastFired = now;
      var dir = this.targetPos.clone().sub(this.object.position);
      dir.multiplyScalar(this.bulletSpeed/dir.length());
      // Spawn bullet outside of turret by a small amount to prevent clipping.
      new Bullet(this.object.position.clone().addScaledVector(dir.clone().normalize(), 0.75), dir);
    }

    this.prop.update(delta);
  },
  onDamage : function(damage, dt) {
    // Shoot particles out of the turret when it gets damaged.
    var dir = new THREE.Vector3(2*Math.random()-1, this.object.position.y, 2*Math.random()-1);
    dir.multiplyScalar(2/dir.length());
    var color = (Math.random() > 0.5) ? 0xcccccc : 0x333333;
    var p = new Particle(this.object.position, dir, color, 0.08, false);
    p.maxLife = 1.5;  
      
    // Should instakill.
    map.removeEntity(this);
    scene.remove(this.object);
    objects.splice(objects.indexOf(this.object), 1);
  },
};
var ParticleShader = new THREE.ShaderMaterial({
  uniforms: {
    color: { type: 'c', value: null },
    flip: { type: 'f', value: 1.0 },
  },
  vertexShader: document.querySelector('#particleVertexShader').textContent,
  fragmentShader: document.querySelector('#particleFragmentShader').textContent,
});

function Particle(position, velocity, color, size, collides, onCollide, type){
    this.velocity = velocity.clone();
    this.timeAlive = 0;
    this.maxLife = 3; // last at most 3 seconds
    this.acceleration = new THREE.Vector3(0,-9.8,0);
    this.collides = collides;
    if (!type) {
      type = Particle.TRIANGLE;
    }
    this.type = type;
    this.destroyed = false;

    var geometry, material;
    if (type === Particle.CUBE) {
      geometry = new THREE.BoxGeometry( size, size, size );
      material = new THREE.MeshBasicMaterial( { color: color, fog: false } );
    } else if (type === Particle.SQUARE) {
      geometry = new THREE.PlaneGeometry(size, size, 1);
    } else if (type === Particle.TRIANGLE) {
      geometry = TriangleGeometry.clone();
      geometry.scale(size/2,size/2,size/2);
    }
    if (type === Particle.SQUARE || type === Particle.TRIANGLE) {
      material = ParticleShader.clone();
      material.uniforms.color.value = new THREE.Color(color);
    }
    this.material = material;
    this.object = new THREE.Mesh(geometry, material);

    this.object.position.copy(position);
    this.object.controller = this;
    scene.add(this.object);
    objects.push(this.object);
    map.addEntity(this);

    var self = this;
    this.prop = new Prop(this, map, position.clone(), collides ? size : 0,
        function(position) {
          self.object.position.copy(position);
        },
        function(entity, dt) {
          if (onCollide)
            onCollide(entity, dt);
        }, 0.5);
    this.prop.applyForce(velocity);
  }

var TriangleShape = new THREE.Shape();
TriangleShape.moveTo( 0, 1 );
TriangleShape.lineTo( 1, 1-Math.sqrt(3) );
TriangleShape.lineTo( -1, 1-Math.sqrt(3) );
TriangleShape.lineTo( 0, 1 );

var TriangleGeometry = new THREE.ShapeGeometry(TriangleShape);

Particle.TRIANGLE = 1;
Particle.CUBE = 2;
Particle.SQUARE = 3;

Particle.prototype = {
  constructor: Particle,
  update: function(delta, now) {
    if (this.timeAlive > this.maxLife) {
      this.destroy();
      return;
    }
    /*
    if (this.acceleration) {
      this.prop.velocity.add(this.acceleration.clone().multiplyScalar(delta));
    }
    */
    var scale = this.maxLife - this.timeAlive;
    if (scale < 1 && scale >= 0) {
      this.object.geometry.scale(scale, scale, scale);
    }
    this.prop.update(delta);
    this.timeAlive += delta;
    if (this.type === Particle.TRIANGLE) {
      this.material.uniforms.flip.value *= -1;
    }
  },
  destroy: function() {
    if (this.destroyed)
      return;
    this.destroyed = true;

    scene.remove(this.object);

    // remove from objects array
    objects.splice(objects.indexOf(this.object), 1);
    map.removeEntity(this);
  },
};

function Bullet(position, velocity) {
  var self = this;
  Particle.prototype.constructor.call(this, position, velocity, BULLET_COLOR, 0.2, true, function(collider, dt) {
    if (collider.onDamage) {
        if(collider instanceof Monster) {
            collider.onDamage(Bullet.prototype.damage, dt);
            self.destroy(); // it's cooler with trick shots tho
        }            
    }
  }, Particle.CUBE);
  this.maxDistance = 80;
  this.acceleration = null;
}
Bullet.prototype =  {
  damage: 2,
  update: function(delta, now) {
    Particle.prototype.update.call(this, delta, now);
  },
  destroy: Particle.prototype.destroy,
};

