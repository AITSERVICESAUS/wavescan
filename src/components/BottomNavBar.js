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

const BottomNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;
  const isActive = screen => currentRoute === screen;

  const handleHistoryPress = async () => {
    try {
      const eid = await AsyncStorage.getItem('@selectedEid');
      if (eid) {
        navigation.navigate('History', {eid: parseInt(eid)});
      } else {
        alert('Please select an event first.');
      }
    } catch (e) {
      alert('Failed to load event. Please try again.');
    }
  };

  return (
    <View style={styles.bottomNavbarContainer}>
      {/* History */}
      <View style={styles.bottomNavHistory}>
        <TouchableOpacity
          onPress={handleHistoryPress}
          style={{alignItems: 'center'}}>
          <Image source={require('../assets/history.png')}
            style={[
              styles.historyButton,
              {tintColor: isActive('History') ? '#FF71D2' : 'white'},
            ]}
            resizeMode="contain"
          />
          <Text style={[
              styles.navText,
              {color: isActive('History') ? '#FF71D2' : 'white'},
            ]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scan icon */}
      {/* <DropShadow style={styles.shadowProp}> */}
      <View style={styles.bottomNavbarScanner}>
        <TouchableOpacity
          style={{alignItems: 'center'}}
          onPress={async () => {
            const eid = await AsyncStorage.getItem('@selectedEid');
            if (eid) {
              navigation.push('ScanBarcode', {eid: parseInt(eid)});
            } else {
              alert('Please select an event first.');
            }
          }}>
          <Image
            source={require('../assets/scanNav.png')}
            style={styles.scanButton}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {/* </DropShadow> */}

      {/* Events */}
      <View style={styles.bottomNavbarEvents}>
        <TouchableOpacity
        onPress={() => navigation.navigate('Events')}
        style={{alignItems: 'center'}}>
          <Image
            source={require('../assets/event.png')}
            style={[
              styles.eventButton,
              {tintColor: isActive('Events') ? '#FF71D2' : 'white'},
            ]}
          />
          <Text
            style={[
              styles.navText,
              {color: isActive('Events') ? '#FF71D2' : 'white'},
            ]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavbarContainer: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: width * 0.05,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.02,
  },
  bottomNavbarScanner: {
    marginTop: height * -0.05,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD23EE',
    borderRadius: 50,
    padding: width * 0.03,
  },
  bottomNavbarEvents: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.01,
  },
  historyButton: {
    width: 30,
    height: 30,
  },
  scanButton: {
    width: 40,
    height: 40,
  },
  eventButton: {
    width: 25,
    height: 25,
  },
  navText: {
    color: 'white',
    fontSize: RFValue(10),
    marginTop: height * 0.005,
    textAlign: 'center',
    justifyContent: 'center',
  },
  scanButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNavBar;
