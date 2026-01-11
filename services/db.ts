import Dexie, { type EntityTable } from 'dexie';
import { CdmEvent } from '../types';

// Define the database
const db = new Dexie('DebriSolverDB') as Dexie & {
  events: EntityTable<CdmEvent, 'id'>;
};

// Define schema
db.version(1).stores({
  events: 'id, object1, object2, tca, lane, pcAnalytic' // Primary key and indexed props
});

export { db };