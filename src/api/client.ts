import { cached } from './cache';
import { mockLiveStatus, mockSearchTrains, mockTrainsBetween } from './mock';
import { searchStationsLocal } from './stations';
import { ApiResult, LiveStatus, RouteStop, Station, TrainSummary } from './types';

// Data layer for the IRCTC API on RapidAPI (irctc1.p.rapidapi.com).
// With no key configured (or on request failure) it falls back to bundled
// sample data and tags the result so the UI can show a notice.
//
// The free tier allows only a handful of requests per month, so this layer
// is deliberately frugal: station autocomplete is fully offline, and every
// successful live response is cached (train search 7 days, trains-between
// 12 hours, live status 2 minutes).
//
// Get a key: https://rapidapi.com/IRCTCAPI/api/irctc1 then put it in .env:
//   EXPO_PUBLIC_RAPIDAPI_KEY=your-key-here

const RAPIDAPI_HOST = 'irctc1.p.rapidapi.com';
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? '';

export const hasLiveApi = API_KEY.length > 0;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

async function rapidGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://${RAPIDAPI_HOST}${path}?${qs}`, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (json?.status === false) throw new Error(json?.message ?? 'API request failed');
  return json?.data;
}

const str = (v: unknown): string => (v == null ? '' : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Station codes are static data - always served from the bundled list,
// never from the API.
export async function searchStations(query: string): Promise<ApiResult<Station[]>> {
  return { data: searchStationsLocal(query), source: 'live' };
}

function mapTrainSummary(t: any, fromFallback = '', toFallback = ''): TrainSummary {
  return {
    trainNo: str(t.train_number ?? t.train_no),
    trainName: str(t.train_name ?? t.name),
    fromCode: str(t.from_station_code ?? t.from ?? fromFallback),
    fromName: str(t.from_station_name ?? t.from_station_code ?? fromFallback),
    toCode: str(t.to_station_code ?? t.to ?? toFallback),
    toName: str(t.to_station_name ?? t.to_station_code ?? toFallback),
    departure: str(t.from_std ?? t.departure ?? '--:--'),
    arrival: str(t.to_sta ?? t.arrival ?? '--:--'),
    duration: str(t.duration ?? ''),
    runDays: Array.isArray(t.run_days) ? t.run_days.map(str) : [],
    classes: Array.isArray(t.class_type) ? t.class_type.map(str) : [],
  };
}

export async function searchTrains(query: string): Promise<ApiResult<TrainSummary[]>> {
  if (hasLiveApi) {
    try {
      const trains = await cached(`searchTrain:${query.toLowerCase()}`, 7 * 24 * HOUR, async () => {
        const data = await rapidGet('/api/v1/searchTrain', { query });
        return (Array.isArray(data) ? data : []).map((t: any) => mapTrainSummary(t));
      });
      return { data: trains, source: 'live' };
    } catch {
      // fall through to sample data
    }
  }
  return { data: mockSearchTrains(query), source: 'sample' };
}

export async function trainsBetween(
  fromCode: string,
  toCode: string,
  dateISO: string
): Promise<ApiResult<TrainSummary[]>> {
  if (hasLiveApi) {
    try {
      const trains = await cached(
        `between:${fromCode}:${toCode}:${dateISO}`,
        12 * HOUR,
        async () => {
          const data = await rapidGet('/api/v3/trainBetweenStations', {
            fromStationCode: fromCode,
            toStationCode: toCode,
            dateOfJourney: dateISO,
          });
          return (Array.isArray(data) ? data : []).map((t: any) =>
            mapTrainSummary(t, fromCode, toCode)
          );
        }
      );
      return { data: trains, source: 'live' };
    } catch {
      // fall through to sample data
    }
  }
  return { data: mockTrainsBetween(fromCode, toCode), source: 'sample' };
}

export async function getLiveStatus(trainNo: string): Promise<ApiResult<LiveStatus | null>> {
  if (hasLiveApi) {
    try {
      const status = await cached(`live:${trainNo}`, 2 * MINUTE, async () => {
        const d = await rapidGet('/api/v1/liveTrainStatus', { trainNo, startDay: '1' });
        if (!d) return null;
        const stops: any[] = Array.isArray(d.previous_stations)
          ? [...d.previous_stations, ...(d.upcoming_stations ?? [])]
          : d.route ?? [];
        const currentCode = str(d.current_station_code);
        let currentIdx = stops.findIndex((s: any) => str(s.station_code) === currentCode);
        if (currentIdx < 0) currentIdx = 0;
        const route: RouteStop[] = stops.map((s: any, i: number) => ({
          station: {
            code: str(s.station_code),
            name: str(s.station_name),
          },
          scheduledArrival: s.sta ? str(s.sta) : null,
          scheduledDeparture: s.std ? str(s.std) : null,
          actualArrival: s.eta ? str(s.eta) : null,
          actualDeparture: s.etd ? str(s.etd) : null,
          delayMinutes: num(s.arrival_delay ?? d.delay),
          distanceKm: num(s.distance_from_source),
          platform: s.platform_number ? str(s.platform_number) : null,
          dayOfJourney: num(s.day ?? 1) || 1,
          status: i < currentIdx ? 'departed' : i === currentIdx ? 'current' : 'upcoming',
        }));
        const live: LiveStatus = {
          trainNo,
          trainName: str(d.train_name),
          statusNote: str(d.status ?? d.ahead_distance_text ?? ''),
          delayMinutes: num(d.delay),
          lastUpdated: str(d.status_as_of ?? ''),
          currentStationIndex: currentIdx,
          route,
        };
        return live;
      });
      if (status) return { data: status, source: 'live' };
    } catch {
      // fall through to sample data
    }
  }
  return { data: mockLiveStatus(trainNo), source: 'sample' };
}
