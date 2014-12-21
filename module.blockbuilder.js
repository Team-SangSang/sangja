/*************************************
*
* SANGJA PROJECT
* module.blockbuilder
*
* 2014. 12. 21
* 김현준 프로그래밍
*
**************************************/


// 상수
var EDIT_MODE = { VIEW: 0, CONSTRUCT: 1, DESTRUCT: 2 };
var CANVAS_BACKGROUND_COLOR = 0xf0f0f0;
var BLOCK_SIZE = 10;
var INITIAL_BLOCK_COLOR = 0xffffff;

// 사용자 UI 관련
var toolbar, canvas, color_picker, controls;
var guideGrid, guideBlock;

// 3D 관련
var scene, camera, renderer
var blockGeometry, blockGeometry2;
var blockColor = INITIAL_BLOCK_COLOR;

// 필드 위 유닛들
var units = [];

// 편집 설정
var editMode = EDIT_MODE.VIEW;

initialize();
render();
animate();


function initialize() {

	// UI 취득
	acquireUI();
	
	// 스테이지 생성
	createStage( 15 );

	onWindowResize();
}


function acquireUI() {

	// 사용자 컨트롤 UI 초기화

	toolbar = new Object();
	toolbar.selection_mode_button = document.getElementById( 'selection-mode-button' );
	toolbar.construction_mode_button = document.getElementById( 'construction-mode-button' );
	toolbar.destruction_mode_button = document.getElementById( 'destruction-mode-button' );

	canvas = document.getElementById( 'canvas' );
	canvas.addEventListener( 'mousemove', onCanvasMouseMove, false );
	canvas.addEventListener( 'mousedown', onCanvasMouseDown, false );

	color_picker = document.getElementById( 'color-picker' );

	// 3D UI 초기화

	scene = new THREE.Scene();	

	renderer = new THREE.WebGLRenderer( { antialias:true } );
	renderer.setClearColor( CANVAS_BACKGROUND_COLOR );
	renderer.setSize( canvas.offsetWidth, canvas.offsetHeight );

	canvas.appendChild( renderer.domElement );
	
	camera = new THREE.PerspectiveCamera( 40, canvas.offsetWidth / canvas.offsetHeight, 1, 20000 );
	camera.position.set( 100, 100, 100 );
	camera.lookAt( new THREE.Vector3() );
	scene.add( camera );

	controls = new THREE.OrbitControls( camera, canvas );
	controls.addEventListener( 'change', render );
	
	window.addEventListener( 'resize', onWindowResize );
	document.addEventListener( 'keydown', onDocumentKeyDown, false );
	document.addEventListener( 'keyup', onDocumentKeyUp, false );

	// 3D 그래픽 요소 초기화

	blockGeometry = new THREE.BoxGeometry( BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE );
	blockGeometry2 = new THREE.BoxGeometry( BLOCK_SIZE/2, BLOCK_SIZE/2, BLOCK_SIZE/2 );
	guideBlock = new THREE.Mesh( blockGeometry, new THREE.MeshLambertMaterial( { color: blockColor, transparent: true, opacity: 0.5 } ) );
	guideBlock.visible = false;
	scene.add( guideBlock );
}


function createStage( size ) {

	units = [];

	// 보조선
	guideGrid = new THREE.GridHelper( size * BLOCK_SIZE, BLOCK_SIZE );	
	scene.add( guideGrid );

	// 광원
	var ambientLight = new THREE.AmbientLight( 0x404040 );
	scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
	scene.add( directionalLight );

	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( -1, -0.75, -0.5 ).normalize();	
	scene.add( directionalLight );

	// 가상 평면 (기준면)
	var planeGeometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
	planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ));
	plane = new THREE.Mesh( planeGeometry );
	plane.visible = false;
	scene.add( plane );
	units.push( plane );	
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

	blockColor = parseInt(event.toHex(), 16);

	render();
}


var _relativePosition = new THREE.Vector3();
var _raycaster = new THREE.Raycaster();
var _canvasX, _canvasY;
var _prevIntersectUnit;

function onCanvasMouseMove( event ) {

	event.preventDefault();
	
	_relativePosition.set( ( ( event.clientX - _canvasX ) / canvas.offsetWidth ) * 2 - 1, - ( ( event.clientY - _canvasY ) / canvas.offsetHeight ) * 2 + 1, 0.5 );
	_relativePosition.unproject( camera );
	_raycaster.ray.set( camera.position, _relativePosition.sub( camera.position ).normalize() );
	var intersects = _raycaster.intersectObjects( units );

	if ( intersects.length > 0 ) {

		var intersect = intersects[ 0 ];

		switch( editMode ) {

			case EDIT_MODE.VIEW:
				 if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1 } ); }
				 intersect.object.material.setValues( { transparent: true, opacity: 0.8 } );
				 _prevIntersectUnit = intersect.object;
				 break;

			case EDIT_MODE.CONSTRUCT:
				 guideBlock.position.copy( intersect.point ).add( intersect.face.normal );
				 guideBlock.position.divideScalar( BLOCK_SIZE ).floor().multiplyScalar( BLOCK_SIZE ).addScalar( BLOCK_SIZE / 2 );
				 break;

			case EDIT_MODE.DESTRUCT:
				 if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1 } ); }
				 intersect.object.material.setValues( { transparent: true, opacity: 0.5 } );
				 _prevIntersectUnit = intersect.object;
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
	
	_relativePosition.set( ( ( event.clientX - _canvasX ) / canvas.offsetWidth ) * 2 - 1, - ( ( event.clientY - _canvasY ) / canvas.offsetHeight ) * 2 + 1, 0.5 );
	_relativePosition.unproject( camera );
	_raycaster.ray.set( camera.position, _relativePosition.sub( camera.position ).normalize() );
	var intersects = _raycaster.intersectObjects( units );

	if( intersects.length > 0 ) {
		var intersect = intersects[ 0 ];

		switch( editMode ) {

			case EDIT_MODE.CONSTRUCT:
				 var block = new THREE.Mesh( blockGeometry, new THREE.MeshLambertMaterial( { color: blockColor } ) );
				 block.position.copy( intersect.point ).add( intersect.face.normal );
				 block.position.divideScalar( BLOCK_SIZE ).floor().multiplyScalar( BLOCK_SIZE ).addScalar( BLOCK_SIZE / 2 );
				 scene.add( block );
				 units.push( block );
				 break;

			case EDIT_MODE.DESTRUCT:
				 if(intersects.length < 2) return;
				 scene.remove( intersect.object );
				 units.splice( units.indexOf( intersect.object ), 1 );
				 break;
		}

	}
	render();

}


function viewMode() {

	editMode = EDIT_MODE.VIEW;
	guideBlock.visible = false;
	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1, wireframe: false } ); }
	render();
}

function constructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.CONSTRUCT;

	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1, wireframe: false } ); }
	guideBlock.visible = true;
	guideBlock.material.setValues( { color:blockColor } );

	render();
}

function destructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.DESTRUCT;
	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1, wireframe: false } ); }
	guideBlock.visible = false;

	render();
}

/**
* When key down
**/
function onDocumentKeyDown( event ) {

	switch( event.keyCode ) {
		case 18: destructMode(); break;
		case 32: constructMode(); break;
	}

}

/**
* When key up
**/
function onDocumentKeyUp( event ) {

	switch ( event.keyCode ) {
		case 18: viewMode(); break;
		case 32: viewMode(); break;
	}

}

/**
* When resize
**/
function onWindowResize() {

	var canvasPosition = getDomElementPosition( canvas );

	_canvasX = canvasPosition.x;
	_canvasY = canvasPosition.y;

	renderer.setSize( canvas.offsetWidth, canvas.offsetHeight );
	camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
	camera.updateProjectionMatrix();
	render();
}