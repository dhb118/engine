
/**
 * 拖尾模块
 * @category particle
 */


import { Material, Texture2D } from '../core/assets';
import { Component } from '../core/components';
import { ccclass, help, executeInEditMode, menu, property, integer } from '../core/data/class-decorator';
import { Vec3, Vec2, Vec4 } from '../core/math';
import { LineModel } from './models/line-model';
import { builtinResMgr } from '../core/3d/builtin';
import CurveRange from './animator/curve-range';
import GradientRange from './animator/gradient-range';
import { math } from '../core';
import { IMaterialInstanceInfo, MaterialInstance } from '../core/renderer/core/material-instance';

const CC_USE_WORLD_SPACE = 'CC_USE_WORLD_SPACE';
const define = { CC_USE_WORLD_SPACE: true };

const _matInsInfo: IMaterialInstanceInfo = {
    parent: null!,
    owner: null!,
    subModelIdx: 0,
};


@ccclass('cc.TrailComponent')
@help('i18n:cc.TrailComponent')
@menu('Components/Trail')
@executeInEditMode
export class TrailComponent extends Component {

    @property({
        type: Material
    })
    private _material:Material | null = null;

    @property({
        type: Material,
        displayOrder: 0,
        tooltip:'拖尾材质',
    })
    get material(){
        return this._material;
    }
    set material(val){
        this._material = val;
        this._updateMaterial(val);
    }


    private _positions:Vec3[] = [];

    @property({
        type: CurveRange,
    })
    private _width = new CurveRange();

    /**
     * @zh 线段的宽度。
     */
    @property({
        type: CurveRange,
        displayOrder: 3,
        tooltip:'线段宽度，如果采用曲线，则表示沿着线段方向上的曲线变化',
    })
    get width () {
        return this._width;
    }

    set width (val) {
        this._width = val;
        //force wrap
        this._width.curve.preWrapMode = 1;
        this._width.curve.postWrapMode = 1;
        this._width.curveMin.preWrapMode = 1;
        this._width.curveMin.postWrapMode = 1;
        this._width.curveMax.preWrapMode = 1;
        this._width.curveMax.postWrapMode = 1;
        if (this._model) {
            this._model.addLineVertexData(this._positions, this._width, this._color);
        }
    }

    @property({
        type: GradientRange,
    })
    private _color = new GradientRange();

    /**
     * @zh 线段颜色。
     */
    @property({
        type: GradientRange,
        displayOrder: 6,
        tooltip:'线段颜色，如果采用渐变色，则表示沿着线段方向上的颜色渐变',
    })
    get color () {
        return this._color;
    }

    set color (val) {
        this._color = val;
        if (this._model) {
            this._model.addLineVertexData(this._positions, this._width, this._color);
        }
    }

    /**
     * @zh 拖尾持续时间 单位秒
     */
    @property
    private _time = 5;

    @property({
        displayOrder: 7,
        tooltip:"How long the tail should be (seconds). { 0, infinity}"
    })
    get time () {
        return this._time;
    }

    set time(val) {
        this._time = val;
    }

    @property
    private _minDistance = 1;

    private _minSquaredDistance = 0;

    @property({
        tooltip:"The minimum distance to spawn a new point on the trail range { 0, infinity}"
    })
    get minDistance(){
        return this._minDistance;
    }
    set minDistance(val){
        this._minDistance = val ;
        this._minSquaredDistance = val * val;
    }

    /**
     * @ignore
     */
    private _model: LineModel | null = null;

    private _timeStamps:Array<number> = [];

    private _materialInstance : MaterialInstance | null = null;

    constructor () {
        super();
    }

    public onLoad () {
        this._model = cc.director.root.createModel(LineModel);
        this._model!.initialize(this.node);
        this._model!.setCapacity(100);

        if (this._material == null) {
            this._material = new Material();
            this._material.copy(builtinResMgr.get<Material>('default-trail-material'));
        }

        this._updateMaterial(this._material);
    }

    protected _updateMaterial(mat:Material | null){
        let inst = this._materialInstance;
        if (inst && inst.parent !== mat) {
            inst!.destroy();
            this._materialInstance = null;
        }

        if(mat){
            _matInsInfo.parent = mat;
            // _matInsInfo.owner = null;
            _matInsInfo.subModelIdx = 0;
            const instantiated = new MaterialInstance(_matInsInfo);
            instantiated.recompileShaders(define);
            this._materialInstance = instantiated;
            this._model!.setSubModelMaterial(0, instantiated);
        }
    }

    public onEnable () {
        if (!this._model) {
            return;
        }

        this.attachToScene();
        this._model.addLineVertexData(this._positions, this._width, this._color);
    }

    public onDisable () {
        if (this._model) {
            this.detachFromScene();
        }
        this._timeStamps = [];
        this._positions = [];
    }

    protected onDestroy(){
        if (this._model) {
            cc.director.root.destroyModel(this._model);
            this._model = null;
        }

        if(this._materialInstance){
            this._materialInstance.destroy();
            this._materialInstance = null;
        }

        if(this._material){
            this._material.destroy();
            this._material = null;
        }
    }

    protected update(dt){

        let now = Date.now();
        let needUpdateModel = false;
        // Remove last vertrices if neccessary
        while (this._timeStamps.length>0 && now > this._timeStamps[this._timeStamps.length-1] + this._time*1000) {
            this._positions.pop();
            this._timeStamps.pop();
            needUpdateModel = true;
        }

        if(this.node){
            const p = this.node.worldPosition;
            if( this._positions.length==0 || Vec3.squaredDistance(this._positions[0],p) > this._minSquaredDistance)
            {
                this._positions.unshift(p.clone());
                this._timeStamps.unshift(now);
                needUpdateModel = true;
            }
        }

        if (needUpdateModel && this._model) {
            this._model.addLineVertexData(this._positions, this._width, this._color);
        }
    }


    protected attachToScene () {
        if (this._model && this.node && this.node.scene) {
            if (this._model.scene) {
                this.detachFromScene();
            }
            this._getRenderScene().addModel(this._model);
        }
    }

    protected detachFromScene () {
        if (this._model && this._model.scene) {
            this._model.scene.removeModel(this._model);
        }
    }
}
