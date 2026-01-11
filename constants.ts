import { PolicyConfig } from './types';

export const DEFAULT_POLICY: PolicyConfig = {
  pcRedThreshold: 1e-4,
  etaThreshold: 10,
  tangencyThreshold: 0.97,
  conditioningThreshold: 5.0,
  warningTimeThreshold: 24,
};

export const MOCK_NAMES = [
  'STARLINK-1002', 'DEBRIS (FENGYUN)', 'COSMOS 2251 DEB', 'NOAA 17', 'INTELSAT 901', 
  'TITAN 3C TRANSTAGE', 'SL-12 R/B', 'PAYLOAD A', 'UNKNOWN', 'FALCON 9 DEB'
];

// Helper to format scientific notation slightly nicer
export const formatSci = (num: number) => {
  return num.toExponential(2).replace('e', 'E');
};

export const formatDist = (num: number) => {
  return num.toFixed(2);
};