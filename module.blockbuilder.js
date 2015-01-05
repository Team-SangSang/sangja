/*************************************
* SANGJA PROJECT
* module.blockbuilder
**************************************/

"use strict";

//블록 빌더 초기화
var BlockBuilder = {
    BLOCK_SIZE: 10,
    currentBlockColor: 0xFFFFFF,
    world: {}
};

BlockBuilder.blockGeometry = new THREE.BoxGeometry( BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE );

(function() {
    //상수 선언
    var ANTIALIAS = true;
    
    var GRID_COUNT = 15;
    
    var CANVAS_BACKGROUND_COLOR = 0xF0F0F0;
    
    //사용자 UI 관련
    var canvas = document.getElementById( 'canvas' );
    var canvasX, canvasY;
    
    //3D 관련
    var scene, camera, renderer;
    var controls, guideGrid, plane;
    
    function createStage() {
        //3D UI 초기화
        scene = new THREE.Scene();	

        renderer = new THREE.WebGLRenderer( { antialias: ANTIALIAS } );
        renderer.setClearColor( CANVAS_BACKGROUND_COLOR );
        renderer.setSize( canvas.offsetWidth, canvas.offsetHeight );

        canvas.appendChild( renderer.domElement );
	
        camera = new THREE.PerspectiveCamera( 40, canvas.offsetWidth / canvas.offsetHeight, 1, 20000 );
        camera.position.set( 100, 100, 100 );
        camera.lookAt( new THREE.Vector3() );
        scene.add( camera );

        controls = new THREE.OrbitControls( camera, canvas );
        controls.addEventListener( 'change', render );

        //보조선
        guideGrid = new THREE.GridHelper( GRID_COUNT * BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE );
        scene.add( guideGrid );

        //광원
        var ambientLight = new THREE.AmbientLight( 0x404040 );
        scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        scene.add( directionalLight );

        directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( -1, -0.75, -0.5 ).normalize();
        scene.add( directionalLight );

        //가상 평면(기준면)
        var planeGeometry = new THREE.PlaneBufferGeometry( GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2, GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2 );
        planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
        plane = new THREE.Mesh( planeGeometry );
        plane.visible = false;
        scene.add( plane );
        
        BlockBuilder.world.plane = plane;
    }
    
    function initialize() {
        createStage();
        onWindowResize();
        
        $( '#color-picker' ).on( 'change.spectrum', function( event, tinycolor ) {
            BlockBuilder.currentBlockColor = parseInt( tinycolor.toHex(), 16 );
            render();
        });
    }
    
    function render() {
        renderer.render( scene, camera );
    }
    
    function animate() {
        requestAnimationFrame( animate );
        controls.update();
    }

    
    initialize();
    render();
    animate();
    
    //BlockBuilder 오브젝트 초기화
    BlockBuilder.canvas = canvas;
    BlockBuilder.scene = scene;
    
    BlockBuilder.currentMode = null;
    
    //툴박스 모드 추가 함수
    BlockBuilder.addMode = function( label, id, key, mode ) {
        var idString = 'toolbox-'+id;
        
        $( '#toolbox' ).append( '<label id="'+idString+'" class="btn btn-default"><input type="radio" name="options">'+label+'</label>' );
        
        //모드 변경 처리
        var toolButton = document.getElementById( idString );
        
        toolButton.addEventListener( 'click', function() {
            if( BlockBuilder.currentMode !== null ){
                BlockBuilder.currentMode.deactivate();
            }
            
            BlockBuilder.currentMode = mode;
            mode.activate();
            
            render();
        });
        
        document.addEventListener( 'keydown', function( event ) {
            if( event.keyCode === key ){
                toolButton.click();
            }
        });
        
        //활성화된 모드가 없을 경우 초기화
        if( BlockBuilder.currentMode === null ) {
            toolButton.click();
        }
    };
    
    //BlockBuilder 월드
    BlockBuilder.world.blockList = [];
    BlockBuilder.world.render = render;
    
    BlockBuilder.world.getMouseRaycaster = function( event ) {
        var mouse3D = new THREE.Vector3(
            ( ( event.clientX - canvasX ) / canvas.offsetWidth ) * 2 - 1,
            - ( ( event.clientY - canvasY ) / canvas.offsetHeight ) * 2 + 1,
            0.5
        );
        mouse3D.unproject( camera );
        
        var raycaster = new THREE.Raycaster( camera.position, mouse3D.sub( camera.position ).normalize() );
        
        return raycaster;
    };
    
    //화면 리사이즈 핸들링
    function onWindowResize() {
        var canvasPosition = $( '#canvas' ).offset();

        canvasX = canvasPosition.left;
        canvasY = canvasPosition.top;

        renderer.setSize( canvas.offsetWidth, canvas.offsetHeight );
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        
        render();
    }
    
    window.addEventListener( 'resize', onWindowResize );
    
    //같은 자리에서 클릭 이벤트 구현
    var lastMouseDown;
    
    function onCanvasMouseDown( event ) {
        lastMouseDown = event;
    }
    
    function onCanvasMouseUp( event ) {
        if( lastMouseDown !== null ){
            if( lastMouseDown.clientX === event.clientX && lastMouseDown.clientY === event.clientY && lastMouseDown.button === event.button ){
                var customEvent = new CustomEvent( 'clickWithoutMove', {
                    detail: {
                        clientX: event.clientX,
                        clientY: event.clientY,
                        pageX: event.pageX,
                        pageY: event.pageY,
                        button: event.button
                    }
                });
                canvas.dispatchEvent( customEvent );
            }
        }
    }
    
    canvas.addEventListener( 'mousedown', onCanvasMouseDown );
    canvas.addEventListener( 'mouseup', onCanvasMouseUp );
})();


