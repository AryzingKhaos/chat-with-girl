#!/usr/bin/env node

/**
 * OCR 测试脚本
 * 用法: node test-ocr.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
async function recognizeImage(imagePath) {
  const base64Image = imageToBase64(imagePath);

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
            text: '请识别图片中所有的文字内容，保持原有格式和换行，不要添加任何解释。',
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
  const resultsDir = path.join(testImagesDir, 'results');

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

  console.log(`\n🔍 开始测试 OCR 功能，共 ${files.length} 张图片...\n`);
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
      const text = await recognizeImage(filePath);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // 保存单个识别结果到文本文件
      const txtFilePath = path.join(resultsDir, `${basename}.txt`);
      fs.writeFileSync(txtFilePath, text, 'utf-8');

      console.log(`✅ 识别成功 (耗时: ${duration}s)`);
      console.log(`💾 结果已保存: test-images/results/${basename}.txt`);
      console.log('\n📝 识别结果:');
      console.log('┌' + '─'.repeat(78) + '┐');

      if (text) {
        text.split('\n').forEach(line => {
          console.log(`│ ${line.padEnd(76)} │`);
        });
      } else {
        console.log(`│ ${'(未识别到文字)'.padEnd(76)} │`);
      }

      console.log('└' + '─'.repeat(78) + '┘');

      // 记录结果用于汇总
      results.push({
        file,
        sizeKB,
        duration,
        text,
        success: true,
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
      });
    }

    console.log('='.repeat(80));
  }

  // 生成汇总报告
  const summaryPath = path.join(resultsDir, `summary-${timestamp}.md`);
  let summary = `# OCR 测试结果汇总\n\n`;
  summary += `**测试时间**: ${new Date().toLocaleString('zh-CN')}\n`;
  summary += `**测试图片**: ${files.length} 张\n`;
  summary += `**成功识别**: ${results.filter(r => r.success).length} 张\n`;
  summary += `**失败**: ${results.filter(r => !r.success).length} 张\n\n`;
  summary += `---\n\n`;

  results.forEach((result, index) => {
    summary += `## ${index + 1}. ${result.file}\n\n`;
    summary += `- **文件大小**: ${result.sizeKB} KB\n`;
    summary += `- **识别状态**: ${result.success ? '✅ 成功' : '❌ 失败'}\n`;
    summary += `- **识别耗时**: ${result.duration}s\n`;

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
  console.log(`📂 所有结果已保存到: test-images/results/`);
  console.log(`📄 汇总报告: test-images/results/summary-${timestamp}.md\n`);
}

main().catch(error => {
  console.error('❌ 程序错误:', error);
  process.exit(1);
});
