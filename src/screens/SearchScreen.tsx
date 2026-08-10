import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchStations, trainsBetween } from '../api/client';
import { Station, TrainSummary } from '../api/types';
import { EmptyState, SampleDataBanner } from '../components/shared';
import { colors, radius, spacing, type } from '../theme';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StationFieldState {
  text: string;
  selected: Station | null;
}

export default function SearchScreen() {
  const [from, setFrom] = useState<StationFieldState>({ text: '', selected: null });
  const [to, setTo] = useState<StationFieldState>({ text: '', selected: null });
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [stationOptions, setStationOptions] = useState<Station[]>([]);
  const [results, setResults] = useState<TrainSummary[] | null>(null);
  const [source, setSource] = useState<'live' | 'sample'>('live');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeText = activeField === 'from' ? from.text : activeField === 'to' ? to.text : '';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!activeField) {
      setStationOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await searchStations(activeText);
      setStationOptions(result.data.slice(0, 8));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeField, activeText]);

  const pickStation = (station: Station) => {
    if (activeField === 'from') {
      setFrom({ text: `${station.name} (${station.code})`, selected: station });
    } else if (activeField === 'to') {
      setTo({ text: `${station.name} (${station.code})`, selected: station });
    }
    setActiveField(null);
    setStationOptions([]);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setResults(null);
  };

  const canSearch = from.selected && to.selected && from.selected.code !== to.selected.code;

  const search = async () => {
    if (!canSearch || !from.selected || !to.selected) return;
    setLoading(true);
    setActiveField(null);
    try {
      const today = new Date();
      const dateISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const result = await trainsBetween(from.selected.code, to.selected.code, dateISO);
      setResults(result.data);
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={type.title}>Find Trains</Text>

        <View style={styles.formCard}>
          <StationInput
            icon="radio-button-on"
            iconColor={colors.success}
            placeholder="From station"
            value={from.text}
            active={activeField === 'from'}
            onFocus={() => setActiveField('from')}
            onChangeText={(text) => {
              setFrom({ text, selected: null });
              setActiveField('from');
            }}
          />
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Pressable
              onPress={swap}
              style={({ pressed }) => [styles.swapButton, pressed && { transform: [{ scale: 0.94 }] }]}
              accessibilityRole="button"
              accessibilityLabel="Swap from and to stations"
              hitSlop={8}
            >
              <Ionicons name="swap-vertical" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <StationInput
            icon="location"
            iconColor={colors.destructive}
            placeholder="To station"
            value={to.text}
            active={activeField === 'to'}
            onFocus={() => setActiveField('to')}
            onChangeText={(text) => {
              setTo({ text, selected: null });
              setActiveField('to');
            }}
          />
        </View>

        <Pressable
          onPress={search}
          disabled={!canSearch || loading}
          style={({ pressed }) => [
            styles.searchButton,
            (!canSearch || loading) && styles.searchButtonDisabled,
            pressed && canSearch && { transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search trains between selected stations"
          accessibilityState={{ disabled: !canSearch || loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="search" size={18} color={colors.onPrimary} />
              <Text style={styles.searchButtonText}>Search Trains</Text>
            </>
          )}
        </Pressable>
      </View>

      {activeField && stationOptions.length > 0 && (
        <View style={styles.suggestions}>
          {stationOptions.map((s) => (
            <Pressable
              key={s.code}
              onPress={() => pickStation(s)}
              style={({ pressed }) => [styles.suggestionRow, pressed && { backgroundColor: colors.muted }]}
              accessibilityRole="button"
              accessibilityLabel={`Select station ${s.name}`}
            >
              <View style={styles.stationCodeBadge}>
                <Text style={styles.stationCodeText}>{s.code}</Text>
              </View>
              <Text style={[type.body, { flex: 1 }]} numberOfLines={1}>
                {s.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {results !== null && !activeField && (
        <FlatList
          data={results}
          keyExtractor={(t) => t.trainNo}
          ListHeaderComponent={source === 'sample' ? <SampleDataBanner /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No trains found"
              subtitle="No direct trains between these stations in the data. Try nearby major stations."
            />
          }
          renderItem={({ item }) => <TrainResultCard train={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {results === null && !activeField && (
        <EmptyState
          icon="git-compare"
          title="Where to?"
          subtitle="Pick origin and destination stations to see all direct trains with timings."
        />
      )}
    </View>
  );
}

function StationInput({
  icon,
  iconColor,
  placeholder,
  value,
  active,
  onFocus,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  placeholder: string;
  value: string;
  active: boolean;
  onFocus: () => void;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={[styles.inputRow, active && styles.inputRowActive]}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        onFocus={onFocus}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

function TrainResultCard({ train }: { train: TrainSummary }) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultTop}>
        <View style={styles.trainNoBadge}>
          <Text style={styles.trainNoText}>{train.trainNo}</Text>
        </View>
        <Text style={[type.heading, { flex: 1 }]} numberOfLines={1}>
          {train.trainName}
        </Text>
      </View>

      <View style={styles.resultTimes}>
        <View style={styles.timeBlock}>
          <Text style={styles.bigTime}>{train.departure}</Text>
          <Text style={type.caption}>{train.fromCode}</Text>
        </View>
        <View style={styles.durationBlock}>
          <Text style={type.caption}>{train.duration}</Text>
          <View style={styles.durationLine}>
            <View style={styles.durationDot} />
            <View style={styles.durationTrack} />
            <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
          </View>
        </View>
        <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
          <Text style={styles.bigTime}>{train.arrival}</Text>
          <Text style={type.caption}>{train.toCode}</Text>
        </View>
      </View>

      <View style={styles.resultBottom}>
        <View style={styles.daysRow}>
          {DAY_ORDER.map((d) => {
            const runs = train.runDays.includes(d);
            return (
              <Text key={d} style={[styles.dayText, runs ? styles.dayOn : styles.dayOff]}>
                {d[0]}
              </Text>
            );
          })}
        </View>
        {train.classes.length > 0 && (
          <Text style={type.caption}>{train.classes.join(' · ')}</Text>
        )}
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
  formCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  inputRowActive: {},
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
  },
  searchButtonDisabled: {
    backgroundColor: '#93B4F5',
  },
  searchButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
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
    minHeight: 52,
  },
  stationCodeBadge: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 52,
    alignItems: 'center',
  },
  stationCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  resultTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBlock: {
    gap: 2,
  },
  bigTime: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  durationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  durationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  durationTrack: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  resultBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayOn: {
    color: colors.primary,
  },
  dayOff: {
    color: colors.border,
  },
});
