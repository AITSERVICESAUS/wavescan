import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const GradientBackground = ({children}) => {
  return (
    <LinearGradient
      // Dark navy → slightly lighter navy (closer to your mockups)
      colors={['#050814', '#070C1C', '#0B1230']}
      locations={[0, 0.55, 1]}
      style={styles.container}>

      {/* Optional subtle “vignette” overlay for depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.45)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Watermark logo (kept) */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* Keep your existing global padding behavior */}
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
    opacity: 0.06, // slightly stronger than before but still subtle
    resizeMode: 'contain',
    transform: [{scale: 1.05}],
  },
  content: {
    flex: 1,
    padding: 20, // keep same for now (we’ll tune screen-by-screen later)
  },
});

export default GradientBackground;
