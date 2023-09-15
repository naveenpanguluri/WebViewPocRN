import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function WebViewEvents() {
  const html = `
    <html>
    <body style='color:red; margin-top: 200px'>
        <div style="margin-top: 200px; text-align: center;">
            <button onclick="msg()" style="padding: 20px; width: 50%; font-size: 30px;">Click</button>
            <h1 id="update" style="margin-top: 200px; text-align: center;"></h1>
        </div>
        <script>
            function msg() {
            setTimeout(function () {
                var data = "Hello Welcome!";
                window.ReactNativeWebView.postMessage(data);
                document.getElementById("update").innerHTML = data;
            }, 1000)
            }
        </script>
    </body>
    </html>
 `;

  return (
    <WebView
      source={{
        html: html,
      }}
      onMessage={(event) => {
        console.log("event...", event);
        alert(event.nativeEvent.data);
      }}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
