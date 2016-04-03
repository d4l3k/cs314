var scene, camera, renderer, composer;
var geometry, material, mesh;
var floor, island;
var onRenderFcts = [];

//var floorColor = 0x113300;//0x8EFAB4;
var fogColor = 0x8EFAB4;

var waterMaterial;

// day cycle
var sunAngle = Math.PI/2;
var dayDuration = 10;

const mapWidth = 9; // map size in x dimension
const mapHeight = 5; // map size in z dimension
const mapElevation = 0.5; // y position of the baseline map level.

init();

var mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = -2;
  camera.position.z = -4;
  camera.position.y = 2.5;

  geometry = new THREE.BoxGeometry( 1, 1, 1 );
  material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );

  mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = 1;
  scene.add( mesh );
  camera.lookAt(mesh.position);

  // Setup water material, which depends on the current time.
  waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { type: "f", value: 0.0 },
      diffuse: { type: "c", value: new THREE.Color(0x000099) },
      specular: { type: "c", value: new THREE.Color(0x333399) },
      alpha: { type: "f", value: 0.5 },
      waveThreshold: { type: "f", value: 25.0 }
    },
    vertexShader: document.getElementById("waterVertexShader").textContent,
    fragmentShader: document.getElementById("waterFragmentShader").textContent
  });

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
  //composer.addPass(bloomPass);
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
      cursor.position.y = 0.501;
      var pos = intersect.point;
      cursor.position.x = Math.floor(pos.x+0.5);
      cursor.position.z = Math.floor(pos.z+0.5);
    } else {
      cursor.position.y = -0.01;
    }
  });
}

// Generates an island mesh with the given width, height, and depth boundaries.
// The island's height map is determined by a combination of a uniform noise
// field for the surface of the island, and a gaussian falloff around the edges.
// - precision: indicates the number of vertices to create per world distance unit.
// - heightVariance: random mesh height variance. should mostly be irrelevant.
// - sigmaFalloff: is the sigma parameter in the gaussian-like distribution used for falloff.
//
function generateIsland(centerX, centerY, width, height, z_max, z_min, precision, heightVariance, sigmaFalloff) {
  // A poor man's Gaussian (no normalization).
  function decay(x) {
    return Math.exp(-(x * x)/(2 * sigmaFalloff * sigmaFalloff));
  }

  var geometry = new THREE.Geometry();

  // Number of world units to extend the gaussian falloff for; encapsulate 3
  // standard deviations, or 99.7% of the values.
  const sigmaSize = 3 * sigmaFalloff;

  var planeWidth = (width + 2 * sigmaSize) * precision,
      planeHeight = (height + 2 * sigmaSize) * precision;
  var offsetX = centerX - Math.floor(width / 2) - sigmaSize,
      offsetY = centerY - Math.floor(height / 2) - sigmaSize;
  for (y = 0; y < planeHeight; y++) {
    for (x = 0; x < planeWidth; x++) {
      var worldX = x/precision;
      var worldY = y/precision;
      var falloff = z_max - z_min;

      // FIXME: this is pretty gross tbh, I'd like to measure clamped distance from plane center
      if (worldX < sigmaSize) {
        falloff *= decay(sigmaSize - worldX);
      }
      if (worldY < sigmaSize) {
        falloff *= decay(sigmaSize - worldY);
      }
      if (worldX - sigmaSize > width) {
        falloff *= decay(worldX - sigmaSize - width);
      }
      if (worldY - sigmaSize > height) {
        falloff *= decay(worldY - sigmaSize - height);
      }

      var elevation = Math.max(falloff + z_min - (heightVariance * Math.random()), z_min);

      geometry.vertices.push(
          new THREE.Vector3(worldX + offsetX,
                            elevation,
                            worldY + offsetY));
      if (x >= 1 && y >= 1) {
        // TODO: randomized perlin normal?
        var offset = (y - 1) * planeWidth; // Points to the first vertex in the last row.
        var normal = new THREE.Vector3(0, 1, 0); // FIXME: vary using perlin noise
        var faceTop = new THREE.Face3(offset + x, offset + x - 1, offset + planeWidth + x - 1, normal);
        var faceBottom = new THREE.Face3(offset + planeWidth + x - 1, offset + planeWidth + x, offset + x, normal);
        geometry.faces.push(faceTop, faceBottom);
      }
    }
  }

  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0xffff00 }));
}

function generateWater(waterLevel, width, height) {
  var geometry = new THREE.PlaneGeometry(width, height);
  var mesh = new THREE.Mesh(geometry, waterMaterial);
  mesh.position.set(0, waterLevel, 0);
  mesh.rotateX(-Math.PI/2);
  return mesh;
}

var cursor;
function addFloor() {
  const meshPrecision = 4;
  const islandFalloff = 0.75;
  island = generateIsland(-0.5, -0.5, mapWidth, mapHeight, mapElevation, 0, meshPrecision, 0.2, islandFalloff);
  scene.add(island);

  var geometry = new THREE.PlaneGeometry(mapWidth, mapHeight, 1);
  var material = new THREE.MeshLambertMaterial( {color: 0} );
  floor = new THREE.Mesh( geometry, material );
  floor.rotateX(-Math.PI/2);
  floor.position.y = mapElevation;
  scene.add( floor );

  // FIXME: remove.
  var wireframeHelper = new THREE.WireframeHelper(island);
  wireframeHelper.material.color.set(0x999999);
  scene.add(wireframeHelper);

  var water = generateWater(0.1, 1000, 1000);
  scene.add(water);

  var geometry = new THREE.PlaneGeometry( 1, 1, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
  cursor = new THREE.Mesh( geometry, material );
  cursor.rotateX(-Math.PI/2);
  cursor.position.y = mapElevation;
  cursor.position.z += 2;
  scene.add( cursor );

  var gridHelper = new THREE.GridHelper(50, 1 );
  gridHelper.position.y = mapElevation + 0.01;
  gridHelper.position.x += 0.5;
  gridHelper.position.z += 0.5;
  //scene.add( gridHelper );
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

  waterMaterial.uniforms.time.value = nowMsec;

  mesh.rotation.y += 0.02;

  // measure time
  lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
  var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec	= nowMsec;
  // call each update function
  onRenderFcts.forEach(function(updateFn){
    updateFn(deltaMsec/1000, nowMsec/1000);
  });

  // TODO: remove demo rotation.
  const ROTATION_DISTANCE = 8;
  const ROTATION_HEIGHT = 4;
  var angle = nowMsec * Math.PI/48000 % 2 * Math.PI;
  camera.position.x = ROTATION_DISTANCE * Math.cos(angle);
  camera.position.y = ROTATION_HEIGHT;
  camera.position.z = ROTATION_DISTANCE * Math.sin(angle);
  camera.lookAt(mesh.position);

  //renderer.render( scene, camera );
  renderer.clear();
  composer.render(deltaMsec/1000);
}
