import React from 'react'; // Component
// import  ActivityIndicator, StatusBar, StyleSheet, View 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../src/screens/Login';
import Events from '../src/screens/Events';
import ListTickets from '../src/screens/ListTickets';
import ScanBarcode from '../src/screens/ScanBarcode';
import AuthLoadingScreen from '../src/screens/AuthLoadingScreen';
import GetStart from '../src/screens/GetStart';

 
const Stack = createNativeStackNavigator();
 
function App() {
  return (
    // <>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoadingScreen">
        <Stack.Screen
          name="AuthLoadingScreen"
          component={AuthLoadingScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{headerShown: false}}
        />
        <Stack.Screen name="GetStart" component={GetStart} options={{headerShown: false}}/>
        <Stack.Screen name="Events" component={Events} options={{headerShown: false}}/>
        <Stack.Screen name="ListTickets" component={ListTickets} options={{headerShown: false}}/>
        <Stack.Screen name="ScanBarcode" component={ScanBarcode} options={{headerShown: false}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
 
export default App;