/*************************************
*
* SANGJA PROJECT
* module.blockbuilder
*
* 2014. 12. 21 ~
* 김현준 프로그래밍
*
**************************************/


// 상수
var ANITALIAS = true;
var EDIT_MODE = { VIEW: 0, CONSTRUCT: 1, DESTRUCT: 2 };

var BLOCK_SIZE = 10;
var BLOCK_OUTLINE_SIZE = 10.1;

var CANVAS_BACKGROUND_COLOR = 0xf0f0f0;
var BLOCK_ROLLOVER_OUTLINE_COLOR = 0x555555;
var BLOCK_SELECTION_OUTLINE_COLOR = 0x00FF00;
var BLOCK_DESTRUCTION_OUTLINE_COLOR = 0xFF0000;
var INITIAL_BLOCK_COLOR = 0xffffff;

// 사용자 UI 관련
var toolbar, canvas, color_picker, controls;
var guideGrid, guideBlock, guideBlockEdgeHelper, guideBlockEdgeHelperForSelection;

// 3D 관련
var scene, camera, renderer
var blockGeometry;
var blockColor = INITIAL_BLOCK_COLOR;

// 필드 위 유닛들
var units = [];
var selectedUnits = [];
var guideEdges = [];

// 편집 설정
var editMode = EDIT_MODE.VIEW;
var multiSelect = false;

initialize();
render();
animate();


function initialize() {

	// UI 취득
	acquireUI();
	
	// 스테이지 생성
	createStage( 15 );

	onWindowResize();
	
	viewMode();
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

	renderer = new THREE.WebGLRenderer( { antialias:ANITALIAS } );
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
	guideBlock = new THREE.Mesh( blockGeometry, new THREE.MeshLambertMaterial( { color: blockColor, transparent: true, opacity: 0.5 } ) );
	guideBlock.visible = false;
	
	var blockOutlineGeometry = new THREE.BoxGeometry( BLOCK_OUTLINE_SIZE , BLOCK_OUTLINE_SIZE, BLOCK_OUTLINE_SIZE );
	
	guideBlockEdgeHelper = new THREE.EdgesHelper( new THREE.Mesh( blockOutlineGeometry) );	
	guideBlockEdgeHelper.matrixAutoUpdate = true;	
	guideBlockEdgeHelper.visible = false;

	guideBlockEdgeHelperForSelection = new THREE.EdgesHelper( new THREE.Mesh( blockOutlineGeometry) );
	guideBlockEdgeHelperForSelection.matrixAutoUpdate = true;

	scene.add( guideBlock );
	scene.add( guideBlockEdgeHelper );
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

	//event.preventDefault();
	
	_relativePosition.set( ( ( event.clientX - _canvasX ) / canvas.offsetWidth ) * 2 - 1, - ( ( event.clientY - _canvasY ) / canvas.offsetHeight ) * 2 + 1, 0.5 );
	_relativePosition.unproject( camera );
	_raycaster.ray.set( camera.position, _relativePosition.sub( camera.position ).normalize() );
	var intersects = _raycaster.intersectObjects( units );
	
	// 스테이지 위에 있을 경우에만
	if ( intersects.length > 0 ) {
		var intersect = intersects[ 0 ];
		
		switch( editMode ) {
			
			case EDIT_MODE.DESTRUCT:
			
				 if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false, opacity: 1 } ); }
				 intersect.object.material.setValues( { transparent: true, opacity: 0.5 } );
				 _prevIntersectUnit = intersect.object;
			
			case EDIT_MODE.VIEW:
				
				// 마우스가 블록 위에 있을 경우에만 외곽선을 표시한다.
				// 조건 추가: selection 상태가 아닐 때 
				if ( intersects.length > 1 && selectedUnits.indexOf( intersect ) < 0 ){
				
					guideBlockEdgeHelper.visible = true;
					guideBlockEdgeHelper.position.copy(intersect.object.position);
					
				} else {
					guideBlockEdgeHelper.visible = false;
				}
				 
				 break;

			case EDIT_MODE.CONSTRUCT:
				 guideBlock.position.copy( intersect.point ).add( intersect.face.normal );
				 guideBlock.position.divideScalar( BLOCK_SIZE ).floor().multiplyScalar( BLOCK_SIZE ).addScalar( BLOCK_SIZE / 2 );
				 break;

			
		}
		render();
	}
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
			
			case EDIT_MODE.VIEW:

				// 왼쪽 마우스 클릭만 인정
				if( ! isLeftMouseClick( event ) ) break;

				// 다중 선택 모드
				if ( multiSelect ) {
					// 블록을 눌렀을 경우에만
					if ( intersects.length > 1 ){

						if( selectedUnits.indexOf( intersect.object ) < 0) {
							addGuideEdge( intersect.object );
							selectedUnits.push( intersect.object );
						}
						// 이미 선택된 블록을 또 누르면
						else {
							removeGuideEdge( intersect.object );
							selectedUnits.splice( selectedUnits.indexOf( intersect.object ), 1 );
						}						
					}
				}
				// 해제 후 단일 선택 (기본)
				else {
					clearGuideEdges();
					selectedUnits = [];
				}
			
				break;
			
			case EDIT_MODE.CONSTRUCT:

				// 왼쪽 마우스 클릭만 인정
				if( ! isLeftMouseClick( event ) ) break;

				var block = new THREE.Mesh( blockGeometry, new THREE.MeshLambertMaterial( { color: blockColor } ) );
				block.position.copy( intersect.point ).add( intersect.face.normal );
				block.position.divideScalar( BLOCK_SIZE ).floor().multiplyScalar( BLOCK_SIZE ).addScalar( BLOCK_SIZE / 2 );
				scene.add( block );
				units.push( block );
				break;

			case EDIT_MODE.DESTRUCT:

				// 왼쪽 마우스 클릭만 인정
				if( ! isLeftMouseClick( event ) ) break;

				scene.remove( intersect.object );
				units.splice( units.indexOf( intersect.object ), 1 );
				break;
		}


		// 오른쪽 마우스 클릭일 경우 컨텍스트 메뉴 표시
		if ( isRightMouseClick( event ) ) {

			// 뷰모드에서 블록을 눌렀을 경우에만
			if ( intersects.length > 1 && editMode == EDIT_MODE.VIEW){					
						
				$('#canvas').contextmenu({
 					target: '#unit-menu',
 					onItem: function(context,e) {
 						console.log(e.target.id);
 						switch( e.target.id ) {
 							case "unit-menu-remove-block":
 								if(selectedUnits.length > 0){
 									clearGuideEdges();

 									for(var i in selectedUnits){
 										scene.remove( selectedUnits[i] );
										units.splice( units.indexOf( selectedUnits[i] ), 1 );
										// 메모리 management 추가요함
 									}
 									selectedUnits = [];

 								} else {
	 								removeGuideEdge(intersect.object);
	 								scene.remove( intersect.object );
									units.splice( units.indexOf( intersect.object ), 1 );
								}
 								break;
 						}
 					}
				});
			}

			// 그 외의 경우 (기본값)
			else {
						
				$('#canvas').contextmenu({
 					before: function(e,context) {
						return false;
  					}
				});
			}			
		}

		render();
	}
	

}

function isLeftMouseClick( event ) {
	return ( event.which ) ? event.which == 1 && event.button == 0 : ( event.type == 'click' ) ? event.button == 0 : event.button == 1;
}

function isRightMouseClick( event ) {
	return event.button == 2;
}


function addGuideEdge( block ) {

	var newGuideEdge = guideBlockEdgeHelperForSelection.clone();
	newGuideEdge.material.setValues( { color: BLOCK_SELECTION_OUTLINE_COLOR } );
	newGuideEdge.position.copy( block.position );
	newGuideEdge.matrixAutoUpdate = true;
	guideEdges.push( newGuideEdge );
	scene.add( newGuideEdge );
}

function removeGuideEdge( block ) {

	var blockIndex = selectedUnits.indexOf( block );

	if( blockIndex >= 0 ) {
		
		scene.remove( guideEdges[blockIndex] );
		guideEdges.splice( blockIndex, 1 );
	}

	
}

function clearGuideEdges() {
	for ( var i in guideEdges ) {
		scene.remove( guideEdges[i] );
	}
	guideEdges = [];

	render();
}

function viewMode() {

	editMode = EDIT_MODE.VIEW;
	
	guideBlock.visible = false;
	guideBlockEdgeHelper.material.setValues({color:BLOCK_ROLLOVER_OUTLINE_COLOR});
	
	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false} ); }
	
	render();
}

function constructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.CONSTRUCT;
	
	guideBlock.visible = true;
	guideBlockEdgeHelper.visible = false;
	guideBlock.material.setValues( { color:blockColor } );
	
	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false} ); }
	
	render();
}

function destructMode() {

	if( editMode != EDIT_MODE.VIEW ) return;

	editMode = EDIT_MODE.DESTRUCT;
	
	
	
	guideBlock.visible = false;
	guideBlockEdgeHelper.material.setValues({color:BLOCK_DESTRUCTION_OUTLINE_COLOR});
	guideBlockEdgeHelper.visible = true;
	
	if(_prevIntersectUnit != null) { _prevIntersectUnit.material.setValues( { transparent: false} ); }
	
	render();
}

/**
* When key down
**/
function onDocumentKeyDown( event ) {

	switch( event.keyCode ) {
		case 16: if ( editMode == EDIT_MODE.VIEW ) { multiSelect = true; } break;
		case 18: destructMode(); break;
		case 32: constructMode(); break;
	}

}

/**
* When key up
**/
function onDocumentKeyUp( event ) {

	switch ( event.keyCode ) {
		case 16: if ( multiSelect ) { multiSelect = false; } break;
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