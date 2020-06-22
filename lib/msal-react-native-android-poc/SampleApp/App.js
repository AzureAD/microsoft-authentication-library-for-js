import React, { useState, Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  StatusBar,
  TextInput,
  Button,
} from 'react-native';

import MSAL from './indexModule.js';

import ToolbarAndroid from '@react-native-community/toolbar-android';

import {
  Text,
} from '@fluentui/react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';



class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSignedIn: false,
      scopesValue: "",
      aUsername: null,
      aTenantId: null,
      aIdToken: null,
      aAuthority: null,
      aId: null,
      resultMap: null
    };
    this.getAccount();
  }

  getAccount = async () => {
    try{
      var {
        authority,
        id,
        tenantId,
        username,
        idToken,
      } = await MSAL.getAccount();
      this.setState({
        aUsername: username,
        aTenantId: tenantId,
        aIdToken: idToken,
        aAuthority: authority,
        aId: id,
        isSignedIn: true
      });
    } catch (message) {
      console.log(message);
    }
  }
  
  render() {
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
                onChangeText = {text => this.setState({scopesValue: text})} />
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
                <Text style={styles.textPlaceholder}>{this.state.isSignedIn ? this.state.aUsername : "Not Signed In"}</Text>
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
                  disabled = {this.state.isSignedIn}
                  onPress = { async () => {
                    try{
                      var {
                        authority,
                        id,
                        tenantId,
                        username,
                        idToken,
                      } = await MSAL.signIn(this.state.scopesValue);
                      this.setState({
                        aUsername: username,
                        aTenantId: tenantId,
                        aIdToken: idToken,
                        aAuthority: authority,
                        aId: id,
                        isSignedIn: true
                      });
                    } catch (error) {
                      console.log(error);
                    }
                  }}
                   />
                </View>
                <View
                style={styles.button}>
                  <Button 
                  title="Sign Out"
                  color ='#2b88d8'
                  disabled = {!this.state.isSignedIn}
                  onPress = {async () => {
                    try {
                      var result = await MSAL.signOut();
                      this.setState({
                        aUsername: null,
                        aTenantId: null,
                        aIdToken: null,
                        aAuthority: null,
                        aId: null,
                        resultMap: null,
                        isSignedIn: false
                      });
                    } catch (exception) {
                      console.log(exception)
                    }
                  }} />
                </View>
              </View>
              <View
              style={styles.viewSideBySide}>
                <View
                style={styles.button}>
                  <Button 
                  title="Get Token Interactively"
                  color ='#2b88d8' />
                </View>
                <View
                style={styles.button}>
                  <Button 
                  title="Get Token Silently"
                  color ='#2b88d8'
                  onPress = {async () => {
                    try {
                      var result = await MSAL.acquireTokenSilent(this.state.scopesValue);
                      this.setState({
                        resultMap: result,
                      });
                    } catch (exception) {
                      console.log(exception);
                    }
                  }} />
                </View>
              </View>
            </View>
           <View
           style={styles.viewResult}>
             <Text>{this.state.isSignedIn ?  "Welcome, " + this.state.aUsername : "Welcome! Please sign in."}</Text>
           </View>
           <View
           style={styles.viewResult}>
             <Text>{this.state.resultMap != null ? JSON.stringify(this.state.resultMap, null, 4) : ""}</Text>
           </View>
  
          </ScrollView>
        </SafeAreaView>
      </>
    );

  }

  
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
  },
  viewResult: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;