import React, { useState, useRef } from "react";
import { SafeAreaView, StyleSheet, Text, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { ActivityIndicator } from "react-native";

export default function WebViewSourceListener() {
  const [message, setMessage] = useState("listening");
  const [loaded, setLoaded] = useState(false);
  const [fallbackPageLoad, setFallbackPageLoad] = useState(false);
  const [apiActivity, setApiActivity] = useState([]);

  const webViewRef = useRef();

  const injectedJavaScript = `
  (function() {
    try {
      window.onload = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_LOAD', message: 'Page loaded', url: window.location.href }));
      };

      // Overriding XMLHttpRequest to track AJAX requests
      var originalXHR = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
          try {
            const response = JSON.parse(this.responseText);
            const responseType = typeof response;
            const responseKeys = responseType === 'object' ? Object.keys(response) : [];
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'XHR_RESPONSE', url: this.responseURL, status: this.status, responseType, responseKeys }));
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'XHR_RESPONSE', url: this.responseURL, status: this.status, responseType: 'text', responseText: this.responseText.slice(0, 100) })); // trimmed response text
          }
        });
        originalXHR.apply(this, arguments);
      };

      var originalFetch = window.fetch;
      window.fetch = function(input, init) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_CALL', url: input, message: 'Fetch called with this input', payload: init }));
      
        return originalFetch(input, init)
          .then(response => response.json())
          .then(data => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_RESPONSE', url: input, message: 'API response received', data: data }));
            return data;
          })
          .catch(error => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_RESPONSE', url: input, message: 'API response error', error: error.message }));
          });
      };
    
      document.addEventListener('click', function(e) {
        let data = { type: 'CLICK_EVENT', target: e.target.tagName };
        [...e.target.attributes].forEach(attr => {
          data[attr.name] = attr.value;
        });
      
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }, false);
    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'JS_ERROR', message: error.message }));
    }
  })();
  true;
  `;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    webView: {
      flex: 1,
      marginTop: 30,
    },
    scrollView: {
      flex: 1,
      borderColor: "blue",
      borderWidth: 2,
    },
    activityText: {
      marginVertical: 4,
    },
    alternateBackground: {
      backgroundColor: "#F5F5DC",
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {loaded ? <ActivityIndicator /> : null}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ uri: "https://www.apollo.com/" }}
        androidShouldInterceptRequest={async (request) => {
          setApiActivity((prev) => [
            ...prev,
            {
              type: "ANDROID_INTERCEPT_REQUEST",
              url: request.url,
              method: request.method,
              headers: JSON.stringify(request.headers),
            },
          ]);

          return null;
        }}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={() => setLoaded(false)}
        onLoad={() => {
          setLoaded(true);
          setFallbackPageLoad(true);
          setApiActivity((prev) => [
            // {
            //   type: "PAGE_LOAD_FALLBACK",
            //   message: "Page started loading (fallback)",
            //   url: "https://www.apollo.com/",
            // },
            ...prev,
          ]);
        }}
        onMessage={(event) => {
          // console.log("Received message", event.nativeEvent.data);
          const data = JSON.parse(event.nativeEvent.data);

          if (data.type === "PAGE_LOAD") {
            setFallbackPageLoad(false);
            setApiActivity((prev) => prev.filter((_, index) => index !== 0));
          }

          if (data.type === "CLICK_EVENT") {
            setMessage(JSON.stringify(data));
          } else {
            setApiActivity((prev) => [...prev, data]);
          }
        }}
        style={styles.webView}
      />
      <Text>{"API ACTIVITY:"}</Text>
      <ScrollView style={styles.scrollView}>
        {apiActivity.map((activity, index) => (
          <Text
            key={index}
            style={[
              styles.activityText,
              index % 2 === 1 ? styles.alternateBackground : null,
            ]}
          >
            Type: {activity.type}
            {"\n"}
            URL: {activity.url || "N/A"}
            {"\n"}
            Message: {activity.message}
            {"\n"}
            Payload: {JSON.stringify(activity.payload) || "N/A"}
            {"\n"}
            Response Type: {activity.responseType || "N/A"}
            {"\n"}
            Response Keys: {JSON.stringify(activity.responseKeys) || "N/A"}
            {"\n"}
            Error: {JSON.stringify(activity.error) || "N/A"}
            {"\n"}
            Method: {activity?.method || "N/A"}
            {"\n"}
            Headers: {activity?.headers || "N/A"}
          </Text>
        ))}
      </ScrollView>
      <Text>{loaded ? "loaded" : "loading"}</Text>
      <Text>Message: {message}</Text>
      <Text>
        Fallback Page Load:{" "}
        {fallbackPageLoad ? "Page loaded" : "No page load detected"}
      </Text>
    </SafeAreaView>
  );
}
