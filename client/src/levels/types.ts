import type { PropertyName } from '../../../shared/rules';
export type Point = readonly [x: number, y: number];

export interface Line {
  readonly from: Point;
  readonly to: Point;
}

export interface TrackDefinition {
  readonly id: string;
  readonly label?: string;
  readonly aliases?: readonly string[];
  readonly feature?: 'bounce' | 'friction';
  readonly material?: { readonly restitution?: number; readonly friction?: number };
  readonly editableProperties?: readonly PropertyName[];
  readonly points: readonly Point[];
  readonly thickness: number;
}

export interface Rect { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
export type DeviceDefinition =
  | { readonly kind: 'conveyor'; readonly id: string; readonly area: Rect; readonly speed: number }
  | { readonly kind: 'spring'; readonly id: string; readonly area: Rect; readonly power: number; readonly launchBase: Point; readonly launchPerPower: Point; readonly chargeSeconds?: number }
  | { readonly kind: 'fan'; readonly id: string; readonly area: Rect; readonly power: number; readonly acceleration: Point }
  | { readonly kind: 'rotor'; readonly id: string; readonly position: Point; readonly radius: number; readonly angularSpeed: number }
  | { readonly kind: 'sensor'; readonly id: string; readonly position: Point; readonly radius: number }
  | { readonly kind: 'gate'; readonly id: string; readonly area: Rect };

// Level files contain data only; Matter bodies and rendering state belong to the runtime.
export interface LevelDefinition {
  readonly id: string;
  readonly number: number;
  readonly stage?: number;
  readonly title: string;
  readonly presentation?: 'bakery';
  readonly editableWorldProperties?: readonly PropertyName[];
  readonly editableSurfaceProperties?: readonly PropertyName[];
  readonly editableDevices?: readonly string[];
  readonly tutorials?: readonly { readonly id: string; readonly deviceId: string; readonly title: string; readonly body: string }[];
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly pixelsPerMetre: number;
  };
  readonly timeLimitSeconds: number;
  readonly initialGravity: number;
  readonly devices?: readonly DeviceDefinition[];
  readonly commandLimit?: number;
  readonly failOnFall?: boolean;
  readonly openEdges?: readonly ('left' | 'right')[];
  readonly ceilingY?: number;
  readonly environment?: { readonly restitution: number; readonly friction: number };
  readonly ball: {
    readonly id: string;
    readonly label: string;
    readonly position: Point;
    // Metres per second; positions and shape dimensions use viewport coordinates.
    readonly velocity: Point;
    readonly radius: number;
    readonly restitution: number;
    readonly shape?: { readonly kind: 'box'; readonly width: number; readonly height: number };
  };
  readonly tracks: readonly TrackDefinition[];
  readonly guideLines: readonly Line[];
  readonly exit: {
    readonly id: string;
    readonly label: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly condition?: { readonly kind: 'settle'; readonly seconds: number; readonly maxSpeed: number };
  };
  readonly instructions: {
    readonly objective: string;
    readonly hint: string;
    readonly sceneDescription: string;
    readonly canvasHeading: string;
    readonly readyCaption: string;
    readonly exampleMessages: readonly string[];
    readonly suggestedMessages: readonly string[];
    readonly exampleNotice: string;
  };
}
