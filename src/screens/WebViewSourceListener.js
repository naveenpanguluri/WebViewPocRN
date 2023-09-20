import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { WebView } from "react-native-webview";
import { ActivityIndicator } from "react-native";

export default function WebViewSourceListener() {
  const [loaded, setLoaded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
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
          .then(response => {
            if(response.ok) {
              return response.text().then(text => {
                try {
                  var data = JSON.parse(text);
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_RESPONSE', url: input, message: 'API response received', data: data }));
                } catch {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_RESPONSE', url: input, message: 'API response received', data: text }));
                }
                return response;
              });
            }
            throw new Error('Network response was not ok.');
          })
          .catch(error => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_RESPONSE', url: input, message: 'API response error', error: error.message }));
          });
      };

      function debounce(fn, delay) {
        let timer;
        return function(...args) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            fn(...args);
          }, delay);
        };
      }      
        
      document.addEventListener('click', debounce(function(e) {
        e.stopPropagation();  // Stop the event from bubbling up
        let data = { type: 'CLICK_EVENT', target: e.target.tagName };
        [...e.target.attributes].forEach(attr => {
          data[attr.name] = attr.value;
        });
      
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }, 500), false);
        
      // Overriding navigator.sendBeacon to intercept data
      var originalSendBeacon = navigator.sendBeacon;
      navigator.sendBeacon = function(url, data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SEND_BEACON', url: url, data: JSON.stringify(data) }));
        return originalSendBeacon(url, data);
      };

      // If jQuery is present, overriding its AJAX method
      if (window.jQuery) {
        var originalAjax = window.jQuery.ajax;
        window.jQuery.ajax = function(options) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'JQUERY_AJAX_CALL', url: options.url, data: options.data }));
          return originalAjax.apply(this, arguments)
            .done(function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'JQUERY_AJAX_RESPONSE', data: data }));
            })
            .fail(function(error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'JQUERY_AJAX_ERROR', error: error.message }));
            });
        };
      }

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
      borderWidth: 4,
    },
    activityText: {
      marginVertical: 4,
    },
    activityHeader: {
      textAlign: "center",
    },
    alternateBackground: {
      backgroundColor: "#F5F5DC",
    },
    lineItemBackground: {
      backgroundColor: "#e3e37d",
    },
    listener: {
      backgroundColor: "blue",
      color: "white",
      textAlign: "center",
    },
    loading: {
      backgroundColor: "blue",
      color: "white",
      textAlign: "center",
    },
    directionLabel: {
      color: "#888",
      fontSize: 12,
    },
  });

  const toggleExpanded = (index) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ uri: "https://www.apollo.com/" }}
        androidShouldInterceptRequest={(request) => {
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
          setApiActivity((prev) => [...prev]);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === "PAGE_LOAD") {
              setApiActivity((prev) => prev.filter((_, index) => index !== 0));
            } else {
              setApiActivity((prev) => [...prev, data]);
            }
          } catch (error) {
            console.error("Failed to parse message event data:", error);
          }
        }}
        style={styles.webView}
      />
      <Text style={styles.listener}>{"ACTIVITY LISTENER:"}</Text>
      <FlatList
        style={styles.scrollView}
        data={apiActivity.slice().reverse()}
        keyExtractor={(item, index) => `${item.type}_${index}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => toggleExpanded(index)}>
            <Text
              style={[
                styles.activityHeader,
                styles.activityText,
                index % 2 === 1
                  ? styles.alternateBackground
                  : styles.lineItemBackground,
              ]}
            >
              {item.type}
              <Text style={styles.directionLabel}>
                {[
                  "PAGE_LOAD",
                  "API_RESPONSE",
                  "XHR_RESPONSE",
                  "JQUERY_AJAX_RESPONSE",
                  "API_RESPONSE",
                ].includes(item.type)
                  ? " Inbound"
                  : ["API_CALL", "SEND_BEACON", "JQUERY_AJAX_CALL"].includes(
                      item.type
                    )
                  ? " Outbound"
                  : ""}
              </Text>
            </Text>
            {expandedIndex === index && item.type !== "CLICK_EVENT" && (
              <Text style={[styles.activityText]}>
                URL: {item.url || "N/A"}
                {"\n"}
                Message: {item.message}
                {"\n"}
                Payload: {JSON.stringify(item.payload) || "N/A"}
                {"\n"}
                Response Type: {item.responseType || "N/A"}
                {"\n"}
                Response Keys: {JSON.stringify(item.responseKeys) || "N/A"}
                {"\n"}
                Error: {JSON.stringify(item.error) || "N/A"}
                {"\n"}
                Method: {item?.method || "N/A"}
                {"\n"}
                Headers: {item?.headers || "N/A"}
              </Text>
            )}
            {expandedIndex === index && item.type === "CLICK_EVENT" && (
              <Text style={[styles.activityText]}>
                target: {item.target || "N/A"}
                {"\n"}
                id: {item?.id || "N/A"}
                {"\n"}
                href: {item?.href || "N/A"}
                {"\n"}
                role: {item?.role || "N/A"}
                {"\n"}
                alt: {item?.alt || "N/A"}
                {"\n"}
                src: {item?.src || "N/A"}
                {"\n"}
                height: {item?.height || "N/A"}
                {"\n"}
                width: {item?.width || "N/A"}
                {"\n"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
      <Text style={styles.loading}>
        {loaded ? <Text>loaded</Text> : <ActivityIndicator />}
      </Text>
    </SafeAreaView>
  );
}
