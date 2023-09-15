import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function WebViewStaticHTML() {
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: "<h1><center>Hello world</center></h1>" }}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
  },
});
