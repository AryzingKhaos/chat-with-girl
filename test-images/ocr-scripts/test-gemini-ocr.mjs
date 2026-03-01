import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量（向上两级到项目根目录）
const envContent = await fs.readFile(path.join(__dirname, '../../.env.local'), 'utf-8');
const apiKey = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='))?.split('=')[1]?.trim();

if (!apiKey) {
  console.error('❌ 未找到 GEMINI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 测试图片列表
const testImages = [
  'soul1.jpg',
  'soul2.jpg',
  'wx1.png',
  'wx2.jpg'
];

// OCR prompt
const OCR_PROMPT = `这是一张聊天应用的截图。请仔细识别图片中所有对话文字内容，包括时间、昵称和消息内容。

要求：
- 逐字识别每个中文字符
- 识别所有时间戳（如：11:47, 19:02）
- 识别表情符号（如：❤️）
- 忽略装饰性元素（如头像、背景、图标）
- 保持原有格式和换行
- 只输出实际可见的文字，不要添加任何解释

直接输出识别结果：`;

async function recognizeWithGemini(imagePath, prompt, modelName) {
  const startTime = Date.now();

  try {
    // 读取图片文件
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // 获取图片 MIME 类型
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const text = result.response.text();

    return {
      success: true,
      text,
      duration,
      model: modelName
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return {
      success: false,
      error: error.message,
      duration,
      model: modelName
    };
  }
}

async function main() {
  console.log('🚀 开始 Gemini OCR 测试\n');

  // 尝试多个可能的模型名称（2026年2月更新）
  const modelsToTry = [
    'gemini-3-flash',           // 最新 Gemini 3 Flash（支持多模态）
    'gemini-2.5-flash',         // 稳定版高性价比模型
    'gemini-2.5-pro',           // 最强推理能力
    'gemini-2.5-flash-lite',    // 最快最经济
    'gemini-2.0-flash'          // 备用（将于2026年3月31日退役）
  ];

  console.log('🔍 检测可用的 Gemini 模型...\n');

  let workingModel = null;

  // 测试第一张图片以找到可用的模型
  const testImagePath = path.join(__dirname, '..', testImages[0]);

  for (const modelName of modelsToTry) {
    console.log(`   测试模型: ${modelName}`);
    const result = await recognizeWithGemini(testImagePath, '识别这张图片中的文字', modelName);

    if (result.success) {
      workingModel = modelName;
      console.log(`   ✅ 模型可用: ${modelName}\n`);
      break;
    } else {
      console.log(`   ❌ 不可用: ${result.error.split(':')[0]}`);
    }
  }

  if (!workingModel) {
    console.error('\n❌ 未找到可用的 Gemini 模型，请检查 API Key 权限');
    process.exit(1);
  }

  console.log(`\n📋 测试配置:`);
  console.log(`  模型: ${workingModel}`);
  console.log('  图片数量:', testImages.length);
  console.log('  结果目录: test-images/results-gemini\n');

  // 创建结果目录
  const resultsDir = path.join(__dirname, '..', 'results-gemini');
  await fs.mkdir(resultsDir, { recursive: true });

  const results = [];

  for (const imageName of testImages) {
    const imagePath = path.join(__dirname, '..', imageName);

    console.log(`\n📸 测试图片: ${imageName}`);
    console.log('⏳ 识别中...');

    const result = await recognizeWithGemini(imagePath, OCR_PROMPT, workingModel);

    if (result.success) {
      console.log(`✅ 识别完成 (${result.duration}s)`);
      console.log(`📝 识别文字长度: ${result.text.length} 字符`);

      // 保存识别结果
      const outputPath = path.join(resultsDir, `${path.parse(imageName).name}.txt`);
      await fs.writeFile(outputPath, result.text, 'utf-8');

      results.push({
        image: imageName,
        duration: result.duration,
        charCount: result.text.length,
        lineCount: result.text.split('\n').length,
        success: true
      });
    } else {
      console.log(`❌ 识别失败: ${result.error}`);
      results.push({
        image: imageName,
        duration: result.duration,
        error: result.error,
        success: false
      });
    }
  }

  // 生成对比报告
  console.log('\n\n📊 测试结果汇总\n');
  console.log('| 图片 | 耗时 | 字符数 | 行数 | 状态 |');
  console.log('|------|------|--------|------|------|');

  for (const result of results) {
    if (result.success) {
      console.log(`| ${result.image} | ${result.duration}s | ${result.charCount} | ${result.lineCount} | ✅ |`);
    } else {
      console.log(`| ${result.image} | ${result.duration}s | - | - | ❌ |`);
    }
  }

  // 保存对比报告
  const reportContent = `# Gemini OCR 测试报告

**测试时间**: ${new Date().toLocaleString('zh-CN')}
**测试模型**: ${workingModel}
**测试图片**: ${testImages.length} 张

## 统计对比

| 图片 | 耗时 | 字符数 | 行数 | 状态 |
|------|------|--------|------|------|
${results.map(r => r.success
  ? `| ${r.image} | ${r.duration}s | ${r.charCount} | ${r.lineCount} | ✅ |`
  : `| ${r.image} | ${r.duration}s | - | - | ❌ ${r.error} |`
).join('\n')}

## 详细识别结果

${await Promise.all(results.filter(r => r.success).map(async (r) => {
  const content = await fs.readFile(path.join(resultsDir, `${path.parse(r.image).name}.txt`), 'utf-8');
  return `### ${r.image}

**统计**: ${r.charCount} 字符, ${r.lineCount} 行, 耗时 ${r.duration}s

\`\`\`
${content}
\`\`\`

---
`;
}))}
`;

  const reportPath = path.join(resultsDir, 'gemini-report.md');
  await fs.writeFile(reportPath, reportContent.replace(/,/g, ''), 'utf-8');

  console.log(`\n✅ 测试完成！结果已保存到: ${resultsDir}`);
  console.log(`📄 报告文件: ${reportPath}`);
}

main().catch(console.error);
