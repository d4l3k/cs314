const WALL_COLOR = 0x3d3d3d;
const WALL_SIDE_COLOR = 0x999999;
const TURRET_BASE_COLOR = WALL_COLOR;
const TURRET_BARREL_COLOR = WALL_SIDE_COLOR;

const TURRET_LASER_COLOR = 0xff0000;

function Wall() {
  this.geometry = new THREE.BoxGeometry( 0.5, 1, 0.5 );
  this.material = new THREE.MeshLambertMaterial( { color: WALL_COLOR } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;

  var sideGeometry = new THREE.BoxGeometry( 0.5, 0.8, 0.3 );
  var sideMaterial = new THREE.MeshLambertMaterial( { color: WALL_SIDE_COLOR } );
	for (var i=0; i<4; i++) {
		var angle = Math.PI*i/2;
		var x = Math.sin(angle)/4;
		var z = Math.cos(angle)/4;
		var side = new THREE.Mesh( sideGeometry, sideMaterial );
		side.position.x = x;
		side.position.z = z;
		side.position.y = -0.1;
		side.rotateY(Math.PI/2 + angle);
		this.object.add(side);
	}
}
Wall.cost = 100;

function Turret() {
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
}
Turret.cost = 1000;
Turret.prototype = {
  update: function(delta, now) {
    var target = new THREE.Vector3(0,5,0);
    var pos = this.object.worldToLocal(target);
    this.gun.lookAt(pos);
  },
};
