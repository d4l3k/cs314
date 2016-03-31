var scene, camera, renderer;
var geometry, material, mesh;
var floor;
var onRenderFcts = [];

// day cycle
var sunAngle = Math.PI/2;
var dayDuration = 10;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 5;
  camera.position.x = 5;
  camera.position.y = 5;

  geometry = new THREE.BoxGeometry( 1, 1, 1 );
  material = new THREE.MeshLambertMaterial( { color: 0xEF597B } );

  mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = 0.5;
  scene.add( mesh );

  addFloor();

  camera.lookAt(mesh.position);

  var light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

  scene.fog = new THREE.FogExp2( 0xF5FFFA, 0.05 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  var winResize = new THREEx.WindowResize(renderer, camera);
  initDayNight();

  document.body.appendChild( renderer.domElement );
}

function addFloor() {
  var geometry = new THREE.PlaneGeometry( 1000, 1000, 32 );
  var material = new THREE.MeshLambertMaterial( {color: 0x8EFAB4} );
  floor = new THREE.Mesh( geometry, material );
  floor.rotateX(-Math.PI/2);
  scene.add( floor );

  var gridHelper = new THREE.GridHelper( 50, 1 );
  gridHelper.position.y += 0.01;
  scene.add( gridHelper );
}

function initDayNight() {
  THREEx.DayNight.baseURL = "bower_components/threex.daynight/";
  var sunSphere = new THREEx.DayNight.SunSphere();
  scene.add( sunSphere.object3d );
  /*
  var skydom  = new THREEx.DayNight.Skydom();
  scene.add( skydom.object3d );
  var starField   = new THREEx.DayNight.StarField();
  scene.add( starField.object3d );
  */
	var sunLight	= new THREEx.DayNight.SunLight()
	scene.add( sunLight.object3d )

  var geometry = new THREE.SphereGeometry(3000, 60, 40);
  var material = new THREE.MeshLambertMaterial( {color: 0, side: THREE.BackSide} );
  var skybox = new THREE.Mesh( geometry, material );
  scene.add(skybox);

  onRenderFcts.push(function(delta, now) {
    //sunAngle    += delta/dayDuration * Math.PI*2;
    //skydom.update(sunAngle);
    sunSphere.update(sunAngle);
    //starField.update(sunAngle);
		sunLight.update(sunAngle)
  });
}

var lastTimeMsec = null;
requestAnimationFrame( render );
function render(nowMsec) {
  requestAnimationFrame( render );

  mesh.rotation.y += 0.02;

  // measure time
  lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
  var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec	= nowMsec;
  // call each update function
  onRenderFcts.forEach(function(updateFn){
    updateFn(deltaMsec/1000, nowMsec/1000);
  });

  renderer.render( scene, camera );
}
