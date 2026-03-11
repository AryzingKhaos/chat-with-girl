# OCR 测试脚本

这个文件夹包含所有 OCR 测试相关的脚本。

## 脚本列表

### 1. test-structured-ocr.mjs
使用 Google Gemini API 进行结构化 OCR 测试（对话识别 + 昵称提取）。

**使用方法**:
```bash
cd test-images/ocr-scripts
node test-structured-ocr.mjs
```

**环境变量**: 需要在项目根目录的 `.env.local` 中配置 `GEMINI_API_KEY`

**使用模型**: gemini-2.5-flash

**输出**: 结果保存在 `test-images/results-structured/`

**功能特点**:
- 识别对话人物（左边=对方，右边=自己）
- 提取并保留昵称信息
- 分离非对话信息（系统提示、日期分隔线等）
- 输出格式：`对方(昵称): 消息内容`

---

### 2. test-gemini-ocr.mjs
使用 Google Gemini API 进行 OCR 测试。

**使用方法**:
```bash
cd test-images/ocr-scripts
node test-gemini-ocr.mjs
```

**环境变量**: 需要在项目根目录的 `.env.local` 中配置 `GEMINI_API_KEY`

**支持模型**:
- gemini-3-flash (最新)
- gemini-2.5-flash (稳定版，推荐)
- gemini-2.5-pro (最强推理能力)
- gemini-2.5-flash-lite (最快最经济)

**输出**: 结果保存在 `test-images/results-gemini/`

---

### 2. test-ocr.mjs
使用 OpenAI GPT-4o-mini 进行基础 OCR 测试。

**使用方法**:
```bash
cd test-images/ocr-scripts
node test-ocr.mjs
```

**环境变量**: 需要在项目根目录的 `.env.local` 中配置 `OPENAI_API_KEY`

**输出**: 结果保存在 `test-images/results/`

---

### 3. test-ocr-enhanced.mjs
增强版 OCR 测试，支持图片预处理和优化 prompt。

**使用方法**:
```bash
cd test-images/ocr-scripts

# 基础测试
node test-ocr-enhanced.mjs

# 启用图片预处理
node test-ocr-enhanced.mjs --preprocess

# 启用优化 prompt
node test-ocr-enhanced.mjs --optimized-prompt

# 同时启用两者
node test-ocr-enhanced.mjs --preprocess --optimized-prompt
```

**环境变量**: 需要在项目根目录的 `.env.local` 中配置 `OPENAI_API_KEY`

**依赖**: 需要安装 `sharp` 包用于图片预处理

**输出**: 结果保存在 `test-images/results-enhanced/`

---

## 测试图片

所有脚本会自动扫描 `test-images/` 目录（上一级目录）中的图片文件：
- soul1.jpg
- soul2.jpg
- wx1.png
- wx2.jpg

支持的图片格式: `.jpg`, `.jpeg`, `.png`, `.webp`

## 结果目录

- `results-structured/` - 结构化 OCR 结果（对话识别 + 昵称提取）
- `results/` - 基础 OCR 结果
- `results-enhanced/` - 增强版 OCR 结果
- `results-gemini/` - Gemini API OCR 结果
- `preprocessed/` - 预处理后的图片

## 环境配置

在项目根目录创建 `.env.local` 文件：

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```
