/*global $, THREE, SANGJA*/

(function () {
    "use strict";
    
    var SELECTION_BLOCK_OUTLINE = 0x00FF00,
        SELECTION_UNION_OUTLINE = 0x0000FF,
        SELECT_NONE_ID = 'select-none',
        SELECTED_ID = 'select-selected',
        SELECT_UNION_ID = 'select-union',
        
        SELECT_ALL_ID = 'select-all',
        UNION_BUTTON_ID = 'select-create-union',
        UNION_NAME_INPUT = 'select-union-name',
        EXPORT_UNION_ID = 'select-export-union',
        
        selectedObjects = [];
    
    function displayMenu() {
        var selectNone = $('#' + SELECT_NONE_ID),
            selected = $('#' + SELECTED_ID),
            selectUnion = $('#' + SELECT_UNION_ID),
            
            unionNameInput = $('#' + UNION_NAME_INPUT);
        
        $('#toolmenu-select > div').css('display', 'none');
        
        if (selectedObjects.length === 0) {
            //아무것도 선택 안 됨
            selectNone.css('display', '');
        } else if (selectedObjects.length === 1 && selectedObjects[0] instanceof SANGJA.core.Union) {
            //유니온 하나 선택
            selectUnion.css('display', '');
            unionNameInput.val(selectedObjects[0].name);
        } else {
            //다중 오브젝트 선택
            selected.css('display', '');
            selected.children('p').text(selectedObjects.length + ' objects selected');
        }
    }
    
    function inputUnionName() {
        selectedObjects[0].name = $('#' + UNION_NAME_INPUT).val();
        
        SANGJA.builder.updateHierarchy();
    }
    
    function deselectAll() {
        var index;
        
        while (selectedObjects.length > 0) {
            index = selectedObjects.length - 1;
            selectedObjects[index].hideGuideBox();
            if (selectedObjects[index].hideGizmo) {
                selectedObjects[index].hideGizmo();
            }
            selectedObjects[index].setOpacity(1.0);
            
            selectedObjects.pop();
        }
    }
    
    function toggleSelection(object) {
        var blockIndex;
        blockIndex = selectedObjects.indexOf(object);
        
        if (blockIndex === -1) {
            object.showGuideBox(object instanceof SANGJA.core.Block ? SELECTION_BLOCK_OUTLINE : SELECTION_UNION_OUTLINE);
            if (object.showGizmo) {
                object.showGizmo();
            }
            object.setOpacity(0.8);
            
            selectedObjects.push(object);
        } else {
            object.hideGuideBox();
            if (object.hideGizmo) {
                object.hideGizmo();
            }
            object.setOpacity(1.0);
            
            selectedObjects.findAndRemove(object);
        }
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect;
        
        if (event.detail.button === 0) {
            raycaster = SANGJA.renderer.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(SANGJA.builder.world.objectList, true);
            
            if (event.detail.shiftKey) {
                //shift키 클릭중
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object.ascendTo(SANGJA.builder.world));
                }
            } else {
                //shift키 클릭중 아님
                deselectAll();
                
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object.ascendTo(SANGJA.builder.world));
                }
            }
        }
        
        displayMenu();
        
        SANGJA.renderer.render();
    }
    
    function keydownHandler(event) {
        var i, obj;
        
        //delete key
        if (event.keyCode === 46) {
            if (window.confirm("Delete all selected objects?")) {
                for (i = 0; i < selectedObjects.length; i += 1) {
                    obj = selectedObjects[i];
                    obj.parent.remove(obj);
                }
                
                deselectAll();
                
                displayMenu();
                SANGJA.renderer.render();
            }
        }
    }
    
    //d키
    SANGJA.builder.addMode('Select', 68, {
        id: 'select',
        activate: function () {
            SANGJA.renderer.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            document.addEventListener('keydown', keydownHandler);
            displayMenu();
        },
        deactivate: function () {
            SANGJA.renderer.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            document.removeEventListener('keydown', keydownHandler);
            deselectAll();
            SANGJA.renderer.render();
        }
    }, '/SANGJA/builder/selectObject.html', function () {
        $('#' + UNION_BUTTON_ID).click(function () {
            SANGJA.builder.world.createUnion(selectedObjects);
            deselectAll();
            displayMenu();
            SANGJA.renderer.render();
        
            SANGJA.builder.updateHierarchy();
        });
        
        $('#' + SELECT_ALL_ID).click(function () {
            deselectAll();
            SANGJA.builder.world.traverseBlock(function (block) {
                toggleSelection(block);
            }, false);
            
            displayMenu();
            SANGJA.renderer.render();
        });
        
        $('#' + UNION_NAME_INPUT).on('input', inputUnionName);
        
        //prevent form submission
        $('#select-union-form').submit(false);
        
        $('#' + EXPORT_UNION_ID).click(function () {
            var target, fileName;
            
            target = selectedObjects[0];
            
            if (target.name && target.name !== '') {
                fileName = target.name;
            } else {
                fileName = 'unnamed';
            }
            
            SANGJA.parser.download(SANGJA.parser.unionToJson(target), fileName + '.union', 'text/plain');
        });
    });
}());
