import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./src/screens/RootScreen";
import WebToNative from "./src/screens/WebToNative";
import NativeToWeb from "./src/screens/NativeToWeb";
import WebViewUI from "./src/screens/WebView";

// import WebViewSourceURL from "./src/screens/WebViewSourceURL";
// import WebViewStaticHTML from "./src/screens/WebViewStaticHTML";
// import WebViewInjectedJs from "./src/screens/WebViewInjectedJs";
// import WebViewInjectedJsBeforeContentLoad from "./src/screens/WebViewInjectedJsBeforeContentLoad";
// import WbViewInjectedJsObj from "./src/screens/WbViewInjectedJsObj";
// import WebViewEvents from "./src/screens/WebViewEvents";
// import WebViewSourceListener from "./WebViewSourceListener";

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="auto" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              headerTintColor: "green",
              title: "Home",
            }}
          />

          <Stack.Screen
            name="WebViewUI"
            component={WebViewUI}
            options={{
              headerTintColor: "green",
              title: "WebViewUI",
            }}
          />
          <Stack.Screen
            name="WebToNative"
            component={WebToNative}
            options={{
              headerTintColor: "green",
              title: "WebToNative",
            }}
          />
          <Stack.Screen
            name="NativeToWeb"
            component={NativeToWeb}
            options={{
              headerTintColor: "green",
              title: "NativeToWeb",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>

    // <View style={styles.container}>
    //   <StatusBar barStyle="auto" />
    //   <WebViewSourceURL />
    //   <WebViewStaticHTML />
    //   <WebViewInjectedJs />
    //   <WebViewInjectedJsBeforeContentLoad />
    //   <WbViewInjectedJsObj />
    //   <WebViewEvents />
    //   <WebViewSourceListener />
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
