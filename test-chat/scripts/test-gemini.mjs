import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载根目录的 .env.local
config({ path: join(__dirname, '../../.env.local') });

const AnalysisResultSchema = z.object({
  mood: z.object({
    status: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
  }),
  personality: z.object({
    traits: z.array(z.string()),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
    note: z.string().optional(),
  }),
  replyStrategy: z.object({
    context: z.string(),
    strategy: z.string(),
    suggestions: z.array(z.object({
      id: z.string(),
      type: z.enum(['humor', 'caring', 'deep', 'casual', 'flirty']),
      content: z.string(),
      explanation: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    })),
    warnings: z.array(z.string()),
  }),
});

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
    "context": "对方最后一句话的内容",
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

function formatMessages(messages) {
  return messages.map(msg => {
    const speaker = msg.speaker === 'self' ? '自己' : `对方(${msg.nickname})`;
    return `${speaker}: ${msg.content}`;
  }).join('\n');
}

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('错误: GEMINI_API_KEY 未配置');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 尝试多个可能的模型名称
  const modelsToTry = [
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash'
  ];

  console.log('🔍 检测可用的 Gemini 模型...\n');

  let workingModel = null;

  // 测试找到可用的模型
  for (const modelName of modelsToTry) {
    console.log(`   测试模型: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(['测试']);
      await result.response.text();

      workingModel = modelName;
      console.log(`   ✅ 模型可用: ${modelName}\n`);
      break;
    } catch (error) {
      console.log(`   ❌ 不可用: ${error.message.split(':')[0]}`);
    }
  }

  if (!workingModel) {
    console.error('\n❌ 未找到可用的 Gemini 模型，请检查 API Key 权限');
    process.exit(1);
  }

  const model = genAI.getGenerativeModel({
    model: workingModel,
    generationConfig: {
      temperature: 0.7,
    },
  });

  const dataDir = join(__dirname, '../data');
  const resultsDir = join(__dirname, '../results');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));

  const report = {
    timestamp: new Date().toISOString(),
    model: workingModel,
    totalTests: files.length,
    successCount: 0,
    failureCount: 0,
    tests: [],
    avgTime: 0,
    avgTokens: 0,
  };

  console.log(`开始测试 Gemini (${workingModel}), 共 ${files.length} 个样本...\n`);

  for (const file of files) {
    console.log(`测试: ${file}`);
    const startTime = Date.now();

    try {
      const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
      const chatText = formatMessages(data.messages);
      const userPrompt = `请分析以下聊天记录:\n\n${chatText}\n\n请严格按照 JSON Schema 返回分析结果。`;

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: userPrompt }
      ]);

      const elapsed = Date.now() - startTime;
      const response = result.response;
      const responseText = response.text();

      // 清理 Gemini 返回的 Markdown 代码块标记
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsedData = JSON.parse(cleanedText);

      const validationResult = AnalysisResultSchema.safeParse(parsedData);

      if (validationResult.success) {
        const tokens = response.usageMetadata?.totalTokenCount || 0;
        console.log(`✅ 成功 (${elapsed}ms, ${tokens} tokens)\n`);

        const testResult = {
          file,
          success: true,
          elapsed,
          tokens,
          data: validationResult.data,
        };

        report.tests.push(testResult);
        report.successCount++;
        report.avgTime += elapsed;
        report.avgTokens += tokens;

        writeFileSync(
          join(resultsDir, `gemini-${file}`),
          JSON.stringify(validationResult.data, null, 2)
        );
      } else {
        console.log(`❌ 失败: JSON Schema 验证失败`);
        console.log('验证错误:');
        validationResult.error.issues.forEach(err => {
          console.log(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.log(`\n原始响应(前500字符):\n${responseText.substring(0, 500)}...\n`);

        report.tests.push({
          file,
          success: false,
          error: 'Schema validation failed',
          details: validationResult.error.issues,
        });
        report.failureCount++;
      }
    } catch (error) {
      console.log(`❌ 失败: ${error.message}\n`);
      report.tests.push({
        file,
        success: false,
        error: error.message,
      });
      report.failureCount++;
    }
  }

  if (report.successCount > 0) {
    report.avgTime = Math.round(report.avgTime / report.successCount);
    report.avgTokens = Math.round(report.avgTokens / report.successCount);
  }

  writeFileSync(
    join(resultsDir, 'gemini-results.json'),
    JSON.stringify(report, null, 2)
  );

  const markdown = generateReport(report);
  writeFileSync(join(resultsDir, 'gemini-report.md'), markdown);

  console.log('\n测试完成!');
  console.log(`成功: ${report.successCount}/${report.totalTests}`);
  console.log(`平均耗时: ${report.avgTime}ms`);
  console.log(`平均 Tokens: ${report.avgTokens}`);
}

function generateReport(report) {
  const successRate = ((report.successCount / report.totalTests) * 100).toFixed(1);

  let markdown = `# Gemini 测试报告\n\n`;
  markdown += `**测试时间**: ${new Date(report.timestamp).toLocaleString()}\n`;
  markdown += `**模型**: ${report.model}\n\n`;
  markdown += `## 测试结果\n\n`;
  markdown += `- 总测试数: ${report.totalTests}\n`;
  markdown += `- 成功: ${report.successCount}\n`;
  markdown += `- 失败: ${report.failureCount}\n`;
  markdown += `- 成功率: ${successRate}%\n\n`;
  markdown += `## 性能指标\n\n`;
  markdown += `- 平均耗时: ${report.avgTime}ms\n`;
  markdown += `- 平均 Token 消耗: ${report.avgTokens}\n\n`;
  markdown += `## 详细结果\n\n`;

  report.tests.forEach((test, index) => {
    markdown += `### ${index + 1}. ${test.file}\n\n`;
    if (test.success) {
      markdown += `- ✅ **成功**\n`;
      markdown += `- 耗时: ${test.elapsed}ms\n`;
      markdown += `- Tokens: ${test.tokens}\n`;
      markdown += `- 心情: ${test.data.mood.status} (置信度 ${test.data.mood.confidence}%)\n`;
      markdown += `- 性格特征: ${test.data.personality.traits.join(', ')}\n`;
      markdown += `- 回复建议数量: ${test.data.replyStrategy.suggestions.length}\n\n`;
    } else {
      markdown += `- ❌ **失败**\n`;
      markdown += `- 错误: ${test.error}\n\n`;
    }
  });

  return markdown;
}

testGemini().catch(console.error);
