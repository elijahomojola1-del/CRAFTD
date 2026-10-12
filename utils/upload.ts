import { Platform } from 'react-native';

// Adds a picked photo to a form upload. Phones send the file by its uri;
// browsers need the actual file contents.
export async function appendImage(
  formData: FormData,
  field: string,
  uri: string,
  filename: string
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append(field, blob, filename);
    return;
  }

  formData.append(field, { uri, name: filename, type: 'image/jpeg' } as any);
}
