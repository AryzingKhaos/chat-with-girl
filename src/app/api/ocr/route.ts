import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import type { OcrRequest, OcrResponse, OcrErrorResponse } from '@/types/ocr';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证 API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '服务配置错误：缺少 API Key' },
        { status: 500 }
      );
    }

    // 2. 解析请求
    const { imageBase64 }: OcrRequest = await request.json();

    if (!imageBase64) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 3. 提取 MIME 类型和 Base64 数据
    const matches = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '图片格式错误' },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // 4. 调用 Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      `你是一个专业的聊天截图文字识别助手。请分析这张一对一聊天应用截图，按照以下规则提取内容：

**识别规则**：
1. **对话内容识别**（仅一对一聊天）：
   - 左边的对话气泡 → 标记为"对方(昵称)："
   - 右边的对话气泡 → 标记为"自己(昵称)："
   - 识别并保留聊天界面显示的昵称/用户名
   - 如果无法判断左右位置，标记为"未知："
   - 每条对话单独一行，格式：[说话人(昵称)]: [消息内容]

2. **非对话信息识别**：
   需要单独提取到"非对话信息"部分的内容：
   - 系统提示（如"XXX撤回了一条消息"、"开启了朋友验证"）
   - 日期分隔线（如"2024年1月1日"、"星期一"）
   - 通知信息（未读消息提示等）
   - 其他界面元素文字
   - 注意：时间戳（如"10:30"、"昨天"）暂不需要提取

3. **识别要求**：
   - 逐字准确识别，不要遗漏任何文字
   - 保持对话的时间顺序（从上到下）
   - 识别表情符号和 emoji
   - 忽略纯装饰性元素（头像图片、背景图案、图标等）

**输出格式**：
对方(张三): [第一条消息]
自己(李四): [回复内容]
对方(张三): [第二条消息]
...

--- 非对话信息 ---
[系统提示]
[日期分隔线]
[其他非对话内容]

请严格按照上述格式输出，不要添加任何解释或说明。`,
    ]);

    // 5. 返回结果
    const text = result.response.text() || '';
    return NextResponse.json<OcrResponse>({ text });
  } catch (error) {
    console.error('OCR API 错误:', error);

    // 返回友好的错误信息
    const errorMessage = error instanceof Error
      ? error.message
      : '识别失败，请重试';

    return NextResponse.json<OcrErrorResponse>(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
