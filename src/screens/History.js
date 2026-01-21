import React, {Component} from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tickets_by_events from '../api/Tickets_by_events';
import TicketDetail from '../api/TicketDetails';
import {RFValue} from 'react-native-responsive-fontsize';

import {theme} from '../theme/theme';

const {height} = Dimensions.get('window');

class History extends Component {
  state = {
    tickets: [],
    loading: true,

    enriching: false,
    nextEnrichIndex: 0,
  };

  componentDidMount() {
    this.initializeData();
  }

  initializeData = async () => {
    let eid = this.props.route?.params?.eid;
    if (!eid) {
      const storedEid = await AsyncStorage.getItem('@selectedEid');
      if (storedEid) eid = parseInt(storedEid, 10);
    }
    this.fetchTickets(eid);
  };

 handleBack = async () => {
   // 1. Try to get eid from the route params first
   let eid = this.props.route?.params?.eid;

   // 2. If not in params, check AsyncStorage (matching your initializeData logic)
   if (!eid) {
     eid = await AsyncStorage.getItem('@selectedEid');
   }

   // 3. Navigate with the param so ListTickets doesn't crash
   this.props.navigation.navigate('ListTickets', {
     eid: eid ? parseInt(eid, 10) : null
   });
 };

  decodeHtml = str => {
    if (!str) return '';
    return String(str)
      .replace(/&#038;/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  formatTime = value => {
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

  getStatusMeta = status => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'checked') return {label: 'Checked In', color: theme.colors.success};
    if (s === 'invalid') return {label: 'Invalid', color: theme.colors.danger};
    if (!s) return {label: 'Not Checked', color: theme.colors.textMuted};
    return {label: s, color: theme.colors.textMuted};
  };

  sortTickets = tickets => {
    const safeTime = t => {
      const ms = new Date(t.checkin_time || '').getTime();
      return isNaN(ms) ? -1 : ms;
    };

    return [...tickets].sort((a, b) => {
      const sa = String(a.ticket_status || '').toLowerCase();
      const sb = String(b.ticket_status || '').toLowerCase();

      if (sa === 'checked' && sb !== 'checked') return -1;
      if (sb === 'checked' && sa !== 'checked') return 1;

      const ta = safeTime(a);
      const tb = safeTime(b);
      if (tb !== ta) return tb - ta;

      return (b.ticket_id || 0) - (a.ticket_id || 0);
    });
  };

  fetchTickets = async (eid = null) => {
    try {
      const stored = await AsyncStorage.multiGet(['@url', '@token']);
      const url = stored.find(item => item[0] === '@url')?.[1];
      const token = stored.find(item => item[0] === '@token')?.[1];

      const res = await Tickets_by_events([url, token], eid);
      const baseTickets = res?.tickets || [];

      const scannedOnly = baseTickets.filter(t => {
        const s = String(t.ticket_status || '').toLowerCase().trim();
        return s === 'checked' || s === 'invalid';
      });

      const tickets = scannedOnly.map(t => ({
        ticket_id: t.ticket_id,
        customer_name: t.customer_name || '',
        email: t.email || '',
        qr_code: t.qr_code,
        ticket_status: t.ticket_status || '',

        ticket_type: '',
        checkin_time: '',
        event_title: '',

        _enriched: false,
      }));

      this.setState(
        {
          tickets: this.sortTickets(tickets),
          loading: false,
          nextEnrichIndex: 0,
        },
        () => this.enrichNextBatch(),
      );
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      this.setState({loading: false});
    }
  };

  enrichNextBatch = async () => {
    const {tickets, enriching, nextEnrichIndex} = this.state;
    if (enriching) return;
    if (!tickets.length) return;

    let start = nextEnrichIndex;
    while (start < tickets.length && tickets[start]._enriched) start++;
    if (start >= tickets.length) return;

    const BATCH_SIZE = 10;
    const slice = tickets.slice(start, start + BATCH_SIZE);

    this.setState({enriching: true});

    const enrichedSlice = await Promise.all(
      slice.map(async item => {
        if (!item?.qr_code) return {...item, _enriched: true};

        try {
          const detail = await TicketDetail(item.qr_code);

          return {
            ...item,
            ticket_id: detail.ticket_id ?? item.ticket_id,
            customer_name: detail.customer_name ?? item.customer_name,
            email: detail.email ?? item.email,
            qr_code: detail.qr_code ?? item.qr_code,
            ticket_status: detail.ticket_status ?? item.ticket_status,

            ticket_type: detail.ticket_type ?? item.ticket_type,
            checkin_time: detail.checkin_time ?? item.checkin_time,
            event_title: this.decodeHtml(detail.event_title ?? item.event_title),

            _enriched: true,
          };
        } catch (e) {
          return {...item, _enriched: true};
        }
      }),
    );

    const merged = [...tickets];
    for (let i = 0; i < enrichedSlice.length; i++) {
      merged[start + i] = enrichedSlice[i];
    }

    this.setState({
      tickets: this.sortTickets(merged),
      enriching: false,
      nextEnrichIndex: start + BATCH_SIZE,
    });
  };

  renderTicket = ({item}) => {
    const meta = this.getStatusMeta(item.ticket_status);
    const timeText = this.formatTime(item.checkin_time);
    const title = item.ticket_type?.trim() || item.event_title?.trim() || 'Ticket';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          this.props.navigation.navigate('TicketView', {ticketNum: item.qr_code})
        }>
        <View style={styles.cardStyle}>
          <View style={styles.topRow}>
            <View style={styles.leftRow}>
              <View style={styles.qrBadge}>
                <Image
                  source={require('../assets/qrCode.png')}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.titleBlock}>
                <Text style={styles.ticketType} numberOfLines={1}>
                  {title}
                </Text>

                {!!item.customer_name && (
                  <Text style={styles.customerName} numberOfLines={1}>
                    {item.customer_name}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.statusPill, {borderColor: meta.color}]}>
              <Text style={[styles.statusText, {color: meta.color}]}>
                {meta.label}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            {timeText ? <Text style={styles.timeText}>{timeText}</Text> : <View />}

            <Text style={styles.qrHint} numberOfLines={1} ellipsizeMode="middle">
              {item.qr_code}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  renderFooter = () => {
    if (!this.state.enriching) return <View style={{height: 16}} />;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#ffffff" />
        <Text style={styles.footerText}>Loading more details…</Text>
      </View>
    );
  };

  render() {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <GradientBackground>
          {/* IMPORTANT: GradientBackground already applies horizontal padding */}
          <SafeAreaView style={styles.safe}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={this.handleBack}
                style={styles.backBtn}
                activeOpacity={0.85}>
                <Image
                  source={require('../assets/back.png')}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>History</Text>

              <View style={{width: 40}} />
            </View>

            {this.state.loading ? (
              <ActivityIndicator size="90" color="#ffffff" style={styles.spinner} />
            ) : (
              <FlatList
                data={this.state.tickets}
                renderItem={this.renderTicket}
                keyExtractor={item => String(item.ticket_id)}
                contentContainerStyle={styles.cardContainer}
                onEndReachedThreshold={0.5}
                onEndReached={this.enrichNextBatch}
                ListFooterComponent={this.renderFooter}
                showsVerticalScrollIndicator={false}
              />
            )}
          </SafeAreaView>

          <BottomNavBar />
        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: {flex: 1},

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

  cardStyle: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    padding: theme.spacing.cardPadding,
    borderRadius: theme.radius.card,
    ...theme.shadow.card,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
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
  },

  qrCode: {
    width: RFValue(22),
    height: RFValue(22),
    tintColor: theme.colors.primary,
  },

  titleBlock: {
    marginLeft: 12,
    flex: 1,
  },

  ticketType: {
    fontSize: RFValue(14),
    fontWeight: '900',
    color: theme.colors.text,
  },

  customerName: {
    marginTop: 4,
    fontSize: RFValue(11),
    color: theme.colors.textMuted,
  },

  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  statusText: {
    fontSize: RFValue(10),
    fontWeight: '900',
  },

  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timeText: {
    fontSize: RFValue(10),
    color: theme.colors.textSubtle,
  },

  qrHint: {
    fontSize: RFValue(9),
    color: theme.colors.textSubtle,
    maxWidth: '45%',
  },

  spinner: {
    marginTop: height * 0.1,
  },

  cardContainer: {
    paddingBottom: 140, // space for bottom nav
  },

  footerLoading: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerText: {
    color: theme.colors.textMuted,
    fontSize: RFValue(10),
    marginTop: 8,
    fontWeight: '700',
  },
});

export default History;
