import React, {Component} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import BottomNavBar from '../components/BottomNavBar';
import TicketDetail from '../api/TicketDetails';
import {RFValue} from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

class TicketView extends Component {
  state = {
    ticketData: null,
    loading: true,
  };

  componentDidMount() {
    this.initializedData();
  }

  async initializedData() {
    const {ticketNum} = this.props.route?.params || {};
    try {
      const ticket = await TicketDetail(ticketNum);
      if (ticket) {
        this.setState({
          ticketData: ticket,
          loading: false,
        });
      } else {
        this.setState({loading: false});
        Alert.alert('Error', 'Failed to load ticket details.');
      }
    } catch (err) {
      console.error('❌ Error loading ticket detail:', err);
      this.setState({loading: false});
      Alert.alert('Error', 'Something went wrong.');
    }
  }

  handleBack = () => {
    this.props.navigation.goBack();
  };

  render() {
    const {loading, ticketData} = this.state;
    let content;

    if (loading) {
      content = (
        <ActivityIndicator
          size="70"
          color="#fff"
          style={styles.activityIndicator}
        />
      );
    } else if (ticketData) {
      content = (
        <View style={styles.ticketCard}>
          <View style={styles.ticketRow}>
            <Image
              source={require('../assets/qrCode.png')}
              style={styles.qrIcon}
            />
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketText}>{ticketData.event_title}</Text>
              <Text style={styles.ticketText}>{ticketData.qr_code}</Text>
              <Text style={styles.ticketText}>{ticketData.customer_name}</Text>
              <Text style={styles.ticketDate}>{ticketData.checkin_time}</Text>
            </View>
          </View>
          <View style={styles.line} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoLabel}>Type</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValueApproved}>
                {ticketData.ticket_status}
              </Text>
              <Text style={styles.infoValueGold}>
                {ticketData.ticket_type || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      );
    } else {
      content = (
        <Text style={styles.noTicket}>
          No ticket data found.
        </Text>
      );
    }

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
                    resizeMode="contain"
                  />
                  <Text style={styles.backText}>Ticket View</Text>
                </View>
              </TouchableOpacity>
            </View>

            {content}

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
    paddingHorizontal: width * 0.01,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: height * -0.05,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: RFValue(20),
    color: '#FF71D2',
    fontWeight: '500',
    marginLeft: height * -0.03,
  },
  activityIndicator:{
    marginTop: height * 0.05,
  },
  ticketCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: width * 0.05,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrIcon: {
    width: 40,
    height: 40,
    marginRight: height * 0.01,
    marginBottom: height * 0.08,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketText: {
    color: '#FFFFFF',
    fontSize: RFValue(13),
  },
  ticketDate: {
    color: '#919191ff',
    fontSize: RFValue(10),
    // marginLeft: height * 0.1,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    marginVertical: height * 0.015,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#AAAAAA',
    fontSize: RFValue(13),
  },
  infoValueApproved: {
    color: 'green',
    fontSize: RFValue(13),
    fontWeight: '500',
  },
  infoValueGold: {
    color: '#FFD700',
    fontSize: RFValue(13),
    fontWeight: '500',
  },
  noTicket:{
    color: 'white',
    marginTop: height * 0.05,
  },
});

export default TicketView;
