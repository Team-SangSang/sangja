/*global $, THREE, SANGJA*/

(function () {
    "use strict";
    
    var currentTarget, currentIndex,
        
        SELECTION_BLOCK_OUTLINE = 0x00FF00,
        SELECTION_UNION_OUTLINE = 0x0000FF,
        SELECT_NONE_ID = 'select-none',
        SELECTED_ID = 'select-selected',
        SELECT_UNION_ID = 'select-union',
        
        SELECT_ALL_ID = 'select-all',
        UNION_BUTTON_ID = 'select-create-union',
        UNION_NAME_INPUT = 'select-union-name',
        
        SCRIPT_DIV_ID = 'select-script',
        
        selectedObjects = [];
    
    function displayMenu() {
        var i, target,
            selectNone = $('#' + SELECT_NONE_ID),
            selected = $('#' + SELECTED_ID),
            selectUnion = $('#' + SELECT_UNION_ID),
            
            unionNameInput = $('#' + UNION_NAME_INPUT),
            addScript = $('#' + SCRIPT_DIV_ID);
        
        function scriptModal(target, index) {
            return function () {
                $('#script-modal-title').text('Script' + (index + 1));
                $('#script-modal').modal();
                $('#script-editor').val(target.scriptList[index]);
                
                currentTarget = target;
                currentIndex = index;
            };
        }
            
        function eraseScript(target, index) {
            return function () {
                target.scriptList.findAndRemove(target.scriptList[index]);
                displayMenu();
            };
        }
        
        $('#toolmenu-select > div').css('display', 'none');
        
        if (selectedObjects.length === 0) {
            //아무것도 선택 안 됨
            selectNone.css('display', '');
        } else if (selectedObjects.length === 1 && selectedObjects[0] instanceof SANGJA.core.Union) {
            //유니온 하나 선택
            target = selectedObjects[0];
            
            selectUnion.css('display', '');
            unionNameInput.val(target.name);
            
            addScript.html('');
            
            for (i = 0; i < target.scriptList.length; i += 1) {
                addScript.append(
                    $('<p>').append(
                        $('<div class="col-xs-10"></div>').append(
                            $('<button class="btn btn-default btn-block">Script' + (i + 1) + '</button>').click(
                                scriptModal(target, i)
                            )
                        )
                    ).append(
                        $('<button class="btn btn-link"><span class="glyphicon glyphicon-trash"></button>').click(
                            eraseScript(target, i)
                        )
                    )
                );
            }
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
    }, './SANGJA/builder/selectObject.html', function () {
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
        
        $('#select-disjoint-union').click(function () {
            var target, next, hash = {}, i;
            
            function getPositionHash(block, context) {
                var position;
                
                context = context ? context.clone() : new THREE.Vector3();
                
                position = SANGJA.core.threeToVoxel(context.add(block.position));
                return 'P' + position.x + '-' + position.y + '-' + position.z;
            }
            
            target = selectedObjects[0];
            
            for (i = 0; i < target.parent.blockList.length; i += 1) {
                hash[getPositionHash(target.parent.blockList[i])] = target.parent.blockList[i];
            }
            
            for (i = 0; i < target.blockList.length; i += 1) {
                if (hash[getPositionHash(target.blockList[i], target.position)]) {
                    break;
                }
            }
            
            if (i === target.blockList.length || window.confirm('Overlapped block will be erased.')) {
                deselectAll();
                displayMenu();
                
                //덮어쓰기 진행
                while (target.objectList.length > 0) {
                    next = target.blockList[0];
                    next.position.add(target.position);
                    
                    if (next instanceof SANGJA.core.Block) {
                        if (hash[getPositionHash(next)]) {
                            target.parent.remove(hash[getPositionHash(next)]);
                        }
                    }
                    
                    target.parent.add(next);
                }
                
                target.parent.remove(target);
            }
            
            SANGJA.builder.updateHierarchy();
            SANGJA.renderer.render();
        });
        
        $('#select-export-union').click(function () {
            var target, fileName;
            
            target = selectedObjects[0];
            
            if (target.name && target.name !== '') {
                fileName = target.name;
            } else {
                fileName = 'unnamed';
            }
            
            SANGJA.parser.download(SANGJA.parser.unionToJson(target), fileName + '.union', 'text/plain');
        });
        
        $('#select-add-script').click(function () {
            var target;
            
            target = selectedObjects[0];
            
            target.scriptList.push('');
            
            displayMenu();
        });
        
        $('#script-modal').on('hide.bs.modal', function () {
            currentTarget.scriptList[currentIndex] = $('#script-editor').val();
        });
        
        $(document).on('keydown', '#script-editor', function (e) {
            var start, end, keyCode = e.keyCode || e.which;

            if (keyCode === 9) {
                e.preventDefault();
                start = $(this).get(0).selectionStart;
                end = $(this).get(0).selectionEnd;

                // set textarea value to: text before caret + tab + text after caret
                $(this).val($(this).val().substring(0, start)
                    + "    "
                    + $(this).val().substring(end));

                // put caret at right position again
                $(this).get(0).selectionStart =
                    $(this).get(0).selectionEnd = start + 4;
            }
        });
    });
}());
