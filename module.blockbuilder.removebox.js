"use strict";

(function() {
    var BLOCK_DESTRUCTION_OUTLINE_COLOR = 0xFF0000;
    
    var prevIntersectUnit = null;
    
    var guideEdge =  new THREE.EdgesHelper( new THREE.Mesh( BlockBuilder.blockGeometry ) );
    guideEdge.material.setValues( { color: BLOCK_DESTRUCTION_OUTLINE_COLOR } );
    guideEdge.matrixAutoUpdate = true;
    guideEdge.visible = false;
    BlockBuilder.scene.add( guideEdge );
    
    function resetPrevInstersect() {
        if( prevIntersectUnit !== null)
            prevIntersectUnit.material.setValues( { transparent: false } );
    }
    
    function setTransparent( object ) {
        object.material.setValues( { transparent: true, opacity: 0.5 } );
    }
    
    function onCanvasMouseMove( event ) {
        var raycaster = BlockBuilder.world.getMouseRaycaster( event );
        
        var intersects = raycaster.intersectObjects( BlockBuilder.world.blockList );
        
        resetPrevInstersect();
        if( intersects.length > 0 ) {
            guideEdge.visible = true;
            var intersect = intersects[0];
            
            guideEdge.position.copy( intersect.object.position );
            
            setTransparent( intersect.object );
            prevIntersectUnit = intersect.object;
        } else {
            guideEdge.visible = false;
        }
        
        BlockBuilder.world.render();
    }
    
    function onCanvasClickWithoutMove( event ) {
        if( event.detail.button === 0 ) {
            var raycaster = BlockBuilder.world.getMouseRaycaster( event.detail );
            
            var intersects = raycaster.intersectObjects( BlockBuilder.world.blockList );
        
            if( intersects.length > 0 ) {
                resetPrevInstersect();
                guideEdge.visible = false;
                
                var intersect = intersects[0];
                
                BlockBuilder.scene.remove( intersect.object );
                
                var list = BlockBuilder.world.blockList;
				list.splice( list.indexOf( intersect.object ), 1  );
            }
        }
    }
    
    //s키
    BlockBuilder.addMode( '삭제', 'remove', 83, {
        activate: function() {
            BlockBuilder.canvas.addEventListener( 'mousemove', onCanvasMouseMove );
            BlockBuilder.canvas.addEventListener( 'clickWithoutMove', onCanvasClickWithoutMove );
        },
        deactivate: function() {
            BlockBuilder.canvas.removeEventListener( 'mousemove', onCanvasMouseMove );
            BlockBuilder.canvas.removeEventListener( 'clickWithoutMove', onCanvasClickWithoutMove );
            resetPrevInstersect();
            guideEdge.visible = false;
        }
    });
})();