#!/usr/bin/env node

/**
 * OCR 增强测试脚本 - 支持优化 prompt 和图片预处理
 * 用法: node test-ocr-enhanced.mjs [--preprocess] [--optimized-prompt]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);
const usePreprocess = args.includes('--preprocess');
const useOptimizedPrompt = args.includes('--optimized-prompt');

console.log('\n🔧 配置选项:');
console.log(`  - 图片预处理: ${usePreprocess ? '✅ 启用' : '❌ 关闭'}`);
console.log(`  - 优化 Prompt: ${useOptimizedPrompt ? '✅ 启用' : '❌ 关闭'}\n`);

// 读取 .env.local 文件（向上两级到项目根目录）
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKey = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
  console.error('❌ 错误: 未找到 OPENAI_API_KEY');
  process.exit(1);
}

const client = new OpenAI({ apiKey });

/**
 * 图片预处理：提高对比度、灰度化、锐化
 */
async function preprocessImage(filePath) {
  const preprocessDir = path.join(path.dirname(filePath), 'preprocessed');
  if (!fs.existsSync(preprocessDir)) {
    fs.mkdirSync(preprocessDir, { recursive: true });
  }

  const basename = path.basename(filePath);
  const outputPath = path.join(preprocessDir, `processed_${basename}`);

  await sharp(filePath)
    .grayscale() // 转为灰度图
    .normalize() // 自动调整对比度
    .sharpen() // 锐化
    .png() // 转为 PNG 格式（无损）
    .toFile(outputPath);

  return outputPath;
}

/**
 * 将图片文件转换为 base64
 */
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();

  let mimeType;
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      mimeType = 'image/jpeg';
      break;
    case '.png':
      mimeType = 'image/png';
      break;
    case '.webp':
      mimeType = 'image/webp';
      break;
    default:
      throw new Error(`不支持的图片格式: ${ext}`);
  }

  return `data:${mimeType};base64,${base64}`;
}

/**
 * 识别图片文字
 */
async function recognizeImage(imagePath, optimizedPrompt = false) {
  const base64Image = imageToBase64(imagePath);

  // 根据参数选择 prompt
  const prompt = optimizedPrompt
    ? '这是一张聊天软件的截图。请仔细识别图片中所有对话文字内容，包括时间、昵称和消息内容。请忽略装饰性元素（如头像、背景、图标），只提取纯文字。保持原有格式和换行，不要添加任何解释或说明。'
    : '请识别图片中所有的文字内容，保持原有格式和换行，不要添加任何解释。';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: base64Image,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * 主函数
 */
async function main() {
  const testImagesDir = path.join(__dirname, '..');
  const resultsDir = path.join(testImagesDir, 'results-enhanced');

  if (!fs.existsSync(testImagesDir)) {
    console.error('❌ 错误: test-images 目录不存在');
    process.exit(1);
  }

  // 创建结果目录
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const files = fs.readdirSync(testImagesDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .sort();

  if (files.length === 0) {
    console.error('❌ 错误: test-images 目录中没有图片文件');
    process.exit(1);
  }

  console.log(`🔍 开始测试 OCR 功能，共 ${files.length} 张图片...\n`);
  console.log('='.repeat(80));

  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  for (const file of files) {
    const filePath = path.join(testImagesDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const basename = path.parse(file).name;

    console.log(`\n📸 图片: ${file} (${sizeKB} KB)`);
    console.log('-'.repeat(80));

    try {
      const startTime = Date.now();

      // 如果启用预处理，先处理图片
      const imageToRecognize = usePreprocess
        ? await preprocessImage(filePath)
        : filePath;

      if (usePreprocess) {
        console.log(`🎨 预处理完成: ${path.basename(imageToRecognize)}`);
      }

      const text = await recognizeImage(imageToRecognize, useOptimizedPrompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // 保存结果
      const txtFilePath = path.join(resultsDir, `${basename}.txt`);
      fs.writeFileSync(txtFilePath, text, 'utf-8');

      console.log(`✅ 识别成功 (耗时: ${duration}s)`);
      console.log(`💾 结果已保存: test-images/results-enhanced/${basename}.txt`);
      console.log('\n📝 识别结果:');
      console.log('┌' + '─'.repeat(78) + '┐');

      if (text) {
        text.split('\n').forEach(line => {
          const displayLine = line.length > 76 ? line.slice(0, 73) + '...' : line;
          console.log(`│ ${displayLine.padEnd(76)} │`);
        });
      } else {
        console.log(`│ ${'(未识别到文字)'.padEnd(76)} │`);
      }

      console.log('└' + '─'.repeat(78) + '┘');

      results.push({
        file,
        sizeKB,
        duration,
        text,
        success: true,
        preprocessed: usePreprocess,
        optimizedPrompt: useOptimizedPrompt,
      });

    } catch (error) {
      console.log(`❌ 识别失败: ${error.message}`);

      results.push({
        file,
        sizeKB,
        duration: '0',
        text: '',
        success: false,
        error: error.message,
        preprocessed: usePreprocess,
        optimizedPrompt: useOptimizedPrompt,
      });
    }

    console.log('='.repeat(80));
  }

  // 生成汇总报告
  const summaryPath = path.join(resultsDir, `summary-${timestamp}.md`);
  let summary = `# OCR 增强测试结果汇总\n\n`;
  summary += `**测试时间**: ${new Date().toLocaleString('zh-CN')}\n`;
  summary += `**测试图片**: ${files.length} 张\n`;
  summary += `**成功识别**: ${results.filter(r => r.success).length} 张\n`;
  summary += `**失败**: ${results.filter(r => !r.success).length} 张\n`;
  summary += `**图片预处理**: ${usePreprocess ? '✅ 启用' : '❌ 关闭'}\n`;
  summary += `**优化 Prompt**: ${useOptimizedPrompt ? '✅ 启用' : '❌ 关闭'}\n\n`;
  summary += `---\n\n`;

  results.forEach((result, index) => {
    summary += `## ${index + 1}. ${result.file}\n\n`;
    summary += `- **文件大小**: ${result.sizeKB} KB\n`;
    summary += `- **识别状态**: ${result.success ? '✅ 成功' : '❌ 失败'}\n`;
    summary += `- **识别耗时**: ${result.duration}s\n`;
    summary += `- **图片预处理**: ${result.preprocessed ? '✅' : '❌'}\n`;
    summary += `- **优化 Prompt**: ${result.optimizedPrompt ? '✅' : '❌'}\n`;

    if (!result.success) {
      summary += `- **错误信息**: ${result.error}\n`;
    }

    summary += `\n### 识别结果\n\n`;

    if (result.text) {
      summary += '```\n';
      summary += result.text;
      summary += '\n```\n\n';
    } else {
      summary += '*未识别到文字*\n\n';
    }

    summary += `---\n\n`;
  });

  fs.writeFileSync(summaryPath, summary, 'utf-8');

  console.log(`\n✨ 测试完成!\n`);
  console.log(`📂 所有结果已保存到: test-images/results-enhanced/`);
  console.log(`📄 汇总报告: test-images/results-enhanced/summary-${timestamp}.md\n`);
}

main().catch(error => {
  console.error('❌ 程序错误:', error);
  process.exit(1);
});
