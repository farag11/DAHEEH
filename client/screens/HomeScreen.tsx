
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const [connectionStatus, setConnectionStatus] = useState("Connecting to Server...");
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await fetch("https://daheeh.onrender.com");
        if (response.ok) {
          setConnectionStatus("Connected to Server!");
        } else {
          setConnectionStatus("Failed to connect to server.");
        }
      } catch (error) {
        setConnectionStatus("Failed to connect to server.");
      }
    };

    setApiUrl("https://daheeh.onrender.com");
    checkApiConnection();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Welcome to Daheeh</Text>
      <Text style={styles.subtitle}>{connectionStatus}</Text>
      <Text style={styles.url}>{apiUrl}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10
  },
  subtitle: {
    color: "#AAA",
    fontSize: 16,
    marginBottom: 10
  },
  url: {
    color: "#888",
    fontSize: 12
  }
});
