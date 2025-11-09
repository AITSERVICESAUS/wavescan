import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const GradientBackground = ({children}) => {
  return (
    <LinearGradient colors={['#1B0E1C', '#3F0F3A']} style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  logo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.05,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default GradientBackground;
