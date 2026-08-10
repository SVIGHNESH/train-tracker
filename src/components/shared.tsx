import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme';

export function DelayChip({ delayMinutes }: { delayMinutes: number }) {
  const onTime = delayMinutes <= 0;
  return (
    <View style={[styles.chip, { backgroundColor: onTime ? colors.successSoft : colors.warningSoft }]}>
      <Ionicons
        name={onTime ? 'checkmark-circle' : 'time'}
        size={14}
        color={onTime ? colors.success : colors.warning}
      />
      <Text style={[styles.chipText, { color: onTime ? colors.success : colors.warning }]}>
        {onTime ? 'On time' : `${delayMinutes} min late`}
      </Text>
    </View>
  );
}

export function SampleDataBanner() {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Ionicons name="flask" size={14} color={colors.accent} />
      <Text style={styles.bannerText}>
        Sample data - live API unavailable (no key, or monthly quota used up)
      </Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  bannerText: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '500',
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...type.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...type.label,
    textAlign: 'center',
    lineHeight: 20,
  },
});
