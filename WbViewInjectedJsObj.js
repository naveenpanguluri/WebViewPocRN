import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function WbViewInjectedJsObj() {
  const customHTML = `
    <html>
        <body>
            <div style="margin-top: 200px;">
                <h1><center>The injectedJavaScriptObject prop</center></h1>
                <h1 id="dynamicVal"></h1>
                <h1 style="margin-top: 50px;"><center>Inject any JavaScript object into the webview so it is available to the JS running on the page.</center></h1>
            </div>
            <script>
                window.onload = (event) => {
                    if (window.ReactNativeWebView.injectedObjectJson()) {
                        document.getElementById("dynamicVal").innerHTML = JSON.parse(window.ReactNativeWebView.injectedObjectJson()).customValue;
                    }
                }
            </script>
        </body>
    </html>
    `;

  return (
    <WebView
      source={{
        html: customHTML,
      }}
      injectedJavaScriptObject={{ customValue: "Welcome to WebView Edna." }}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
