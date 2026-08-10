import { LiveStatus, RouteStop, Station, TrainSummary } from './types';

// Bundled sample data so the app is fully usable before a RapidAPI key is added.
// Live position is simulated from the device clock so the timeline feels real.

interface StopSpec {
  code: string;
  name: string;
  offsetMin: number; // arrival, minutes after origin departure
  dwellMin: number;
  distanceKm: number;
  platform: string | null;
}

interface MockTrain {
  trainNo: string;
  trainName: string;
  originDeparture: string; // "HH:MM"
  runDays: string[];
  classes: string[];
  baseDelayMin: number;
  stops: StopSpec[];
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MOCK_TRAINS: MockTrain[] = [
  {
    trainNo: '12951',
    trainName: 'Mumbai Rajdhani Express',
    originDeparture: '17:00',
    runDays: ALL_DAYS,
    classes: ['1A', '2A', '3A'],
    baseDelayMin: 12,
    stops: [
      { code: 'MMCT', name: 'Mumbai Central', offsetMin: 0, dwellMin: 0, distanceKm: 0, platform: '3' },
      { code: 'BVI', name: 'Borivali', offsetMin: 27, dwellMin: 2, distanceKm: 30, platform: '5' },
      { code: 'ST', name: 'Surat', offsetMin: 160, dwellMin: 3, distanceKm: 263, platform: '2' },
      { code: 'BRC', name: 'Vadodara Jn', offsetMin: 253, dwellMin: 5, distanceKm: 392, platform: '1' },
      { code: 'RTM', name: 'Ratlam Jn', offsetMin: 448, dwellMin: 5, distanceKm: 654, platform: '4' },
      { code: 'KOTA', name: 'Kota Jn', offsetMin: 590, dwellMin: 5, distanceKm: 882, platform: '2' },
      { code: 'NDLS', name: 'New Delhi', offsetMin: 932, dwellMin: 0, distanceKm: 1384, platform: '16' },
    ],
  },
  {
    trainNo: '12301',
    trainName: 'Howrah Rajdhani Express',
    originDeparture: '16:55',
    runDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    classes: ['1A', '2A', '3A'],
    baseDelayMin: 0,
    stops: [
      { code: 'HWH', name: 'Howrah Jn', offsetMin: 0, dwellMin: 0, distanceKm: 0, platform: '9' },
      { code: 'DHN', name: 'Dhanbad Jn', offsetMin: 200, dwellMin: 5, distanceKm: 259, platform: '3' },
      { code: 'GAYA', name: 'Gaya Jn', offsetMin: 320, dwellMin: 5, distanceKm: 458, platform: '1' },
      { code: 'DDU', name: 'Pt. DD Upadhyaya Jn', offsetMin: 445, dwellMin: 10, distanceKm: 662, platform: '4' },
      { code: 'PRYJ', name: 'Prayagraj Jn', offsetMin: 560, dwellMin: 5, distanceKm: 815, platform: '6' },
      { code: 'CNB', name: 'Kanpur Central', offsetMin: 680, dwellMin: 5, distanceKm: 1009, platform: '1' },
      { code: 'NDLS', name: 'New Delhi', offsetMin: 1025, dwellMin: 0, distanceKm: 1451, platform: '2' },
    ],
  },
  {
    trainNo: '12002',
    trainName: 'Bhopal Shatabdi Express',
    originDeparture: '06:00',
    runDays: ALL_DAYS,
    classes: ['EC', 'CC'],
    baseDelayMin: 5,
    stops: [
      { code: 'NDLS', name: 'New Delhi', offsetMin: 0, dwellMin: 0, distanceKm: 0, platform: '1' },
      { code: 'AGC', name: 'Agra Cantt', offsetMin: 117, dwellMin: 2, distanceKm: 195, platform: '1' },
      { code: 'GWL', name: 'Gwalior Jn', offsetMin: 205, dwellMin: 2, distanceKm: 313, platform: '1' },
      { code: 'VGLJ', name: 'Virangana Lakshmibai Jhansi', offsetMin: 270, dwellMin: 4, distanceKm: 411, platform: '2' },
      { code: 'BPL', name: 'Bhopal Jn', offsetMin: 465, dwellMin: 0, distanceKm: 702, platform: '4' },
    ],
  },
  {
    trainNo: '12622',
    trainName: 'Tamil Nadu Express',
    originDeparture: '22:30',
    runDays: ALL_DAYS,
    classes: ['1A', '2A', '3A', 'SL'],
    baseDelayMin: 25,
    stops: [
      { code: 'NDLS', name: 'New Delhi', offsetMin: 0, dwellMin: 0, distanceKm: 0, platform: '9' },
      { code: 'AGC', name: 'Agra Cantt', offsetMin: 155, dwellMin: 5, distanceKm: 195, platform: '3' },
      { code: 'VGLJ', name: 'Virangana Lakshmibai Jhansi', offsetMin: 330, dwellMin: 10, distanceKm: 411, platform: '1' },
      { code: 'BPL', name: 'Bhopal Jn', offsetMin: 555, dwellMin: 10, distanceKm: 702, platform: '2' },
      { code: 'NGP', name: 'Nagpur Jn', offsetMin: 890, dwellMin: 10, distanceKm: 1092, platform: '2' },
      { code: 'BPQ', name: 'Balharshah Jn', offsetMin: 1055, dwellMin: 10, distanceKm: 1300, platform: '1' },
      { code: 'WL', name: 'Warangal', offsetMin: 1230, dwellMin: 2, distanceKm: 1543, platform: '2' },
      { code: 'BZA', name: 'Vijayawada Jn', offsetMin: 1360, dwellMin: 10, distanceKm: 1751, platform: '5' },
      { code: 'MAS', name: 'Chennai Central', offsetMin: 1795, dwellMin: 0, distanceKm: 2182, platform: '7' },
    ],
  },
  {
    trainNo: '12009',
    trainName: 'Mumbai Ahmedabad Shatabdi',
    originDeparture: '06:20',
    runDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    classes: ['EC', 'CC'],
    baseDelayMin: 0,
    stops: [
      { code: 'MMCT', name: 'Mumbai Central', offsetMin: 0, dwellMin: 0, distanceKm: 0, platform: '2' },
      { code: 'BVI', name: 'Borivali', offsetMin: 24, dwellMin: 3, distanceKm: 30, platform: '4' },
      { code: 'ST', name: 'Surat', offsetMin: 150, dwellMin: 5, distanceKm: 263, platform: '4' },
      { code: 'BRC', name: 'Vadodara Jn', offsetMin: 240, dwellMin: 5, distanceKm: 392, platform: '6' },
      { code: 'ADI', name: 'Ahmedabad Jn', offsetMin: 340, dwellMin: 0, distanceKm: 491, platform: '1' },
    ],
  },
];

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function formatDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

function stopIndexes(train: MockTrain, fromCode: string, toCode: string): [number, number] | null {
  const i = train.stops.findIndex((s) => s.code === fromCode);
  const j = train.stops.findIndex((s) => s.code === toCode);
  return i >= 0 && j >= 0 && i < j ? [i, j] : null;
}

function toSummary(train: MockTrain, fromIdx: number, toIdx: number): TrainSummary {
  const dep = parseHHMM(train.originDeparture);
  const from = train.stops[fromIdx];
  const to = train.stops[toIdx];
  const depMin = dep + from.offsetMin + from.dwellMin;
  const arrMin = dep + to.offsetMin;
  return {
    trainNo: train.trainNo,
    trainName: train.trainName,
    fromCode: from.code,
    fromName: from.name,
    toCode: to.code,
    toName: to.name,
    departure: toHHMM(depMin),
    arrival: toHHMM(arrMin),
    duration: formatDuration(to.offsetMin - from.offsetMin - from.dwellMin),
    runDays: train.runDays,
    classes: train.classes,
  };
}

export function mockTrainsBetween(fromCode: string, toCode: string): TrainSummary[] {
  const out: TrainSummary[] = [];
  for (const t of MOCK_TRAINS) {
    const idx = stopIndexes(t, fromCode, toCode);
    if (idx) out.push(toSummary(t, idx[0], idx[1]));
  }
  return out.sort((a, b) => a.departure.localeCompare(b.departure));
}

export function mockSearchTrains(query: string): TrainSummary[] {
  const q = query.trim().toLowerCase();
  return MOCK_TRAINS.filter(
    (t) => t.trainNo.includes(q) || t.trainName.toLowerCase().includes(q)
  ).map((t) => toSummary(t, 0, t.stops.length - 1));
}

export function mockLiveStatus(trainNo: string, now: Date = new Date()): LiveStatus | null {
  const train = MOCK_TRAINS.find((t) => t.trainNo === trainNo);
  if (!train) return null;

  const originDep = parseHHMM(train.originDeparture);
  const total = train.stops[train.stops.length - 1].offsetMin;
  const delay = train.baseDelayMin;

  // Simulate: minutes since today's scheduled departure, wrapped into the
  // journey length so the train is always somewhere en route.
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const elapsed = (((nowMin - originDep - delay) % total) + total) % total;

  let currentIdx = 0;
  for (let i = 0; i < train.stops.length; i++) {
    if (train.stops[i].offsetMin <= elapsed) currentIdx = i;
  }

  const route: RouteStop[] = train.stops.map((s, i) => {
    const schedArr = i === 0 ? null : toHHMM(originDep + s.offsetMin);
    const schedDep =
      i === train.stops.length - 1 ? null : toHHMM(originDep + s.offsetMin + s.dwellMin);
    const passed = i < currentIdx;
    const isCurrent = i === currentIdx;
    return {
      station: { code: s.code, name: s.name },
      scheduledArrival: schedArr,
      scheduledDeparture: schedDep,
      actualArrival: passed || isCurrent ? toHHMM(originDep + s.offsetMin + delay) : null,
      actualDeparture: passed ? toHHMM(originDep + s.offsetMin + s.dwellMin + delay) : null,
      delayMinutes: delay,
      distanceKm: s.distanceKm,
      platform: s.platform,
      dayOfJourney: Math.floor((originDep + s.offsetMin) / 1440) + 1,
      status: passed ? 'departed' : isCurrent ? 'current' : 'upcoming',
    };
  });

  const cur = train.stops[currentIdx];
  const next = train.stops[currentIdx + 1];
  const statusNote = next
    ? `Departed ${cur.name} · next stop ${next.name} (${next.distanceKm - cur.distanceKm} km)`
    : `Arrived at ${cur.name}`;

  return {
    trainNo: train.trainNo,
    trainName: train.trainName,
    statusNote,
    delayMinutes: delay,
    lastUpdated: toHHMM(nowMin),
    currentStationIndex: currentIdx,
    route,
  };
}
