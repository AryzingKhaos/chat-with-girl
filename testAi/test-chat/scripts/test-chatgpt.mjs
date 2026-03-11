import OpenAI from 'openai';
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
        "id": "uuid",
        "type": "humor",
        "content": "具体回复文案",
        "explanation": "为什么这样回复",
        "riskLevel": "low"
      }
    ],
    "warnings": ["注意事项1", "注意事项2"]
  }
}`;

function formatMessages(messages) {
  return messages.map(msg => {
    const speaker = msg.speaker === 'self' ? '自己' : `对方(${msg.nickname})`;
    return `${speaker}: ${msg.content}`;
  }).join('\n');
}

async function testChatGPT() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('错误: OPENAI_API_KEY 未配置');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  const dataDir = join(__dirname, '../data');
  const resultsDir = join(__dirname, '../results');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));

  const report = {
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini',
    totalTests: files.length,
    successCount: 0,
    failureCount: 0,
    tests: [],
    avgTime: 0,
    avgTokens: 0,
  };

  console.log(`开始测试 ChatGPT (gpt-4o-mini), 共 ${files.length} 个样本...\n`);

  for (const file of files) {
    console.log(`测试: ${file}`);
    const startTime = Date.now();

    try {
      const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
      const chatText = formatMessages(data.messages);
      const userPrompt = `请分析以下聊天记录:\n\n${chatText}\n\n请严格按照 JSON Schema 返回分析结果。`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const elapsed = Date.now() - startTime;
      const responseText = completion.choices[0].message.content;
      const parsedData = JSON.parse(responseText);

      const validationResult = AnalysisResultSchema.safeParse(parsedData);

      if (validationResult.success) {
        console.log(`✅ 成功 (${elapsed}ms, ${completion.usage.total_tokens} tokens)\n`);

        const result = {
          file,
          success: true,
          elapsed,
          tokens: completion.usage.total_tokens,
          data: validationResult.data,
        };

        report.tests.push(result);
        report.successCount++;
        report.avgTime += elapsed;
        report.avgTokens += completion.usage.total_tokens;

        writeFileSync(
          join(resultsDir, `chatgpt-${file}`),
          JSON.stringify(validationResult.data, null, 2)
        );
      } else {
        console.log(`❌ 失败: JSON Schema 验证失败`);
        console.log(validationResult.error.errors);
        console.log(`原始响应: ${responseText}\n`);

        report.tests.push({
          file,
          success: false,
          error: 'Schema validation failed',
          details: validationResult.error.errors,
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
    join(resultsDir, 'chatgpt-results.json'),
    JSON.stringify(report, null, 2)
  );

  const markdown = generateReport(report);
  writeFileSync(join(resultsDir, 'chatgpt-report.md'), markdown);

  console.log('\n测试完成!');
  console.log(`成功: ${report.successCount}/${report.totalTests}`);
  console.log(`平均耗时: ${report.avgTime}ms`);
  console.log(`平均 Tokens: ${report.avgTokens}`);
}

function generateReport(report) {
  const successRate = ((report.successCount / report.totalTests) * 100).toFixed(1);

  let markdown = `# ChatGPT 测试报告\n\n`;
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

testChatGPT().catch(console.error);
