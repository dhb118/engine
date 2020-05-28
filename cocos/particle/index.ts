/**
 * @hidden
 */

import { BillboardComponent } from './billboard-component';
import { LineComponent } from './line-component';
import { TrailComponent } from './trail-component';
import { ParticleSystemComponent } from './particle-system-component';
import { ParticleUtils } from './particle-utils';
import './deprecated';

export {
    BillboardComponent,
    LineComponent,
    TrailComponent,
    ParticleSystemComponent,
    ParticleUtils
};

cc.ParticleSystemComponent = ParticleSystemComponent;
cc.BillboardComponent = BillboardComponent;
cc.LineComponent = LineComponent;
cc.TrailComponent = TrailComponent;
cc.ParticleUtils = ParticleUtils;