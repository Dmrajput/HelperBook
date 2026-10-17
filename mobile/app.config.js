export default ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";

  return {
    ...config,
    android: {
      ...config.android,
      versionCode: config.android?.versionCode || 1,
      usesCleartextTraffic: apiUrl.startsWith("http://"),
    },
  };
};
