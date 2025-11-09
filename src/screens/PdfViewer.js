import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Pdf from 'react-native-pdf';

export default function PdfViewer({ route }) {
  const { filePath } = route.params;
  const uri = Platform.OS === 'android' ? `file://${filePath}` : filePath;

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri }}
        style={styles.pdf}
        onError={(e) => console.log('PDF error:', e)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' }, pdf: { flex: 1 } });
