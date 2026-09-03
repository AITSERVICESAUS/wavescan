import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import getFoodFairReport from '../api/FoodFairReportApi';
import {theme} from '../theme/theme';

const FOOD_FAIR_EVENT_ID = 18968;

const number = value => Number(value) || 0;

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const FoodFairReport = ({navigation, route}) => {
  const eventId = Number(route.params?.eid) || FOOD_FAIR_EVENT_ID;
  const fallbackTitle = route.params?.title || 'Food Fair Report';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadReport = useCallback(
    async isRefresh => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage('');

      try {
        const [siteUrl, staffToken] = await Promise.all([
          AsyncStorage.getItem('@url'),
          AsyncStorage.getItem('@token'),
        ]);

        if (!staffToken) {
          navigation.reset({index: 0, routes: [{name: 'Login'}]});
          return;
        }

        const data = await getFoodFairReport(siteUrl, staffToken, eventId);
        setReport(data);
      } catch (error) {
        if (error.statusCode === 401 || error.response?.status === 'unauthorized') {
          setErrorMessage(
            error.message ||
              'The Food Fair report API did not accept the WaveScan login token.',
          );
          return;
        }
        setErrorMessage(error.message || 'Unable to load Food Fair report.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, navigation],
  );

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  const generatePdf = async () => {
    if (!report || generatingPdf) {
      return;
    }

    setGeneratingPdf(true);
    const hubRows = (report.collection_hubs || [])
      .map(
        hub => `
          <tr>
            <td>${escapeHtml(hub.name || 'Not Assigned')}</td>
            <td>${number(hub.total_orders)}</td>
            <td>${number(hub.redeemed_orders)}</td>
            <td>${number(hub.total_packs)}</td>
            <td>${number(hub.distributed_packs)}</td>
            <td>${number(hub.remaining_packs)}</td>
          </tr>`,
      )
      .join('');
    const redemptionRows = (report.redemptions || [])
      .map(
        item => `
          <tr>
            <td>#${escapeHtml(item.order_id)}</td>
            <td>${escapeHtml(item.collection_hub || 'Not Assigned')}</td>
            <td>${number(item.total_packs)}</td>
            <td>${escapeHtml(item.redeemed_at || '-')}</td>
            <td>${escapeHtml(item.redeemed_by || '-')}</td>
          </tr>`,
      )
      .join('');
    const tableCss =
      'width:100%;border-collapse:collapse;margin:12px 0 24px;font-size:11px;';
    const cellCss = 'border:1px solid #bbb;padding:6px;text-align:left;';
    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;color:#222;">
        <h1 style="text-align:center;">${escapeHtml(
          report.event_name || fallbackTitle,
        )}</h1>
        <h2>Food Fair Report</h2>
        <table style="${tableCss}">
          <tr><td style="${cellCss}"><b>QR Orders Scanned</b></td><td style="${cellCss}">${number(
      report.redeemed_orders,
    )}</td></tr>
          <tr><td style="${cellCss}"><b>Packs Distributed</b></td><td style="${cellCss}">${number(
      report.distributed_packs,
    )}</td></tr>
          <tr><td style="${cellCss}"><b>Packs Remaining</b></td><td style="${cellCss}">${number(
      report.remaining_packs,
    )}</td></tr>
          <tr><td style="${cellCss}"><b>Total Orders</b></td><td style="${cellCss}">${number(
      report.total_orders,
    )}</td></tr>
          <tr><td style="${cellCss}"><b>Unredeemed Orders</b></td><td style="${cellCss}">${number(
      report.unredeemed_orders,
    )}</td></tr>
          <tr><td style="${cellCss}"><b>Total Packs</b></td><td style="${cellCss}">${number(
      report.total_packs,
    )}</td></tr>
        </table>
        <h2>Collection Hubs</h2>
        <table style="${tableCss}">
          <tr>${['Hub', 'Orders', 'Redeemed', 'Packs', 'Distributed', 'Remaining']
            .map(label => `<th style="${cellCss}">${label}</th>`)
            .join('')}</tr>
          ${hubRows || `<tr><td style="${cellCss}" colspan="6">No hub data</td></tr>`}
        </table>
        <h2>Redemption History</h2>
        <table style="${tableCss}">
          <tr>${['Order', 'Hub', 'Packs', 'Redeemed At', 'Staff']
            .map(label => `<th style="${cellCss}">${label}</th>`)
            .join('')}</tr>
          ${
            redemptionRows ||
            `<tr><td style="${cellCss}" colspan="5">No redemptions</td></tr>`
          }
        </table>
      </div>`;

    try {
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `FoodFairReport_${Date.now()}`,
        directory: 'Documents',
      });
      navigation.navigate('PdfViewer', {filePath: file.filePath});
    } catch (error) {
      setErrorMessage('Unable to generate the PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const eventName = report?.event_name || fallbackTitle;
  const hubs = report?.collection_hubs || [];
  const redemptions = report?.redemptions || [];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Fair Report</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => loadReport(true)}>
            <MaterialCommunityIcons name="refresh" size={23} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.muted}>Loading report...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadReport(true)}
                tintColor={theme.colors.primary}
              />
            }>
            <Text style={styles.eventName}>{eventName}</Text>

            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => loadReport(false)}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {report && (
              <>
                <View style={styles.metricGrid}>
                  <MetricCard label="QR Orders Scanned" value={report.redeemed_orders} />
                  <MetricCard label="Packs Distributed" value={report.distributed_packs} />
                  <MetricCard label="Packs Remaining" value={report.remaining_packs} />
                </View>

                <Section title="Order Summary">
                  <Row label="Total Orders" value={report.total_orders} />
                  <Row label="Redeemed Orders" value={report.redeemed_orders} />
                  <Row label="Not Redeemed" value={report.unredeemed_orders} />
                  <Row label="Total Packs" value={report.total_packs} />
                </Section>

                <Text style={styles.sectionHeading}>Collection Hubs</Text>
                {hubs.length ? (
                  hubs.map(hub => (
                    <View key={hub.name} style={styles.card}>
                      <Text style={styles.cardTitle}>{hub.name || 'Not Assigned'}</Text>
                      <Row label="Orders" value={hub.total_orders} />
                      <Row label="Redeemed Orders" value={hub.redeemed_orders} />
                      <Row label="Total Packs" value={hub.total_packs} />
                      <Row label="Distributed" value={hub.distributed_packs} />
                      <Row label="Remaining" value={hub.remaining_packs} />
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No collection hub data.</Text>
                )}

                <Text style={styles.sectionHeading}>Recent Redemptions</Text>
                {redemptions.length ? (
                  redemptions.map((item, index) => (
                    <View key={`${item.order_id}-${index}`} style={styles.card}>
                      <Text style={styles.cardTitle}>Order #{item.order_id}</Text>
                      <Text style={styles.historyText}>
                        {item.collection_hub || 'Not Assigned'} · {number(item.total_packs)} Packs
                      </Text>
                      <Text style={styles.historyText}>{item.redeemed_at || '-'}</Text>
                      <Text style={styles.historyText}>Staff: {item.redeemed_by || '-'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No redemptions yet.</Text>
                )}

                <GradientButton
                  text={generatingPdf ? 'Generating PDF...' : 'Generate PDF Report'}
                  onPress={generatePdf}
                  style={styles.pdfButton}
                />
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

const MetricCard = ({label, value}) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricValue}>{number(value)}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const Row = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{number(value)}</Text>
  </View>
);

const Section = ({title, children}) => (
  <>
    <Text style={styles.sectionHeading}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </>
);

const styles = StyleSheet.create({
  safe: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.headerTop,
    marginBottom: theme.spacing.headerBottom,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {color: theme.colors.text, fontSize: RFValue(16), fontWeight: '900'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  muted: {marginTop: 12, color: theme.colors.textMuted, fontWeight: '700'},
  content: {paddingBottom: 50},
  eventName: {
    color: theme.colors.text,
    fontSize: RFValue(21),
    fontWeight: '900',
    marginBottom: 18,
  },
  metricGrid: {flexDirection: 'row', gap: 8},
  metricCard: {
    flex: 1,
    minHeight: 106,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {color: theme.colors.success, fontSize: RFValue(24), fontWeight: '900'},
  metricLabel: {
    marginTop: 7,
    color: theme.colors.textMuted,
    fontSize: RFValue(10),
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeading: {
    color: theme.colors.text,
    fontSize: RFValue(15),
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    marginBottom: 10,
  },
  cardTitle: {color: theme.colors.text, fontSize: RFValue(15), fontWeight: '900'},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  rowLabel: {color: theme.colors.textMuted, fontSize: RFValue(12), fontWeight: '700'},
  rowValue: {color: theme.colors.text, fontSize: RFValue(13), fontWeight: '900'},
  historyText: {color: theme.colors.textMuted, fontSize: RFValue(11), marginTop: 7},
  emptyText: {color: theme.colors.textMuted, fontSize: RFValue(12)},
  errorBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(255,77,77,0.12)',
    marginBottom: 16,
  },
  errorText: {color: theme.colors.text, fontSize: RFValue(12), fontWeight: '700'},
  retryText: {color: theme.colors.primary, marginTop: 10, fontWeight: '900'},
  pdfButton: {height: 54, marginTop: 24},
});

export default FoodFairReport;
