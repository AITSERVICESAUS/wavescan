import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RFValue} from 'react-native-responsive-fontsize';

const {width, height} = Dimensions.get('window');

const COLORS = {
  active: '#7C3AED',        // purple
  inactive: '#8A8F9C',      // gray
  barBg: 'rgba(12, 18, 34, 0.92)',
  barBorder: 'rgba(255,255,255,0.10)',
  bubbleIdle: '#1B2238',
  white: '#FFFFFF',
};

const BottomNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const currentRoute = route.name;

  const isHistory = currentRoute === 'History';
  const isEvents = currentRoute === 'Events';
  const isScan = currentRoute === 'ScanBarcode';

  const tintFor = isActive => (isActive ? COLORS.active : COLORS.inactive);

  const handleHistoryPress = async () => {
    try {
      const eid = await AsyncStorage.getItem('@selectedEid');
      if (eid) {
        navigation.navigate('History', {eid: parseInt(eid, 10)});
      } else {
        alert('Please select an event first.');
      }
    } catch {
      alert('Failed to load event.');
    }
  };

  const handleScanPress = async () => {
    const eid = await AsyncStorage.getItem('@selectedEid');
    if (eid) {
      navigation.navigate('ScanBarcode', {eid: parseInt(eid, 10)});
    } else {
      alert('Please select an event first.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bottomNavbarContainer}>

        {/* History (original icon restored) */}
        <TouchableOpacity
          onPress={handleHistoryPress}
          style={styles.tabBtn}
          activeOpacity={0.85}>
          <Image
            source={require('../assets/history.png')} // ✅ original icon
            style={[
              styles.icon,
              {tintColor: tintFor(isHistory)},
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.navText, {color: tintFor(isHistory)}]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Scan bubble */}
        <View style={styles.scanSlot}>
          <TouchableOpacity
            onPress={handleScanPress}
            activeOpacity={0.9}
            style={[
              styles.scanBubble,
              {backgroundColor: isScan ? COLORS.active : COLORS.bubbleIdle},
            ]}>
            <Image
              source={require('../assets/scannericon.png')}
              style={styles.scanIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Events */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Events')}
          style={styles.tabBtn}
          activeOpacity={0.85}>
          <Image
            source={require('../assets/event.png')}
            style={[
              styles.icon,
              {tintColor: tintFor(isEvents)},
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.navText, {color: tintFor(isEvents)}]}>
            Events
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },

  bottomNavbarContainer: {
    flexDirection: 'row',
    height: 68,
    paddingHorizontal: width * 0.07,
    backgroundColor: COLORS.barBg,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.barBorder,
  },

  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },

  icon: {
    width: RFValue(22),
    height: RFValue(22),
    marginBottom: 6,
  },

  navText: {
    fontSize: RFValue(10),
    fontWeight: '600',
  },

  scanSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },

  scanBubble: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  scanIcon: {
    width: RFValue(28),
    height: RFValue(28),
    tintColor: '#FFFFFF',
  },
});

export default BottomNavBar;
