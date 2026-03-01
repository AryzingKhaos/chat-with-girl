import imageCompression from 'browser-image-compression';

/**
 * 将图片文件转换为 base64 字符串（完整 data URL 格式）
 * @param file - 图片文件对象
 * @returns base64 字符串，格式为 data:image/xxx;base64,...
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 压缩图片文件
 * @param file - 原图片文件
 * @param maxSizeMB - 最大文件大小（MB）
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1
): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('图片压缩失败:', error);
    return file; // 压缩失败则返回原文件
  }
}

/**
 * 验证文件类型
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function isValidImageSize(file: File, maxMB: number = 5): boolean {
  return file.size <= maxMB * 1024 * 1024;
}
