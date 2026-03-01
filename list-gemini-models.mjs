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

const genAI = new GoogleGenerativeAI(apiKey);

console.log('🔍 查询可用的 Gemini 模型...\n');

try {
  const models = await genAI.listModels();

  console.log(`✅ 找到 ${models.length} 个可用模型:\n`);

  const visionModels = [];

  for (const model of models) {
    console.log(`📦 ${model.name}`);
    console.log(`   显示名称: ${model.displayName}`);
    console.log(`   描述: ${model.description}`);
    console.log(`   支持的方法: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);

    // 检查是否支持图片输入
    if (model.supportedGenerationMethods?.includes('generateContent')) {
      visionModels.push(model.name.replace('models/', ''));
    }
    console.log('');
  }

  console.log('\n🎯 支持 generateContent 的模型（可用于 OCR）:');
  visionModels.forEach(m => console.log(`  - ${m}`));

} catch (error) {
  console.error('❌ 查询失败:', error.message);
}
