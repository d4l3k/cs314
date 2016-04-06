function Wall() {
  this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
  this.material = new THREE.MeshLambertMaterial( { color: 0x3d3d3d } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;
}
Wall.cost = 100;

function Turret() {
  this.geometry = new THREE.BoxGeometry( 0.5, 1, 0.5 );
  this.material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
  this.object = new THREE.Mesh( this.geometry, this.material );
  this.object.controller = this;
  this.object.position.y = cursorElevation() + 0.5;
}
Turret.cost = 1000;
