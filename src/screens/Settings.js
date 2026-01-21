import React, { Component } from "react";
import {
    Image,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    Switch
} from "react-native";
import GradientBackground from "../components/GradientBackground";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientButton from "../components/GradientButton";
import CustomAlert from "../components/CustomAlert";

class Setting extends Component {

    constructor(props){
        super(props);
        this.state = {
            showLogoutAlert: false,
        }
    }
    state = {
        vibrate: true,
        beep: false,
    };

    handleBack = () => {
        this.props.navigation.goBack();
    };

    

    handleVibrateToggle = async (value) => {
        this.setState({ vibrate: value });
        await AsyncStorage.setItem('@vibrate', JSON.stringify(value));
    };

    handleBeepToggle = async (value) => {
        this.setState({ beep: value });
        await AsyncStorage.setItem('@beep', JSON.stringify(value));
    };
     confirmLogout = () => {
    this.setState({showLogoutAlert: true});
  };

  hideLogoutAlert = () => {
    this.setState({showLogoutAlert: false});
  };

  logout = async () => {
    try {
      await AsyncStorage.multiSet([
        ['@token', ''],
        ['@isLoggedIn', '0'],
      ]);
      this.setState({showLogoutAlert: false});
      this.props.navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


    render() {
        return (
            <>
                <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
                <GradientBackground>
                    <SafeAreaView style={styles.safe}>
                        {/* Back Button */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={this.handleBack}>
                                <View style={styles.backContent}>
                                    <Image
                                        source={require('../assets/back.png')}
                                        style={styles.backIcon}
                                        resizeMode="contain"
                                    />

                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Header */}
                        <Text style={styles.headerText}>Settings</Text>


                        {/* Vibrate Toggle*/}
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <Icon name="vibrate" size={26} color="#FF71D2" style={styles.cardIcon} />
                                <View style={styles.cardText}>
                                    <Text style={styles.cardTitle}>Vibrate</Text>
                                    <Text style={styles.cardSubtitle}>Vibration when scan is done.</Text>
                                </View>
                            </View>
                            <Switch
                                value={this.state.vibrate}
                                onValueChange={this.handleVibrateToggle}
                                thumbColor={this.state.vibrate ? '#FF71D2' : '#888'}
                                trackColor={{ false: '#555', true: '#FFB2E4' }}
                            />
                        </View>

                        {/* Beep Toggle */}
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <Icon name="bell-ring-outline" size={26} color="#FF71D2" style={styles.cardIcon} />
                                <View style={styles.cardText}>
                                    <Text style={styles.cardTitle}>Beep</Text>
                                    <Text style={styles.cardSubtitle}>Beep when scan is done.</Text>
                                </View>
                            </View>
                            <Switch
                                value={this.state.beep}
                                onValueChange={this.handleBeepToggle}
                                thumbColor={this.state.beep ? '#FF71D2' : '#888'}
                                trackColor={{ false: '#555', true: '#FFB2E4' }}
                            />
                        </View>
 
                        {/* Logout Button */}
                        <GradientButton style={styles.logoutBtn} onPress={this.confirmLogout} 
                        text={
                            <View style={styles.logoutBtn}>
                                <Icon name="logout" size={26}  color='#fff' marginRight={10}/>
                                <Text style={styles.logoutText}>Logout</Text>
                            </View>
                        }
                        >
                            
                            
                        </GradientButton>
                    </SafeAreaView>
                    <CustomAlert
                                visible={this.state.showLogoutAlert}
                                title="Logout"
                                message="Are you sure you want to logout?"
                                onClose={this.hideLogoutAlert}
                                onConfirm={this.logout}
                                showCancel={true}
                                confirmText="Logout"
                                cancelText="Cancel"
                              />
                </GradientBackground>
            </>
        );
    }
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -50,
    },
    backContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    headerText: {
        color: '#FF71D2',
        fontSize: 28,
        fontWeight: '600',
        marginTop: 5,
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#2B2B2E',
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        width: 28,
        height: 28,
        tintColor: '#FF71D2',
        marginRight: 12,
    },
    cardText: {
        flexShrink: 1,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    cardSubtitle: {
        color: '#bbb',
        fontSize: 13,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutIcon: {
        
        marginRight: 10,
        color: '#fff',
    },
    logoutText: {
        fontSize: 25,
        
        color: '#fff',
    },
});

export default Setting;
