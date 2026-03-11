import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiProvider, AnalysisResult } from '@/types/ai-analysis';
import { formatMessagesForAi } from '@/utils/message-formatter';
import { validateAnalysisResult } from '@/utils/analysis-validator';

const SYSTEM_PROMPT = `你是一位专业的聊天心理分析师,擅长通过文字对话分析人的情绪、性格和沟通模式。

你的任务是分析一段男性用户与女性的聊天记录,从男性视角提供分析和建议。

分析要求:
1. 客观准确:基于对话内容,不做过度推测
2. 实用性强:建议具体可操作,贴近真实聊天场景
3. 风险意识:标注建议的风险等级,避免误导

输出要求:
严格按照以下 JSON Schema 返回,不要添加任何额外文字:
{
  "mood": {
    "status": "对方当前心情(如:开心、平淡、有点生气)",
    "confidence": 85,
    "evidence": ["引用的对话片段1", "引用的对话片段2"],
    "description": "详细描述心情判断依据"
  },
  "personality": {
    "traits": ["性格特征1", "性格特征2"],
    "confidence": 70,
    "evidence": ["引用的对话片段1"],
    "description": "性格特征详细分析",
    "note": "如果对话少于10条,添加:聊天内容较少,分析仅供参考"
  },
  "replyStrategy": {
    "context": "必须使用 User Prompt 中明确标注的「对方最后一句话」，不是对话末尾的最后一条消息",
    "strategy": "核心回复策略(一句话)",
    "suggestions": [
      {
        "id": "使用UUID格式",
        "type": "必须是以下之一: humor(幽默风趣) | caring(关心体贴) | deep(深度交流) | casual(轻松日常) | flirty(轻微调情)",
        "content": "具体回复文案",
        "explanation": "为什么这样回复",
        "riskLevel": "必须是以下之一: low | medium | high"
      }
    ],
    "warnings": ["注意事项1", "注意事项2"]
  }
}

重要: suggestions 数组的 type 字段必须使用以下值之一: "humor", "caring", "deep", "casual", "flirty"，不要使用其他任何值或组合值。`;

interface RequestBody {
  messages: Array<{
    id: string;
    speaker: 'self' | 'other';
    nickname: string;
    content: string;
  }>;
  provider: AiProvider;
}

async function callChatGPT(chatText: string, lastOtherContent: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('服务配置错误:缺少 ChatGPT API Key');
  }

  const client = new OpenAI({ apiKey });
  const userPrompt = `请分析以下聊天记录:\n\n${chatText}\n\n⚠️ 重要提示：对方最后一句话是：\n「${lastOtherContent}」\n（这是对方发送的最后一条消息，对话末尾可能还有"自己"发出的消息，请忽略那些）\n\n请严格按照 JSON Schema 返回分析结果。\n其中 replyStrategy.context 请直接使用上方标注的「对方最后一句话」内容。`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  }, { timeout: 30000 });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error('AI 返回内容为空');
  }

  const parsedData = JSON.parse(responseText);
  return validateAnalysisResult(parsedData);
}

async function callGemini(chatText: string, lastOtherContent: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('服务配置错误:缺少 Gemini API Key');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 尝试多个模型
  const modelsToTry = [
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash'
  ];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
        },
      });

      const userPrompt = `请分析以下聊天记录:\n\n${chatText}\n\n⚠️ 重要提示：对方最后一句话是：\n「${lastOtherContent}」\n（这是对方发送的最后一条消息，对话末尾可能还有"自己"发出的消息，请忽略那些）\n\n请严格按照 JSON Schema 返回分析结果。\n其中 replyStrategy.context 请直接使用上方标注的「对方最后一句话」内容。`;

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: userPrompt }
      ]);

      const responseText = result.response.text();

      // 清理 Markdown 代码块标记
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsedData = JSON.parse(cleanedText);
      return validateAnalysisResult(parsedData);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw lastError || new Error('所有 Gemini 模型均不可用');
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    // 验证输入
    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: '消息列表不能为空' },
        { status: 400 }
      );
    }

    // 检查是否包含对方消息
    const hasOtherMessages = body.messages.some(msg => msg.speaker === 'other');
    if (!hasOtherMessages) {
      return NextResponse.json(
        { success: false, data: null, error: '对话中缺少对方的消息,无法分析' },
        { status: 400 }
      );
    }

    // 消息数量限制
    if (body.messages.length > 100) {
      return NextResponse.json(
        { success: false, data: null, error: '消息数量超过限制(最多100条),请分段分析' },
        { status: 400 }
      );
    }

    // 格式化消息
    const chatText = formatMessagesForAi(body.messages);

    // 预处理：找到对方最后一条非空消息，避免末尾是"自己"消息导致 context 分析错误
    const lastOtherMessage = [...body.messages]
      .reverse()
      .find(msg => msg.speaker === 'other' && msg.content.trim().length > 0);
    const lastOtherContent = lastOtherMessage?.content ?? '(对方未发送有效消息)';

    // 对话文本长度检查
    if (chatText.length > 10000) {
      return NextResponse.json(
        { success: false, data: null, error: '对话文本过长,请减少消息数量' },
        { status: 400 }
      );
    }

    // 调用对应的 AI API
    let result: AnalysisResult;
    if (body.provider === 'chatgpt') {
      result = await callChatGPT(chatText, lastOtherContent);
    } else if (body.provider === 'gemini') {
      result = await callGemini(chatText, lastOtherContent);
    } else {
      return NextResponse.json(
        { success: false, data: null, error: '不支持的 AI 提供商' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('AI 分析失败:', error);

    const errorMessage = error instanceof Error ? error.message : '分析失败,请稍后重试';

    return NextResponse.json(
      { success: false, data: null, error: errorMessage },
      { status: 500 }
    );
  }
}
