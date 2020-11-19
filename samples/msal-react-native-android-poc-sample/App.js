/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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

import MSAL from '@azuread/msal-react-native-android-poc';

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
      isSharedDevice: false,
      scopesValue: "",
      URLValue: "https://graph.microsoft.com/v1.0/me",
      account: null,
      graphResult: null
    };
  }

  async componentDidMount() {
    try {
      await this.getAccount();
      await this.isSharedDevice();
    } catch (error) {
      console.log(error);
    }
  }

  getAccount = async () => {
    try{
      const result = await MSAL.getAccount();
      this.setState({
        account: result,
      });
    } catch (message) {
      console.log(message);
    }
  }

  isSharedDevice = async () => {
    try {
      const sharedDevice = MSAL.isSharedDevice();
      this.setState({
        isSharedDevice: sharedDevice
      })
    } catch (message) {
      console.log(message);
    }
  }

  startSignIn = async () => {
    try{
      const result = await MSAL.signIn(this.state.scopesValue);
      this.setState({
        account: result,
      });
    } catch (error) {
      console.log(error);
    }
  }

  startSignOut = async () => {
    try {
      const result = await MSAL.signOut();
      this.setState({
        account: null,
        graphResult: null,
      });
    } catch (exception) {
      console.log(exception)
    }
  }

  startGetGraphDataSilently = async () => {
    try {
      const result = await MSAL.acquireTokenSilent(this.state.scopesValue);
      //api call to MSGraph
      const response = await fetch (
        this.state.URLValue, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${result.accessToken}`
          }
        }
      );
      const json = await response.json();
      this.setState({
        graphResult: json
      });
    } catch (error) {
      console.log(error);
    }
  }

  startGetGraphDataInteractively = async () => {
    try {
      const result = await MSAL.acquireToken(this.state.scopesValue);
      //make api call
      const response = await fetch (
        this.state.URLValue, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${result.accessToken}`
          }
        }
      );
      const json = await response.json();
      //update current account and state
      await this.getAccount();
      this.setState({
        graphResult: json,
      });
    } catch (exception) {
      console.log(exception);
    }
  }

  showResult = () => {
   return this.state.graphResult && JSON.stringify(this.state.graphResult, null, 4);
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
                defaultValue={this.state.URLValue}
                underlineColorAndroid='#8a8886'
                onChangeText = {text => this.setState({URLValue: text})} />
              </View>
              <View
              style={styles.viewFormEntry}>
                <Text style={styles.textSubHeader}> Signed-in User: </Text>
                <Text style={styles.textPlaceholder}>{this.state.account ? this.state.account.username : "Not Signed In"}</Text>
              </View>
              <View
              style={styles.viewFormEntry}>
                <Text style={styles.textSubHeader}> Device Mode: </Text>
                <Text style={styles.textPlaceholder}>{this.state.isSharedDevice ? "Shared" : "Non-shared"}</Text>
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
                  disabled = {Boolean(this.state.account)}
                  onPress = {this.startSignIn}
                   />
                </View>
                <View
                style={styles.button}>
                  <Button 
                  title="Sign Out"
                  color ='#2b88d8'
                  disabled = {!Boolean(this.state.account)}
                  onPress = {this.startSignOut} />
                </View>
              </View>
              <View
              style={styles.viewSideBySide}>
                <View
                style={styles.button}>
                  <Button 
                  title="Get Graph Data Interactively"
                  color ='#2b88d8'
                  onPress = {this.startGetGraphDataInteractively} />
                </View>
                <View
                style={styles.button}>
                  <Button 
                  title="Get Graph Data Silently"
                  color ='#2b88d8'
                  onPress = {this.startGetGraphDataSilently} />
                </View>
              </View>
            </View>
           <View
           style={styles.viewResult}>
             <Text>{this.state.account ?  "Welcome, " + this.state.account.username : "Welcome! Please sign in."}</Text>
           </View>
           <View
           style={styles.viewResult}>
             <Text>{this.showResult()}</Text>
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
