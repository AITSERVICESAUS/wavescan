import React from 'react';

import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import PropTypes from 'prop-types';

import { RFValue } from 'react-native-responsive-fontsize';
 
const GradientButton = ({

  onPress,

  text,

  style,

  textStyle,

  variant = 'block',   // 'block' (full width) or 'pill' (shrink to content)

}) => {

  const isBlock = variant === 'block';
 
  return (
<TouchableOpacity

      onPress={onPress}

      activeOpacity={0.8}

      style={[

        styles.base,

        isBlock ? styles.block : styles.pill,

        style,

      ]}
>
<LinearGradient

        colors={['#6A11CB', '#2575FC']}

        start={{ x: 0, y: 0 }}

        end={{ x: 1, y: 0 }}

        style={StyleSheet.absoluteFill}

      />
<Text style={[styles.text, isBlock && styles.textCenter, textStyle]}>

        {text}
</Text>
</TouchableOpacity>

  );

};
 
GradientButton.propTypes = {

  onPress: PropTypes.func.isRequired,

  text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,

  style: PropTypes.object,

  textStyle: PropTypes.object,

  variant: PropTypes.oneOf(['block', 'pill']),

};
 
const styles = StyleSheet.create({

  base: {

    borderRadius: 14,

    overflow: 'hidden',

    justifyContent: 'center',

    alignItems: 'center',

    paddingVertical: 12,

    paddingHorizontal: 16,

    minHeight: 44,

    marginVertical: 5,

  },

  block: {

    width: '100%',          // full width

    alignSelf: 'stretch',

  },

  pill: {

    width: 'auto',          // shrink to content

    alignSelf: 'flex-start',

    minWidth: 72,           // avoid collapsing too small

  },

  text: {

    color: '#fff',

    fontSize: RFValue(13),

    fontWeight: '600',

  },

  textCenter: { textAlign: 'center' },

});
 
export default GradientButton;

 