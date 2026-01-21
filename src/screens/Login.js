import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../components/GradientBackground';
import LoginApi from '../api/LoginApi';
import GradientButton from '../components/GradientButton';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CustomAlert from '../components/CustomAlert';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';

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

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://ticketwave.com.au/',
      user: '',
      pass: '',
      secureText: true,
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

  _validate() {
    const {url, user, pass} = this.state;
    if (!url.trim()) {
      this.showAlert(
        'Validation Error',
        'Enter a valid Site URL (e.g. https://yourdomain.com/).',
      );
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

  _onLogin = async () => {
    if (!this._validate()) return;

    const {navigate} = this.props.navigation;
    const {url, user, pass} = this.state;

    try {
      const resjson = await LoginApi(url, user, pass);

      if (resjson.html) {
        this.showAlert(
          'Password Update Required',
          'We detected a password reset requirement. Please change your password on the website to continue.',
          true,
        );
        return;
      }

      if (resjson.status === 'SUCCESS' && (await this.saveToStorage(resjson.token))) {
        this.showAlert('Welcome!', 'You are logged in.', true);
        setTimeout(() => {
          this.hideAlert();
          navigate('GetStart');
        }, 2000);
      } else {
        this.showAlert('Login Failed', 'Incorrect username or password.');
      }
    } catch (err) {
      console.error(err);
      this.showAlert('Error', err.message || 'Something went wrong. Please try again.');
    }
  };

  async saveToStorage(token) {
    if (token) {
      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@isLoggedIn', '1');
      await AsyncStorage.setItem('@url', this.state.url);
      return true;
    }
    return false;
  }

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

              <Text style={styles.subTopic}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@gmail.com"
                onChangeText={text => this.setState({user: text})}
                value={user}
                autoCapitalize="none"
                placeholderTextColor={UI.muted}
              />

              <Text style={styles.subTopic}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  onChangeText={text => this.setState({pass: text})}
                  value={pass}
                  secureTextEntry={this.state.secureText}
                  placeholderTextColor={UI.muted}
                />
                <Ionicons
                  name={this.state.secureText ? 'eye-off' : 'eye'}
                  size={22}
                  color={UI.muted}
                  onPress={() =>
                    this.setState(prev => ({secureText: !prev.secureText}))
                  }
                  style={styles.eyeIcon}
                />
              </View>

              <GradientButton text="Log In" onPress={this._onLogin} />
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
});

export default Login;
