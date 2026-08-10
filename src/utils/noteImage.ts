import type { NoteImage } from "../types/nots";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("تصویر انتخاب‌شده قابل خواندن نیست."));
    };

    image.src = objectUrl;
  });

export async function prepareNoteImage(file: File): Promise<NoteImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("لطفاً فقط یک فایل تصویری انتخاب کنید.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("حجم تصویر باید کمتر از ۸ مگابایت باشد.");
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("امکان پردازش تصویر در مرورگر وجود ندارد.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/webp", IMAGE_QUALITY),
    name: file.name,
  };
}
