export enum TriageLane {
  ANALYTIC_OK = 'ANALYTIC_OK',
  MC_REQUIRED = 'MC_REQUIRED',
  ACTION_NOW = 'ACTION_NOW'
}

export interface GateResult {
  value: number;
  passed: boolean;
  reason: string;
}

export interface Gates {
  eta: GateResult; // Size ratio
  tangency: GateResult; // T
  conditioning: GateResult; // rho
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface CdmEvent {
  id: string;
  object1: string;
  object2: string;
  tca: string; // Time of Closest Approach (ISO)
  creationDate: string;
  missDistance: number; // meters
  relativeSpeed: number; // m/s
  pcAnalytic: number;
  pcMc?: number; // Monte Carlo result (optional)
  hbr: number; // Combined Hard Body Radius
  
  // Explainability
  gates: Gates;
  lane: TriageLane;
  
  // Raw Data for Viz
  relativePosition: Vector3;
  relativeVelocity: Vector3;
  covarianceDiagonal: Vector3; // Simplified for demo
}

export interface PolicyConfig {
  pcRedThreshold: number;
  etaThreshold: number;
  tangencyThreshold: number;
  conditioningThreshold: number;
  warningTimeThreshold: number; // hours
}

export interface SimulationResult {
  pc: number;
  samples: number;
  ciLower: number;
  ciUpper: number;
  points: { x: number; y: number; hit: boolean }[]; // For scatter plot
}