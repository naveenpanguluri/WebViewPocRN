import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function WebViewInjectedJs() {
  const customHTML = `
    <div style="margin-top: 200px;">
        <h1><center>The injectedJavaScript prop</center></h1>
        <h1 style="margin-top: 50px;"><center>This is a script that runs immediately after the web page loads for the first time. It only runs once, even if the page is reloaded or navigated away.</center></h1>
    </div>
    `;
    
  const runFirst = `
      document.body.style.backgroundColor = 'red';
      document.body.style.color = '#fff';
      setTimeout(function() { window.alert('hi') }, 2000);
      true; // note: this is required, or you'll sometimes get silent failures
    `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{
        html: customHTML,
      }}
      onMessage={(event) => {}}
      injectedJavaScript={runFirst}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
