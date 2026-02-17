import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

export async function share(data: { url?: string }) {
  if (!data.url) {
    return;
  }

  let file: File | null = null;

  try {
    const base64Index = data.url.indexOf(",");
    if (base64Index === -1) {
      return;
    }

    const base64Data = data.url.substring(base64Index + 1);
    const fileName = `temp_image_${Date.now()}.png`;
    file = new File(Paths.cache, fileName);

    file.write(base64Data, { encoding: "base64" });

    if (!(await Sharing.isAvailableAsync())) {
      return;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: "image/png",
      dialogTitle: "اشتراک‌گذاری داستان",
      UTI: "image.png",
    });
  } catch {}
};