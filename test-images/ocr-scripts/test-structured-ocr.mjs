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

// 新的结构化 OCR prompt（支持对话识别和昵称提取）
const STRUCTURED_OCR_PROMPT = `你是一个专业的聊天截图文字识别助手。请分析这张一对一聊天应用截图，按照以下规则提取内容：

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

请严格按照上述格式输出，不要添加任何解释或说明。`;

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
  console.log('🚀 开始结构化 OCR 测试（对话识别 + 昵称提取）\n');

  const modelName = 'gemini-2.5-flash';

  console.log('📋 测试配置:');
  console.log(`  模型: ${modelName}`);
  console.log('  图片数量:', testImages.length);
  console.log('  结果目录: test-images/results-structured\n');

  // 创建结果目录
  const resultsDir = path.join(__dirname, '..', 'results-structured');
  await fs.mkdir(resultsDir, { recursive: true });

  const results = [];

  for (const imageName of testImages) {
    const imagePath = path.join(__dirname, '..', imageName);

    console.log(`\n📸 测试图片: ${imageName}`);
    console.log('⏳ 识别中...');

    const result = await recognizeWithGemini(imagePath, STRUCTURED_OCR_PROMPT, modelName);

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
  const reportContent = `# 结构化 OCR 测试报告

**测试时间**: ${new Date().toLocaleString('zh-CN')}
**测试模型**: ${modelName}
**测试图片**: ${testImages.length} 张
**测试目标**: 对话识别、昵称提取、非对话信息分离

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

  const reportPath = path.join(resultsDir, 'structured-report.md');
  await fs.writeFile(reportPath, reportContent.replace(/,/g, ''), 'utf-8');

  console.log(`\n✅ 测试完成！结果已保存到: ${resultsDir}`);
  console.log(`📄 报告文件: ${reportPath}`);
}

main().catch(console.error);
