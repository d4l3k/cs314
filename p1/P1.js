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
var non_uniform_scale = new THREE.Matrix4().set(5,0,0,0, 0,5,0,0, 0,0,8,0, 0,0,0,1);

var torsoGeometry = makeCube();
torsoGeometry.applyMatrix(non_uniform_scale);

var headGeometry = makeCube();
var tailGeometry = makeCube();
var noseGeometry = makeCube();

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

var headMatrix = scale(translate(identity(), 0,0,6), 3,3,4);
var tailMatrix = scale(translate(identity(), 0,0,-6), 1,1,4);
var noseMatrix = scale(translate(identity(), 0,0,0.5), 0.4,0.4,0.3);



// CREATE BODY
var torso = new THREE.Mesh(torsoGeometry,normalMaterial);
torso.setMatrix(torsoMatrix)
scene.add(torso);

var head = new THREE.Mesh(headGeometry,normalMaterial);
head.setMatrix(headMatrix)
torso.add(head);

var tail = new THREE.Mesh(tailGeometry,normalMaterial);
tail.setMatrix(tailMatrix)
torso.add(tail);

var nose = new THREE.Mesh(noseGeometry,normalMaterial);
nose.setMatrix(noseMatrix)
head.add(nose);


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

var tailOriginMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,-0.5, 0,0,0,1);
var tailOriginInvMatrix = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,1,0.5, 0,0,0,1);

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

      var rotate = new THREE.Matrix4().set(1,        0,         0,        0,
                                            0, Math.cos(-p),-Math.sin(-p), 0,
                                            0, Math.sin(-p), Math.cos(-p), 0,
                                            0,        0,         0,        1);

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

      var rotate = new THREE.Matrix4().set(
          Math.cos(-p), 0, -Math.sin(-p), 0,
          0,            1,             0, 0, Math.sin(-p), 0,  Math.cos(-p), 0, 0,            0,             0, 1);

      var headRotMatrix = mul(headMatrix,mul(headOriginInvMatrix, mul(rotate, headOriginMatrix)));
      head.setMatrix(headRotMatrix);
      break

    case(key == "T" || key == "V"):
      if (time > time_end || jumpcut){
        p = p1;
        animate = false;
      } else {
        p = (p1 - p0)*((time-time_start)/time_length) + p0; // current frame
      }

      var rotate = new THREE.Matrix4().set(
          Math.cos(-p), 0, -Math.sin(-p), 0,
          0,            1,             0, 0,
          Math.sin(-p), 0,  Math.cos(-p), 0,
          0,            0,             0, 1);

      var tailRotMatrix = mul(tailMatrix,mul(tailOriginInvMatrix, mul(rotate, tailOriginMatrix)));
      tail.setMatrix(tailRotMatrix);
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
    (key == "H")? init_animation(p1,p0,time_length) : (init_animation(0,Math.PI/4,1), key = "H")
  } else if(keyboard.eventMatches(event,"G")) { // Head left
    (key == "G")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/4,1), key = "G")
  } else if(keyboard.eventMatches(event,"T")) { // Tail right
    (key == "T")? init_animation(p1,p0,time_length) : (init_animation(0,Math.PI/4,1), key = "T")
  } else if(keyboard.eventMatches(event,"V")) { // Tail left
    (key == "V")? init_animation(p1,p0,time_length) : (init_animation(0,-Math.PI/4,1), key = "V")
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
