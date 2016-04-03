/***
 * Created by Glen Berseth Feb 5, 2016
 * Created for Project 2 of CPSC314 Introduction to graphics Course.
 */

// Build a visual axis system
function buildAxis( src, dst, colorHex, dashed ) {
        var geom = new THREE.Geometry(),
            mat;

        if(dashed) {
                mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
        } else {
                mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
        }

        geom.vertices.push( src.clone() );
        geom.vertices.push( dst.clone() );
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;

}
var length = 100.0;
// Build axis visuliaztion for debugging.
x_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( length, 0, 0 ),
	    0xFF0000,
	    false
	)
y_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( 0, length, 0 ),
	    0x00ff00,
	    false
	)
z_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( 0, 0, length ),
	    0x0000FF,
	    false
	)

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix=a;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}
//ASSIGNMENT-SPECIFIC API EXTENSION
// For use with matrix stack
THREE.Object3D.prototype.setMatrixFromStack = function(a) {
  this.matrix=mvMatrix;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}

// Data to for the two camera view
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;
var views = [
	{
		left: 0,
		bottom: 0,
		width: 0.499,
		height: 1.0,
		background: new THREE.Color().setRGB( 0.1, 0.1, 0.1 ),
		fov: 45,
		updateCamera: function ( camera, scene, mouseX, mouseY ) {
    }
	},
	{
		left: 0.501,
		bottom: 0.0,
		width: 0.499,
		height: 1.0,
		background: new THREE.Color().setRGB( 0.1, 0.1, 0.1 ),
		fov: 45,
		updateCamera: function ( camera, scene, mouseX, mouseY ) {
    }
	}
];



//SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
// renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);

// Creating the two cameras and adding them to the scene.
var view = views[0];
camera_MotherShip = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
view.camera = camera_MotherShip;

var view = views[1];
camera_ScoutShip = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
view.camera = camera_ScoutShip;


// ADDING THE AXIS DEBUG VISUALIZATIONS
scene.add(x_axis);
scene.add(y_axis);
scene.add(z_axis);


// ADAPT TO WINDOW RESIZE
function resize() {
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
  renderer.setSize(window.innerWidth,window.innerHeight);
}

// EVENT LISTENER RESIZE
window.addEventListener('resize',resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function ()
{
     window.scrollTo(0,0);
}

var ambientLight = new THREE.AmbientLight( 0x222222 );
scene.add( ambientLight );

var lights = [];
lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[0].castShadow = true;

lights[0].position.set( 0, 0, 0 ); // IN THE SUN....

scene.add( lights[0] );

// SETUP HELPER GRID
// Note: Press Z to show/hide
var gridGeometry = new THREE.Geometry();
var i;
for(i=-50;i<51;i+=2) {
    gridGeometry.vertices.push( new THREE.Vector3(i,0,-50));
    gridGeometry.vertices.push( new THREE.Vector3(i,0,50));
    gridGeometry.vertices.push( new THREE.Vector3(-50,0,i));
    gridGeometry.vertices.push( new THREE.Vector3(50,0,i));
}

var gridMaterial = new THREE.LineBasicMaterial({color:0xBBBBBB});
var grid = new THREE.Line(gridGeometry,gridMaterial,THREE.LinePieces);

/////////////////////////////////
//   YOUR WORK STARTS BELOW    //
/////////////////////////////////

// Create Solar System
var sun = new THREE.Object3D();
var geometrySun = new THREE.SphereGeometry( 5, 32, 32 );
generateVertexColors( geometrySun );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var sunMesh = new THREE.Mesh( geometrySun, material );
sun.add(sunMesh);
scene.add(sun);

// Ring Variables
var radius = 1;
var segments = 64;

// Materials
var orbitMaterial = new THREE.LineBasicMaterial({color: 0xDDDDDD});
var greyMaterial = new THREE.MeshBasicMaterial({color: 0x999999});
var lightBrownMaterial = new THREE.MeshBasicMaterial({color: 0xFFCD6C, side: THREE.DoubleSide});
var blueMaterial = new THREE.MeshBasicMaterial({color: 0x369EFF, side: THREE.DoubleSide});
var redMaterial = new THREE.MeshBasicMaterial({color: 0xFF6536});
var hullMaterial = new THREE.MeshBasicMaterial({color: 0x333333});

// Planet Object3D
var mercuryPivot = new THREE.Object3D();
var venusPivot = new THREE.Object3D();
var earthPivot = new THREE.Object3D();
var moonPivot = new THREE.Object3D();
var marsPivot = new THREE.Object3D();
var jupiterPivot = new THREE.Object3D();
var saturnPivot = new THREE.Object3D();
var uranusPivot = new THREE.Object3D();
var neptunePivot = new THREE.Object3D();

// Arbitrary starting points

mercuryPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.1);
venusPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.3);
earthPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.5);
marsPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.7);
jupiterPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.9);
saturnPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 1.1);
uranusPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 1.3);
neptunePivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 1.5);

scene.add(mercuryPivot);
scene.add(venusPivot);
scene.add(earthPivot);
scene.add(moonPivot);
scene.add(marsPivot);
scene.add(jupiterPivot);
scene.add(saturnPivot);
scene.add(uranusPivot);
scene.add(neptunePivot);

// Matricies
var mercury = new THREE.Object3D();
var venus = new THREE.Object3D();
var earth = new THREE.Object3D();
var moon = new THREE.Object3D();
var mars = new THREE.Object3D();
var jupiter = new THREE.Object3D();
var saturn = new THREE.Object3D();
var uranus = new THREE.Object3D();
var neptune = new THREE.Object3D();

mercury.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 7,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
venus.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 9,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
earth.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 12,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
moon.position = earth.position;
moon.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 1,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
mars.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 15,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
jupiter.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 19,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
saturn.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 24,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
uranus.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 29,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
neptune.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 34,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));

mercuryPivot.add(mercury);
venusPivot.add(venus);
earthPivot.add(earth);
moonPivot.add(moon);
earth.add(moonPivot);
marsPivot.add(mars);
jupiterPivot.add(jupiter);
saturnPivot.add(saturn);
uranusPivot.add(uranus);
neptunePivot.add(neptune);


// Geometry
var mercuryGeometry = new THREE.SphereGeometry( 0.25, 32, 32);
var venusGeometry = new THREE.SphereGeometry( 0.5, 32, 32 );
var earthGeometry = new THREE.SphereGeometry( 0.6, 32, 32 );
var moonGeometry = new THREE.SphereGeometry( 0.2, 32, 32 );
var moonOrbitGeometry = new THREE.CircleGeometry(radius, segments);
moonOrbitGeometry.rotateX(1.5708).scale(1, 1, 1);
moonOrbitGeometry.vertices.shift();
var marsGeometry = new THREE.SphereGeometry( 0.4, 32, 32 );
var jupiterGeometry = new THREE.SphereGeometry( 1.25, 32, 32 );
var saturnGeometry = new THREE.SphereGeometry( 1, 32, 32 );
var saturnRingGeometry = new THREE.RingGeometry( 1.5, 2, 32 );
saturnRingGeometry.rotateX(1.5708);
var uranusGeometry = new THREE.SphereGeometry( 0.7, 32, 32 );
var uranusRingGeometry = new THREE.RingGeometry( 1, 1.1, 32 );
var neptuneGeometry = new THREE.SphereGeometry( 0.7, 32, 32 );

generateVertexColors( mercuryGeometry );
generateVertexColors( venusGeometry );
generateVertexColors( earthGeometry );
generateVertexColors( moonGeometry );
generateVertexColors( marsGeometry );
generateVertexColors( jupiterGeometry );
generateVertexColors( saturnGeometry );
generateVertexColors( uranusGeometry );
generateVertexColors( neptuneGeometry );

// Planet Meshes
var mercuryMesh = new THREE.Mesh( mercuryGeometry, greyMaterial );
mercury.add(mercuryMesh);
var venusMesh = new THREE.Mesh( venusGeometry, lightBrownMaterial );
venus.add(venusMesh);
var moonMesh = new THREE.Mesh( moonGeometry, greyMaterial );
moon.add(moonMesh);
var moonOrbit = new THREE.Line(moonOrbitGeometry, orbitMaterial);
earth.add( moonOrbit );
var earthMesh = new THREE.Mesh( earthGeometry, blueMaterial );
earth.add(earthMesh);
var marsMesh = new THREE.Mesh( marsGeometry, redMaterial );
mars.add(marsMesh);
var jupiterMesh = new THREE.Mesh( jupiterGeometry, lightBrownMaterial );
jupiter.add(jupiterMesh);
var saturnMesh = new THREE.Mesh( saturnGeometry, lightBrownMaterial );
saturn.add(saturnMesh);
var saturnRingMesh = new THREE.Mesh( saturnRingGeometry, lightBrownMaterial );
saturn.add(saturnRingMesh);
var uranusMesh = new THREE.Mesh( uranusGeometry, blueMaterial );
uranus.add(uranusMesh);
var uranusRingMesh = new THREE.Mesh( uranusRingGeometry, blueMaterial );
uranus.add(uranusRingMesh);
var neptuneMesh = new THREE.Mesh( neptuneGeometry, blueMaterial );
neptune.add(neptuneMesh);


// Ring Geometry besides Moon
var mercuryOrbitGeometry = new THREE.CircleGeometry(radius, segments);
mercuryOrbitGeometry.rotateX(1.5708).scale(7, 7, 7);
mercuryOrbitGeometry.vertices.shift();
var mercuryOrbit = new THREE.Line(mercuryOrbitGeometry, orbitMaterial);
scene.add( mercuryOrbit );

var venusOrbitGeometry = new THREE.CircleGeometry(radius, segments);
venusOrbitGeometry.rotateX(1.5708).scale(9, 9, 9);
venusOrbitGeometry.vertices.shift();
var venusOrbit = new THREE.Line(venusOrbitGeometry, orbitMaterial);
scene.add( venusOrbit );

var earthOrbitGeometry = new THREE.CircleGeometry(radius, segments);
earthOrbitGeometry.rotateX(1.5708).scale(12, 12, 12);
earthOrbitGeometry.vertices.shift();
var earthOrbit = new THREE.Line(earthOrbitGeometry, orbitMaterial);
scene.add( earthOrbit );

var marsOrbitGeometry = new THREE.CircleGeometry(radius, segments);
marsOrbitGeometry.rotateX(1.5708).scale(15, 15, 15);
marsOrbitGeometry.vertices.shift();
var marsOrbit = new THREE.Line(marsOrbitGeometry, orbitMaterial);
scene.add( marsOrbit );

var jupiterOrbitGeometry = new THREE.CircleGeometry(radius, segments);
jupiterOrbitGeometry.rotateX(1.5708).scale(19, 19, 19);
jupiterOrbitGeometry.vertices.shift();
var jupiterOrbit = new THREE.Line(jupiterOrbitGeometry, orbitMaterial);
scene.add( jupiterOrbit );

var saturnOrbitGeometry = new THREE.CircleGeometry(radius, segments);
saturnOrbitGeometry.rotateX(1.5708).scale(24, 24, 24);
saturnOrbitGeometry.vertices.shift();
var saturnOrbit = new THREE.Line(saturnOrbitGeometry, orbitMaterial);
scene.add( saturnOrbit );

var uranusOrbitGeometry = new THREE.CircleGeometry(radius, segments);
uranusOrbitGeometry.rotateX(1.5708).scale(29, 29, 29);
uranusOrbitGeometry.vertices.shift();
var uranusOrbit = new THREE.Line(uranusOrbitGeometry, orbitMaterial);
scene.add( uranusOrbit );

var neptuneOrbitGeometry = new THREE.CircleGeometry(radius, segments);
neptuneOrbitGeometry.rotateX(1.5708).scale(34, 34, 34);
neptuneOrbitGeometry.vertices.shift();
var neptuneOrbit = new THREE.Line(neptuneOrbitGeometry, orbitMaterial);
scene.add( neptuneOrbit );


// Spaceships
var mainShip = new THREE.Object3D();
var body = new THREE.Object3D();
var cockpitGeometry = new THREE.BoxGeometry(2, 1, 0.5);
var bridgeGeometry = new THREE.BoxGeometry(3, 0.5, 1.25);
var middriftGeometry = new THREE.BoxGeometry(8, 0.5, 2);
var hullGeometry = new THREE.BoxGeometry(7, 0.5, 1.5);
var engineGeometry = new THREE.CylinderGeometry( 0.25, 0.25, 1, 32 );

var cockpit = new THREE.Mesh(cockpitGeometry, greyMaterial);
var bridge = new THREE.Mesh(bridgeGeometry, hullMaterial);
var middrift = new THREE.Mesh(middriftGeometry, greyMaterial);
var hull = new THREE.Mesh(hullGeometry, hullMaterial);
var engine = new THREE.Mesh(engineGeometry, blueMaterial);

cockpit.applyMatrix(new THREE.Matrix4().set(1, 0, 0, -1,  0, 1, 0, 0.75,  0, 0, 1, 0,  0, 0, 0, 1));
bridge.applyMatrix(new THREE.Matrix4().set(1, 0, 0, -1.75,  0, 1, 0, 0.25,  0, 0, 1, 0,  0, 0, 0, 1));
hull.applyMatrix(new THREE.Matrix4().set(1, 0, 0, -0.75,  0, 1, 0, -0.25,  0, 0, 1, 0,  0, 0, 0, 1));
engine.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
engine.applyMatrix(new THREE.Matrix4().set(1, 0, 0, -4,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1));
body.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI/2));

var engine2 = engine.clone();
engine2.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0.6,  0, 0, 0, 1));
var engine3 = engine.clone();
engine3.applyMatrix(new THREE.Matrix4().set(1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, -0.6,  0, 0, 0, 1));

camera_MotherShip.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI));
camera_MotherShip.position.setZ(1);

camera_ScoutShip.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI));
camera_ScoutShip.position.setZ(1);

body.add(cockpit);
body.add(bridge);
body.add(middrift);
body.add(hull);
body.add(engine);
body.add(engine2);
body.add(engine3);
mainShip.add(body);
scene.add(mainShip);

var scoutShip = mainShip.clone();
scoutShip.scale.set(0.5, 0.5, 0.5);
scene.add(scoutShip);

mainShip.add(camera_MotherShip);
scoutShip.add(camera_ScoutShip);

function resetPositions() {
  setParent(mainShip, scene);
  mainShip.position.set(40, -5, 40);
  mainShip.up.set(0, 1, 0);
  mainShip.lookAt(scene.position);

  setParent(scoutShip, scene);
  scoutShip.position.set(60, 5, 60);
  scoutShip.up.set(0, 1, 0);
  scoutShip.lookAt(scene.position);
}

resetPositions();


//Note: Use of parent attribute IS allowed.
//Hint: Keep hierarchies in mind!

var freeze = false;
var clock = new THREE.Clock(true);
function updateSystem()
{
	// ANIMATE YOUR SOLAR SYSTEM HERE.
    if (!update) {
        return;
    }
    var time = clock.getElapsedTime();

    if(!freeze) {
        mercuryPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.03);
        venusPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.02);
        earthPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
        moonPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.05);
        marsPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.008);
        jupiterPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.006);
        saturnPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.004);
        uranusPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.003);
        neptunePivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.001);

        mercury.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.02);
        venus.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
        earth.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
        mars.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
        jupiter.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005);
        saturn.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005);
        uranus.rotateOnAxis(new THREE.Vector3(0, 0, 1), 0.005);
        neptune.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005);
    }
}

// AbsoluteMode represents the absolute control method.
function AbsoluteMode() {
  this.lookAt = new THREE.Vector3();
  this.stepSize = 1;
}
AbsoluteMode.prototype.updateShip = function() {
  shipParent(scene);
  controlledShip.lookAt(this.lookAt);
};
AbsoluteMode.prototype.onKeyDown = function(event) {
  if (keyboard.eventMatches(event, "shift+x")) {
    controlledShip.position.x -= this.stepSize;
  } else if (keyboard.eventMatches(event, "x")) { // Ship position
    controlledShip.position.x += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+y")) {
    controlledShip.position.y -= this.stepSize;
  } else if (keyboard.eventMatches(event, "y")) {
    controlledShip.position.y += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+z")) {
    controlledShip.position.z -= this.stepSize;
  } else if (keyboard.eventMatches(event, "z")) {
    controlledShip.position.z += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+a")) { // LookAt
    this.lookAt.x -= this.stepSize;
  } else if (keyboard.eventMatches(event, "a")) {
    this.lookAt.x += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+b")) {
    this.lookAt.y -= this.stepSize;
  } else if (keyboard.eventMatches(event, "b")) {
    this.lookAt.y += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+c")) {
    this.lookAt.z -= this.stepSize;
  } else if (keyboard.eventMatches(event, "c")) {
    this.lookAt.z += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+d")) { // UP vector
    controlledShip.up.x -= this.stepSize;
  } else if (keyboard.eventMatches(event, "d")) {
    controlledShip.up.x += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+e")) {
    controlledShip.up.y -= this.stepSize;
  } else if (keyboard.eventMatches(event, "e")) {
    controlledShip.up.y += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+f")) {
    controlledShip.up.z -= this.stepSize;
  } else if (keyboard.eventMatches(event, "f")) {
    controlledShip.up.z += this.stepSize;
  } else if (keyboard.eventMatches(event, "shift+k")) { // change step size
    this.stepSize -= 0.1;
  } else if (keyboard.eventMatches(event, "k")) {
    this.stepSize += 0.1;
  }
  this.updateShip();
};

function RelativeMode() {
  this.stepSize = 1;
  this.tDown = false;
}
RelativeMode.prototype.updateShip = function() {
  shipParent(scene);
};
RelativeMode.prototype.onKeyDown = function(event) {
  if (keyboard.eventMatches(event, "shift+k")) { // change step size
    this.stepSize -= 0.1;
  } else if (keyboard.eventMatches(event, "k")) {
    this.stepSize += 0.1;
  } else if (keyboard.eventMatches(event, "shift+q")) { // yaw
    controlledShip.rotateY(-this.stepSize/10);
  } else if (keyboard.eventMatches(event, "q")) {
    controlledShip.rotateY(this.stepSize/10);
  } else if (keyboard.eventMatches(event, "shift+s")) { // pitch
    controlledShip.rotateX(-this.stepSize/10);
  } else if (keyboard.eventMatches(event, "s")) {
    controlledShip.rotateX(this.stepSize/10);
  } else if (keyboard.eventMatches(event, "shift+a")) { // roll
    controlledShip.rotateZ(-this.stepSize/10);
  } else if (keyboard.eventMatches(event, "a")) {
    controlledShip.rotateZ(this.stepSize/10);
  } else if (keyboard.eventMatches(event, "shift+w")) { // move forward
    controlledShip.translateZ(-this.stepSize/10);
  } else if (keyboard.eventMatches(event, "w")) {
    controlledShip.translateZ(this.stepSize/10);
  } else if (keyboard.eventMatches(event, "t")) {
    this.tDown = true;
  }
};
RelativeMode.prototype.onKeyUp = function(event) {
  if (keyboard.eventMatches(event, "t")) {
    this.tDown = false;
  }
};
RelativeMode.prototype.onMouseMove = function(dx, dy) {
  controlledShip.rotateY(-dx/100); // yaw
  if (this.tDown) {
    controlledShip.translateZ(-dy/10);
  } else {
    controlledShip.rotateX(dy/100); // pitch
  }
};

var planets = [
  mercury,
  venus,
  earth,
  mars,
  jupiter,
  saturn,
  uranus,
  neptune,
];

function GeoMode() {
  this.pi = 2;
  this.dist = 5;
  this.stepSize = 1;
}
GeoMode.prototype.updateShip = function() {
  var p = this.planet();
  shipParent(p);
  controlledShip.position.set(this.dist, this.dist, 0);
  controlledShip.lookAt(new THREE.Vector3());
};
GeoMode.prototype.planet = function() {
  return planets[this.pi];
}
GeoMode.prototype.onKeyDown = function(event) {
  // switch follow planet
  for (var i=0; i<8; i++) {
    if (keyboard.eventMatches(event, (i+1).toFixed(0))) {
      this.pi = i;
    }
  }
  if (keyboard.eventMatches(event, "shift+k")) { // change step size
    this.stepSize -= 0.1;
  } else if (keyboard.eventMatches(event, "k")) {
    this.stepSize += 0.1;
  } else if (keyboard.eventMatches(event, "shift+w")) { // change distance
    this.dist -= this.stepSize;
  } else if (keyboard.eventMatches(event, "w")) {
    this.dist += this.stepSize;
  }
  this.updateShip();
};
GeoMode.prototype.onMouseMove = function(dx, dy) {
  this.dist += dy/20;
  this.updateShip();
};

function shipParent(parent) {
  setParent(controlledShip, parent);
}
function setParent(ship, parent) {
  if (ship.parent !== parent) {
    ship.parent.remove(ship);
    parent.add(ship);
  }
}

// LISTEN TO KEYBOARD
// Hint: Pay careful attention to how the keys already specified work!
var keyboard = new THREEx.KeyboardState();
var grid_state = false;

var controlledShip = mainShip;
var shipMode = {};
function mode() {
  var m = shipMode[controlledShip.uuid];
  if (!m) {
    m = AbsoluteMode;
    shipMode[controlledShip.uuid] = m;
  }
  return m
}
var modes = {};

function currentMode() {
  var ms = modes[controlledShip.uuid];
  if (!ms) {
    ms = {};
    modes[controlledShip.uuid] = ms;
  }
  var m = ms[mode().name];
  if (!m) {
    m = new (mode())();
    ms[mode().name] = m;
  }
  return m;
}

function setMode(m) {
  shipMode[controlledShip.uuid] = m;
  return currentMode().updateShip();
}

function controlShip(ship) {
    controlledShip = ship;
    currentMode().updateShip();
}

function onKeyDown(event)
{
	// TO-DO: BIND KEYS TO YOUR CONTROLS
  if (keyboard.eventMatches(event,"shift+g"))  {  // Reveal/Hide helper grid
    grid_state = !grid_state;
    grid_state? scene.add(grid) : scene.remove(grid);
  } else if (keyboard.eventMatches(event, "space")) {
    freeze = !freeze;
  } else if (keyboard.eventMatches(event, "m")) {
    resetPositions();
  } else if (keyboard.eventMatches(event, "o")) {
    controlShip(mainShip);
  } else if (keyboard.eventMatches(event, "p")) {
    controlShip(scoutShip);
  } else if (keyboard.eventMatches(event, "l")) {
    setMode(AbsoluteMode);
  } else if (keyboard.eventMatches(event, "r")) {
    setMode(RelativeMode);
  } else if (keyboard.eventMatches(event, "g")) {
    setMode(GeoMode);
  } else {
    var mode = currentMode();
    if (mode.onKeyDown) {
      mode.onKeyDown(event);
    }
  }
}
keyboard.domElement.addEventListener('keydown', onKeyDown );
keyboard.domElement.addEventListener('keyup', function(event) {
  var mode = currentMode();
  if (mode.onKeyUp) {
    mode.onKeyUp(event);
  }
});
var down = false;
document.body.addEventListener('mousedown', function(e) {
  down = true;
  mouseX = e.pageX;
  mouseY = e.pageY;
});
document.body.addEventListener('mousemove', function(e) {
  if (down) {
    var mode = currentMode()
    if (mode.onMouseMove) {
      mode.onMouseMove(e.pageX-mouseX, e.pageY-mouseY);
    }
    mouseX = e.pageX;
    mouseY = e.pageY;
  }
});
document.body.addEventListener('mouseup', function(e) {
  down = false;
});
document.body.addEventListener('mouseout', function(e) {
  down = false;
});


// SETUP UPDATE CALL-BACK
// Hint: It is useful to understand what is being updated here, the effect, and why.
// DON'T TOUCH THIS
function update() {
  updateSystem();

  requestAnimationFrame(update);

  // UPDATES THE MULTIPLE CAMERAS IN THE SIMULATION
  for ( var ii = 0; ii < views.length; ++ii )
  {

		view = views[ii];
		camera_ = view.camera;

		view.updateCamera( camera_, scene, mouseX, mouseY );

		var left   = Math.floor( windowWidth  * view.left );
		var bottom = Math.floor( windowHeight * view.bottom );
		var width  = Math.floor( windowWidth  * view.width );
		var height = Math.floor( windowHeight * view.height );
		renderer.setViewport( left, bottom, width, height );
		renderer.setScissor( left, bottom, width, height );
		renderer.enableScissorTest ( true );
		renderer.setClearColor( view.background );

		camera_.aspect = width / height;
		camera_.updateProjectionMatrix();

		renderer.render( scene, camera_ );
	}
}

update();