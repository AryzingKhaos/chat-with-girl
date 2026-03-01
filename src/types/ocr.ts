// OCR API 请求
export interface OcrRequest {
  imageBase64: string; // 完整格式：data:image/xxx;base64,...
}

// OCR API 响应
export interface OcrResponse {
  text: string;
}

// 错误响应
export interface OcrErrorResponse {
  error: string;
}
