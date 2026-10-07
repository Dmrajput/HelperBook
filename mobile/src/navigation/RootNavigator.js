import { useCallback, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { DevPreviewProvider } from "../context/devPreviewContext";
import SplashScreen from "../screens/SplashScreen";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

export default function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAppPreview, setShowAppPreview] = useState(false);

  const finishSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  const openAppPreview = useCallback(() => {
    if (__DEV__) {
      setShowAppPreview(true);
    }
  }, []);

  const closeAppPreview = useCallback(() => {
    setShowAppPreview(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={finishSplash} />;
  }

  return (
    <DevPreviewProvider onOpen={openAppPreview} onClose={closeAppPreview}>
      <NavigationContainer>
        {showAppPreview ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </DevPreviewProvider>
  );
}
