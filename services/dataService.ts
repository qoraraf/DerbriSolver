import { CdmEvent, TriageLane, PolicyConfig, SimulationResult, Vector3 } from '../types';
import { MOCK_NAMES } from '../constants';
import { db } from './db';

// Seeded random-ish generator for consistency during session
let seed = 123;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomRange(min: number, max: number) {
  return random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

const generateRandomVector = (scale: number): Vector3 => ({
    x: randomRange(-scale, scale),
    y: randomRange(-scale, scale),
    z: randomRange(-scale, scale)
});

// Logic to apply gates based on policy
export const applyPolicy = (event: CdmEvent, policy: PolicyConfig): CdmEvent => {
  const { eta, tangency, conditioning } = event.gates;
  const pc = event.pcAnalytic;
  
  // Re-eval gates based on new policy
  const etaPassed = eta.value < policy.etaThreshold;
  const tanPassed = tangency.value < policy.tangencyThreshold;
  const condPassed = conditioning.value < policy.conditioningThreshold;

  let lane = TriageLane.ANALYTIC_OK;

  // Lane Logic
  // 1. If Pc > Red Threshold -> MC Required
  if (pc >= policy.pcRedThreshold) {
    lane = TriageLane.MC_REQUIRED;
  }
  // 2. If any gate fails -> MC Required
  else if (!etaPassed || !tanPassed || !condPassed) {
    lane = TriageLane.MC_REQUIRED;
  }
  
  // 3. If Action Now Logic (usually post-MC, but we can check analytic for High Risk)
  const hoursToTca = (new Date(event.tca).getTime() - new Date().getTime()) / 36e5;
  if (pc > 1e-3 && hoursToTca < policy.warningTimeThreshold) {
    lane = TriageLane.ACTION_NOW;
  }

  // If MC has been run and is high
  if (event.pcMc !== undefined && event.pcMc > policy.pcRedThreshold && hoursToTca < policy.warningTimeThreshold) {
      lane = TriageLane.ACTION_NOW;
  }

  return {
    ...event,
    lane,
    gates: {
      eta: { ...eta, passed: etaPassed },
      tangency: { ...tangency, passed: tanPassed },
      conditioning: { ...conditioning, passed: condPassed }
    }
  };
};

export const generateMockEvents = (count: number, policy: PolicyConfig): CdmEvent[] => {
  const events: CdmEvent[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const id = `CDM-${20250000 + i}`;
    const obj1 = randomChoice(MOCK_NAMES);
    let obj2 = randomChoice(MOCK_NAMES);
    while (obj1 === obj2) obj2 = randomChoice(MOCK_NAMES);

    const tcaOffsetHours = randomRange(1, 72);
    const tca = new Date(now.getTime() + tcaOffsetHours * 3600 * 1000).toISOString();
    const creationDate = new Date(now.getTime() - randomRange(1, 12) * 3600 * 1000).toISOString();

    const missDistance = randomRange(10, 5000);
    const hbr = randomRange(2, 15);
    
    // Weighted PC generation
    let pcAnalytic = 0;
    const roll = random();
    if (roll > 0.95) pcAnalytic = randomRange(1e-4, 1e-2); // High risk
    else if (roll > 0.8) pcAnalytic = randomRange(1e-6, 1e-4); // Medium
    else pcAnalytic = randomRange(1e-9, 1e-6); // Low

    const etaVal = randomRange(1, 20);
    const tanVal = randomRange(0.8, 1.0);
    const rhoVal = randomRange(1, 10);

    const rawEvent: CdmEvent = {
      id,
      object1: obj1,
      object2: obj2,
      tca,
      creationDate,
      missDistance,
      relativeSpeed: randomRange(5000, 15000),
      pcAnalytic,
      hbr,
      relativePosition: generateRandomVector(missDistance),
      relativeVelocity: generateRandomVector(7000),
      covarianceDiagonal: { x: randomRange(10, 100), y: randomRange(100, 1000), z: randomRange(10, 50) },
      gates: {
        eta: { value: etaVal, passed: true, reason: 'Size ratio high' },
        tangency: { value: tanVal, passed: true, reason: 'Geometry alignment' },
        conditioning: { value: rhoVal, passed: true, reason: 'Poor covariance' },
      },
      lane: TriageLane.ANALYTIC_OK // Default, will be recalculated
    };

    events.push(applyPolicy(rawEvent, policy));
  }
  
  // Sort by risk (Analytic PC desc)
  return events.sort((a, b) => b.pcAnalytic - a.pcAnalytic);
};

// Simulate a heavy Monte Carlo Calculation
export const runMonteCarlo = async (event: CdmEvent, samples: number = 5000): Promise<SimulationResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate hits based on analytic PC + some noise
      const trueProb = event.pcAnalytic * randomRange(0.8, 1.2); 
      let hits = 0;
      const points = [];
      
      // We only generate a subset of points for the UI to render to keep it fast
      const uiPointsLimit = 500;
      
      for(let i=0; i<samples; i++) {
         const isHit = Math.random() < trueProb;
         if (isHit) hits++;
         
         if (i < uiPointsLimit) {
            // Generate visual scatter points in encounter plane (2D)
            // Center is 0,0. 
            // We simulate a Gaussian cloud. 
            // If it's a hit, it must be within HBR.
            const angle = Math.random() * Math.PI * 2;
            const r = isHit 
                ? Math.random() * event.hbr // Inside collision radius
                : event.hbr + Math.random() * event.missDistance * 0.5; // Outside
            
            points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                hit: isHit
            });
         }
      }

      const pc = hits / samples;
      
      // Wilson score interval approximation for 95% CI
      const z = 1.96;
      const factor = z * Math.sqrt((pc * (1 - pc)) / samples);
      
      resolve({
        pc,
        samples,
        ciLower: Math.max(0, pc - factor),
        ciUpper: pc + factor,
        points
      });
    }, 1500); // Artificial delay 1.5s
  });
};

// DB Operations
export const fetchEventsFromDb = async (): Promise<CdmEvent[]> => {
  return await db.events.toArray();
};

export const clearDb = async (): Promise<void> => {
    await db.events.clear();
}

export const saveEventsToDb = async (events: CdmEvent[]) => {
    await db.events.bulkPut(events);
}

// CSV Parsing Helper
const parseCsvLine = (line: string, delimiter: string, headers: string[], policy: PolicyConfig, index: number): CdmEvent | null => {
    if (!line.trim()) return null;
    const values = line.split(delimiter).map(v => v.trim());
    
    // Simple mapping
    const getVal = (keyPart: string) => {
        const idx = headers.findIndex(h => h.includes(keyPart));
        return idx >= 0 ? values[idx] : null;
    }

    // Basic Robustness: If line doesn't have enough columns, skip or try best effort
    if (values.length < Math.min(3, headers.length)) return null;

    const id = getVal('id') || `IMP-${Date.now()}-${index}`;
    const obj1 = getVal('object1') || 'UNKNOWN_1';
    const obj2 = getVal('object2') || 'UNKNOWN_2';
    
    const tcaRaw = getVal('tca');
    let tca = tcaRaw || new Date().toISOString();
    
    // Attempt to normalize date to ISO if it's not (e.g. 2023-01-01 12:00:00)
    if (tcaRaw && !tcaRaw.includes('T')) {
        const parsed = Date.parse(tcaRaw);
        if (!isNaN(parsed)) {
            tca = new Date(parsed).toISOString();
        }
    }
    
    const dist = parseFloat(getVal('miss') || '1000');
    const speed = parseFloat(getVal('speed') || getVal('velocity') || '7500');
    const pc = parseFloat(getVal('prob') || getVal('pc') || '0');
    
    // Generate missing data for demo purpose if CSV is partial
    const hbr = 5 + Math.random() * 5;
    
    const rawEvent: CdmEvent = {
        id,
        object1: obj1,
        object2: obj2,
        tca: tca,
        creationDate: new Date().toISOString(),
        missDistance: isNaN(dist) ? 1000 : dist,
        relativeSpeed: isNaN(speed) ? 7500 : speed,
        pcAnalytic: isNaN(pc) ? 0 : pc,
        hbr,
        relativePosition: generateRandomVector(dist),
        relativeVelocity: generateRandomVector(speed),
        covarianceDiagonal: { x: 50, y: 500, z: 50 },
        gates: {
            eta: { value: Math.random() * 15, passed: true, reason: '' },
            tangency: { value: 0.9 + Math.random() * 0.1, passed: true, reason: '' },
            conditioning: { value: Math.random() * 8, passed: true, reason: '' }
        },
        lane: TriageLane.ANALYTIC_OK
    };

    return applyPolicy(rawEvent, policy);
};

// CSV Streaming Import
export const parseAndImportCdmFile = async (
    file: File, 
    policy: PolicyConfig,
    onProgress: (percent: number) => void
): Promise<void> => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks implicit in stream usually
    const totalSize = file.size;
    let processedBytes = 0;
    
    // Use Web Streams API
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let leftover = '';
    let isFirstChunk = true;
    let headers: string[] = [];
    let delimiter = ',';
    let bufferEvents: CdmEvent[] = [];
    let lineIndex = 0;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        processedBytes += value.byteLength;
        const chunk = decoder.decode(value, { stream: true });
        const text = leftover + chunk;
        const lines = text.split('\n');
        
        // Save the last line as it might be incomplete, unless it's the very last chunk (handled after loop)
        leftover = lines.pop() || ''; 
        
        if (isFirstChunk) {
            // Parse header from first line
            const firstLine = lines[0];
            if (!firstLine) continue; // Empty file?
            
            if (firstLine.includes('\t')) delimiter = '\t';
            else if (firstLine.includes(';')) delimiter = ';';
            
            headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim());
            lines.shift(); // Remove header line
            isFirstChunk = false;
        }
        
        // Process lines in this chunk
        for (const line of lines) {
            const evt = parseCsvLine(line, delimiter, headers, policy, lineIndex++);
            if (evt) bufferEvents.push(evt);
        }
        
        // Batch Insert to DB to keep memory usage low
        if (bufferEvents.length >= 1000) {
            await saveEventsToDb(bufferEvents);
            bufferEvents = [];
            // Yield to main thread to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Report Progress
        onProgress(Math.min(99, Math.round((processedBytes / totalSize) * 100)));
    }
    
    // Process any leftover text
    if (leftover.trim()) {
        const evt = parseCsvLine(leftover, delimiter, headers, policy, lineIndex++);
        if (evt) bufferEvents.push(evt);
    }
    
    // Final Flush
    if (bufferEvents.length > 0) {
        await saveEventsToDb(bufferEvents);
    }
    
    onProgress(100);
}