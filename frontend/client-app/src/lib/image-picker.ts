import * as ImagePicker from "expo-image-picker";

export interface PickImageResult {
  uri?: string;
  error?: string;
}

export async function pickProfileImage(): Promise<PickImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return {
      error: "Photo library access is required to choose a profile image.",
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return {};

  return { uri: result.assets[0]?.uri };
}
