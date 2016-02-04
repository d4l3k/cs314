// UBC CPSC 314 (2015W2) -- P1
// HAVE FUN!!! :)

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix=a;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}

// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30,1,0.1,1000); // view angle, aspect ratio, near, far
camera.position.set(45,20,40);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROLS OF THE CAMERA
var controls = new THREE.OrbitControls(camera);

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

// EVENT LISTENER RESIZE
window.addEventListener('resize',resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function () {
     window.scrollTo(0,0);
   }

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

// MATERIALS
// Note: Feel free to be creative with this!
var normalMaterial = new THREE.MeshNormalMaterial();

// function drawCube()
// Draws a unit cube centered about the origin.
// Note: You will be using this for all of your geometry
function makeCube() {
  var unitCube = new THREE.BoxGeometry(1,1,1);
  return unitCube;
}

// GEOMETRY
var non_uniform_scale = new THREE.Matrix4().set(5,0,0,0, 0,5,0,0, 0,0,5,0, 0,0,0,1);

var torsoGeometry = makeCube();
torsoGeometry.applyMatrix(non_uniform_scale);

var headGeometry = makeCube();
var headGeometry2 = makeCube();
var neckGeometry = makeCube();
var neckGeometry2 = makeCube();
var behindGeometry = makeCube();
behindGeometry.applyMatrix(scale(identity(), 3,3,2));
var behindGeometry2 = makeCube();
var behindGeometry3 = makeCube();
var behindGeometry4 = makeCube();
var tailGeometry = makeCube();
var tailGeometry2 = makeCube();
var noseGeometry = makeCube();
var nostrilGeometry = makeCube();
var nostrilGeometry2 = makeCube();
var nostrilGeometry3 = makeCube();
var nostrilGeometry4 = makeCube();
var nostrilGeometry5 = makeCube();
var nostrilGeometry6 = makeCube();
var rArmGeometry = makeCube();
torsoGeometry.applyMatrix(scale(identity(), 1,1,2));
var rArmGeometry2 = makeCube();
var rArmGeometry3 = makeCube();
var rFingerGeometry = makeCube();
rFingerGeometry.applyMatrix(scale(identity(), 0.125,0.125,0.75));
var rLegGeometry = makeCube();
var rLegGeometry2 = makeCube();
var rToeGeometry = makeCube();
var rToeGeometry2 = makeCube();
var rToeGeometry3 = makeCube();
var rToeGeometry4 = makeCube();
var rToeGeometry5 = makeCube();

// TO-DO: SPECIFY THE REST OF YOUR STAR-NOSE MOLE'S GEOMETRY.
// Note: You will be using transformation matrices to set the shape.
// Note: You are not allowed to use the tools Three.js provides for
//       rotation, translation and scaling.
// Note: The torso has been done for you (but feel free to modify it!)
// Hint: Explicity declare new matrices using Matrix4().set

function identity() {
  return new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
}
function scale(m, x, y, z) {
  var scaleMatrix = new THREE.Matrix4().set(x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1);
  return m.clone().multiply(scaleMatrix);
}

function rotateAngle(m, a) {
  // var scaleMatrix = new THREE.Matrix4().set(1,0,0,0, 0,Math.cos(a),-Math.sin(a),0, 0,Math.sin(a),Math.cos(a),0, 0,0,0,1);
  var scaleMatrix = new THREE.Matrix4().set(Math.cos(-a),0,Math.sin(-a),0, 0,1,0,0, -Math.sin(-a),0,Math.cos(-a),0, 0,0,0,1);
  return m.clone().multiply(scaleMatrix);
}

function translate(m, x, y, z) {
  var translateMatrix = new THREE.Matrix4().set(1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1);
  return m.clone().multiply(translateMatrix);
}


// MATRICES
var torsoMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,2.5, 0,0,1,0, 0,0,0,1);

// TO-DO: INITIALIZE THE REST OF YOUR MATRICES
// Note: Use of parent attribute is not allowed.
// Hint: Keep hierarchies in mind!
// Hint: Play around with the headTorsoMatrix values, what changes in the render? Why?

var headMatrix = scale(translate(identity(), 0,-0.125,0.375), 0.75,0.75,0.75);
var headMatrix2 = scale(translate(identity(), 0,-0.125,0.325), 0.75,0.75,0.75);
var neckMatrix = scale(translate(identity(), 0,-0.5,3.25), 3.5,3.5,4);
var neckMatrix2 = scale(translate(identity(), 0,0.125,-0.25), 1.25,1.25,1);
var behindMatrix = translate(identity(), 0,-0.375,-5);
var behindMatrix2 = scale(translate(identity(), 0,-0.125,-1), 0.75,0.75,1);
var behindMatrix3 = scale(translate(identity(), 0,-0.25,-1.5), 0.5,0.5,1);
var behindMatrix4 = scale(translate(identity(), 0,-0.375,-2), 0.25,0.25,1);
var tailMatrix = scale(translate(identity(), 0,-0.4,-2.75), 0.125,0.125,1);
var tailMatrix2 = scale(translate(identity(), 0,0,-0.75), 0.75,0.75,1);
var noseMatrix = scale(translate(identity(), 0,0,0.75), 0.25,0.25,0.25);
var nostrilMatrix = scale(translate(identity(), 0.25,0.375,0.75), 0.125,0.125,0.75);
var nostrilMatrix2 = scale(translate(identity(), 0.375,0.25,0.75), 0.125,0.125,0.75);
var nostrilMatrix3 = scale(translate(identity(), 0.375,0.1,0.75), 0.125,0.125,0.75);
var nostrilMatrix4 = scale(translate(identity(), 0.375,-0.1,0.75), 0.125,0.125,0.75);
var nostrilMatrix5 = scale(translate(identity(), 0.375,-0.25,0.75), 0.125,0.125,0.75);
var nostrilMatrix6 = scale(translate(identity(), 0.25,-0.375,0.75), 0.125,0.125,0.75);
var rArmMatrix = translate(identity(), 3,-2,2.5);
var rArmMatrix2 = scale(translate(identity(), 0.5,0,0.75), 1.5,1.25,1.5);
var rArmMatrix3 = scale(translate(identity(), 0.5,-0.5,1.5), 1,1,1);
var rFingerMatrix = translate(identity(), -0.5,-0.375,0.75);
var rFingerMatrix2 = translate(identity(), -0.25,-0.375,0.75);
var rFingerMatrix3 = translate(identity(), 0,-0.375,0.75);
var rFingerMatrix4 = translate(identity(), 0.25,-0.375,0.75);
var rFingerMatrix5 = translate(identity(), 0.5,-0.375,0.75);
var rLegMatrix = scale(translate(identity(), 2.75,-2.25,-1.75), 0.75,0.75,1.5);
var rLegMatrix2 = scale(translate(identity(), 0.75,-0.5,0.375), 0.75,0.75,1);
var rToeMatrix = scale(translate(identity(), -0.5,-0.375,0.75), 0.125,0.125,0.5);
var rToeMatrix2 = scale(translate(identity(), -0.25,-0.375,0.75), 0.125,0.125,0.5);
var rToeMatrix3 = scale(translate(identity(), 0,-0.375,0.75), 0.125,0.125,0.5);
var rToeMatrix4 = scale(translate(identity(), 0.25,-0.375,0.75), 0.125,0.125,0.5);
var rToeMatrix5 = scale(translate(identity(), 0.5,-0.375,0.75), 0.125,0.125,0.5);

// CREATE BODY
var torso = new THREE.Mesh(torsoGeometry,normalMaterial);
torso.setMatrix(torsoMatrix)
scene.add(torso);

var neck = new THREE.Mesh(neckGeometry,normalMaterial);
neck.setMatrix(neckMatrix)
torso.add(neck);

var neck2 = new THREE.Mesh(neckGeometry2,normalMaterial);
neck2.setMatrix(neckMatrix2)
neck.add(neck2);

var behind = new THREE.Mesh(behindGeometry,normalMaterial);
behind.setMatrix(behindMatrix)
torso.add(behind);

var behind2 = new THREE.Mesh(behindGeometry2,normalMaterial);
behind2.setMatrix(behindMatrix2)
behind.add(behind2);

var behind3 = new THREE.Mesh(behindGeometry3,normalMaterial);
behind3.setMatrix(behindMatrix3)
behind.add(behind3);

var behind4 = new THREE.Mesh(behindGeometry4,normalMaterial);
behind4.setMatrix(behindMatrix4)
behind.add(behind4);

var tail = new THREE.Mesh(tailGeometry,normalMaterial);
tail.setMatrix(tailMatrix)
behind.add(tail);

var tail2 = new THREE.Mesh(tailGeometry2,normalMaterial);
tail2.setMatrix(tailMatrix2)
tail.add(tail2);

var head = new THREE.Mesh(headGeometry,normalMaterial);
head.setMatrix(headMatrix)
neck.add(head);

var head2 = new THREE.Mesh(headGeometry2,normalMaterial);
head2.setMatrix(headMatrix2)
head.add(head2);

var nose = new THREE.Mesh(noseGeometry,normalMaterial);
nose.setMatrix(noseMatrix)
head.add(nose);

var nostril = new THREE.Mesh(nostrilGeometry,normalMaterial);
nostril.setMatrix(nostrilMatrix)
nose.add(nostril);

var nostril2 = new THREE.Mesh(nostrilGeometry2,normalMaterial);
nostril2.setMatrix(nostrilMatrix2)
nose.add(nostril2);

var nostril3 = new THREE.Mesh(nostrilGeometry3,normalMaterial);
nostril3.setMatrix(nostrilMatrix3)
nose.add(nostril3);

var nostril4 = new THREE.Mesh(nostrilGeometry4,normalMaterial);
nostril4.setMatrix(nostrilMatrix4)
nose.add(nostril4);

var nostril5 = new THREE.Mesh(nostrilGeometry5,normalMaterial);
nostril5.setMatrix(nostrilMatrix5)
nose.add(nostril5);

var nostril6 = new THREE.Mesh(nostrilGeometry6,normalMaterial);
nostril6.setMatrix(nostrilMatrix6)
nose.add(nostril6);

var rArm = new THREE.Mesh(rArmGeometry,normalMaterial);
rArm.setMatrix(rArmMatrix)
torso.add(rArm);

var rArm2 = new THREE.Mesh(rArmGeometry2,normalMaterial);
rArm2.setMatrix(rArmMatrix2)
rArm.add(rArm2);

var rArm3 = new THREE.Mesh(rArmGeometry3,normalMaterial);
rArm3.setMatrix(rArmMatrix3)
rArm.add(rArm3);

var rFinger = new THREE.Mesh(rFingerGeometry,normalMaterial);
rFinger.setMatrix(rFingerMatrix)
rArm3.add(rFinger);

var rFinger2 = new THREE.Mesh(rFingerGeometry,normalMaterial);
rFinger2.setMatrix(rFingerMatrix2)
rArm3.add(rFinger2);

var rFinger3 = new THREE.Mesh(rFingerGeometry,normalMaterial);
rFinger3.setMatrix(rFingerMatrix3)
rArm3.add(rFinger3);

var rFinger4 = new THREE.Mesh(rFingerGeometry,normalMaterial);
rFinger4.setMatrix(rFingerMatrix4)
rArm3.add(rFinger4);

var rFinger5 = new THREE.Mesh(rFingerGeometry,normalMaterial);
rFinger5.setMatrix(rFingerMatrix5)
rArm3.add(rFinger5);

var rLeg = new THREE.Mesh(rLegGeometry,normalMaterial);
rLeg.setMatrix(rLegMatrix)
torso.add(rLeg);

var rLeg2 = new THREE.Mesh(rLegGeometry2,normalMaterial);
rLeg2.setMatrix(rLegMatrix2)
rLeg.add(rLeg2);

var rToe = new THREE.Mesh(rToeGeometry,normalMaterial);
rToe.setMatrix(rToeMatrix)
rLeg2.add(rToe);

var rToe2 = new THREE.Mesh(rToeGeometry2,normalMaterial);
rToe2.setMatrix(rToeMatrix2)
rLeg2.add(rToe2);

var rToe3 = new THREE.Mesh(rToeGeometry3,normalMaterial);
rToe3.setMatrix(rToeMatrix3)
rLeg2.add(rToe3);

var rToe4 = new THREE.Mesh(rToeGeometry4,normalMaterial);
rToe4.setMatrix(rToeMatrix4)
rLeg2.add(rToe4);

var rToe5 = new THREE.Mesh(rToeGeometry5,normalMaterial);
rToe5.setMatrix(rToeMatrix5)
rLeg2.add(rToe5);

// TO-DO: PUT TOGETHER THE REST OF YOUR STAR-NOSED MOLE AND ADD TO THE SCENE!
// Hint: Hint: Add one piece of geometry at a time, then implement the motion for that part.
//             Then you can make sure your hierarchy still works properly after each step.



// APPLY DIFFERENT JUMP CUTS/ANIMATIONS TO DIFFERNET KEYS
// Note: The start of "U" animation has been done for you, you must implement the hiearchy and jumpcut.
// Hint: There are other ways to manipulate and grab clock values!!
// Hint: Check THREE.js clock documenation for ideas.
// Hint: It may help to start with a jumpcut and implement the animation after.
// Hint: Where is updateBody() called?
var clock = new THREE.Clock(true);

var p0; // start position or angle
var p1; // end position or angle
var time_length; // total time of animation
var time_start; // start time of animation
var time_end; // end time of animation
var p; // current frame
var animate = false; // animate?

// function init_animation()
// Initializes parameters and sets animate flag to true.
// Input: start position or angle, end position or angle, and total time of animation.
function init_animation(p_start,p_end,t_length){
  p0 = p_start;
  p1 = p_end;
  time_length = t_length;
  time_start = clock.getElapsedTime();
  time_end = time_start + time_length;
  animate = true; // flag for animation
  return;
}

function mul(a, b) {
  return new THREE.Matrix4().multiplyMatrices(a, b);
}

var headOriginMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0.5, 0,0,0,1);
var headOriginInvMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,-0.5, 0,0,0,1);

var neckOriginMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,1.125, 0,0,0,1);
var neckOriginInvMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,-1.125, 0,0,0,1);

var tailOriginMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
var tailOriginInvMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);

var behindOriginMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
var behindOriginInvMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);

function rotateX(p) {
  return new THREE.Matrix4().set(
      1,        0,         0,        0,
      0, Math.cos(-p),-Math.sin(-p), 0,
      0, Math.sin(-p), Math.cos(-p), 0,
      0,        0,         0,        1);
}

function rotateY(p) {
  return new THREE.Matrix4().set(
      Math.cos(-p), 0, -Math.sin(-p), 0,
      0,            1,             0, 0,
      Math.sin(-p), 0,  Math.cos(-p), 0,
      0,            0,             0, 1);
}

function updateBody() {
  if (!animate) {
    return;
  }
  var time = clock.getElapsedTime(); // t seconds passed since the clock started.
  switch(true) {
    case(key == "U" || key == "E"):
      if (time > time_end || jumpcut){
        p = p1;
        animate = false;
      } else {
        p = (p1 - p0)*((time-time_start)/time_length) + p0; // current frame
      }

      var rotate = rotateX(p);
      var torsoRotMatrix = mul(torsoMatrix,rotate);
      torso.setMatrix(torsoRotMatrix);
      break

    case(key == "H" || key == "G"):
      if (time > time_end || jumpcut){
        p = p1;
        animate = false;
      } else {
        p = (p1 - p0)*((time-time_start)/time_length) + p0; // current frame
      }

      var rotate = rotateY(p);

      var headRotMatrix = mul(headMatrix,mul(headOriginInvMatrix, mul(rotate, headOriginMatrix)));
      var neckRotMatrix = mul(neckMatrix,mul(neckOriginInvMatrix, mul(rotate, neckOriginMatrix)));
      head.setMatrix(headRotMatrix);
      neck.setMatrix(neckRotMatrix);
      break

    case(key == "T" || key == "V"):
      if (time > time_end || jumpcut){
        p = p1;
        animate = false;
      } else {
        p = (p1 - p0)*((time-time_start)/time_length) + p0; // current frame
      }

      var rotate = rotateY(p);

      //var tailRotMatrix = mul(tailMatrix,mul(tailOriginInvMatrix, mul(rotate, tailOriginMatrix)));
      var behindRotMatrix = mul(behindMatrix,mul(behindOriginInvMatrix, mul(rotate, behindOriginMatrix)));
      //tail.setMatrix(tailRotMatrix);
      behind.setMatrix(behindRotMatrix);
      break

    case(key == "D"):
      if (time > time_end || jumpcut){
        p = p1;
        animate = false;
      } else {
        p = (p1 - p0)*((time-time_start)/time_length) + p0; // current frame
      }

      var rotate = rotateX(p);

      rArm.setMatrix(mul(rArmMatrix, rotate));
      rFinger.setMatrix(translate(mul(translate(rFingerMatrix, 0, 0, -0.5), rotate), 0, 0, 0.5));
      rFinger2.setMatrix(translate(mul(translate(rFingerMatrix2, 0, 0, -0.5), rotate), 0, 0, 0.5));
      rFinger3.setMatrix(translate(mul(translate(rFingerMatrix3, 0, 0, -0.5), rotate), 0, 0, 0.5));
      rFinger4.setMatrix(translate(mul(translate(rFingerMatrix4, 0, 0, -0.5), rotate), 0, 0, 0.5));
      rFinger5.setMatrix(translate(mul(translate(rFingerMatrix5, 0, 0, -0.5), rotate), 0, 0, 0.5));
      break

    default:
      break;
  }
}

// LISTEN TO KEYBOARD
// Hint: Pay careful attention to how the keys already specified work!
var keyboard = new THREEx.KeyboardState();
var grid_state = false;
var key;
var jumpcut = false;
keyboard.domElement.addEventListener('keydown',function(event){
  if (event.repeat)
    return;
  if(keyboard.eventMatches(event,"Z")) {  // Z: Reveal/Hide helper grid
    grid_state = !grid_state;
    grid_state? scene.add(grid) : scene.remove(grid);}
  else if(keyboard.eventMatches(event,"0")) {    // 0: Set camera to neutral position, view reset
    camera.position.set(45,0,0);
    camera.lookAt(scene.position);}
  else if(keyboard.eventMatches(event,"U")) { // Body up
    (key == "U")? init_animation(p1,p0,time_length) : (init_animation(0,Math.PI/4,1), key = "U")
  } else if(keyboard.eventMatches(event,"E")) { // Body down
    (key == "E")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/4,1), key = "E")
  } else if(keyboard.eventMatches(event,"H")) { // Head right
    (key == "H")? init_animation(p1,p0,time_length) : (init_animation(0,Math.PI/16,1), key = "H")
  } else if(keyboard.eventMatches(event,"G")) { // Head left
    (key == "G")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/16,1), key = "G")
  } else if(keyboard.eventMatches(event,"T")) { // Tail right
    (key == "T")? init_animation(p1,p0,time_length) : (init_animation(0,Math.PI/4,1), key = "T")
  } else if(keyboard.eventMatches(event,"V")) { // Tail left
    (key == "V")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/4,1), key = "V")
  } else if(keyboard.eventMatches(event,"D")) { // Tail left
    (key == "D")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/4,1), key = "D")
  } else if(keyboard.eventMatches(event,"space")) { // Jumpcut
    jumpcut = !jumpcut;
  }


  // TO-DO: BIND KEYS TO YOUR JUMP CUTS AND ANIMATIONS
  // Note: Remember spacebar sets jumpcut/animate!
  // Hint: Look up "threex.keyboardstate by Jerome Tienne" for more info.



    });

// SETUP UPDATE CALL-BACK
// Hint: It is useful to understand what is being updated here, the effect, and why.
function update() {
  updateBody();

  requestAnimationFrame(update);
  renderer.render(scene,camera);
}

update();
