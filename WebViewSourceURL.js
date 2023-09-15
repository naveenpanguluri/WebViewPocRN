import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function WebViewSourceURL() {
  return (
    <WebView
      source={{ uri: "https://www.apollo.com/" }}
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
