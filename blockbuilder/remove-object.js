/*global THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var BLOCK_DESTRUCTION_OUTLINE_COLOR = 0xFF0000,
        
        prevIntersectUnit = null;
    
    function resetPrevInstersect() {
        if (prevIntersectUnit !== null) {
            prevIntersectUnit.hideGuideBox();
            prevIntersectUnit.setOpacity(1.0);
        }
    }
    
    function onCanvasMouseMove(event) {
        var raycaster, intersects, intersect;

        raycaster = BlockBuilder.util.getMouseRaycaster(event);
        
        intersects = raycaster.intersectObjects(BlockBuilder.world.objectList);
        
        resetPrevInstersect();
        if (intersects.length > 0) {
            intersect = intersects[0];
            
            intersect.object.showGuideBox(BLOCK_DESTRUCTION_OUTLINE_COLOR);
            
            intersect.object.setOpacity(0.5);
            prevIntersectUnit = intersect.object;
        }
        
        BlockBuilder.render();
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, blockList;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.util.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(BlockBuilder.world.objectList);
            
            if (intersects.length > 0) {
                resetPrevInstersect();
                
                intersect = intersects[0];
                
                BlockBuilder.world.remove(intersect.object);
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
