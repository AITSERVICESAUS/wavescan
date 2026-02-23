import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';

import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import CustomAlert from '../components/CustomAlert';

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

async function postJson(url, path, body) {
  const res = await fetch(url + path, {
    method: 'POST',
    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

class ResetPassword extends Component {
  constructor(props) {
    super(props);

    const passedUrl = props.route?.params?.url;
    this.state = {
      url: passedUrl || 'https://ticketwave.com.au/',
      step: 1, // 1=email, 2=otp, 3=new password

      email: '',
      code: '',
      resetToken: '',

      newPassword: '',
      confirmPassword: '',
      secureText1: true,
      secureText2: true,

      loading: false,

      alertVisible: false,
      alertTitle: '',
      alertMessage: '',
      alertHideButton: false,
    };
  }

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

  isValidEmail = (v) => {
    const s = String(v || '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  };

  // STEP 1: Send OTP
  sendCode = async () => {
    const {url, email} = this.state;

    if (!url || !url.endsWith('/')) {
      this.showAlert('Validation Error', 'URL must end with a trailing slash (/).');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    this.setState({loading: true});
    try {
      const json = await postJson(url, 'wp-json/meup/v1/forgot_password/', {email: email.trim()});

      // Backend always returns SUCCESS to prevent enumeration.
      this.showAlert('Code Sent', json?.msg || 'If the account exists, we sent a verification code.');
      this.setState({step: 2});
    } catch (e) {
      console.error(e);
      this.showAlert('Error', e.message || 'Something went wrong.');
    } finally {
      this.setState({loading: false});
    }
  };

  // STEP 2: Verify OTP -> get reset_token
  verifyCode = async () => {
    const {url, email, code} = this.state;

    if (!this.isValidEmail(email)) {
      this.showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!/^\d{6}$/.test(String(code).trim())) {
      this.showAlert('Validation Error', 'Enter the 6-digit code.');
      return;
    }

    this.setState({loading: true});
    try {
      const json = await postJson(url, 'wp-json/meup/v1/verify_reset_code/', {
        email: email.trim(),
        code: String(code).trim(),
      });

      if (json?.status === 'SUCCESS' && json?.reset_token) {
        this.showAlert('Verified', 'Code verified. Please set a new password.');
        this.setState({resetToken: json.reset_token, step: 3});
      } else {
        this.showAlert('Invalid Code', json?.msg || 'Invalid code or expired.');
      }
    } catch (e) {
      console.error(e);
      this.showAlert('Error', e.message || 'Something went wrong.');
    } finally {
      this.setState({loading: false});
    }
  };

  resendCode = async () => {
    const {url, email} = this.state;

    if (!this.isValidEmail(email)) {
      this.showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    this.setState({loading: true});
    try {
      const json = await postJson(url, 'wp-json/meup/v1/resend_reset_code/', {
        email: email.trim(),
      });

      this.showAlert('Code Sent', json?.msg || 'If the account exists, we sent a verification code.');
    } catch (e) {
      console.error(e);
      this.showAlert('Error', e.message || 'Something went wrong.');
    } finally {
      this.setState({loading: false});
    }
  };

  // STEP 3: Reset password
  resetPassword = async () => {
    const {url, email, resetToken, newPassword, confirmPassword} = this.state;

    if (!resetToken || resetToken.length < 20) {
      this.showAlert('Error', 'Reset token missing. Please verify the code again.');
      this.setState({step: 2});
      return;
    }

    if (String(newPassword).trim().length < 10) {
      this.showAlert('Validation Error', 'Password must be at least 10 characters.');
      return;
    }

    if (String(newPassword) !== String(confirmPassword)) {
      this.showAlert('Validation Error', 'Passwords do not match.');
      return;
    }

    this.setState({loading: true});
    try {
      const json = await postJson(url, 'wp-json/meup/v1/reset_password/', {
        email: email.trim(),
        reset_token: resetToken,
        new_password: newPassword,
      });

      if (json?.status === 'SUCCESS') {
        this.showAlert('Success', 'Password updated successfully.', true);

        // go back to login after a moment
        setTimeout(() => {
          this.hideAlert();
          this.props.navigation.goBack();
        }, 1200);
      } else {
        this.showAlert('Failed', json?.msg || 'Reset token invalid or expired.');
      }
    } catch (e) {
      console.error(e);
      this.showAlert('Error', e.message || 'Something went wrong.');
    } finally {
      this.setState({loading: false});
    }
  };

  renderStepTitle() {
    const {step} = this.state;
    if (step === 1) return 'Reset Password';
    if (step === 2) return 'Enter Verification Code';
    return 'Set New Password';
  }

  render() {
    const {email, code, newPassword, confirmPassword, step, loading} = this.state;

    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <GradientBackground>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => this.props.navigation.goBack()}
                  style={styles.backBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={22} color={UI.text} />
                </TouchableOpacity>

                <Text style={styles.title}>{this.renderStepTitle()}</Text>

                <View style={{width: 40}} />
              </View>

              {/* Step 1 + 2 share Email */}
              <Text style={styles.subTopic}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@gmail.com"
                placeholderTextColor={UI.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                editable={step !== 3} // lock email at final step
                onChangeText={(t) => this.setState({email: t})}
              />

              {step === 1 && (
                <>
                  <Text style={styles.helperText}>
                    We’ll send a 6-digit verification code to your email.
                  </Text>

                  <GradientButton text={loading ? 'Sending...' : 'Send Code'} onPress={this.sendCode} />
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={styles.subTopic}>6-digit Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor={UI.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(t) => this.setState({code: t.replace(/[^0-9]/g, '')})}
                  />

                  <GradientButton text={loading ? 'Verifying...' : 'Verify Code'} onPress={this.verifyCode} />

                  <TouchableOpacity
                    onPress={this.resendCode}
                    activeOpacity={0.85}
                    style={styles.linkBtn}
                    disabled={loading}
                  >
                    <Text style={styles.linkText}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 3 && (
                <>
                  <Text style={styles.subTopic}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="New password (10+ characters)"
                      placeholderTextColor={UI.muted}
                      secureTextEntry={this.state.secureText1}
                      value={newPassword}
                      onChangeText={(t) => this.setState({newPassword: t})}
                    />
                    <Ionicons
                      name={this.state.secureText1 ? 'eye-off' : 'eye'}
                      size={22}
                      color={UI.muted}
                      onPress={() => this.setState((p) => ({secureText1: !p.secureText1}))}
                      style={styles.eyeIcon}
                    />
                  </View>

                  <Text style={styles.subTopic}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm password"
                      placeholderTextColor={UI.muted}
                      secureTextEntry={this.state.secureText2}
                      value={confirmPassword}
                      onChangeText={(t) => this.setState({confirmPassword: t})}
                    />
                    <Ionicons
                      name={this.state.secureText2 ? 'eye-off' : 'eye'}
                      size={22}
                      color={UI.muted}
                      onPress={() => this.setState((p) => ({secureText2: !p.secureText2}))}
                      style={styles.eyeIcon}
                    />
                  </View>

                  <GradientButton
                    text={loading ? 'Updating...' : 'Update Password'}
                    onPress={this.resetPassword}
                  />

                  <TouchableOpacity
                    onPress={() => this.setState({step: 2})}
                    activeOpacity={0.85}
                    style={styles.linkBtn}
                    disabled={loading}
                  >
                    <Text style={styles.linkText}>Back to code verification</Text>
                  </TouchableOpacity>
                </>
              )}
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

  formContainer: {
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 18,
    padding: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  title: {
    fontSize: RFValue(16),
    color: UI.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  subTopic: {
    fontSize: RFValue(12),
    color: UI.muted,
    marginBottom: 8,
    textAlign: 'left',
    fontWeight: '600',
  },

  helperText: {
    color: UI.muted,
    fontSize: RFValue(11),
    marginBottom: 12,
    lineHeight: 16,
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

  linkBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: RFValue(12),
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default ResetPassword;
