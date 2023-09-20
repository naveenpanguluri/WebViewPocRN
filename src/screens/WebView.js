import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";

function WebViewUI(props) {
  const webviewRef = React.useRef(null);

  function webViewgoback() {
    if (webviewRef.current) webviewRef.current.goBack();
  }

  function webViewNext() {
    if (webviewRef.current) webviewRef.current.goForward();
  }

  function LoadingIndicatorView() {
    return (
      <ActivityIndicator
        color="#009b88"
        size="large"
        style={styles.ActivityIndicatorStyle}
      />
    );
  }

  // Approach for listening to call and cancel if pdf
  const onShouldStartLoadWithRequestHandler = (request) => {
    const { url } = request;
    console.log("URL request:", url);
    if (url.endsWith(".pdf") || url.includes("viewpdf")) {
      Linking.openURL(url);
      return false;
    }
    return true;
  };

  // Approach for picking up url change from nav state
  function onNavigationStateChange(navState) {
    const { url } = navState;
    console.log('Navigation state change, URL:', url);
    if (url.includes('viewpdf.aspx') || url.endsWith('.pdf')) {
      Linking.openURL(url);      
      // Might want to navigate the WebView back to prevent it from staying on an unhandled URL
      if (webviewRef.current) webviewRef.current.goBack();
    }
  }

  return (
    <>
      <SafeAreaView style={styles.flexContainer}>
        <WebView
          source={{ uri: "https://www.apollo.com/" }}
          renderLoading={LoadingIndicatorView}
          startInLoadingState={true}
          ref={webviewRef}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequestHandler}
          onNavigationStateChange={onNavigationStateChange} 
        />
        <View style={styles.tabBarContainer}>
          <TouchableOpacity onPress={webViewgoback}>
            <Text style={{ color: "green" }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => props.navigation.navigate("Home")}>
            <Text style={{ color: "green" }}>Exit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={webViewNext}>
            <Text style={{ color: "green" }}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  ActivityIndicatorStyle: {
    flex: 1,
    justifyContent: "center",
  },
  flexContainer: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: "#d3d3d3",
    height: 56,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  button: {
    fontSize: 24,
  },
  arrow: {
    color: "#ef4771",
  },
  icon: {
    width: 20,
    height: 20,
  },
});

export default WebViewUI;
