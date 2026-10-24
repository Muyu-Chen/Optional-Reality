export type Point = readonly [x: number, y: number];

export interface Line {
  readonly from: Point;
  readonly to: Point;
}

export interface TrackDefinition {
  readonly id: string;
  readonly points: readonly Point[];
  readonly thickness: number;
}

// Level files contain data only; Matter bodies and rendering state belong to the runtime.
export interface LevelDefinition {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly pixelsPerMetre: number;
  };
  readonly timeLimitSeconds: number;
  readonly initialGravity: number;
  readonly ball: {
    readonly id: string;
    readonly label: string;
    readonly position: Point;
    // Metres per second; positions and shape dimensions use viewport coordinates.
    readonly velocity: Point;
    readonly radius: number;
    readonly restitution: number;
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
