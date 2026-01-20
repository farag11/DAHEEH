import React from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { Header } from "../components/Header";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const fetchCollections = async () => {
  const res = await fetch(`${API_URL}/collections`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

export default function HomeScreen() {
  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Header title="Study Sets" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading && <ActivityIndicator size="large" color="#fff" />}
        {isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Server Offline</Text>
            <Text style={styles.errorSubText}>
              Could not connect to: {API_URL}
            </Text>
            <Text style={styles.errorSubText}>Error: {error.message}</Text>
            <Button title="Retry" onPress={() => refetch()} />
          </View>
        )}
        {data && (
          <View>
            {data.map((collection) => (
              <View key={collection.id} style={styles.collectionItem}>
                <Text style={styles.collectionName}>{collection.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorSubText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  collectionItem: {
    backgroundColor: "#1A1A2A",
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
  },
  collectionName: {
    color: "#fff",
    fontSize: 18,
  },
});
