import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import WebViewSourceURL from "./WebViewSourceURL";
import WebViewStaticHTML from "./WebViewStaticHTML";
import WebViewInjectedJs from "./WebViewInjectedJs";
import WebViewInjectedJsBeforeContentLoad from "./WebViewInjectedJsBeforeContentLoad";
import WbViewInjectedJsObj from "./WbViewInjectedJsObj";
import WebViewEvents from "./WebViewEvents";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <WebViewSourceURL />
      {/* <WebViewStaticHTML /> */}
      {/* <WebViewInjectedJs /> */}
      {/* <WebViewInjectedJsBeforeContentLoad /> */}
      {/* <WbViewInjectedJsObj /> */}
      {/* <WebViewEvents /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
