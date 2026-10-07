import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { MAX_LOGO_BYTES } from "../constants/shop";

async function prepareLogo(asset) {
  const image = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 512 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  try {
    const size = new File(image.uri).size;
    if (size > MAX_LOGO_BYTES) {
      throw new Error("Logo image must be smaller than 5 MB.");
    }
  } catch (error) {
    if (error?.message === "Logo image must be smaller than 5 MB.") {
      throw error;
    }
  }

  return {
    uri: image.uri,
    name: "logo.jpg",
    type: "image/jpeg",
    remote: false,
  };
}

export async function pickShopLogo(source) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      source === "camera"
        ? "Camera permission is needed to take a logo photo."
        : "Photo permission is needed to choose a logo."
    );
  }

  const options = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return prepareLogo(result.assets[0]);
}
