import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  // BackHandler,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import getToken from '../api/getToken';
import EventsApi from '../api/EventsApi';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import CustomAlert from '../components/CustomAlert';
import { RFValue } from 'react-native-responsive-fontsize';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

class Events extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLogoutAlert: false,
      data: [],

    };
  }

  componentDidMount() {
    // this.backHandler = BackHandler.addEventListener(
    //   'hardwareBackPress',
    //   () => true,
    // );

    getToken()
      .then(token => EventsApi(token))
      .then(data =>
        this.setState({
          data: data.status === 'SUCCESS' ? data.events : [],
          loading: false,
        }),
      )
      .catch(err => {
        console.log(err);
        this.setState({ loading: false });
      });
  }

  // componentWillUnmount() {
  //   if (this.backHandler) {
  //     this.backHandler.remove();
  //   }
  // }


  confirmLogout = () => {
    this.setState({ showLogoutAlert: true });
  };
  hideLogoutAlert = () => {
    this.setState({ showLogoutAlert: false });
  };
  logout = async () => {
    try {
      await AsyncStorage.multiSet([
        ['@token', ''],
        ['@isLoggedIn', '0'],
      ]);
      this.setState({showLogoutAlert: false});
      this.props.navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
              <View style={styles.backContent}>
                <Text style={styles.backText}>Events</Text>
              </View>

              {/* Setting Icon at the end of the header */}
              <TouchableOpacity onPress={this.confirmLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.container}>
              {this.state.loading ? (
                <ActivityIndicator
                  size="70"
                  color="#ffffff"
                  style={styles.spinner}
                />
              ) : (
                <FlatList
                  data={this.state.data}
                  renderItem={({ item, index }) => (
                    <View style={styles.card}>
                      <Text style={styles.indexText}>{index + 1}.</Text>
                      <Text style={styles.titleText}>{item.post_title}</Text>
                      <GradientButton
                        text="View"
                        variant="pill"
                        style={styles.viewButton}
                        onPress={() =>
 
                          this.props.navigation.navigate('ListTickets', {
                            eid: parseInt(item.ID),
                            title: item.post_title,
                          })
                        }
                       // style={styles.viewButton}
                      />
                    </View>
                  )}
                  keyExtractor={item => item.post_title}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No events found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </SafeAreaView>
          <CustomAlert
            visible={this.state.showLogoutAlert}
            title="Logout"
            message="Are you sure you want to logout?"
            onClose={this.hideLogoutAlert}
            onConfirm={this.logout}
            showCancel={true}
            confirmText="Logout"
            cancelText="Cancel"
          />

        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: height * -0.05,
    marginRight: height * -0.02,
    paddingRight: width * 0.02,
  },
  set: {
    paddingTop: width * 0.03,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: RFValue(25),
    color: '#FF71D2',
    marginLeft: height * 0.05,
    marginTop: height * 0.03,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingHorizontal: width * 0.015,
    paddingVertical: width * 0.01,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: RFValue(15),
    color: '#FF71D2',
    fontWeight: '600',
    marginTop: height * 0.03,
  },
  container: {
    flex: 1,
    marginTop: height * 0.02,
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: width * 0.05,
    marginBottom: height * 0.015,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: RFValue(14),
    marginRight: height * 0.01,
  },
  titleText: {
    flex: 1,
    color: '#fff',
    fontSize: RFValue(14),
  },
  viewButton: {
    paddingVertical: width * 0.015,
    paddingHorizontal: width * 0.03,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: height * 0.01,
  },
  spinner: {
    marginTop: height * 0.1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: width * 0.05,
  },
  emptyText: {
    fontSize: RFValue(16),
    color: '#ccc',
    textAlign: 'center',
  },
});

export default Events;
