/*************************************
* SANGJA PROJECT
* core module
**************************************/

/*global THREE, console*/

var SANGJA = {};

(function () {
    "use strict";
    
    SANGJA.core = {
        //Class
        Block: undefined,
        Union: undefined,
        
        //Method
        voxelToThree: undefined,
        threeToVoxel: undefined,
        isLocal: undefined
    };
    
    //기존 클래스에 메서드 추가
    //=====================
    
    Array.prototype.findAndRemove = function (target) {
        var index = this.indexOf(target);
        
        if (index !== -1) {
            this.splice(index, 1);
        }
        
        return index;
    };
    
    THREE.Object3D.prototype.ascendTo = function (level) {
        if (this.parent === undefined) {
            console.error('THREE.Object3D.ascendTo: Cannot ascend to ', level);
        } else if (this.parent === level) {
            return this;
        } else {
            return this.parent.ascendTo(level);
        }
    };
    
    //외곽선 관련 메서드
    THREE.Object3D.prototype.updateGuideBox = function () {
        if (this.guideEdge) {
            this.guideEdge.update({
                geometry: {
                    boundingBox: this.getBoundingBox()
                },
                matrixWorld: this.matrixWorld
            });
        }
    };
    
    THREE.Object3D.prototype.showGuideBox = function (color) {
        if (this.guideEdge === undefined) {
            this.guideEdge = new THREE.BoxHelper();
            this.parent.add(this.guideEdge);
        }
        this.guideEdge.material.setValues({ color: color });
        this.guideEdge.visible = true;
        
        this.updateGuideBox();
    };

    THREE.Object3D.prototype.hideGuideBox = function () {
        if (this.guideEdge) {
            this.guideEdge.visible = false;
        }
    };
    
    //커스텀 클래스 구현
    //===============
    
    //블록 클래스
    SANGJA.core.Block = (function () {
        var blockGeometry;
        
        function Block(setting) {
            THREE.Mesh.call(this, blockGeometry, new THREE.MeshLambertMaterial(setting));
            
            this.type = 'Block';
        }
        
        Block.SIZE = 10;
        
        Block.prototype = Object.create(THREE.Mesh.prototype);
        Block.prototype.constructor = Block;
        
        blockGeometry = new THREE.BoxGeometry(Block.SIZE, Block.SIZE, Block.SIZE);
        blockGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(Block.SIZE * 0.5, Block.SIZE * 0.5, Block.SIZE * 0.5));
        
        Block.prototype.setOpacity = function (opacity) {
            if (opacity === 1.0) {
                this.material.setValues({ transparent: false });
            } else {
                this.material.setValues({ transparent: true, opacity: opacity });
            }
        };
        
        Block.prototype.getBoundingBox = function () {
            if (this.geometry.boundingBox === null) {
                this.geometry.computeBoundingBox();
            }
            return this.geometry.boundingBox.clone();
        };
        
        return Block;
    }());
    
    //유니온 클래스
    SANGJA.core.Union = (function () {
        function Union() {
            THREE.Object3D.call(this);
            
            this.type = 'Union';
            
            this.objectList = []; //blocks + unions
            this.blockList = []; //only blocks
            this.unionList = []; //only unions
            
            this.scriptList = [];
            this.omniList = [];
        }
        
        Union.prototype = Object.create(THREE.Object3D.prototype);
        Union.prototype.constructor = Union;
        
        Union.prototype.add = function (target, interactable) {
            interactable = interactable === undefined ? true : interactable;
            
            if (interactable) {
                if (target instanceof SANGJA.core.Block) {
                    this.objectList.push(target);
                    this.blockList.push(target);
                } else if (target instanceof SANGJA.core.Union) {
                    this.objectList.push(target);
                    this.unionList.push(target);
                }
            }
            
            THREE.Object3D.prototype.add.call(this, target);
        };
        
        Union.prototype.remove = function (target, interactable) {
            interactable = interactable === undefined ? true : interactable;
            
            if (interactable) {
                if (target instanceof SANGJA.core.Block) {
                    this.objectList.findAndRemove(target);
                    this.blockList.findAndRemove(target);
                } else if (target instanceof SANGJA.core.Union) {
                    this.objectList.findAndRemove(target);
                    this.unionList.findAndRemove(target);
                }
            }
            
            THREE.Object3D.prototype.remove.call(this, target);
        };
        
        Union.prototype.createBlock = function (vector, setting) {
            var block = new SANGJA.core.Block(setting);
            
            block.position.copy(SANGJA.core.voxelToThree(vector));
            
            this.add(block);
        };
        
        Union.prototype.createUnion = function (array) {
            var union, center, i;
            
            union = new SANGJA.core.Union();
            
            for (i = 0; i < array.length; i += 1) {
                if (array[i] instanceof SANGJA.core.Block || array[i] instanceof SANGJA.core.Union) {
                    if (array[i].parent === this) {
                        union.add(array[i]);
                    } else {
                        console.error('BlockBuilder.Union.createUnion: ', array[i], ' is not a child of ', this);
                    }
                } else {
                    console.error('BlockBuilder.Union.createUnion: ', array[i], ' is not an instance of BlockBuilder.Block or BlockBuilder.Union');
                    return;
                }
            }
            
            this.add(union);
            
            center = union.getBoundingBox().center();
            union.position.copy(center);
            union.move(SANGJA.core.threeToVoxel(center.multiplyScalar(-1)));
        };
        
        Union.prototype.setOpacity = function (opacity) {
            var i, object;
            
            for (i = 0; i < this.objectList.length; i += 1) {
                object = this.objectList[i];
                object.setOpacity(opacity);
            }
        };
        
        //Block들을 전부 순회
        Union.prototype.traverseBlock = function (callback, recursive) {
            var i, next;
            
            if (recursive === undefined) {
                recursive = true;
            }
            
            for (i = 0; i < this.blockList.length; i += 1) {
                next = this.blockList[i];
                callback(next);
            }
            
            if (recursive) {
                for (i = 0; i < this.unionList.length; i += 1) {
                    next = this.unionList[i];
                    next.traverseBlock(callback, recursive);
                }
            }
        };
        
        //좌표 관련 함수들
        Union.prototype.move = function (x, y, z) {
            var vector, obj, i;
            
            if (x instanceof THREE.Vector3) {
                vector = x;
            } else {
                vector = new THREE.Vector3(x, y, z);
            }
            
            vector.multiplyScalar(SANGJA.core.Block.SIZE);
            
            for (i = 0; i < this.objectList.length; i += 1) {
                obj = this.objectList[i];
                obj.position.add(vector);
            }
            
            this.updateGuideBox();
        };
        
        Union.prototype.relativeLinearTransform = function (matrix) {
            var vector, obj, i;
            
            for (i = 0; i < this.blockList.length; i += 1) {
                obj = this.blockList[i];
                vector = obj.position;
                vector.addScalar(SANGJA.core.Block.SIZE * 0.5);
                vector.applyMatrix3(matrix);
                vector.addScalar(-SANGJA.core.Block.SIZE * 0.5);
            }
            
            for (i = 0; i < this.unionList.length; i += 1) {
                obj = this.unionList[i];
                vector = obj.position;
                vector.applyMatrix3(matrix);
                obj.relativeLinearTransform(matrix);
            }

            this.updateGuideBox();
            this.updateGizmo();
        };
        
        Union.prototype.getBoundingBox = function () {
            var vector, box, obj, i;
            
            for (i = 0; i < this.objectList.length; i += 1) {
                obj = this.objectList[i];
                box = box ? box.union(obj.getBoundingBox().translate(obj.position)) : obj.getBoundingBox().translate(obj.position);
            }
            
            return box;
        };
        
        //기즈모 관련 메서드
        Union.prototype.updateGizmo = function () {
            var box, geometry;

            if (this.guideAxis) {
                box = this.getBoundingBox();
                geometry = this.guideAxis.geometry;

                geometry.attributes.position.array[3] = box.max.x - box.min.x;
                geometry.attributes.position.array[10] = box.max.y - box.min.y;
                geometry.attributes.position.array[17] = box.max.z - box.min.z;
                geometry.attributes.position.needsUpdate = true;
            }
        };

        Union.prototype.showGizmo = function () {
            if (this.guideAxis === undefined) {
                this.guideAxis = new THREE.AxisHelper();
                this.add(this.guideAxis);
            }
            
            this.updateGizmo();
            this.guideAxis.visible = true;
        };
        
        Union.prototype.hideGizmo = function () {
            if (this.guideAxis) {
                this.guideAxis.visible = false;
            }
        };
        
        //기타 메서드
        Union.prototype.clone = function () {
            var json = SANGJA.parser.unionToJson(this);
            return SANGJA.parser.jsonToUnion(json);
        };
        
        return Union;
    }());
    
    //메서드 구현
    //==========
    
    SANGJA.core.voxelToThree = function (vector) {
        var result = new THREE.Vector3().copy(vector);
        result.multiplyScalar(SANGJA.core.Block.SIZE);

        return result;
    };
    
    SANGJA.core.threeToVoxel = function (vector) {
        var result = new THREE.Vector3().copy(vector);
        result.divideScalar(SANGJA.core.Block.SIZE);
        
        return result;
    };
    
    SANGJA.core.isLocal = function () {
        return window === window.parent;
    };
}());
