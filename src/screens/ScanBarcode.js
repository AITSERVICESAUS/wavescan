import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  StatusBar,
  PermissionsAndroid,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraType } from 'react-native-camera-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';

import BottomNavBar from '../components/BottomNavBar';
import CustomAlert from '../components/CustomAlert';
import { theme } from '../theme/theme';

const { height } = Dimensions.get('window');

class ScanBarcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: false,
      token_storate: '',
      valid_ticket: '',
      name_customer: '',
      seat: '',
      checkin_time: '',
      e_cal: '',
      token: '',
      url: '',
      eid: '',
      cameraPermissionGranted: false,

      showCustomAlert: false,
      alertTitle: '',
      alertMessage: '',
      alertType: '',
      ticket_type: '',
    };
  }

  async componentDidMount() {
    await this.loadSettings();

    const eidFromParams = this.props.route?.params?.eid;
    if (eidFromParams) {
      await AsyncStorage.setItem('@selectedEid', String(eidFromParams));
      this.setState({ eid: eidFromParams });
    }

    this.checkCameraPermission();
  }

  async loadSettings() {
    const token = await AsyncStorage.getItem('@token');
    const url = await AsyncStorage.getItem('@url');
    const eid = JSON.stringify(this.props.route?.params?.eid);
    this.setState({ token, url, eid });
  }

  async checkCameraPermission() {
    if (Platform.OS === 'android') {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      this.setState({
        cameraPermissionGranted:
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED,
      });
    } else {
      this.setState({ cameraPermissionGranted: true });
    }
  }

  handleBack = async () => {
    let eid = this.props.route?.params?.eid;
    if (!eid) {
      eid = await AsyncStorage.getItem('@selectedEid');
    }
    // Navigate specifically to ListTickets with the required param
    this.props.navigation.navigate('ListTickets', {
      eid: eid ? parseInt(eid, 10) : null
    });
  };

  resetScan = () => {
    this.setState({
      token_storate: '',
      valid_ticket: '',
      name_customer: '',
      seat: '',
      checkin_time: '',
      e_cal: '',
      scanning: false,
      ticket_type: '',
    });
  };

  showCustomAlert = (title, message, type) => {
    this.setState({
      showCustomAlert: true,
      alertTitle: title,
      alertMessage: message,
      alertType: type,
    });
  };

  hideCustomAlert = () => {
    this.setState({ showCustomAlert: false }, this.resetScan);
  };

  onBarCodeRead = async event => {
    const scannedCode = event.nativeEvent?.codeStringValue;
    const { scanning, token_storate, token, url, eid } = this.state;

    if (scanning || scannedCode === token_storate) return;

    this.setState({ scanning: true });

    try {
      const response = await fetch(`${url}wp-json/meup/v1/validate_ticket/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          qrcode: scannedCode,
          eid,
        }),
      });

      const resjson = await response.json();

      if (resjson.status === 'SUCCESS') {
        this.showCustomAlert(
          'SUCCESS',
          `Name: ${resjson.name_customer}\nTicket Type: ${resjson.ticket_type}`,
          'success'
        );
      } else {
        this.showCustomAlert('FAIL', resjson.msg, 'fail');
      }

      this.setState({
        valid_ticket: resjson.status,
        name_customer: resjson.name_customer,
        seat: resjson.seat,
        checkin_time: resjson.checkin_time,
        e_cal: resjson.e_cal,
        token_storate: scannedCode,
        ticket_type: resjson.ticket_type,
      });
    } catch (error) {
      this.showCustomAlert('Error', 'Scan failed. Please try again.', 'fail');
    }
  };

  render() {
    if (!this.state.cameraPermissionGranted) {
      return (
        <View style={styles.container}>
          <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

          <SafeAreaView style={styles.permissionWrap}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={this.handleBack}
                style={styles.backBtn}
                activeOpacity={0.85}
              >
                <Image
                  source={require('../assets/back.png')}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Scan</Text>

              <View style={{ width: 40 }} />
            </View>

            <Text style={styles.camPermission}>Camera permission not granted.</Text>
          </SafeAreaView>

          <BottomNavBar />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Fullscreen camera */}
        <Camera
          cameraType={CameraType.Back}
          scanBarcode={true}
          onReadCode={this.onBarCodeRead}
          showFrame={true}
          laserColor={theme.colors.primary}
          frameColor={theme.colors.primary}
          style={styles.preview}
        />

        {/* Header overlay — spacing matches History */}
        <SafeAreaView style={styles.headerSafe} pointerEvents="box-none">
          <View style={styles.headerRow} pointerEvents="box-none">
            <TouchableOpacity
              onPress={this.handleBack}
              style={styles.backBtn}
              activeOpacity={0.85}
            >
              <Image
                source={require('../assets/back.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Scan</Text>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <BottomNavBar />

        <CustomAlert
          visible={this.state.showCustomAlert}
          title={this.state.alertTitle}
          message={this.state.alertMessage}
          onClose={this.hideCustomAlert}
          onConfirm={this.hideCustomAlert}
          showCancel={false}
          confirmText="OK"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Your theme has bgTop/bgBottom; scan uses camera behind so keep it dark
    backgroundColor: theme.colors.bgTop,
  },

  preview: {
    flex: 1,
  },

  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },

  // ✅ MATCH HISTORY HEADER POSITIONING
  headerRow: {
    // same as History:
    marginTop: theme.spacing.headerTop,
    marginBottom: theme.spacing.headerBottom,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    // ✅ History gets this from GradientBackground.
    // Scan does not, so we add it using the CORRECT theme key:
    paddingHorizontal: theme.spacing.screenPadding,
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

  // ✅ Match History title styling
  headerTitle: {
    color: theme.colors.text,
    fontSize: RFValue(16),
    fontWeight: '900',
  },

  permissionWrap: {
    flex: 1,
  },

  camPermission: {
    textAlign: 'center',
    marginTop: height * 0.2,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.screenPadding,
    fontWeight: '700',
  },
});

export default ScanBarcode;
