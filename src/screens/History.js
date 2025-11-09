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
import {RFValue} from 'react-native-responsive-fontsize';

const {width, height} = Dimensions.get('window');

class History extends Component {
  state = {
    tickets: [],
    loading: true,
  };

  componentDidMount() {
    this.initializeData();
  }

  initializeData = async () => {
    let eid = this.props.route?.params?.eid;
    if (!eid) {
      const storedEid = await AsyncStorage.getItem('@selectedEid');
      if (storedEid) {
        eid = parseInt(storedEid);
      }
    }
    this.fetchScannedTickets(eid);
  };

  handleBack = () => {
    this.props.navigation.goBack();
  };

  fetchScannedTickets = async (eid = null) => {
    try {
      const stored = await AsyncStorage.multiGet(['@url', '@token']);
      const url = stored.find(item => item[0] === '@url')[1];
      const token = stored.find(item => item[0] === '@token')[1];

      const event = await Tickets_by_events([url, token], eid);

      if (!event) {
        this.setState({loading: false});
        return;
      }

      const tickets = (event.tickets || [])
        .filter(ticket => ticket.ticket_status === 'checked')
        .map(ticket => ({
          id: ticket.ticket_id,
          ticketNum: ticket.qr_code,
          eventTitle: event.event_title,
          customerName: ticket.customer_name,
        }));

      this.setState({tickets, loading: false});
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      this.setState({loading: false});
    }
  };

  renderTicket = ({item}) => (
    <TouchableOpacity
      onPress={() =>
        this.props.navigation.navigate('TicketView', {
          ticketNum: item.ticketNum,
        })
      }>
      <View style={styles.cardStyle}>
        <View style={styles.cardActions}>
          <View style={styles.qrRow}>
            <Image
              source={require('../assets/qrCode.png')}
              style={styles.qrCode}
              resizeMode="contain"
            />
            {/*  */}
            <Text
              style={styles.ticketTitle}
              numberOfLines={1}
              ellipsizeMode="middle">
              {item.ticketNum}
            </Text>
          </View>
        </View>

        {/* Second row: Date aligned to the right */}
        <View style={styles.dateRow}>
          <Text style={styles.ticketDetails2}>{item.customerName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  render() {
    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <GradientBackground>
          <SafeAreaView style={styles.safe}>
              <View style={styles.header}>
                <TouchableOpacity onPress={this.handleBack}>
                  <View style={styles.backContent}>
                    <Image
                      source={require('../assets/back.png')}
                      style={styles.backIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.backText}>History</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Ticket cards list */}
              {this.state.loading ? (
                <ActivityIndicator
                  size="90"
                  color="#ffffff"
                  style={styles.spinner}
                />
              ) : (
                <FlatList
                  data={this.state.tickets}
                  renderItem={this.renderTicket}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.cardContainer}
                />
              )}
              <BottomNavBar />
          </SafeAreaView>
        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: height * -0.05,
    justifyContent: 'space-between',
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: RFValue(20),
    color: '#FF71D2',
    marginLeft: height * -0.03,
    fontWeight: '500',
  },
  cardStyle: {
    backgroundColor: '#2c2c2c',
    marginBottom: height * 0.015,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  ticketTitle: {
    fontSize: RFValue(13),
    fontWeight: '600',
    color: '#fff',
    marginTop: height * 0.005,
    marginLeft: height * 0.01,
  },
  ticketLabel: {
    color: '#fff',
    fontSize: RFValue(13),
    marginLeft: height * 0.01,
  },
  qrValue: {
    flex: 1,
    color: '#fff',
    fontSize: RFValue(14),
    marginLeft: height * 0.005,
    flexWrap: 'wrap',
  },
  qrCode: {
    width: RFValue(30),
    height: RFValue(30),
  },
  ticketDetails: {
    fontSize: RFValue(15),
    color: '#fff',
    flex: 1,
    // marginLeft: 10,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: height * 0.005,
  },
  ticketDetails2: {
    fontSize: RFValue(10),
    color: 'grey',
    textAlign: 'right',
  },
  spinner: {
    marginTop: height * 0.1,
  },
  showTicketText: {
    color: '#FF71D2',
    fontWeight: '600',
    fontSize: RFValue(10),
    marginTop: height * 0.01,
    textAlign: 'center',
  },
  cardContainer: {
  paddingBottom: height * 0.12,
}

});

export default History;
