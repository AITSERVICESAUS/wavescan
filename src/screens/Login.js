import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../components/GradientBackground';
import LoginApi from '../api/LoginApi';
import GradientButton from '../components/GradientButton';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CustomAlert from '../components/CustomAlert';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import * as Keychain from 'react-native-keychain';
import {deviceLoginApi} from '../api/DeviceAuthApi';

const {width, height} = Dimensions.get('window');

const UI = {
  pad: width * 0.06,
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.65)',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  inputBg: 'rgba(255,255,255,0.08)',
  primary: '#7C3AED',
};

// Storage keys
const DEVICE_ID_KEY = '@device_id';
const BIO_ENABLED_KEY = '@bio_enabled';
const BIO_EMAIL_KEY = '@bio_email';
const BIO_TOKEN_PRESENT_KEY = '@bio_token_present';
const KC_MIGRATION_KEY = '@kc_migration_v2';

// Keychain services (MUST be consistent everywhere)
const KC_DEVICE_TOKEN_SERVICE = 'meup_device_token';
const KC_DEVICE_ID_SERVICE = 'meup_device_id';

// ---------------- HELPERS ----------------
function prettyAuthError(e) {
  const msg = (e?.message || String(e) || '').toLowerCase();
  const code = e?.code;

  // user cancel (Android often code 13)
  if (code === 13 || msg.includes('cancel')) {
    return 'Unlock cancelled.';
  }

  // some devices return this on cancel/fail
  if (msg.includes('user not authenticated')) {
    return 'Unlock cancelled.';
  }

  // no enrolled biometrics / not available / weak biometric
  if (
    msg.includes('not enrolled') ||
    msg.includes('no biometrics') ||
    msg.includes('biometry') ||
    msg.includes('biometric') ||
    msg.includes('not available') ||
    msg.includes('not supported')
  ) {
    return 'Biometric unlock isn’t available on this device. Use your device PIN instead.';
  }

  // lockout / too many attempts
  if (msg.includes('lockout') || msg.includes('too many')) {
    return 'Too many attempts. Please use your device PIN.';
  }

  return e?.message || 'Unlock failed. Please try again.';
}

// Helper: store device_id in Keychain so it never drifts away from token
async function getOrCreateDeviceId() {
  try {
    const kc = await Keychain.getGenericPassword({service: KC_DEVICE_ID_SERVICE});
    if (kc?.password) return kc.password;
  } catch (e) {}

  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }

  try {
    await Keychain.setGenericPassword('device_id', id, {service: KC_DEVICE_ID_SERVICE});
  } catch (e) {}

  return id;
}

// Helper: hard-reset secure unlock state
async function resetSecureUnlockState(setStateFn) {
  await AsyncStorage.setItem(BIO_ENABLED_KEY, '0');
  await AsyncStorage.setItem(BIO_TOKEN_PRESENT_KEY, '0');
  await AsyncStorage.removeItem(BIO_EMAIL_KEY);

  try {
    await Keychain.resetGenericPassword({service: KC_DEVICE_TOKEN_SERVICE});
  } catch (e) {}

  setStateFn({
    bioHasToken: false,
    bioReady: false,
  });
}

// One-time migration: wipe any old token so Quick Unlock can’t “free login”
async function migrateKeychainTokenOnce() {
  try {
    const done = await AsyncStorage.getItem(KC_MIGRATION_KEY);
    if (done === '1') return;

    try {
      await Keychain.resetGenericPassword({service: KC_DEVICE_TOKEN_SERVICE});
    } catch (e) {}

    await AsyncStorage.setItem(BIO_ENABLED_KEY, '0');
    await AsyncStorage.setItem(BIO_TOKEN_PRESENT_KEY, '0');
    await AsyncStorage.removeItem(BIO_EMAIL_KEY);

    await AsyncStorage.setItem(KC_MIGRATION_KEY, '1');
  } catch (e) {}
}

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://staging2.ticketwave.com.au/',
      user: '',
      pass: '',
      secureText: true,

      // Alert
      alertVisible: false,
      alertTitle: '',
      alertMessage: '',
      alertHideButton: false,

      // Secure Unlock
      bioSupported: false,
      bioHasToken: false,
      bioReady: false,
      bioTypeLabel: 'Secure Unlock',
    };

    // Auto unlock control
    this._autoTried = false;
    this._focusUnsub = null;
  }

  async componentDidMount() {
    await migrateKeychainTokenOnce();
    await this.refreshBiometricState();

    // ✅ Auto prompt on initial mount (important if Login is initial route)
    if (this.state.bioReady && !this._autoTried) {
      this._autoTried = true;
      this._onBiometricLogin({silent: true});
    }

    // ✅ Auto-trigger unlock on screen focus
    this._focusUnsub = this.props.navigation.addListener('focus', async () => {
      await this.refreshBiometricState();

      if (this.state.bioReady && !this._autoTried) {
        this._autoTried = true;
        this._onBiometricLogin({silent: true});
      }
    });
  }

  componentWillUnmount() {
    if (this._focusUnsub) this._focusUnsub();
    this._autoTried = false;
  }

  refreshBiometricState = async () => {
    try {
      const savedToggle = (await AsyncStorage.getItem(BIO_ENABLED_KEY)) === '1';
      const tokenPresent = (await AsyncStorage.getItem(BIO_TOKEN_PRESENT_KEY)) === '1';
      const savedEmail = (await AsyncStorage.getItem(BIO_EMAIL_KEY)) || '';

      const biometryType = await Keychain.getSupportedBiometryType();

      let bioTypeLabel = 'Secure Unlock';
      if (Platform.OS === 'ios') {
        if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) bioTypeLabel = 'Face ID';
        if (biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID) bioTypeLabel = 'Touch ID';
        if (!biometryType) bioTypeLabel = 'Secure Unlock';
      } else {
        bioTypeLabel = 'Secure Unlock';
      }

      // Android: we allow PIN fallback always, but secure unlock availability is controlled by bioReady flags
      const bioSupported = Platform.OS === 'android' ? true : !!biometryType;

      const device_id = await getOrCreateDeviceId();

      const bioHasToken = savedToggle && tokenPresent && !!savedEmail;
      const bioReady = savedToggle && tokenPresent && !!savedEmail && !!device_id;

      this.setState({
        bioSupported,
        bioHasToken,
        bioReady,
        bioTypeLabel,
      });
    } catch (e) {
      this.setState({
        bioSupported: Platform.OS === 'android',
        bioHasToken: false,
        bioReady: false,
        bioTypeLabel: 'Secure Unlock',
      });
    }
  };

  showAlert = (title, message, hideButton = false) => {
    this.setState({
      alertVisible: true,
      alertTitle: title,
      alertMessage: message,
      alertHideButton: hideButton,
    });
  };

  hideAlert = () => {
    this.setState({alertVisible: false});
  };

  _validate() {
    const {url, user, pass} = this.state;

    if (!url.trim()) {
      this.showAlert('Validation Error', 'Enter a valid Site URL (e.g. https://yourdomain.com/).');
      return false;
    }
    if (!url.endsWith('/')) {
      this.showAlert('Validation Error', 'URL must end with a trailing slash (/).');
      return false;
    }
    if (!user.trim()) {
      this.showAlert('Validation Error', 'Enter Email.');
      return false;
    }
    if (!pass.trim()) {
      this.showAlert('Validation Error', 'Enter Password.');
      return false;
    }
    return true;
  }

  saveToStorage = async token => {
    if (token) {
      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@isLoggedIn', '1');
      await AsyncStorage.setItem('@url', this.state.url);
      return true;
    }
    return false;
  };

  // ✅ Secure Unlock: fingerprint-only attempt if fingerprint is present; otherwise PIN only (avoids face prompt)
  _onBiometricLogin = async ({silent = false} = {}) => {
    const {url} = this.state;

    try {
      const identity = (await AsyncStorage.getItem(BIO_EMAIL_KEY)) || '';
      const device_id = await getOrCreateDeviceId();

      if (!identity) {
        if (!silent) {
          this.showAlert('Secure Unlock Unavailable', 'Enable Secure Unlock from Settings first.');
        }
        return;
      }

      const prompt =
        Platform.OS === 'android'
          ? {title: 'Unlock to continue'}
          : {title: `Login with ${this.state.bioTypeLabel}`};

      let creds = null;

      if (Platform.OS === 'android') {
        // ✅ Detect fingerprint presence via supported biometry type
        let biometryType = null;
        try {
          biometryType = await Keychain.getSupportedBiometryType();
        } catch (e) {}

        const hasFingerprint =
          biometryType === Keychain.BIOMETRY_TYPE.FINGERPRINT ||
          biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID;

        if (hasFingerprint) {
          // Attempt A: biometrics (fingerprint)
          try {
            creds = await Keychain.getGenericPassword({
              service: KC_DEVICE_TOKEN_SERVICE,
              authenticationPrompt: prompt,
              authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
            });
          } catch (eBio) {
            // Attempt B: fallback to PIN/pattern/password
            try {
              creds = await Keychain.getGenericPassword({
                service: KC_DEVICE_TOKEN_SERVICE,
                authenticationPrompt: prompt,
                authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE,
              });
            } catch (ePin) {
              if (!silent) this.showAlert('Unlock Failed', prettyAuthError(ePin));
              return;
            }
          }
        } else {
          // ✅ Face-only or unknown: go straight to PIN/pattern/password (NO FACE PROMPT)
          try {
            creds = await Keychain.getGenericPassword({
              service: KC_DEVICE_TOKEN_SERVICE,
              authenticationPrompt: prompt,
              authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE,
            });
          } catch (ePin) {
            if (!silent) this.showAlert('Unlock Failed', prettyAuthError(ePin));
            return;
          }
        }
      } else {
        // iOS: biometrics prompt; OS handles passcode fallback
        try {
          creds = await Keychain.getGenericPassword({
            service: KC_DEVICE_TOKEN_SERVICE,
            authenticationPrompt: prompt,
            authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
          });
        } catch (e) {
          if (!silent) this.showAlert('Unlock Failed', prettyAuthError(e));
          return;
        }
      }

      if (!creds?.password) {
        if (!silent) {
          this.showAlert(
            'Secure Unlock Unavailable',
            'No token found. Enable Secure Unlock again from Settings.',
          );
        }
        return;
      }

      const device_token = creds.password;

      const meta = await deviceLoginApi(url, identity, device_id, device_token);
      const resjson = meta?.json || meta;

      if (resjson?.status === 'SUCCESS' && resjson.token) {
        const saved = await this.saveToStorage(resjson.token);

        if (saved) {
          this.props.navigation.reset({
            index: 0,
            routes: [{name: 'GetStart'}],
          });
        } else {
          if (!silent) this.showAlert('Error', 'Could not save session. Please try again.');
        }
        return;
      }

      // If token rejected by server, self-heal by wiping secure unlock state
      const serverMsg = String(resjson?.msg || '').toLowerCase();
      if (serverMsg.includes('token') || serverMsg.includes('device')) {
        await resetSecureUnlockState(this.setState.bind(this));
        await this.refreshBiometricState();
      }

      if (!silent) this.showAlert('Login Failed', resjson?.msg || 'Secure Unlock login failed.');
    } catch (err) {
      if (!silent) this.showAlert('Error', prettyAuthError(err));
    }
  };

  _onLogin = async () => {
    if (!this._validate()) return;

    const {url, user, pass} = this.state;

    try {
      const resjson = await LoginApi(url, user, pass);

      if (resjson?.html) {
        this.showAlert(
          'Password Update Required',
          'We detected a password reset requirement. Please change your password on the website to continue.',
          true,
        );
        return;
      }

      if (resjson?.status === 'SUCCESS' && (await this.saveToStorage(resjson.token))) {
        await AsyncStorage.setItem('@email', user.toLowerCase().trim());

        await this.refreshBiometricState();

        this.showAlert('Welcome!', 'You are logged in.', true);

        setTimeout(() => {
          this.hideAlert();
          this.props.navigation.reset({
            index: 0,
            routes: [{name: 'GetStart'}],
          });
        }, 900);

        return;
      }

      this.showAlert('Login Failed', resjson?.msg || 'Incorrect username or password.');
    } catch (err) {
      this.showAlert('Error', err?.message || 'Something went wrong. Please try again.');
    }
  };

  render() {
    const {user, pass} = this.state;

    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <GradientBackground>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />

            <View style={styles.formContainer}>
              <Text style={styles.title}>Login</Text>

              {/* ✅ Button removed: Secure Unlock is auto-triggered only */}

              <Text style={styles.subTopic}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@gmail.com"
                onChangeText={text =>
                  this.setState({user: text}, () => {
                    this._autoTried = false;
                  })
                }
                value={user}
                autoCapitalize="none"
                placeholderTextColor={UI.muted}
              />

              <Text style={styles.subTopic}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  onChangeText={text =>
                    this.setState({pass: text}, () => {
                      this._autoTried = false;
                    })
                  }
                  value={pass}
                  secureTextEntry={this.state.secureText}
                  placeholderTextColor={UI.muted}
                />
                <Ionicons
                  name={this.state.secureText ? 'eye-off' : 'eye'}
                  size={22}
                  color={UI.muted}
                  onPress={() => this.setState(prev => ({secureText: !prev.secureText}))}
                  style={styles.eyeIcon}
                />
              </View>

              <GradientButton text="Log In" onPress={this._onLogin} />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  this.props.navigation.navigate('ResetPassword', {url: this.state.url})
                }
                style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
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
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: UI.pad,
    paddingBottom: height * 0.04,
  },

  logo: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    marginBottom: height * 0.03,
    resizeMode: 'contain',
    opacity: 0.95,
  },

  formContainer: {
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 18,
    padding: 16,
  },

  title: {
    fontSize: RFValue(18),
    color: UI.text,
    marginBottom: 14,
    fontWeight: '800',
    textAlign: 'left',
  },

  subTopic: {
    fontSize: RFValue(12),
    color: UI.muted,
    marginBottom: 8,
    textAlign: 'left',
    fontWeight: '600',
  },

  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: UI.inputBg,
    borderWidth: 1,
    borderColor: UI.border,
    marginBottom: 12,
    paddingHorizontal: 14,
    fontSize: RFValue(13),
    color: UI.text,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: UI.inputBg,
    borderWidth: 1,
    borderColor: UI.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 50,
  },

  passwordInput: {
    flex: 1,
    fontSize: RFValue(13),
    color: UI.text,
  },

  eyeIcon: {
    paddingLeft: 10,
  },

  resetBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetBtnText: {
    color: UI.text,
    fontSize: RFValue(13),
    fontWeight: '700',
  },
});

export default Login;