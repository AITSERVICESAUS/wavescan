import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {theme} from '../theme/theme';

const statusMeta = {
  redeemed_now: {
    title: 'PACKS DISTRIBUTED',
    subtitle: 'Rice packs have been issued for this order.',
    color: '#16A34A',
  },
  already_redeemed: {
    title: 'ALREADY REDEEMED',
    subtitle: 'DO NOT ISSUE RICE PACKS.',
    color: '#DC2626',
  },
  donation_only: {
    title: 'DONATION ONLY',
    subtitle: 'This booking has no rice-pack entitlement.',
    color: '#2563EB',
  },
  busy: {
    title: 'PROCESSING',
    subtitle: 'Ticket currently being processed. Please scan again.',
    color: '#F59E0B',
  },
};

const groupPacks = packs => {
  const groups = {};

  (packs || []).forEach(pack => {
    const type = pack.ticket_type || 'Ticket';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(pack.food_label || pack.food_type || 'Food pack');
  });

  return Object.entries(groups);
};

const FoodFairResult = ({result, onScanNext}) => {
  if (!result) return null;

  const status = String(result.status || '').toLowerCase();
  const meta = statusMeta[status] || {
    title: 'FOOD FAIR RESULT',
    subtitle: result.message || 'Scan completed.',
    color: '#6B7280',
  };

  const packGroups = groupPacks(result.packs);

  return (
    <View style={styles.overlay}>
      <View style={[styles.panel, {borderColor: meta.color}]}>
        <View style={[styles.statusBar, {backgroundColor: meta.color}]} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, {color: meta.color}]}>{meta.title}</Text>
          <Text style={styles.subtitle}>{meta.subtitle}</Text>

          {!!result.order_id && (
            <Text style={styles.order}>Order #{result.order_id}</Text>
          )}

          {packGroups.map(([ticketType, foods]) => (
            <View key={ticketType} style={styles.packGroup}>
              <Text style={styles.packTitle}>{ticketType}</Text>
              {foods.map((food, index) => (
                <Text key={`${ticketType}-${food}-${index}`} style={styles.packItem}>
                  - {food}
                </Text>
              ))}
            </View>
          ))}

          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total Packs: {result.total_packs ?? 0}</Text>
            <Text style={styles.summaryText}>Distributed: {result.distributed ?? 0}</Text>
            <Text style={styles.summaryText}>Remaining: {result.remaining ?? 0}</Text>
          </View>

          {!!result.redeemed_at && (
            <Text style={styles.redeemedAt}>Redeemed At: {result.redeemed_at}</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={onScanNext}>
            <Text style={styles.buttonText}>Scan Next QR</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    zIndex: 90,
  },

  panel: {
    width: '100%',
    maxHeight: '78%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },

  statusBar: {
    height: 8,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: RFValue(20),
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: RFValue(13),
    fontWeight: '800',
    textAlign: 'center',
  },

  order: {
    marginTop: 18,
    color: theme.colors.text,
    fontSize: RFValue(15),
    fontWeight: '900',
    textAlign: 'center',
  },

  packGroup: {
    marginTop: 16,
  },

  packTitle: {
    color: theme.colors.text,
    fontSize: RFValue(14),
    fontWeight: '900',
  },

  packItem: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: RFValue(13),
    fontWeight: '700',
  },

  summary: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  summaryText: {
    color: theme.colors.text,
    fontSize: RFValue(13),
    fontWeight: '800',
    marginTop: 4,
  },

  redeemedAt: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: RFValue(12),
    fontWeight: '700',
    textAlign: 'center',
  },

  button: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: RFValue(13),
    fontWeight: '900',
  },
});

export default FoodFairResult;