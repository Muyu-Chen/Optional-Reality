import { normalizeAccelerationOperation,accelerationAxis } from '../../../shared/acceleration';
import type { Operation } from '../../../shared/rules';

function cue(candidate?:Operation) {
  if(!candidate)return {icon:'…',tone:'neutral'};
  const operation=normalizeAccelerationOperation(candidate);
  if(operation.type==='add_sensor_trigger')return {icon:'⌁',tone:'drive'};
  const axis=accelerationAxis(operation.property);
  if(axis) {
    const icon=operation.type==='scale_property' ? operation.factor<0?axis==='x'?'↔':'↕':'×'
      : operation.value===0?'○':axis==='x'?operation.value>0?'→':'←':operation.value>0?'↓':'↑';
    return {icon,tone:'acceleration'};
  }
  if(operation.property==='restitution'||operation.property==='spring_power')return {icon:'↥',tone:'bounce'};
  if(operation.property==='friction')return {icon:'≋',tone:'friction'};
  return {icon:operation.property==='angular_speed'?'⟳':'➜',tone:'drive'};
}

// The cue describes the prepared operation, never a guessed future trajectory.
export function RulePreview({operations,description,error=false}:{operations:Operation[];description:string;error?:boolean}) {
  const {icon,tone}=cue(operations[0]);
  return <p className={`parsed-rule rule-preview rule-preview--${error?'error':tone}`} title={description}>
    <span className="rule-preview-icon" aria-hidden="true">{error?'!':icon}</span>
    <span className="rule-preview-label">{description}</span>
  </p>;
}
