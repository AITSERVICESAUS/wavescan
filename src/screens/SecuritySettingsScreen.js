// src/screens/SecuritySettingsScreen.js
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import GradientBackground from '../components/GradientBackground';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { deviceRegisterApi, deviceRevokeApi } from '../api/DeviceAuthApi';
import { theme } from '../theme/theme';

const UI = {
  pad: 16,
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.65)',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
};

// Storage keys
const DEVICE_ID_KEY = '@device_id';
const BIO_ENABLED_KEY = '@bio_enabled';
const BIO_EMAIL_KEY = '@bio_email';
const BIO_TOKEN_PRESENT_KEY = '@bio_token_present';

// Keychain services
const KC_DEVICE_TOKEN_SERVICE = 'meup_device_token';
const KC_DEVICE_ID_SERVICE = 'meup_device_id';

// Helper: store device_id in Keychain so it never drifts away from token
async function getOrCreateDeviceId() {
  try {
    const kc = await Keychain.getGenericPassword({ service: KC_DEVICE_ID_SERVICE });
    if (kc?.password) return kc.password;
  } catch (e) {}

  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }

  try {
    await Keychain.setGenericPassword('device_id', id, { service: KC_DEVICE_ID_SERVICE });
  } catch (e) {}

  return id;
}

async function wipeSecureUnlockLocal() {
  await AsyncStorage.setItem(BIO_ENABLED_KEY, '0');
  await AsyncStorage.setItem(BIO_TOKEN_PRESENT_KEY, '0');
  await AsyncStorage.removeItem(BIO_EMAIL_KEY);

  try {
    await Keychain.resetGenericPassword({ service: KC_DEVICE_TOKEN_SERVICE });
  } catch (e) {}
}

export default class SecuritySettingsScreen extends Component {
  state = {
    enabled: false,
    busy: false,

    alertVisible: false,
    alertTitle: '',
    alertMessage: '',
    alertHideButton: false,
  };

  async componentDidMount() {
    await this.loadState();
  }

  showAlert = (title, message, hideButton = false) => {
    this.setState({
      alertVisible: true,
      alertTitle: title,
      alertMessage: message,
      alertHideButton: hideButton,
    });
  };

  hideAlert = () => this.setState({ alertVisible: false });

  loadState = async () => {
    const enabled = (await AsyncStorage.getItem(BIO_ENABLED_KEY)) === '1';
    this.setState({ enabled });
  };

  // ✅ Back button (like History)
  handleBack = () => {
    this.props.navigation.goBack();
  };

  // ✅ Get the email identity reliably (prevents "Email Missing" loop)
  getIdentityEmail = async () => {
    // Priority:
    // 1) @email (stored on successful normal login)
    // 2) BIO_EMAIL_KEY (if previously enabled)
    const e1 = ((await AsyncStorage.getItem('@email')) || '').trim();
    if (e1) return e1.toLowerCase();

    const e2 = ((await AsyncStorage.getItem(BIO_EMAIL_KEY)) || '').trim();
    if (e2) return e2.toLowerCase();

    return '';
  };

  enableSecureUnlock = async () => {
    if (this.state.busy) return;
    this.setState({ busy: true });

    try {
      const jwt = (await AsyncStorage.getItem('@token')) || '';
      const baseUrl = (await AsyncStorage.getItem('@url')) || '';

      if (!jwt || !baseUrl) {
        this.showAlert(
          'Not Logged In',
          'Please login first. Then enable Secure Unlock from Settings.',
        );
        return;
      }

      const device_id = await getOrCreateDeviceId();
      const email = await this.getIdentityEmail();

      if (!email) {
        this.showAlert(
          'Email Missing',
          'Please login again so we can identify your account, then try enabling Secure Unlock.',
        );
        return;
      }

      // Register device (JWT)
      const label = `WaveScan Secure Unlock`;
      const reg = await deviceRegisterApi(baseUrl, jwt, device_id, label);
      const regData = reg?.json || reg;

      if (!(regData?.status === 'SUCCESS' && regData?.device_token)) {
        this.showAlert(
          'Setup Failed',
          regData?.msg || reg?.raw || 'Could not register this device.',
        );
        return;
      }

      const tokenToStore = regData.device_token;

      // ✅ Store device_token securely
      if (Platform.OS === 'ios') {
        // iOS: biometrics OR passcode
        await Keychain.setGenericPassword('device', tokenToStore, {
          service: KC_DEVICE_TOKEN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
      } else {
        // ✅ Android: allow biometrics (fingerprint if available) OR device credential (PIN/pattern/password)
        await Keychain.setGenericPassword('device', tokenToStore, {
          service: KC_DEVICE_TOKEN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
      }

      // Persist flags AFTER Keychain succeeds
      await AsyncStorage.setItem(BIO_ENABLED_KEY, '1');
      await AsyncStorage.setItem(BIO_TOKEN_PRESENT_KEY, '1');
      await AsyncStorage.setItem(BIO_EMAIL_KEY, email.toLowerCase());

      this.setState({ enabled: true });
      this.showAlert('Secure Unlock Enabled', 'This device can now be unlocked quickly.');
    } catch (e) {
      this.showAlert('Error', e?.message || String(e));
    } finally {
      this.setState({ busy: false });
    }
  };

  disableSecureUnlock = async () => {
    if (this.state.busy) return;
    this.setState({ busy: true });

    try {
      const jwt = (await AsyncStorage.getItem('@token')) || '';
      const baseUrl = (await AsyncStorage.getItem('@url')) || '';
      const device_id = await getOrCreateDeviceId();

      // Optional: revoke on server if logged in
      if (jwt && baseUrl) {
        try {
          await deviceRevokeApi(baseUrl, jwt, device_id);
        } catch (e) {
          // ignore revoke failures
        }
      }

      await wipeSecureUnlockLocal();

      this.setState({ enabled: false });
      this.showAlert('Disabled', 'Secure Unlock has been disabled on this device.');
    } catch (e) {
      this.showAlert('Error', e?.message || String(e));
    } finally {
      this.setState({ busy: false });
    }
  };

  changeAccount = async () => {
    if (this.state.busy) return;
    this.setState({ busy: true });

    try {
      // wipe secure unlock
      await wipeSecureUnlockLocal();

      // wipe session + identity
      await AsyncStorage.multiRemove(['@token', '@email']);
      await AsyncStorage.setItem('@isLoggedIn', '0');

      this.showAlert('Account Cleared', 'Please login with a different account.', true);

      setTimeout(() => {
        this.hideAlert();
        this.props.navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 600);
    } catch (e) {
      this.showAlert('Error', e?.message || String(e));
    } finally {
      this.setState({ busy: false });
    }
  };

  onToggle = async (v) => {
    if (v) await this.enableSecureUnlock();
    else await this.disableSecureUnlock();
  };

  render() {
    const { enabled, busy } = this.state;

    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <GradientBackground>
          <SafeAreaView style={styles.safe}>
            {/* ✅ Header row with Back button */}
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

              <Text style={styles.headerTitle}>Security</Text>

              {/* spacer to keep title centered */}
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
              <View style={styles.card}>
                <Text style={styles.title}>Secure Unlock</Text>
                <Text style={styles.desc}>
                  Enable Secure Unlock to quickly unlock WaveScan on this device.
                  {Platform.OS === 'android'
                    ? ' Android will use fingerprint (if available) or device PIN/pattern/password.'
                    : ' iOS can use Face ID / Touch ID / Passcode.'}
                </Text>

                <View style={styles.row}>
                  <Text style={styles.rowText}>Enable Secure Unlock</Text>
                  <Switch value={enabled} onValueChange={this.onToggle} disabled={busy} />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={this.changeAccount}
                  style={[styles.btn, { marginTop: 14 }]}
                  disabled={busy}
                >
                  <Text style={styles.btnText}>Change Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </GradientBackground>

        <CustomAlert
          visible={this.state.alertVisible}
          title={this.state.alertTitle}
          message={this.state.alertMessage}
          onClose={this.hideAlert}
          hideButton={this.state.alertHideButton}
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

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
    width: 18,
    height: 18,
    tintColor: theme.colors.text,
  },

  container: { flex: 1, padding: UI.pad, justifyContent: 'center' },

  card: {
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 18,
    padding: 16,
  },

  title: {
    fontSize: RFValue(16),
    color: UI.text,
    marginBottom: 8,
    fontWeight: '900',
  },

  desc: {
    color: UI.muted,
    fontSize: RFValue(12),
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  rowText: { color: UI.text, fontSize: RFValue(13), fontWeight: '700' },

  btn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: { color: UI.text, fontSize: RFValue(13), fontWeight: '800' },
});