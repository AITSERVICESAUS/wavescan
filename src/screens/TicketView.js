import React, { Component } from 'react';
import {
  Text,
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import BottomNavBar from '../components/BottomNavBar';
import TicketDetail from '../api/TicketDetails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { theme } from '../theme/theme';

const { height, width } = Dimensions.get('window');

const logJson = (label, data) => {
  try {
    console.log(
      `\n===== ${label} =====\n${JSON.stringify(data, null, 2)}\n====================\n`,
    );
  } catch (e) {
    console.log(`\n===== ${label} (raw) =====\n`, data);
  }
};

class TicketView extends Component {
  state = {
    ticketData: null,
    loading: true,
  };

  componentDidMount() {
    this.initializedData();
  }

  decodeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&#038;/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  formatTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  getStatusMeta = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'checked') return { label: 'Checked In', color: theme.colors.success };
    if (s === 'invalid') return { label: 'Invalid', color: theme.colors.danger };
    if (!s) return { label: 'Not Checked', color: theme.colors.textMuted };
    return { label: s, color: theme.colors.textMuted };
  };

  async initializedData() {
    const { ticketNum } = this.props.route?.params || {};
    try {
      const ticket = await TicketDetail(ticketNum);
      logJson('TicketDetail result (TicketView)', ticket);

      if (ticket) {
        // Normalize + decode title (fixes &#8211; issue)
        const normalized = {
          ...ticket,
          event_title: this.decodeHtml(ticket.event_title),
        };

        this.setState({
          ticketData: normalized,
          loading: false,
        });
      } else {
        this.setState({ loading: false });
        Alert.alert('Error', 'Failed to load ticket details.');
      }
    } catch (err) {
      console.error('❌ Error loading ticket detail:', err);
      this.setState({ loading: false });
      Alert.alert('Error', 'Something went wrong.');
    }
  }

  // Match History behavior: avoid stack back-trace loops
  handleBack = async () => {
    let eid = this.props.route?.params?.eid;
    if (!eid) {
      eid = await AsyncStorage.getItem('@selectedEid');
    }

    this.props.navigation.navigate('History', {
      eid: eid ? parseInt(eid, 10) : null,
    });
  };

  render() {
    const { loading, ticketData } = this.state;

    const meta = this.getStatusMeta(ticketData?.ticket_status);
    const timeText = this.formatTime(ticketData?.checkin_time);

    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <GradientBackground>
          {/* IMPORTANT: Do NOT add horizontal padding here (GradientBackground already does it like History) */}
          <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={this.handleBack} style={styles.backBtn} activeOpacity={0.85}>
                <Image
                  source={require('../assets/back.png')}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Ticket Details</Text>

              <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            {loading ? (
              <ActivityIndicator size="90" color="#fff" style={styles.spinner} />
            ) : ticketData ? (
              <View style={styles.ticketCard}>
                <View style={styles.ticketRow}>
                  <View style={styles.qrBadge}>
                    <Image
                      source={require('../assets/qrCode.png')}
                      style={styles.qrIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle} numberOfLines={2}>
                      {ticketData.event_title || 'Ticket'}
                    </Text>

                    <Text style={styles.qrText} numberOfLines={2} ellipsizeMode="middle">
                      {ticketData.qr_code || ''}
                    </Text>

                    {!!ticketData.customer_name && (
                      <Text style={styles.customerName} numberOfLines={1}>
                        {ticketData.customer_name}
                      </Text>
                    )}

                    {!!timeText && <Text style={styles.ticketDate}>{timeText}</Text>}
                  </View>
                </View>

                <View style={styles.line} />

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={styles.infoLabel}>Type</Text>
                  </View>

                  <View style={styles.infoItemRight}>
                    <Text style={[styles.infoValue, { color: meta?.color || theme.colors.textMuted }]}>
                      {meta?.label || '—'}
                    </Text>
                    <Text style={styles.infoValueGold}>
                      {ticketData.ticket_type || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.noTicket}>No ticket data found.</Text>
            )}
          </SafeAreaView>

          {/* Match History: BottomNavBar outside SafeAreaView */}
          <BottomNavBar />
        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  headerRow: {
    marginTop: theme.spacing.headerTop,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },

    backIcon: {
        width: 80,
        height: 80

    },

  headerTitle: {
    color: theme.colors.text,
    fontSize: RFValue(16),
    fontWeight: '900',
  },

  spinner: {
    marginTop: height * 0.1,
  },

  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    ...theme.shadow.card,
  },

  ticketRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  qrBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  qrIcon: {
    width: RFValue(22),
    height: RFValue(22),
    tintColor: theme.colors.primary,
  },

  ticketInfo: {
    flex: 1,
  },

  ticketTitle: {
    color: theme.colors.text,
    fontSize: RFValue(14),
    fontWeight: '900',
    marginBottom: 6,
  },

  qrText: {
    color: theme.colors.textSubtle,
    fontSize: RFValue(11),
    marginBottom: 6,
  },

  customerName: {
    color: theme.colors.textMuted,
    fontSize: RFValue(11),
    marginBottom: 4,
  },

  ticketDate: {
    color: theme.colors.textSubtle,
    fontSize: RFValue(10),
    marginTop: 2,
  },

  line: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoItem: { flex: 1 },
  infoItemRight: { flex: 1, alignItems: 'flex-end' },

  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: RFValue(12),
    marginBottom: 6,
    fontWeight: '700',
  },

  infoValue: {
    fontSize: RFValue(12),
    fontWeight: '900',
    marginBottom: 6,
  },

  infoValueGold: {
    color: '#FFD700',
    fontSize: RFValue(12),
    fontWeight: '900',
  },

  noTicket: {
    color: theme.colors.text,
    marginTop: height * 0.05,
  },
});

export default TicketView;
