/*************************************
* SANGJA PROJECT
* module.blockbuilder
**************************************/

/*global $, THREE*/

//블록 빌더 초기화
var BlockBuilder = {
    BLOCK_SIZE: 10,
    currentBlockColor: 0xFFFFFF,
    world: {}
};

BlockBuilder.blockGeometry = new THREE.BoxGeometry(BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE);

(function () {
    "use strict";
    
    var ANTIALIAS = true,
        GRID_COUNT = 15,
        
        CANVAS_BACKGROUND_COLOR = 0xF0F0F0,
        
        //사용자 UI 관련
        canvas = document.getElementById('canvas'),
        canvasX,
        canvasY,
        
        //3D 관련
        scene,
        camera,
        renderer,
        controls,
        
        //마우스 이벤트 처리 관련
        lastMouseDown;
    
    //초기화 관련 함수 선언
    //==================
    
    function createStage() {
        var guideGrid,
            ambientLight,
            directionalLight,
            
            planeGeometry,
            plane;
        
        //3D UI 초기화
        scene = new THREE.Scene();
        
        renderer = new THREE.WebGLRenderer({ antialias: ANTIALIAS });
        renderer.setClearColor(CANVAS_BACKGROUND_COLOR);
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        
        canvas.appendChild(renderer.domElement);
        
        camera = new THREE.PerspectiveCamera(40, canvas.offsetWidth / canvas.offsetHeight, 1, 20000);
        camera.position.set(100, 100, 100);
        camera.lookAt(new THREE.Vector3());
        scene.add(camera);
        
        controls = new THREE.OrbitControls(camera, canvas);
        
        //보조선
        guideGrid = new THREE.GridHelper(GRID_COUNT * BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE);
        scene.add(guideGrid);
        
        //광원
        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(-1, -0.75, -0.5).normalize();
        scene.add(directionalLight);
        
        //가상 평면(기준면)
        planeGeometry = new THREE.PlaneBufferGeometry(GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2, GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2);
        planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        plane = new THREE.Mesh(planeGeometry);
        plane.visible = false;
        scene.add(plane);
        
        BlockBuilder.world.plane = plane;
    }
    
    function render() {
        renderer.render(scene, camera);
    }
    
    function initialize() {
        createStage();
        
        $('#color-picker').on('change.spectrum', function (event, tinycolor) {
            BlockBuilder.currentBlockColor = parseInt(tinycolor.toHex(), 16);
            render();
        });
        controls.addEventListener('change', render);
    }
    
    function animate() {
        window.requestAnimationFrame(animate);
        controls.update();
    }
    
    //기타 초기화
    //=========
    
    //화면 리사이즈 핸들링
    function onWindowResize() {
        var canvasPosition = $('#canvas').offset();
        
        canvasX = canvasPosition.left;
        canvasY = canvasPosition.top;
        
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        
        render();
    }
    
    window.addEventListener('resize', onWindowResize);
    
    //같은 자리에서 클릭 이벤트 구현
    function onCanvasMouseDown(event) {
        lastMouseDown = event;
    }
    
    function onCanvasMouseUp(event) {
        if (lastMouseDown !== null) {
            if (lastMouseDown.clientX === event.clientX && lastMouseDown.clientY === event.clientY && lastMouseDown.button === event.button) {
                var customEvent = new window.CustomEvent('clickWithoutMove', {
                    detail: {
                        clientX: event.clientX,
                        clientY: event.clientY,
                        pageX: event.pageX,
                        pageY: event.pageY,
                        button: event.button
                    }
                });
                canvas.dispatchEvent(customEvent);
            }
        }
    }
    
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    
    //초기화 함수 호출
    //=============
    
    initialize();
    onWindowResize();
    render();
    animate();
    
    //BlockBuilder 초기화
    //==================
    
    BlockBuilder.canvas = canvas;
    BlockBuilder.scene = scene;
    
    BlockBuilder.currentMode = null;
    
    //BlockBuilder 모드 추가 함수
    BlockBuilder.addMode = function (label, id, key, mode) {
        var idString, toolButton;
        
        idString = 'toolbox-' + id;
        $('#toolbox').append('<label id="' + idString + '" class="btn btn-default"><input type="radio" name="options">' + label + '</label>');
        
        //모드 변경 처리
        toolButton = document.getElementById(idString);
        
        toolButton.addEventListener('click', function () {
            if (BlockBuilder.currentMode !== null) {
                BlockBuilder.currentMode.deactivate();
            }
            
            BlockBuilder.currentMode = mode;
            mode.activate();
            
            render();
        });
        
        document.addEventListener('keydown', function (event) {
            if (event.keyCode === key) {
                toolButton.click();
            }
        });
        
        //활성화된 모드가 없을 경우 초기화
        if (BlockBuilder.currentMode === null) {
            toolButton.click();
        }
    };
    
    //BlockBuilder 월드
    BlockBuilder.world.blockList = [];
    BlockBuilder.world.render = render;
    
    //마우스 이벤트에서 RayCaster 가져오는 함수
    BlockBuilder.world.getMouseRaycaster = function (event) {
        var mouse3D, raycaster;
        
        mouse3D = new THREE.Vector3(
            ((event.clientX - canvasX) / canvas.offsetWidth) * 2 - 1,
            -((event.clientY - canvasY) / canvas.offsetHeight) * 2 + 1,
            0.5
        );
        mouse3D.unproject(camera);
        
        raycaster = new THREE.Raycaster(camera.position, mouse3D.sub(camera.position).normalize());
        
        return raycaster;
    };
}());
