/*global THREE, BlockBuilder*/

(function () {
    "use strict";
    
    //가이드 블록 생성 처리
    var guideBlock = new BlockBuilder.Block({ color: BlockBuilder.currentBlockColor, transparent: true, opacity: 0.5 });
    guideBlock.visible = false;
    BlockBuilder.scene.add(guideBlock);
    
    //교차점으로부터 다음 블록 위치를 결정하는 함수
    function getNextBlockPosition(intersect) {
        var vector = new THREE.Vector3();
        vector.copy(intersect.point).add(intersect.face.normal);
        vector.divideScalar(BlockBuilder.BLOCK_SIZE).floor().multiplyScalar(BlockBuilder.BLOCK_SIZE).addScalar(BlockBuilder.BLOCK_SIZE * 0.5);
        return vector;
    }
    
    function onCanvasMouseMove(event) {
        var raycaster, intersects, intersect;
        
        raycaster = BlockBuilder.world.getMouseRaycaster(event);
        
        //addBox 모드에서는 가상 평면 추가
        BlockBuilder.world.blockList.push(BlockBuilder.world.plane);
        intersects = raycaster.intersectObjects(BlockBuilder.world.blockList);
        BlockBuilder.world.blockList.pop();
        
        if (intersects.length > 0) {
            guideBlock.visible = true;
            intersect = intersects[0];
            
            guideBlock.material.setValues({ color: BlockBuilder.currentBlockColor });
            guideBlock.position.copy(getNextBlockPosition(intersect));
        } else {
            guideBlock.visible = false;
        }
        
        BlockBuilder.world.render();
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, block;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.world.getMouseRaycaster(event.detail);
            
            //addBox 모드에서는 가상 평면 추가
            BlockBuilder.world.blockList.push(BlockBuilder.world.plane);
            intersects = raycaster.intersectObjects(BlockBuilder.world.blockList);
            BlockBuilder.world.blockList.pop();
            
            if (intersects.length > 0) {
                intersect = intersects[0];
                
                block = new BlockBuilder.Block({ color: BlockBuilder.currentBlockColor });
                block.position.copy(getNextBlockPosition(intersect));
                
                BlockBuilder.scene.add(block);
                BlockBuilder.world.blockList.push(block);
            }
            
            BlockBuilder.world.render();
        }
    }
    
    //TODO: 기준 평면 아래(z 좌표 음수) 처리하기
    
    //a키
    BlockBuilder.addMode('추가', 65, {
        id: 'add',
        activate: function () {
            BlockBuilder.canvas.addEventListener('mousemove', onCanvasMouseMove);
            BlockBuilder.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
        },
        deactivate: function () {
            BlockBuilder.canvas.removeEventListener('mousemove', onCanvasMouseMove);
            BlockBuilder.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            guideBlock.visible = false;
        }
    });
}());
