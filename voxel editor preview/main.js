
// global values
var scene, camera, renderer, controls;
var canvasArea;

// canvas values
var CANVAS = new Object();
CANVAS.domElement = null;
CANVAS.width = 500;
CANVAS.height = 500;
CANVAS.x = 0;
CANVAS.y = 0;

// editor components
var COLOR_PICKER = new Object();
COLOR_PICKER.domElement = null;
COLOR_PICKER.selectedColor = 0xFFFFFF;

// cube values
var CUBE = new Object();
CUBE.size = 10;
CUBE.geometry = new THREE.BoxGeometry( CUBE.size, CUBE.size, CUBE.size );
CUBE.material = new THREE.MeshLambertMaterial( { color: 0x333333} );

// voxels + other objects on stage
var objects = [];

// mouse input vector
var relativePosition = new THREE.Vector3();
var raycaster = new THREE.Raycaster();

// visual effect
var rollOverCubeMesh;
var rollOverConstructMaterial = new THREE.MeshLambertMaterial( { color: 0x333333, transparent: true, opacity: 0.5 } );
var rollOverDestructMaterial = new THREE.MeshLambertMaterial( { color: 0xFF0000, transparent: true, opacity: 0.5 } );

// mode flags
var EDIT_MODE = { VIEW: 0, CONSTRUCT: 1, DESTRUCT: 2 };
var editMode = EDIT_MODE.VIEW;

initialize();
render();
animate();

/**
* initialize
* Init Voxel Editor
**/
function initialize() {

	// retrieve canvas
	CANVAS.domElement = document.getElementById( 'canvas-area' );
	CANVAS.width = CANVAS.domElement.offsetWidth;
	CANVAS.height = CANVAS.domElement.offsetHeight;

	var canvasPosition = getDomElementPosition( CANVAS.domElement );
	
	CANVAS.x = canvasPosition.x;
	CANVAS.y = canvasPosition.y;

	// color picker
	COLOR_PICKER.domElement = document.getElementById( 'color-picker' );
	console.log(COLOR_PICKER.domElement);
	// scene
	scene = new THREE.Scene();	

	// renderer
	renderer = new THREE.WebGLRenderer( { antialias:true } );
	renderer.setClearColor( 0xf0f0f0 );
	


	renderer.setSize( CANVAS.width, CANVAS.height );
	CANVAS.domElement.appendChild( renderer.domElement );

	// camera
	camera = new THREE.PerspectiveCamera( 40, CANVAS.width / CANVAS.height, 1, 20000 );
	camera.position.set( 100, 100, 100 );
	camera.lookAt( new THREE.Vector3() );
	scene.add( camera );


	// controller
	controls = new THREE.OrbitControls( camera, CANVAS.domElement );
	controls.addEventListener( 'change', render );

	// create stage
	createStage( 15, 15 );

	// event listeners
	window.addEventListener( 'resize', onWindowResize );

	CANVAS.domElement.addEventListener( 'mousemove', onCanvasMouseMove, false );
	CANVAS.domElement.addEventListener( 'mousedown', onCanvasMouseDown, false );

	document.addEventListener( 'keydown', onCanvasKeyDown, false );
	document.addEventListener( 'keyup', onCanvasKeyUp, false );
}

/**
* createStage
* create default stage
**/
function createStage( size ) {

	var grid = new THREE.GridHelper( size * CUBE.size, CUBE.size );	
	var axes = new THREE.AxisHelper( 50 );
	scene.add( grid );
	//scene.add( axes );

	// light
	var ambientLight = new THREE.AmbientLight( 0x404040 );
	scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 1, 0.75, 0.5 ).normalize();

	scene.add( directionalLight );

	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( -1, -0.75, -0.5 ).normalize();
	
	scene.add( directionalLight );

	// create virtual plane (default ground)
	var planeGeometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
	planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ));

	plane = new THREE.Mesh( planeGeometry );
	plane.visible = false;

	scene.add( plane );
	objects.push( plane );

	// roll-over cube
	rollOverCubeMesh = new THREE.Mesh( CUBE.geometry, CUBE.material );
	rollOverCubeMesh.visible = false;
	scene.add( rollOverCubeMesh );
}


function animate() {

  requestAnimationFrame( animate );
  controls.update();

}

function render() {

	renderer.render( scene, camera );
	
}

function getDomElementPosition( element ) {

    var xPosition = 0;
    var yPosition = 0;
  
    while( element ) {
        xPosition += ( element.offsetLeft - element.scrollLeft + element.clientLeft );
        yPosition += ( element.offsetTop - element.scrollTop + element.clientTop );
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}

function onColorChange ( event ) {
	
	COLOR_PICKER.selectedColor = parseInt(event.toHex(), 16);
	rollOverConstructMaterial.color = COLOR_PICKER.selectedColor;

	render();
}

/**
* When mouse moves
**/
function onCanvasMouseMove( event ) {

	event.preventDefault();
	
	relativePosition.set( ( ( event.clientX - CANVAS.x ) / CANVAS.width ) * 2 - 1, - ( ( event.clientY - CANVAS.y ) / CANVAS.height ) * 2 + 1, 0.5 );
	relativePosition.unproject( camera );

	raycaster.ray.set( camera.position, relativePosition.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {

		var intersect = intersects[ 0 ];

		switch( editMode ) {

			case EDIT_MODE.CONSTRUCT:

				 rollOverCubeMesh.position.copy( intersect.point ).add( intersect.face.normal );
				 rollOverCubeMesh.position.divideScalar( CUBE.size ).floor().multiplyScalar( CUBE.size ).addScalar( CUBE.size / 2 );

				 break;

			case EDIT_MODE.DESTRUCT:

				 rollOverCubeMesh.position.copy( intersect.point ).add( intersect.face.normal );;
				 rollOverCubeMesh.position.divideScalar( CUBE.size ).floor().multiplyScalar( CUBE.size ).addScalar( CUBE.size / 2 );

				 break;

		}

	}
	render();

}

/**
* When mouse down
**/
function onCanvasMouseDown( event ) {

	event.preventDefault();

	relativePosition.set( ( ( event.clientX - CANVAS.x ) / CANVAS.width ) * 2 - 1, - ( ( event.clientY - CANVAS.y ) / CANVAS.height ) * 2 + 1, 0.5 );
	relativePosition.unproject( camera );

	raycaster.ray.set( camera.position, relativePosition.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( objects );

	if( intersects.length > 0 ) {

		var intersect = intersects[ 0 ];

		switch( editMode ) {

			case EDIT_MODE.CONSTRUCT:

				 var voxel = new THREE.Mesh( CUBE.geometry, new THREE.MeshLambertMaterial( { color: COLOR_PICKER.selectedColor } ) );
				 voxel.position.copy( intersect.point ).add( intersect.face.normal );
				 voxel.position.divideScalar( CUBE.size ).floor().multiplyScalar( CUBE.size ).addScalar( CUBE.size / 2 );

				 scene.add( voxel );
				 objects.push( voxel );

				 break;

			case EDIT_MODE.DESTRUCT:
				 if(intersects.length < 2) return;
				 scene.remove( intersect.object );
				 objects.splice( objects.indexOf( intersect.object ), 1 );

				 break;

		}

	}
	render();

}


function viewMode() {

	editMode = EDIT_MODE.VIEW;
	rollOverCubeMesh.visible = false;

	render();
}

function constructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.CONSTRUCT;

	rollOverCubeMesh.visible = true;
	rollOverCubeMesh.material = rollOverConstructMaterial;

	render();
}

function destructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.DESTRUCT;

	rollOverCubeMesh.visible = true;
	rollOverCubeMesh.material = rollOverDestructMaterial;

	render();
}

/**
* When key down
**/
function onCanvasKeyDown( event ) {

	switch( event.keyCode ) {
		case 16: destructMode(); break;
		case 32: constructMode(); break;
	}

}

/**
* When key up
**/
function onCanvasKeyUp( event ) {

	switch ( event.keyCode ) {
		case 16: viewMode(); break;
		case 32: viewMode(); break;
	}

}

/**
* When resize
**/
function onWindowResize() {

	var canvasPosition = getDomElementPosition( CANVAS.domElement );

	CANVAS.width = CANVAS.domElement.offsetWidth;
	CANVAS.height = CANVAS.domElement.offsetHeight;
	
	CANVAS.x = canvasPosition.x;
	CANVAS.y = canvasPosition.y;

	renderer.setSize( CANVAS.width, CANVAS.height );
	camera.aspect = CANVAS.width / CANVAS.height;
	camera.updateProjectionMatrix();
	render();
}