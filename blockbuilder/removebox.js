/*global THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var BLOCK_DESTRUCTION_OUTLINE_COLOR = 0xFF0000,
        
        prevIntersectUnit = null;
    
    function resetPrevInstersect() {
        if (prevIntersectUnit !== null) {
            prevIntersectUnit.hideGuideEdge();
            prevIntersectUnit.material.setValues({ transparent: false });
        }
    }
    
    function setTransparent(object) {
        object.material.setValues({ transparent: true, opacity: 0.5 });
    }
    
    function onCanvasMouseMove(event) {
        var raycaster, intersects, intersect;

        raycaster = BlockBuilder.world.getMouseRaycaster(event);
        
        intersects = raycaster.intersectObjects(BlockBuilder.world.blockList);
        
        resetPrevInstersect();
        if (intersects.length > 0) {
            intersect = intersects[0];
            
            intersect.object.showGuideEdge(BLOCK_DESTRUCTION_OUTLINE_COLOR);
            
            setTransparent(intersect.object);
            prevIntersectUnit = intersect.object;
        }
        
        BlockBuilder.world.render();
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, blockList;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.world.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(BlockBuilder.world.blockList);
            
            if (intersects.length > 0) {
                resetPrevInstersect();
                
                intersect = intersects[0];
                
                BlockBuilder.scene.remove(intersect.object);
                
                blockList = BlockBuilder.world.blockList;
                blockList.splice(blockList.indexOf(intersect.object), 1);
            }
        }
    }
    
    //s키
    BlockBuilder.addMode('삭제', 83, {
        id: 'remove',
        activate: function () {
            BlockBuilder.canvas.addEventListener('mousemove', onCanvasMouseMove);
            BlockBuilder.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
        },
        deactivate: function () {
            BlockBuilder.canvas.removeEventListener('mousemove', onCanvasMouseMove);
            BlockBuilder.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            resetPrevInstersect();
        }
    });
}());
