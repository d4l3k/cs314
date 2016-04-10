'use strict';

var scene, camera, renderer, composer, glowcomposer;
var ambientLightDay, ambientLightNight;
var floor, island, seabed;
var onRenderFcts = [];
var map;

var audioElem = document.getElementById("music");
audioElem.volume = 0.2;
audioElem.muted = true;

function playAmbientMusic() {
  const tracks = [
    "music/Mellowtron.mp3",
    "music/KawaiKitsune.mp3"
  ]
  // Cycle through tracks depending on wave.
  audioElem.src = tracks[wave.difficulty % tracks.length];
  audioElem.play();
}

function playBattleMusic() {
  const tracks = [
    "music/Reformat.mp3",
    "music/VideoDungeonBoss.mp3",
    "music/Rhinoceros.mp3",
  ]
  // TODO: make this a function of the current wave, so more intense tracks
  // get played on "boss" waves?
  // Cycle through tracks depending on wave.
  audioElem.src = tracks[wave.difficulty % tracks.length];
  audioElem.play();
}

var cameraSpeed = 10;
var cameraDir = new THREE.Vector3(0,0,0);
var cameraElevation = 8;

//var floorColor = 0x113300;//0x8EFAB4;
var fogColor = 0x87CEEB;

var waterMaterial;
var sandMaterial = new THREE.MeshLambertMaterial();

// day cycle
var sunAngle = Math.PI/2;
var dayDuration = 10;

const mapWidth = 15; // map size in x dimension
const mapHeight = 15; // map size in z dimension
const mapElevation = 0.7; // y position of the baseline map level.
const mapFalloffSigma = 2; // sigma value of gaussianlike decay around island edges
const seabedElevation = -1;

const sandColor = 0xEDC9AF;

const AMBIENT_DAY = 0x404040;
const AMBIENT_NIGHT = 0x101040;

var objects = []; // A list of all interactable objects in the scene.

var wave;
var waveNum = 0;

// controls is a list of creatable objects.
const placeable = [Turret, Wall];
var controls = {};
placeable.forEach(function(control) {
  var name = control.name.toUpperCase();
  controls[name] = control;
  var button = document.createElement("a");
  button.classList.add("button");
  button.dataset.item = name;
  button.innerText = name+' -$'+control.prototype.cost;
  document.querySelector('#items').appendChild(button);
});


var mouse = new THREE.Vector2(10000,10000), raycaster = new THREE.Raycaster();

var money = 0;
var score = 0;
var health = 0;

function addMoney(d) {
  if (money + d >= 0) {
    money += d;
    document.querySelector('#money').innerText = money.toFixed(0);
    return true;
  }
  return false;
}
function addScore(d) {
  score += d;
  document.querySelector('#score').innerText = score.toFixed(0);
}
function addHealth(d) {
  health += d;
  if (health < 0) {
    health = 0;
  }
  document.querySelector('#health').innerText = health.toFixed(0);
  if (health <= 0) {
    document.querySelector("#gameover").classList.remove("hidden");
  } else {
    document.querySelector("#gameover").classList.add("hidden");
  }
}

addMoney(10000);
addHealth(10);

function removeWelcome() {
    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#overlay").classList.remove("hidden");     
}

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, .1, 10000 );
  camera.position.z = 2;
  camera.position.y = 8;

  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var texture = THREE.ImageUtils.loadTexture( "textures/cube.png" );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture, fog: false } );
  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = mapElevation+0.5;
  scene.add(mesh);
  camera.lookAt(mesh.position);
  onRenderFcts.push(function() {
    mesh.rotation.y += 0.02;
  });

  setInterval(function() {
    var dir = new THREE.Vector3(2*Math.random()-1, 4, 2*Math.random()-1);
    dir.multiplyScalar(3/dir.length());
    new Particle(mesh.position, dir, 0xffffff, 0.1, false, null, Particle.SQUARE);
  }, 100);

  // Setup water material, which depends on the current time.
  waterMaterial = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([ {
      time: { type: "f", value: 0.0 },
      diffuse: { type: "c", value: new THREE.Color(0x0000bb) },
      specular: { type: "c", value: new THREE.Color(0x3333bb) },
      alpha: { type: "f", value: 0.4 },
      waveThreshold: { type: "f", value: 20.0 },
      tideVariance: { type: "f", value: 0.1 },
    }, THREE.UniformsLib[ "fog" ], ]),
    vertexShader: document.getElementById("waterVertexShader").textContent,
    fragmentShader: document.getElementById("waterFragmentShader").textContent,
    transparent: true,
    fog: true,
  });

  addFloor();

  map = new Map(new THREE.Vector3(mapWidth/2, mapElevation, -mapHeight/2),
                mapWidth, mapHeight, 1);

  initControls();

  ambientLightDay = new THREE.AmbientLight(AMBIENT_DAY);
  scene.add(ambientLightDay);
  ambientLightNight = new THREE.AmbientLight(AMBIENT_NIGHT);

  scene.fog = new THREE.FogExp2( fogColor, 0.02 );

  var goalLight = new THREE.PointLight(0xffffff, 1, 15);
  goalLight.position.set(0, 1, 0);
  goalLight.rotateX(-Math.PI / 2);
  scene.add(goalLight);

  var sunLight = new THREE.DirectionalLight(0xffffff, 0.4);
  sunLight.position.set(0, 1, 0);
  scene.add(sunLight);

  initRenderer()

  initDayNight();


  // setup mouse handlers
  var lastX, lastY;
  document.body.addEventListener('mousemove', function(e) {
    mouse.x = ( e.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( e.clientY / renderer.domElement.height ) * 2 + 1;

    // If middle mouse is held down, pan camera.
    // We use inverse mouse panning, because that's my favourite feature of StarCraft 2. -acomminos
    if ((e.buttons & 4) && lastX && lastY) {
      const DRAG_SCALE = 20;
      camera.position.x -= DRAG_SCALE * (e.clientX - lastX) / window.innerWidth;
      camera.position.z -= DRAG_SCALE * (e.clientY - lastY) / window.innerHeight;
    } else {
      // Otherwise, pan to edges.
      if (mouse.x < -0.9) {
        cameraDir.x = -1;
      } else if (mouse.x > 0.9) {
        cameraDir.x = 1;
      } else {
        cameraDir.x = 0;
      }

      if (mouse.y < -0.9) {
        cameraDir.z = 1;
      } else if (mouse.y > 0.9) {
        cameraDir.z = -1;
      } else {
        cameraDir.z = 0;
      }
    }

    lastX = e.clientX;
    lastY = e.clientY;
  });
  document.body.addEventListener('wheel', function(e) {
    const maxY = 50;
    const minY = 3;
    var scrollAmount = e.deltaY;
    switch (e.deltaMode) {
      case 0x0: // DOM_DELTA_PIXEL
        scrollAmount /= 50;
        break;
      case 0x1: // DOM_DELTA_LINE
      case 0x2: // DOM_DELTA_PAGE
        break;
    }
    cameraElevation = Math.min(Math.max(cameraElevation + scrollAmount, minY), maxY);
  });
  document.body.addEventListener('keydown', function(e) {
    switch(e.which) {
      case 37: // left
        cameraDir.x = -1;
        break;
      case 38: // up
        cameraDir.z = -1;
        break;
      case 39: // right
        cameraDir.x = 1;
        break;
      case 40: // down
        cameraDir.z = 1;
        break;
      default:
    }
  });
  document.body.addEventListener('keyup', function(e) {
    switch(e.which) {
      case 37: // left
      case 39: // right
        cameraDir.x = 0;
        break;
      case 38: // up
      case 40: // down
        cameraDir.z = 0;
        break;
      default:
    }
  });
  document.body.addEventListener('mouseout', function() {
    cameraDir.x = 0;
    cameraDir.z = 0;
  });

  renderer.domElement.addEventListener('click', function(e) {
    if (!cursor.visible || !cursorObject) {
      return;
    }

    if (e.button != 0) {
      return;
    }

    if (activeControl) {
      if (!(cursorObject.controller instanceof Wall || cursorObject == floor)) {
        return;
      }
      if (!addMoney(-activeControl.prototype.cost)) {
        return;
      }
      var item = new activeControl(cursor.position.x, cursor.position.z);
      objects.push(item.object);
      scene.add(item.object);
      map.addEntity(item);
      setSelectedObject(item.object);
      // XXX map.pushConstruct(item, cursor.position.x, cursor.position.z);
    } else {
      setSelectedObject(cursorObject);
    }
  });
  // deselect the current object.
  document.querySelector('#info #unselect').addEventListener('click', function() {
    setSelectedObject(null);
  });
  // destroy object and add money back to user.
  document.querySelector('#info #destroy').addEventListener('click', function() {
    var controller = selectedObject.controller;
    addMoney(controller.destroyCost);
    scene.remove(selectedObject);
    map.removeEntity(controller);
    // remove from objects array
    objects.splice(objects.indexOf(selectedObject), 1);
    setSelectedObject(null);
  });
  document.querySelector('#next').addEventListener('click', function() {
    var waveText = document.querySelector("#waveNum");
    waveNum++;
    waveText.innerHTML = waveNum;
    if (!wave.started) {
      wave.start();
    } else {
      wave = wave.next();
      wave.start();
    }
  });

  onRenderFcts.push(function(delta, now) {
    raycaster.setFromCamera( mouse, camera );
    var intersectable = [floor].concat(objects);
    var intersects = raycaster.intersectObjects(intersectable, true);
    cursor.visible = false;
    intersects.slice(0,1).forEach(function(intersect) {
      var obj = topLevelObject(intersect.object);
      var pos = intersect.point;
      if (obj === floor) {
        cursor.position.y = floor.position.y - 0.5;
      } else {
        pos = obj.position;
        cursor.position.y = obj.position.y;
      }
      cursorObject = obj;
      cursor.visible = true;
      cursor.position.x = Math.floor(pos.x+0.5);
      cursor.position.z = Math.floor(pos.z+0.5);
    });
  });
  onRenderFcts.push(function(delta, now) {
    objects.forEach(function(obj) {
      if (obj.controller.update) {
        obj.controller.update(delta, now);
      }
    });
  });

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });

  playAmbientMusic();
}

// topLevelObject returns the parent object that is a direct descendent of the scene.
function topLevelObject(obj) {
  while(!(obj.parent instanceof THREE.Scene) && obj.parent) {
    obj = obj.parent;
  }
  return obj;
}

var activeControl = null;
function initControls() {
  document.getElementById('musicEnabled').addEventListener('change', function(e) {
    audioElem.muted = !e.target.checked;
  });

  var itemButtons = document.querySelectorAll('#items .button');
  [].forEach.call(itemButtons, function(button) {
    button.addEventListener('click', function(e) {
      [].forEach.call(itemButtons, function(b2) {
        b2.classList.remove('selected');
      });
      button.classList.add('selected');
      activeControl = controls[button.dataset.item];
    });
  });

  var waveButton = document.querySelector('#next');
  wave = new Wave(scene, map, mapElevation, {
    begin: function() {
      playBattleMusic();
      waveButton.style.display = 'none';
      scene.remove(ambientLightDay);
      scene.add(ambientLightNight);
    },
    end: function() {
      playAmbientMusic();
      waveButton.style.display = '';
      scene.remove(ambientLightNight);
      scene.add(ambientLightDay);
    }
  }, 5);
}

function nearestEnemy(position) {
  if (!wave || !wave.monsters || !wave.monsters.length) {
    return;
  }
  var enemy = null;
  var dist = 10000000;
  wave.monsters.forEach(function(monster) {
    var mDist = monster.prop.position.clone().sub(position).length();
    if (mDist < dist) {
      dist = mDist;
      enemy = monster;
    }
  });
  return enemy;
}

// A poor man's Gaussian (no normalization).
function decay(x, sigmaFalloff) {
  return Math.exp(-(x * x)/(2 * sigmaFalloff * sigmaFalloff));
}

// Computes falloff for the given x and z coordinates around a rectangular region.
// Assume coordinates on the rectangle are in range [0, width), [0, height).
function computeFalloff(x, z, width, height, sigmaFalloff) {
  // FIXME: this is pretty gross tbh, I'd like to measure clamped distance from plane center
  var value = 1.0;
  if (x < 0) {
    value *= decay(x, sigmaFalloff);
  }
  if (z < 0) {
    value *= decay(z, sigmaFalloff);
  }
  if (x > width) {
    value *= decay(x - width, sigmaFalloff);
  }
  if (z > height) {
    value *= decay(z - height, sigmaFalloff);
  }
  return value;
}

/**
 * Returns the height of the bottom of the map at the given coordinates.
 */
function floorY(x, z) {
  if (x < -mapWidth/2 || x > mapWidth/2 || z < -mapHeight/2 || z > mapHeight/2) {
    // Use gaussian falloff out of bounds.
    return Math.max(seabedElevation,
        (mapElevation - seabedElevation) *
        computeFalloff(x + mapWidth / 2, z + mapHeight / 2, mapWidth, mapHeight, mapFalloffSigma)
        + seabedElevation);
  }
  return mapElevation;
}

// Generates an island mesh with the given width, height, and depth boundaries.
// The island's height map is determined by a combination of a uniform noise
// field for the surface of the island, and a gaussian falloff around the edges.
// - precision: indicates the number of vertices to create per world distance unit.
// - heightVariance: random mesh height variance. should mostly be irrelevant.
// - sigmaFalloff: is the sigma parameter in the gaussian-like distribution used for falloff.
//
function generateIsland(centerX, centerY, width, height, z_max, z_min, precision, heightVariance, sigmaFalloff) {
  var geometry = new THREE.Geometry();

  // Number of world units to extend the gaussian falloff for; encapsulate 3
  // standard deviations, or 99.7% of the values.
  const sigmaSize = 3 * sigmaFalloff;

  var planeWidth = (width + 2 * sigmaSize) * precision,
      planeHeight = (height + 2 * sigmaSize) * precision;
  var offsetX = centerX - Math.floor(width / 2) - sigmaSize,
      offsetY = centerY - Math.floor(height / 2) - sigmaSize;
  for (var y = 0; y < planeHeight; y++) {
    for (var x = 0; x < planeWidth; x++) {
      var worldX = x/precision;
      var worldY = y/precision;
      var falloff = (z_max - z_min) * computeFalloff(worldX - sigmaSize, worldY - sigmaSize, width, height, sigmaFalloff);
      var elevation = Math.max(falloff + z_min - (heightVariance * Math.random()), z_min);

      geometry.vertices.push(
          new THREE.Vector3(worldX + offsetX,
                            elevation,
                            worldY + offsetY));
      if (x >= 1 && y >= 1) {
        // TODO: randomized perlin normal?
        var offset = (y - 1) * planeWidth; // Points to the first vertex in the last row.
        // a----b
        // | \  |
        // |  \ |  <-- as stored in vertex array
        // c----d
        var aIndex = offset + x - 1,
            bIndex = aIndex + 1,
            cIndex = aIndex + planeWidth,
            dIndex = bIndex + planeWidth;
        var faceTop = new THREE.Face3(dIndex, bIndex, aIndex);
        var faceBottom = new THREE.Face3(aIndex, cIndex, dIndex);
        geometry.faces.push(faceTop, faceBottom);
      }
    }
  }

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: sandColor }));
}

function generateWater(waterLevel, width, height) {
  var geometry = new THREE.PlaneGeometry(width, height);
  var mesh = new THREE.Mesh(geometry, waterMaterial);
  mesh.position.set(0, waterLevel, 0);
  mesh.rotateX(-Math.PI/2);
  return mesh;
}

var cursor;
var cursorObject;
var selectedObject = null;
function setSelectedObject(obj) {
  selectedObject = obj;
  var controller = obj && obj.controller;
  if (!controller) {
    selectedObject = null;
    obj = null;
    controller = null;
  }
  var infoPane = document.querySelector('#info');
  if (!selectedObject) {
    infoPane.classList.add('hidden');
    return;
  }
  var infoTitle = document.querySelector('#info #title');
  infoTitle.innerText = obj.controller.name;
  var infoDesc = document.querySelector('#info #desc');
  infoDesc.innerText = obj.controller.description;
  var infoCost = document.querySelector('#info #cost');
  infoCost.innerText = obj.controller.destroyCost;

  infoPane.classList.remove('hidden');
}
function addFloor() {
  const meshPrecision = 5;
  island = generateIsland(-0.5, -0.5, mapWidth, mapHeight, mapElevation, seabedElevation, meshPrecision, 0.05, mapFalloffSigma);
  scene.add(island);

  //var normals = new THREE.FaceNormalsHelper(island, 0.2, 0x00ff00, 1);
  //scene.add(normals);

  // TODO: replace floor- useless.
  var geometry = new THREE.PlaneGeometry(mapWidth, mapHeight, 1);
  var material = new THREE.MeshBasicMaterial( {color: 0, transparent: true, opacity: 0} );
  floor = new THREE.Mesh( geometry, material );
  floor.rotateX(-Math.PI/2);
  floor.position.y = mapElevation;
  scene.add( floor );

  // FIXME: remove.
  /*
  var wireframeHelper = new THREE.WireframeHelper(island);
  wireframeHelper.material.color.set(0x999999);
  scene.add(wireframeHelper);
  */

  var seabedGeometry = new THREE.PlaneGeometry(1000, 1000);
  seabed = new THREE.Mesh(seabedGeometry, new THREE.MeshPhongMaterial({color: sandColor}));
  seabed.rotateX(-Math.PI/2);
  seabed.position.set(0, -1, 0);
  scene.add(seabed);

  var water = generateWater(0.2, 1000, 1000);
  scene.add(water);

  var geometry = new THREE.BoxGeometry( 1.01, 1.01, 1.01 );
  var material = new THREE.MeshBasicMaterial( {color: 0xffffff, transparent: true, opacity: 0.5} );
  cursor = new THREE.Mesh( geometry, material );
  cursor.rotateX(-Math.PI/2);
  cursor.position.y = mapElevation;
  cursor.position.z += 2;
  cursor.visible = false;
  scene.add( cursor );

  var gridHelper = new THREE.GridHelper(50, 1 );
  gridHelper.position.y = mapElevation + 0.01;
  gridHelper.position.x += 0.5;
  gridHelper.position.z += 0.5;
  //scene.add( gridHelper );
}


function initDayNight() {
  var geometry = new THREE.SphereGeometry(1000, 60, 40);
  var material = new THREE.MeshLambertMaterial( {color: 0x00ff00, side: THREE.BackSide} );
  var skybox = new THREE.Mesh( geometry, material );
  scene.add(skybox);
}

function cursorElevation() {
  return cursor.position.y + 0.5;
}

// Lazy pass calls the pass every n times to avoid duplicating work.
function LazyPass(pass, every, params) {
  this.pass = pass;
  this.every = every;
  this.count = 0;

  if (!params) {
    params = {};
  }

  this.enabled = pass.enabled;
  this.clear = pass.clear;
  this.needsSwap = pass.needsSwap;

	var width = params.width || window.innerWidth || 1;
	var height = params.height || window.innerHeight || 1;

	this.renderTarget = new THREE.WebGLRenderTarget(width, height);

  var copyShader = new THREE.ShaderMaterial(THREE.CopyShader).clone();
  this.copyPass = new THREE.ShaderPass(copyShader);
};
LazyPass.prototype = {
  render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {
    if (this.count == 0) {
      this.pass.render(renderer, this.renderTarget, readBuffer, delta, maskActive);
      this.copyPass.render(renderer, writeBuffer, this.renderTarget, delta, maskActive);
    }
    this.count = (this.count + 1) % this.every;
  },
}


var combineShader = {
  uniforms: {
    tDiffuse: { type: "t", value: 0, texture: null },
    tGlow: { type: "t", value: 0, texture: null }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = vec2(uv);",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform sampler2D tGlow;",
    "varying vec2 vUv;",
    "void main() {",
    "gl_FragColor = texture2D(tDiffuse, vUv) + texture2D(tGlow, vUv);",
    "}"
  ].join("\n")
};

function initRenderer() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  // composers
  var renderPass = new THREE.RenderPass(scene, camera);
  var lazyPass = new LazyPass(renderPass, 1);

  // glow composer
  glowcomposer = new THREE.EffectComposer(renderer);
  glowcomposer.addPass(lazyPass);
  var highlightPass = new HighlightPass();
  glowcomposer.addPass(highlightPass);
  var bloomPass = new THREE.BloomPass(2, 25, 4, 256);
  glowcomposer.addPass(bloomPass);

  // main composer
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(lazyPass);
  combineShader.uniforms.tGlow.value = glowcomposer.renderTarget1;
  var combinePass = new THREE.ShaderPass(combineShader);
  combinePass.renderToScreen = true;
  composer.addPass(combinePass);

  document.body.appendChild( renderer.domElement );
}

var delays = [];
var fpsCounter = document.querySelector("#fps");

var lastTimeMsec = null;
requestAnimationFrame( render );

function render(nowMsec) {
  requestAnimationFrame( render );

  waterMaterial.uniforms.time.value = nowMsec;


  // measure time
  lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
  var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
  var deltasec = deltaMsec/1000;

  lastTimeMsec	= nowMsec;
  // call each update function
  onRenderFcts.forEach(function(updateFn){
    updateFn(deltaMsec/1000, nowMsec/1000);
  });
  wave.update(deltaMsec/1000);

  delays.push(deltasec);
  if (delays.length > 60) {
    delays.shift();
  }
  var average = 0;
  delays.forEach(function(delay) {
    average += delay;
  });
  average /= delays.length;
  fpsCounter.innerText = (1/average).toFixed(0);

  // TODO: remove demo rotation.
  /*
  const ROTATION_DISTANCE = 8;
  const ROTATION_HEIGHT = 4;
  var angle = nowMsec * Math.PI/48000 % 2 * Math.PI;
  camera.position.x = ROTATION_DISTANCE * Math.cos(angle);
  camera.position.y = ROTATION_HEIGHT;
  camera.position.z = ROTATION_DISTANCE * Math.sin(angle);
  camera.lookAt(mesh.position);
  */

  var cameraDelta = cameraSpeed * deltaMsec/1000;
  camera.position.add(cameraDir.clone().multiplyScalar(cameraDelta));
  if (Math.abs(camera.position.y - cameraElevation) > cameraDelta) {
    // Animate elevation changes.
    camera.position.y += cameraDelta * (camera.position.y < cameraElevation ? 1 : -1);
  }

  //renderer.clear();
  glowcomposer.render(deltaMsec/1000);
  composer.render(deltaMsec/1000);
}

init();
