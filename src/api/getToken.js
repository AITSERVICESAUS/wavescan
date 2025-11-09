import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
   
    try {
        const token = await AsyncStorage.getItem('@token');
        const url = await AsyncStorage.getItem('@url');
        if (token !== null && url !== null) {
            return [ url, token ];
        }
        return '';
    } catch (error) {
    // Error retrieving data
        return '';
    }
};

export default getToken;


