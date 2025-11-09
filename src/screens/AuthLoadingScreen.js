import React, {Component} from 'react';
import {
  StatusBar,
  StyleSheet,
  Image,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import PropTypes from 'prop-types';
import getToken from '../api/getToken';
import checkLogin from '../api/checkLogin';
import GradientBackground from '../components/GradientBackground';
import {RFValue} from 'react-native-responsive-fontsize';

export default class AuthLoadingScreen extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this._loadData();
  }

  render() {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <SafeAreaView style={styles.safeAreaStyles}>
          <GradientBackground>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
              />
              <ActivityIndicator
                size="70"
                color="#ffffff"
                style={styles.spinner}
              />
              <Text style={styles.loadingText}>Loading...</Text>
            </KeyboardAvoidingView>
          </GradientBackground>
        </SafeAreaView>
      </>
    );
  }

  _loadData = async () => {
    try {
      const token = await getToken();
      console.log('🔐 Token:', token);

      const res = await checkLogin(token);
      console.log('✅ Login Check Result:', res);

      this.props.navigation.navigate(
        res.status === 'SUCCESS' ? 'Login' : 'Login',
      );
    } catch (err) {
      console.log('❌ Error in auth flow:', err);
      this.props.navigation.navigate('Login');
    }
  };
}

AuthLoadingScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeAreaStyles: {
    flex: 1,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: RFValue(20),
  },
});
