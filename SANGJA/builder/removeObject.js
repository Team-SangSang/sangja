/*global THREE, SANGJA*/

(function () {
    "use strict";
    
    var BLOCK_DESTRUCTION_OUTLINE_COLOR = 0xFF0000,
        
        prevIntersectUnit;
    
    function resetPrevInstersect() {
        if (prevIntersectUnit !== undefined) {
            prevIntersectUnit.hideGuideBox();
            prevIntersectUnit.setOpacity(1.0);
        }
    }
    
    function onCanvasMouseMove(event) {
        var raycaster, intersects, intersect;

        raycaster = SANGJA.renderer.getMouseRaycaster(event);
        
        intersects = raycaster.intersectObjects(SANGJA.builder.world.objectList, true);
        
        resetPrevInstersect();
        if (intersects.length > 0) {
            intersect = intersects[0].object.ascendTo(SANGJA.builder.world);
            
            intersect.showGuideBox(BLOCK_DESTRUCTION_OUTLINE_COLOR);
            
            intersect.setOpacity(0.5);
            prevIntersectUnit = intersect;
        }
        
        SANGJA.renderer.render();
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, blockList;
        
        if (event.detail.button === 0) {
            raycaster = SANGJA.renderer.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(SANGJA.builder.world.objectList, true);
            
            if (intersects.length > 0) {
                resetPrevInstersect();
                
                intersect = intersects[0].object.ascendTo(SANGJA.builder.world);
                
                SANGJA.builder.world.remove(intersect);
                
                SANGJA.builder.updateHierarchy();
            }
        }
    }
    
    //s키
    SANGJA.builder.addMode('Erase', 83, {
        id: 'remove',
        activate: function () {
            SANGJA.renderer.canvas.addEventListener('mousemove', onCanvasMouseMove);
            SANGJA.renderer.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
        },
        deactivate: function () {
            SANGJA.renderer.canvas.removeEventListener('mousemove', onCanvasMouseMove);
            SANGJA.renderer.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            resetPrevInstersect();
        }
    });
}());
