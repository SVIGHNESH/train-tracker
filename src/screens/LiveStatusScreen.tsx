import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getLiveStatus, searchTrains } from '../api/client';
import { LiveStatus, RouteStop, TrainSummary } from '../api/types';
import { DelayChip, EmptyState, SampleDataBanner } from '../components/shared';
import { colors, radius, spacing, type } from '../theme';

// Kept conservative: RapidAPI free tiers have very small quotas.
const REFRESH_INTERVAL_MS = 5 * 60_000;
const MIN_SUGGESTION_CHARS = 3;

export default function LiveStatusScreen() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TrainSummary[]>([]);
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [source, setSource] = useState<'live' | 'sample'>('live');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_SUGGESTION_CHARS || status) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await searchTrains(query);
      setSuggestions(result.data.slice(0, 8));
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, status]);

  const loadStatus = useCallback(async (trainNo: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await getLiveStatus(trainNo);
      if (result.data) {
        setStatus(result.data);
        setSource(result.source);
      } else {
        setStatus(null);
        setError(`No train found for "${trainNo}". Try a train number like 12951.`);
      }
    } catch {
      setError('Could not fetch live status. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh the tracked train every minute.
  useEffect(() => {
    if (!status) return;
    const id = setInterval(() => loadStatus(status.trainNo, true), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status?.trainNo, loadStatus]);

  const selectTrain = (t: TrainSummary) => {
    setQuery(`${t.trainNo} - ${t.trainName}`);
    setSuggestions([]);
    loadStatus(t.trainNo);
  };

  const submit = () => {
    const trainNo = query.trim().match(/\d{4,5}/)?.[0];
    if (trainNo) loadStatus(trainNo);
    else setError('Enter a train number (e.g. 12951) or pick a suggestion.');
  };

  const clear = () => {
    setQuery('');
    setStatus(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Train Status</Text>
        <View style={styles.searchRow}>
          <Ionicons name="train" size={20} color={colors.primary} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (status) setStatus(null);
            }}
            placeholder="Train number or name (e.g. 12951)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="default"
            returnKeyType="search"
            onSubmitEditing={submit}
            accessibilityLabel="Search train by number or name"
          />
          {query.length > 0 && (
            <Pressable onPress={clear} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((t) => (
            <Pressable
              key={t.trainNo}
              onPress={() => selectTrain(t)}
              style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Track train ${t.trainNo} ${t.trainName}`}
            >
              <View style={styles.trainNoBadge}>
                <Text style={styles.trainNoText}>{t.trainNo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={1}>
                  {t.trainName}
                </Text>
                <Text style={type.caption}>
                  {t.fromName} → {t.toName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[type.label, { marginTop: spacing.md }]}>Locating train…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!status && !loading && !error && suggestions.length === 0 && (
        <EmptyState
          icon="navigate"
          title="Track any train live"
          subtitle="Search by train number or name to see where it is right now, station by station."
        />
      )}

      {status && !loading && (
        <FlatList
          data={status.route}
          keyExtractor={(stop) => stop.station.code}
          ListHeaderComponent={
            <View>
              {source === 'sample' && <SampleDataBanner />}
              <StatusCard status={status} />
            </View>
          }
          renderItem={({ item, index }) => (
            <TimelineRow stop={item} isFirst={index === 0} isLast={index === status.route.length - 1} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadStatus(status.trainNo, true);
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

function StatusCard({ status }: { status: LiveStatus }) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusCardTop}>
        <View style={styles.trainNoBadgeLarge}>
          <Text style={styles.trainNoTextLarge}>{status.trainNo}</Text>
        </View>
        <DelayChip delayMinutes={status.delayMinutes} />
      </View>
      <Text style={styles.statusTrainName}>{status.trainName}</Text>
      <Text style={styles.statusNote}>{status.statusNote}</Text>
      {status.lastUpdated ? (
        <Text style={[type.caption, { marginTop: spacing.xs }]}>
          Updated {status.lastUpdated} · pull down to refresh
        </Text>
      ) : null}
    </View>
  );
}

function TimelineRow({
  stop,
  isFirst,
  isLast,
}: {
  stop: RouteStop;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isCurrent = stop.status === 'current';
  const isDeparted = stop.status === 'departed';
  const lineColor = isDeparted || isCurrent ? colors.primary : colors.border;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineTimes}>
        <Text style={[styles.timeText, !isDeparted && !isCurrent && styles.timeMuted]}>
          {stop.scheduledArrival ?? stop.scheduledDeparture ?? '--:--'}
        </Text>
        {stop.actualArrival && stop.delayMinutes > 0 && (
          <Text style={styles.timeActual}>{stop.actualArrival}</Text>
        )}
      </View>

      <View style={styles.timelineTrack}>
        <View
          style={[
            styles.trackSegment,
            { backgroundColor: isFirst ? 'transparent' : lineColor },
          ]}
        />
        {isCurrent ? (
          <View style={styles.currentDot}>
            <Ionicons name="train" size={14} color={colors.onPrimary} />
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              isDeparted ? styles.dotDeparted : styles.dotUpcoming,
            ]}
          />
        )}
        <View
          style={[
            styles.trackSegment,
            {
              backgroundColor: isLast
                ? 'transparent'
                : isDeparted
                ? colors.primary
                : colors.border,
            },
          ]}
        />
      </View>

      <View style={styles.timelineStation}>
        <Text
          style={[
            type.body,
            isCurrent && { fontWeight: '700', color: colors.primary },
            !isDeparted && !isCurrent && { color: colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {stop.station.name}
        </Text>
        <Text style={type.caption}>
          {stop.station.code} · {stop.distanceKm} km
          {stop.platform ? ` · PF ${stop.platform}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerTitle: {
    ...type.title,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: spacing.md,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
  trainNoBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trainNoText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
  },
  errorText: {
    flex: 1,
    color: colors.destructive,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  statusCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  trainNoBadgeLarge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trainNoTextLarge: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  statusTrainName: {
    ...type.heading,
  },
  statusNote: {
    ...type.label,
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  timelineTimes: {
    width: 56,
    alignItems: 'flex-end',
    paddingTop: 14,
    paddingRight: spacing.sm,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  timeMuted: {
    color: colors.textTertiary,
    fontWeight: '400',
  },
  timeActual: {
    fontSize: 12,
    color: colors.warning,
    fontVariant: ['tabular-nums'],
  },
  timelineTrack: {
    width: 32,
    alignItems: 'center',
  },
  trackSegment: {
    width: 3,
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 2,
  },
  dotDeparted: {
    backgroundColor: colors.primary,
  },
  dotUpcoming: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  currentDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  timelineStation: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.md,
  },
});
