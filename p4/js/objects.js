function Wall() {
  this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
  this.material = new THREE.MeshLambertMaterial( { color: 0x3d3d3d } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;
}
Wall.cost = 100;

function Turret() {
  this.object = new THREE.Object3D();
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;

  var geometry = new THREE.BoxGeometry( 0.2, 0.5, 0.2 );
  var material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
  var base = new THREE.Mesh( geometry, material );
  base.position.y = -0.25;
  this.object.add(base);

  this.gun = new THREE.Object3D();
  this.object.add(this.gun);

  var geometry = new THREE.BoxGeometry( 0.3, 0.75, 0.3 );
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
  var barrel = new THREE.Mesh( geometry, material );
  barrel.position.z=0.20;
  barrel.rotateX(Math.PI/2);
  this.gun.add(barrel);

  var geometry = new THREE.BoxGeometry( 0.05, 10000, 0.05 );
  var material = new THREE.MeshLambertMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
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
