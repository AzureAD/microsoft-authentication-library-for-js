import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  StatusBar,
  TextInput,
  Button,
  DrawerLayoutAndroid
} from 'react-native';

import MSAL from './indexModule.js';

import ToolbarAndroid from '@react-native-community/toolbar-android';

import {
  Text,
} from '@fluentui/react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

const App = ()  => {

  const [isSignedIn,setIsSignedIn] = useState(false);

  const [scopesValue, setScopesValue] = useState("");
  const [resultMap, setResultMap] = useState(new Map());

  return (
    <>
      <StatusBar 
      barStyle="light-content" 
      backgroundColor="#2b88d8" />
      <ToolbarAndroid 
      title="MSAL for React Native"
      titleColor= "#ffffff"
      style={styles.toolbar}
       />
      <SafeAreaView style={styles.SafeAreaView}>
        <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        contentContainerStyle={{justifyContent: "space-around"}} >
          <View
          style={styles.sectionTop} >
            <View
            style={styles.viewFormEntry}>
              <Text style={styles.textSubHeader}> Scope: </Text>
              <TextInput
              style={styles.textInput}
              placeholder="Ex. user.read"
              underlineColorAndroid='#8a8886'
              onChangeText = {text => setScopesValue(text)} />
            </View>
            <View
            style={styles.viewFormEntry}>
              <Text style={styles.textSubHeader}> MSGraph URL: </Text>
              <TextInput
              style={styles.textInput}
              placeholder="Some URL"
              underlineColorAndroid='#8a8886' />
            </View>
            <View
            style={styles.viewFormEntry}>
              <Text style={styles.textSubHeader}> Signed-in User: </Text>
              <Text style={styles.textPlaceholder}>(Placeholder)</Text>
            </View>
            <View
            style={styles.viewFormEntry}>
              <Text style={styles.textSubHeader}> Device Mode: </Text>
              <Text style={styles.textPlaceholder}>(Placeholder)</Text>
            </View>
          </View>
          <View
          style={styles.sectionButton} >
            <View
            style={styles.viewSideBySide}>
              <View
              style={styles.button}>
                <Button 
                title="Sign In"
                color ='#2b88d8'
                onPress={ async () => {
                  if (!isSignedIn) {
                    try{
                      var result = await MSAL.signIn(scopesValue);
                      setResultMap(result);
                      setIsSignedIn(true);
                    } catch (error) {
                      console.log(error);
                    }
                  }
                }
                } />
              </View>
              <View
              style={styles.button}>
                <Button 
                title="Sign Out"
                color ='#2b88d8' />
              </View>
            </View>
            <View
            style={styles.viewSideBySide}>
              <View
              style={styles.button}>
                <Button 
                title="Get Graph Data Interactively"
                color ='#2b88d8' />
              </View>
              <View
              style={styles.button}>
                <Button 
                title="Get Graph Data Silently"
                color ='#2b88d8' />
              </View>
            </View>
          </View>
         <View>
           <Text>{isSignedIn ?  JSON.stringify(resultMap, null, 4)  : "not signed in"}</Text>
         </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  SafeAreaView: {
    flex: 1,
  },
  body: {
    backgroundColor: Colors.white,
  },
  toolbar: {
    backgroundColor: '#2b88d8',
    height: 56,
  },
  sectionTop: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  viewFormEntry: {
    flex: 1,
    flexDirection: "row",
  },
  textSubHeader: {
    flex: 1,
    fontWeight: '600',
    fontSize: 20,
  },
  textInput: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  textPlaceholder: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  viewSideBySide: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sectionButton: {
    flex: 1,
    justifyContent: "space-around",
  },
  button: {
    width: '45%',
    margin: 10,
  }
});

export default App;