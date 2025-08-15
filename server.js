const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 中间件
app.use(cors());
app.use(express.json());
// 修改静态文件中间件配置
app.use(express.static('.'));

// 提供静态文件（HTML页面）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 运势预测 API 端点
app.post('/api/fortune', async (req, res) => {
  try {
    console.log('Received fortune request');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a playful hippo fortune teller. Give short, whimsical fortune predictions in 1-2 sentences. Be cheerful, slightly quirky, and optimistic. Use emojis sparingly but effectively.'
        },
        {
          role: 'user',
          content: 'Tell me my fortune for today. Make it fun and optimistic!'
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const fortune = completion.choices[0].message.content.trim();
    
    console.log('Generated fortune:', fortune);
    
    res.json({ 
      success: true, 
      fortune: fortune 
    });
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    let errorMessage = 'The hippo is taking a nap. Please try again later! 🦛💤';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'The hippo has used up all its wisdom for today. Please try again tomorrow! 🦛✨';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'The hippo forgot its magic words. Please check the configuration! 🦛🔑';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// TTS API 端点 - 将文字转换为语音（憨厚版本）
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }
    
    console.log('Generating speech for:', text);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',    // 憨厚的低沉声音
      input: text,
      speed: 0.75       // 更慢的语速，增加憨态可掬的感觉
    });
    
    // 将音频数据转换为 Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // 设置响应头
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    
    // 发送音频数据
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate speech' 
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hippo server is running!' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🦛 Hippo Fortune Teller server is running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to set your OPENAI_API_KEY in the .env file`);
});