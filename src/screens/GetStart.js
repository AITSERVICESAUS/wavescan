import React, {Component} from 'react';
import {View, Text, StyleSheet, Image, Dimensions} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import { RFValue } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

class GetStart extends Component {
  render() {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Image
            source={require('../assets/scannericon.png')}
            style={styles.logo}
          />
          <Text style={styles.firstText}>
            Explore powerful tools for hassle-free event ticket scanning -
            totally free!
          </Text>
          <GradientButton
            text="Let's Start  ➔"
            onPress={() => this.props.navigation.navigate('Events')}
            style={styles.gradientBtn}
          />
        </View>
      </GradientBackground>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  firstText:{
    textAlign: 'center',
    marginTop: height * 0.05,
    color: '#fff',
    fontSize: RFValue(13),
  },
  logo: {
    width: width * 0.3,
    height: height * 0.3,
    resizeMode: 'contain',
    marginTop: height * 0.1,
    marginBottom: height * 0.03,
    alignSelf: 'center',
  },
  gradientBtn:{
    width: width * 0.5,
    height: height * 0.06,
    marginTop: 20,
  },
});

export default GetStart;
