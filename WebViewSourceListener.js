import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { ActivityIndicator } from "react-native";

export default function WebViewSourceListener() {
  const [loaded, setLoaded] = useState(false);
  const [fallbackPageLoad, setFallbackPageLoad] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [apiActivity, setApiActivity] = useState([]);
  const apiActivityBatch = useRef([]);

  useEffect(() => {
    let lastAddedIndex = -1;

    const intervalId = setInterval(() => {
      if (
        apiActivityBatch.current.length > 0 &&
        lastAddedIndex !== apiActivityBatch.current.length - 1
      ) {
        console.log("API BATCH: ", apiActivityBatch.current[0]);

        setApiActivity((prev) => [...prev, ...apiActivityBatch.current]);
        lastAddedIndex = apiActivityBatch.current.length - 1;
        apiActivityBatch.current = [];
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [apiActivityBatch.current]);

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
        
      document.addEventListener('click', function(e) {
        let data = { type: 'CLICK_EVENT', target: e.target.tagName };
        [...e.target.attributes].forEach(attr => {
          data[attr.name] = attr.value;
        });
      
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }, false);

        
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
    alternateBackground: {
      backgroundColor: "#F5F5DC",
    },
    lineItemBackground: {
      backgroundColor: "#e3e37d",
    },
    listener: {
      backgroundColor: "blue",
      color: "white",
    },
    loading: {
      backgroundColor: "blue",
      color: "white",
    },
  });

  const toggleExpanded = (index) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <SafeAreaView style={styles.container}>
      {loaded ? <ActivityIndicator /> : null}
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
          setFallbackPageLoad(true);
          setApiActivity((prev) => [...prev]);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === "PAGE_LOAD") {
              setFallbackPageLoad(false);
              setApiActivity((prev) => prev.filter((_, index) => index !== 0));
            } else {
              apiActivityBatch.current.push(data);
            }
          } catch (error) {
            console.error("Failed to parse message event data:", error);
          }
        }}
        style={styles.webView}
      />
      <Text style={styles.listener}>{"ACTIVITY LISTENER:"}</Text>
      <ScrollView style={styles.scrollView}>
        {apiActivity
          .slice()
          .reverse()
          .map((activity, index) => (
            <TouchableOpacity key={index} onPress={() => toggleExpanded(index)}>
              <Text
                style={[
                  styles.activityText,
                  index % 2 === 1
                    ? styles.alternateBackground
                    : styles.lineItemBackground,
                ]}
              >
                Type: {activity.type}
              </Text>
              {expandedIndex === index && activity.type !== "CLICK_EVENT" && (
                <Text style={[styles.activityText]}>
                  URL: {activity.url || "N/A"}
                  {"\n"}
                  Message: {activity.message}
                  {"\n"}
                  Payload: {JSON.stringify(activity.payload) || "N/A"}
                  {"\n"}
                  Response Type: {activity.responseType || "N/A"}
                  {"\n"}
                  Response Keys:{" "}
                  {JSON.stringify(activity.responseKeys) || "N/A"}
                  {"\n"}
                  Error: {JSON.stringify(activity.error) || "N/A"}
                  {"\n"}
                  Method: {activity?.method || "N/A"}
                  {"\n"}
                  Headers: {activity?.headers || "N/A"}
                </Text>
              )}
              {expandedIndex === index && activity.type === "CLICK_EVENT" && (
                <Text style={[styles.activityText]}>
                  target: {activity.target || "N/A"}
                  {"\n"}
                  id: {activity?.id || "N/A"}
                  {"\n"}
                  href: {activity?.href || "N/A"}
                  {"\n"}
                  role: {activity?.role || "N/A"}
                  {"\n"}
                  alt: {activity?.alt || "N/A"}
                  {"\n"}
                  src: {activity?.src || "N/A"}
                  {"\n"}
                  height: {activity?.height || "N/A"}
                  {"\n"}
                  width: {activity?.width || "N/A"}
                  {"\n"}
                </Text>
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>
      <Text style={styles.loading}>
        <Text>{loaded ? "loaded" : "loading"}</Text>
      </Text>
    </SafeAreaView>
  );
}
