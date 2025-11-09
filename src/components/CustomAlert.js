import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  hideButton = false,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>

          {!hideButton && (
            <View style={styles.buttonContainer}>
              {showCancel && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }}>
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#5C00FF',
  },
  cancelButtonText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CustomAlert;
