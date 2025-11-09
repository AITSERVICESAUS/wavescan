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

// Hardcoded Site URL for Australia
const HARDCODED_SITE_URL = 'https://ticketwave.com.au/';
const HARDCODED_SITE_VALUE = 'AU';

class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      url: HARDCODED_SITE_URL, // URL is now hardcoded
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
    // URL checks will pass since it's hardcoded and valid
    if (!url.trim()) {
      this.showAlert('Validation Error', 'Select a valid Site.');
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
    const {url, user, pass} = this.state; // url will be the hardcoded AU url

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
      await AsyncStorage.setItem('@url', this.state.url); // Saves the AU url
      await AsyncStorage.setItem('@site', HARDCODED_SITE_VALUE); // Saves 'AU'
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
            showsVerticalScrollIndicator={false}
          >
            <Image source={require('../assets/logo.png')} style={styles.logo} />

            <View style={styles.formContainer}>
              <Text style={styles.title}>Login</Text>

              {/* Site selector and modal have been removed */}

              <Text style={styles.subTopic}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@gmail.com"
                onChangeText={text => this.setState({user: text})}
                value={user}
                autoCapitalize="none"
                placeholderTextColor="#ccc"
              />

              <Text style={styles.subTopic}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  onChangeText={text => this.setState({pass: text})}
                  value={pass}
                  secureTextEntry={this.state.secureText}
                  placeholderTextColor="#ccc"
                />
                <Ionicons
                  name={this.state.secureText ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                  onPress={() =>
                    this.setState(prevState => ({ secureText: !prevState.secureText }))
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
    paddingHorizontal: width * 0.05,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: height * 0.03,
    resizeMode: 'contain',
  },
  formContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: RFValue(20),
    color: '#fff',
    marginBottom: height * 0.03,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subTopic: {
    fontSize: RFValue(15),
    color: '#ccc',
    marginBottom: height * 0.015,
    textAlign: 'left',
  },

  // Removed all dropdown/menu styles

  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: height * 0.015,
    paddingHorizontal: width * 0.015,
    fontSize: RFValue(14),
    color: '#000',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: height * 0.015,
    paddingHorizontal: width * 0.02,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: RFValue(14),
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: width * 0.02,
  },
});

export default Login;