/*************************************
* SANGJA PROJECT
* renderer module
**************************************/

/*global $, THREE, SANGJA*/

(function () {
    "use strict";
    
    SANGJA.renderer = {
        //Property
        scene: undefined,
        canvas: undefined,
        
        //Method
        getMouseRaycaster: undefined,
        render: undefined,
        capture: undefined
    };
    
    //상수 선언
    //========
    
    var ANTIALIAS = true,
        
        CANVAS_BACKGROUND_COLOR = 0xF0F0F0,
        
        CLICK_WITHOUT_MOVE_TOLERANCE = 5,
        
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
    
    function render() {
        renderer.render(scene, camera);
    }
    
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
        camera.position.set(200, 200, 200);
        camera.lookAt(new THREE.Vector3());
        scene.add(camera);
        
        controls = new THREE.OrbitControls(camera, canvas);
        
        //광원
        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(-1, -0.75, -0.5).normalize();
        scene.add(directionalLight);
    }
    
    function resizeCanvas() {
        var canvasPosition = $('#canvas').offset();
        
        canvasX = canvasPosition.left;
        canvasY = canvasPosition.top;
        
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        
        render();
    }
    
    function animate() {
        window.requestAnimationFrame(animate);
        controls.update();
    }
    
    createStage();
    resizeCanvas();
    animate();
    
    render();
    
    //이벤트 리스너 등록
    //================
    
    controls.addEventListener('change', render);
    
    //화면 리사이즈 핸들링
    window.addEventListener('resize', resizeCanvas);
    
    //같은 자리에서 클릭 이벤트 구현
    function onCanvasMouseDown(event) {
        lastMouseDown = event;
    }
    
    function onCanvasMouseUp(event) {
        var diffX, diffY, customEvent;
        
        if (lastMouseDown !== undefined) {
            diffX = lastMouseDown.clientX - event.clientX;
            diffY = lastMouseDown.clientY - event.clientY;
            
            if (Math.abs(diffX) < CLICK_WITHOUT_MOVE_TOLERANCE && Math.abs(diffY) < CLICK_WITHOUT_MOVE_TOLERANCE && lastMouseDown.button === event.button) {
                customEvent = document.createEvent('CustomEvent');
                customEvent.initCustomEvent('clickWithoutMove', false, false, {
                    screenX: event.screenX,
                    screenY: event.screenY,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    pageX: event.pageX,
                    pageY: event.pageY,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey,
                    metaKey: event.metaKey,
                    button: event.button
                });
                canvas.dispatchEvent(customEvent);
            }
        }
    }
    
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    
    //속성 및 메서드 연결
    //=================
    
    SANGJA.renderer.scene = scene;
    SANGJA.renderer.canvas = canvas;
    
    //마우스 이벤트에서 RayCaster 가져오는 함수
    SANGJA.renderer.getMouseRaycaster = function (event) {
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

    SANGJA.renderer.capture = function () {
        SANGJA.builder.showGrid(false);
        
        var $data = $(canvas).find('canvas')[0].toDataURL();

        SANGJA.builder.showGrid(true);

        return $data;
    };
    
    SANGJA.renderer.render = render;
}());
