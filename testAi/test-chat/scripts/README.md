# 测试脚本说明

本目录包含用于测试 ChatGPT 和 Gemini AI 分析功能的测试脚本。

## 环境准备

确保在项目根目录的 `.env.local` 文件中配置了以下 API Key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## 运行测试

### 测试 ChatGPT

```bash
cd test-chat/scripts
node test-chatgpt.mjs
```

### 测试 Gemini

```bash
cd test-chat/scripts
node test-gemini.mjs
```

## 测试数据

测试数据位于 `../data/` 目录:
- `sample-chat-short.json`: 短对话 (3-5 条消息)
- `sample-chat-medium.json`: 中等对话 (10-15 条消息)
- `sample-chat-long.json`: 长对话 (30-50 条消息)

## 测试结果

测试结果保存在 `../results/` 目录:
- `chatgpt-*.json`: ChatGPT 分析结果
- `chatgpt-results.json`: ChatGPT 测试数据汇总
- `chatgpt-report.md`: ChatGPT 测试报告
- `gemini-*.json`: Gemini 分析结果
- `gemini-results.json`: Gemini 测试数据汇总
- `gemini-report.md`: Gemini 测试报告

## 测试内容

脚本会验证:
1. AI API 调用是否成功
2. 返回的 JSON 格式是否符合 Schema
3. 分析结果的完整性
4. Token 消耗和耗时统计
