var scene, camera, renderer, composer;
var geometry, material, mesh;
var floor;
var onRenderFcts = [];

var floorColor = 0x113300;//0x8EFAB4;
var fogColor = 0x8EFAB4;

// day cycle
var sunAngle = Math.PI/2;
var dayDuration = 10;

init();

var mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = 0;
  camera.position.z = 3;
  camera.position.y = 10;

  geometry = new THREE.BoxGeometry( 1, 1, 1 );
  material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );

  mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = 0.5;
  scene.add( mesh );
  camera.lookAt(mesh.position);

  addFloor();

  var light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );
  scene.fog = new THREE.FogExp2( fogColor, 0.05 );
  scene.fog.color.setScalar(0.7);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.autoClear = false;
  composer = new THREE.EffectComposer(renderer);
  var renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);
  var bloomPass = new THREE.BloomPass(1, 25, 5, 256);
  composer.addPass(bloomPass);
  var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
  effectCopy.renderToScreen = true;
  composer.addPass(effectCopy);

  var winResize = new THREEx.WindowResize(renderer, camera);
  initDayNight();

  document.body.appendChild( renderer.domElement );


  // setup mouse handlers
  document.body.addEventListener('mousemove', function(e) {
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
  });
  onRenderFcts.push(function(delta, now) {
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( [floor] );

    if ( intersects.length == 0 ) {
      return;
    }
    var intersect = intersects[0];
    if (intersect.object === floor) {
      cursor.position.y = 0.01;
      var pos = intersect.point;
      cursor.position.x = Math.floor(pos.x+0.5);
      cursor.position.z = Math.floor(pos.z+0.5);
    } else {
      cursor.position.y = -0.01;
    }
  });
}

var cursor;
function addFloor() {
  var geometry = new THREE.PlaneGeometry( 1000, 1000, 32 );
  var material = new THREE.MeshLambertMaterial( {color: floorColor} );
  floor = new THREE.Mesh( geometry, material );
  floor.rotateX(-Math.PI/2);
  scene.add( floor );

  var geometry = new THREE.PlaneGeometry( 1, 1, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
  cursor = new THREE.Mesh( geometry, material );
  cursor.rotateX(-Math.PI/2);
  cursor.position.y = -0.01;
  cursor.position.z += 2;
  scene.add( cursor );

  var gridHelper = new THREE.GridHelper( 50, 1 );
  gridHelper.position.y += 0.01;
  gridHelper.position.x += 0.5;
  gridHelper.position.z += 0.5;
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

  //renderer.render( scene, camera );
  renderer.clear();
  composer.render(deltaMsec/1000);
}
