import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {theme} from '../theme/theme';

const statusMeta = {
  redeemed_now: {
    title: 'VALID FOOD ORDER',
    subtitle: 'Give these rice packs now.',
    color: '#16A34A',
  },
  already_redeemed: {
    title: 'ALREADY COLLECTED',
    subtitle: 'Do not give rice packs again.',
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
  invalid: {
    title: 'INVALID FOOD FAIR QR',
    subtitle: 'This QR is not valid for Food Fair collection.',
    color: '#DC2626',
  },
  invalid_event: {
    title: 'INVALID FOOD FAIR QR',
    subtitle: 'This QR is not valid for this Food Fair event.',
    color: '#DC2626',
  },
  not_found: {
    title: 'INVALID FOOD FAIR QR',
    subtitle: 'No Food Fair order was found for this QR.',
    color: '#DC2626',
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

const countFoodTypes = packs => {
  const counts = {};

  (packs || []).forEach(pack => {
    const label = pack.food_label || pack.food_type || 'Food pack';
    counts[label] = (counts[label] || 0) + 1;
  });

  return Object.entries(counts);
};

const getCollectionPoint = result =>
  String(result?.collection_hub || '').trim();

const FoodFairResult = ({result, onScanNext}) => {
  if (!result) {
    return null;
  }

  const status = String(result.status || '').toLowerCase();
  const meta = statusMeta[status] || {
    title: 'FOOD FAIR RESULT',
    subtitle: result.message || 'Scan completed.',
    color: '#6B7280',
  };

  const packGroups = groupPacks(result.packs);
  const foodCounts = countFoodTypes(result.packs);
  const showPackDetails = packGroups.length > 0;
  const isAlreadyRedeemed = status === 'already_redeemed';
  const collectionPoint = getCollectionPoint(result);

  return (
    <View style={styles.overlay}>
      <View style={[styles.panel, {borderColor: meta.color}]}>
        <View style={[styles.statusBar, {backgroundColor: meta.color}]} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, {color: meta.color}]}>{meta.title}</Text>
          <Text style={styles.subtitle}>{meta.subtitle}</Text>

          {!!collectionPoint && (
            <View style={styles.collectionPointBox}>
              <Text style={styles.collectionPointLabel}>COLLECTION POINT</Text>
              <Text style={styles.collectionPointName}>{collectionPoint}</Text>
            </View>
          )}

          {foodCounts.length > 0 && (
            <View style={styles.giveNowBox}>
              <Text style={styles.giveNowTitle}>
                {isAlreadyRedeemed ? 'Original food order' : 'Give Now'}
              </Text>
              {foodCounts.map(([food, count]) => (
                <Text key={food} style={styles.foodCount}>
                  {count} {food}
                </Text>
              ))}
              <Text style={styles.totalText}>
                Total: {result.total_packs ?? (result.packs || []).length} rice packs
              </Text>
            </View>
          )}

          {showPackDetails && (
            <View style={styles.detailsBox}>
              {packGroups.map(([ticketType, foods]) => (
                <View key={ticketType} style={styles.packGroup}>
                  <Text style={styles.packTitle}>{ticketType}</Text>
                  {foods.map((food, index) => (
                    <Text
                      key={`${ticketType}-${food}-${index}`}
                      style={styles.packItem}>
                      - {food}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {!!result.order_id && (
            <Text style={styles.order}>Order #{result.order_id}</Text>
          )}

          {isAlreadyRedeemed && !!result.redeemed_at && (
            <Text style={styles.redeemedAt}>Collected At: {result.redeemed_at}</Text>
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
    backgroundColor: '#0B1020',
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
    marginTop: 16,
    color: theme.colors.text,
    fontSize: RFValue(15),
    fontWeight: '900',
    textAlign: 'center',
  },

  giveNowBox: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#171C2C',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  collectionPointBox: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#111D38',
    borderWidth: 1,
    borderColor: '#2563EB',
  },

  collectionPointLabel: {
    color: theme.colors.textMuted,
    fontSize: RFValue(11),
    fontWeight: '900',
    textAlign: 'center',
  },

  collectionPointName: {
    marginTop: 5,
    color: theme.colors.text,
    fontSize: RFValue(18),
    fontWeight: '900',
    textAlign: 'center',
  },

  giveNowTitle: {
    color: theme.colors.textMuted,
    fontSize: RFValue(12),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  foodCount: {
    color: theme.colors.text,
    fontSize: RFValue(20),
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },

  totalText: {
    marginTop: 12,
    color: theme.colors.text,
    fontSize: RFValue(14),
    fontWeight: '900',
    textAlign: 'center',
  },

  detailsBox: {
    marginTop: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  packGroup: {
    marginTop: 14,
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
