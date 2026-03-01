import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量
const envContent = await fs.readFile(path.join(__dirname, '.env.local'), 'utf-8');
const apiKey = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='))?.split('=')[1]?.trim();

if (!apiKey) {
  console.error('❌ 未找到 GEMINI_API_KEY');
  process.exit(1);
}

console.log('🔑 API Key 长度:', apiKey.length, '字符');
console.log('🔑 API Key 前缀:', apiKey.substring(0, 10) + '...');
console.log('');

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTry = [
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

for (const modelName of modelsToTry) {
  console.log(`\n📦 测试模型: ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello');
    console.log(`   ✅ 成功! 响应: ${result.response.text().substring(0, 50)}...`);
  } catch (error) {
    console.log(`   ❌ 失败:`);
    console.log(`      错误类型: ${error.constructor.name}`);
    console.log(`      错误信息: ${error.message}`);
    if (error.response) {
      console.log(`      HTTP 状态: ${error.response.status}`);
      console.log(`      响应体:`, error.response.data);
    }
  }
}
