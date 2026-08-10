export interface Station {
  code: string;
  name: string;
}

export interface TrainSummary {
  trainNo: string;
  trainName: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  departure: string; // "16:35" at origin
  arrival: string; // "08:32" at destination
  duration: string; // "15h 57m"
  runDays: string[]; // ["Mon", "Tue", ...]
  classes: string[]; // ["1A", "2A", "3A"]
}

export type StopStatus = 'departed' | 'current' | 'upcoming';

export interface RouteStop {
  station: Station;
  scheduledArrival: string | null; // null at origin
  scheduledDeparture: string | null; // null at destination
  actualArrival: string | null;
  actualDeparture: string | null;
  delayMinutes: number;
  distanceKm: number;
  platform: string | null;
  dayOfJourney: number; // 1-based
  status: StopStatus;
}

export interface LiveStatus {
  trainNo: string;
  trainName: string;
  statusNote: string; // e.g. "Departed BPL, 12 km ahead is JHS"
  delayMinutes: number;
  lastUpdated: string; // "18:42"
  currentStationIndex: number;
  route: RouteStop[];
}

/** Wraps API results with the source so the UI can show a sample-data notice. */
export interface ApiResult<T> {
  data: T;
  source: 'live' | 'sample';
}
