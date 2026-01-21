import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import getToken from '../api/getToken';
import EventsApi from '../api/EventsApi';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../theme/theme';

class Events extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLogoutAlert: false,
      data: [],
      loading: true,
    };
  }

  componentDidMount() {
    getToken()
      .then(token => EventsApi(token))
      .then(data =>
        this.setState({
          data: data?.status === 'SUCCESS' ? data.events : [],
          loading: false,
        })
      )
      .catch(err => {
        console.log(err);
        this.setState({ loading: false });
      });
  }

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
      this.setState({ showLogoutAlert: false });
      this.props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.leftBlock}>
          <Text style={styles.titleText} numberOfLines={2}>
            {item.post_title}
          </Text>
        </View>

        <GradientButton
          text="View"
          onPress={() =>
            this.props.navigation.navigate('ListTickets', {
              eid: parseInt(item.ID, 10),
              title: item.post_title,
            })
          }
          style={styles.viewButton}
          textStyle={styles.viewButtonText}
        />
      </View>
    );
  };

  render() {
    return (
      <>
        {/* ✅ Status bar consistent with other pages */}
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        <GradientBackground>
          {/* GradientBackground already applies horizontal padding */}
          <SafeAreaView style={styles.safe}>
            {/* ✅ Header: centered title, button aligned right */}
            <View style={styles.headerRow}>
              {/* Left spacer matches Logout button width to keep title centered */}
              <View style={styles.headerSideSpacer} />

              <Text style={styles.headerTitle}>Events</Text>

              <TouchableOpacity
                onPress={this.confirmLogout}
                style={styles.logoutBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Intro / Guidance Card (fills empty space nicely) */}
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>Ready to Scan Tickets?</Text>
              <Text style={styles.introSubtitle}>
                Select an event to begin scanning and managing check-ins.
              </Text>

              {/* Optional subtle hint row (you can remove if you want) */}
              <View style={styles.introHintRow}>
                <View style={styles.introDot} />
                <Text style={styles.introHintText}>
                  You’ll see Scan + History after selecting an event.
                </Text>
              </View>
            </View>

            {/* List */}
            {this.state.loading ? (
              <ActivityIndicator size="70" color="#ffffff" style={styles.spinner} />
            ) : (
              <FlatList
                data={this.state.data}
                renderItem={this.renderItem}
                keyExtractor={item => String(item.ID || item.post_title)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No events found</Text>
                  </View>
                }
              />
            )}

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
          </SafeAreaView>

          {/* ✅ BottomNavBar REMOVED from Events screen */}
        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  headerRow: {
    marginTop: theme.spacing.headerTop,
    marginBottom: theme.spacing.headerBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: theme.colors.text,
    fontSize: RFValue(16),
    fontWeight: '900',
  },

  logoutBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },

  logoutText: {
    color: theme.colors.text,
    fontSize: RFValue(12),
    fontWeight: '800',
  },

  // ✅ This keeps title perfectly centered by matching the Logout button “footprint”
  headerSideSpacer: {
    width: 72, // tuned to visually match logout button width (padding + text)
    height: 40,
  },

  // ✅ Intro card
  introCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    marginBottom: 14,
    ...theme.shadow.card,
  },

  introTitle: {
    color: theme.colors.text,
    fontSize: RFValue(15),
    fontWeight: '900',
  },

  introSubtitle: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: RFValue(11.5),
    fontWeight: '700',
    lineHeight: RFValue(16),
  },

  introHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  introDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },

  introHintText: {
    color: theme.colors.textSoft,
    fontSize: RFValue(10.5),
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 30, // ✅ no BottomNavBar now
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow.card,
  },

  leftBlock: {
    flex: 1,
    paddingRight: 12,
  },

  titleText: {
    color: theme.colors.text,
    fontSize: RFValue(13),
    fontWeight: '800',
    lineHeight: RFValue(18),
  },

  viewButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  viewButtonText: {
    fontSize: RFValue(12),
    fontWeight: '900',
  },

  spinner: {
    marginTop: 60,
  },

  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: RFValue(14),
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default Events;
