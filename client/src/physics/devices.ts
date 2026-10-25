import Matter from 'matter-js';
import type { RuleState } from '../../../shared/rules';
import type { LevelDefinition, Rect } from '../levels/types';

const { Bodies, Body, Composite, Constraint } = Matter;
export interface SpringState { phase: 'idle' | 'charging' | 'launched'; elapsed: number; anchor?: Matter.Constraint; origin?: {x:number;y:number} }
export interface DeviceEvent { type: 'spring_charging' | 'spring_released'; deviceId: string }
const overlaps = (ball: Matter.Body, radius: number, area: Rect) => {
  const x = Math.max(area.x, Math.min(ball.position.x, area.x + area.width));
  const y = Math.max(area.y, Math.min(ball.position.y, area.y + area.height));
  return (ball.position.x - x) ** 2 + (ball.position.y - y) ** 2 <= radius ** 2;
};

// Devices affect the environment or respond to physical contact. User rules never edit the core.
export class DeviceRuntime {
  readonly gates = new Map<string, Matter.Body>();
  readonly rotors = new Map<string, Matter.Body>();
  readonly openGates = new Set<string>();
  readonly firedSprings = new Set<string>();
  readonly springs = new Map<string,SpringState>();
  private events: DeviceEvent[] = [];
  private touchingRotors = new Set<string>();

  constructor(private level: LevelDefinition, private engine: Matter.Engine, private ball: Matter.Body) {
    for (const device of level.devices || []) {
      if (device.kind === 'spring') this.springs.set(device.id,{phase:'idle',elapsed:0});
      if (device.kind === 'gate') {
        const { x, y, width, height } = device.area;
        const body = Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true, label: device.id });
        this.gates.set(device.id, body); Composite.add(engine.world, body);
      } else if (device.kind === 'rotor') {
        const body = Bodies.circle(...device.position, device.radius, { isStatic: true, label: device.id });
        this.rotors.set(device.id, body); Composite.add(engine.world, body);
      }
    }
  }
  takeEvents() { const events=this.events; this.events=[]; return events; }
  private accelerate(x: number, y: number) {
    const factor = this.level.viewport.pixelsPerMetre / 1_000_000 * this.ball.mass;
    Body.applyForce(this.ball, this.ball.position, { x: x * factor, y: y * factor });
  }
  beforeStep(rules: RuleState, dt: number) {
    const { ball, level } = this;
    const radius = level.ball.radius, ppm = level.viewport.pixelsPerMetre;
    for (const device of level.devices || []) {
      const values = rules.values[device.id] || {};
      switch (device.kind) {
        case 'fan':
          if (overlaps(ball, radius, device.area)) {
            const power = values.fan_power ?? device.power;
            this.accelerate(device.acceleration[0] * power, device.acceleration[1] * power);
          }
          break;
        case 'conveyor': {
          const onSurface = overlaps(ball, radius, device.area)
            && Matter.Query.collides(ball, this.engine.world.bodies.filter(body => level.tracks.some(track => track.id === body.label))).length > 0;
          if (onSurface) {
            const speed = values.conveyor_speed ?? device.speed;
            const velocity = Body.getVelocity(ball).x * 60 / ppm;
            this.accelerate((1.725 * speed - velocity) * 7.5, 0);
          }
          break;
        }
        case 'spring': {
          const power = values.spring_power ?? device.power;
          const state = this.springs.get(device.id)!;
          const touching = overlaps(ball,radius,device.area);
          if (state.phase === 'launched' && !touching) state.phase='idle';
          if (state.phase === 'charging' && power <= 0) {
            if(state.anchor) Composite.remove(this.engine.world,state.anchor);
            state.anchor=undefined;state.phase='idle';state.elapsed=0;
          }
          if (power <= 0) break;
          if (state.phase === 'idle' && touching) {
            state.phase='charging';state.elapsed=0;
            state.origin={...ball.position};
            state.anchor=Constraint.create({bodyA:ball,pointB:{...ball.position},stiffness:1,damping:.2,length:0});
            Composite.add(this.engine.world,state.anchor);
            Body.setVelocity(ball,{x:0,y:0});Body.setAngularVelocity(ball,0);
            this.events.push({type:'spring_charging',deviceId:device.id});
          } else if(state.phase === 'charging') state.elapsed+=dt;
          if(state.phase==='charging' && state.anchor && state.origin) {
            const fraction=Math.min(1,state.elapsed/(device.chargeSeconds || dt));
            state.anchor.pointB.y=state.origin.y+(device.compressionDistance || 0)*fraction;
          }
          if(state.phase === 'charging' && state.elapsed+1e-8 >= (device.chargeSeconds ?? 0)) {
            if(state.anchor) Composite.remove(this.engine.world,state.anchor);
            state.anchor=undefined;state.phase='launched';
            this.firedSprings.add(device.id);
            Body.setVelocity(ball, {
              x: (device.launchBase[0] + device.launchPerPower[0] * power) * ppm / 60,
              y: (device.launchBase[1] + device.launchPerPower[1] * power) * ppm / 60,
            });
            this.events.push({type:'spring_released',deviceId:device.id});
          }
          break;
        }
        case 'rotor': {
          const body = this.rotors.get(device.id)!;
          const speed = values.angular_speed ?? device.angularSpeed;
          Body.setAngle(body, body.angle + speed * dt * 2.4);
          const dx = ball.position.x - device.position[0], dy = ball.position.y - device.position[1];
          const distance = Math.hypot(dx, dy);
          const touching = distance <= radius + device.radius + .5;
          if (touching && !this.touchingRotors.has(device.id) && distance > 0) {
            const velocity = Body.getVelocity(ball);
            Body.setVelocity(ball, { x: velocity.x - dy / distance * speed * 115 / 60, y: velocity.y + dx / distance * speed * 115 / 60 });
          }
          if (touching) this.touchingRotors.add(device.id); else this.touchingRotors.delete(device.id);
          break;
        }
      }
    }
  }
  afterStep(rules: RuleState) {
    for (const trigger of rules.triggers) {
      const sensor = (this.level.devices || []).find(device => device.id === trigger.sensor && device.kind === 'sensor');
      if (sensor?.kind !== 'sensor') continue;
      const distance = Math.hypot(this.ball.position.x - sensor.position[0], this.ball.position.y - sensor.position[1]);
      if (distance <= sensor.radius + this.level.ball.radius) this.setGate(trigger.gate, true);
    }
  }
  syncRules(rules: RuleState) {
    for (const id of this.openGates) if (!rules.triggers.some(trigger => trigger.gate === id)) this.setGate(id, false);
    for (const body of [...this.gates.values(), ...this.rotors.values()]) {
      body.restitution = rules.values.world?.restitution ?? 0;
      body.friction = rules.values.world?.friction ?? 0;
    }
  }
  private setGate(id: string, open: boolean) {
    const body = this.gates.get(id);
    if (!body || this.openGates.has(id) === open) return;
    if (open) { Composite.remove(this.engine.world, body); this.openGates.add(id); }
    else { Composite.add(this.engine.world, body); this.openGates.delete(id); }
  }
}
