/**
 * Codex → DeepSeek 协议桥接代理 v3
 * 完整实现 Responses API SSE 事件流格式
 */
const http = require('http');
const https = require('https');
const DEEPSEEK_API_KEY = 'sk-DEEPSEEK_API_KEY_REPLACED';
const PORT = 38440;
const roleMap = { developer: 'system', system: 'system', user: 'user', assistant: 'assistant', tool: 'tool' };

function extractMessages(codexReq) {
  const messages = [];
  if (codexReq.instructions) messages.push({ role: 'system', content: codexReq.instructions });
  if (codexReq.input) {
    const input = Array.isArray(codexReq.input) ? codexReq.input : [{ role: 'user', content: codexReq.input }];
    for (const item of input) {
      const role = roleMap[item.role] || 'user';
      let text = '';
      if (typeof item.content === 'string') text = item.content;
      else if (Array.isArray(item.content)) for (const p of item.content) if (p.text) text += p.text;
      if (text) messages.push({ role, content: text });
    }
  }
  if (!messages.length) messages.push({ role: 'user', content: 'hello' });
  return messages;
}

// 调用 DeepSeek Chat Completions API
function deepseekChat(messages, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, messages, max_tokens: 65536, stream: false });
    const req = https.request({
      hostname: 'api.deepseek.com', path: '/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let seq = 0;
function event(type, extra = {}) {
  return `data: ${JSON.stringify({ type, sequence_number: seq++, ...extra })}\n\n`;
}

function buildResponse(id, model, content, usage) {
  const u = usage || {};
  return {
    id, object: 'response', status: 'completed', model,
    created: Math.floor(Date.now() / 1000),
    output: [{
      id: 'msg_' + id.split('_')[1], type: 'message', role: 'assistant',
      content: [{ type: 'output_text', text: content }],
    }],
    usage: {
      input_tokens: u.prompt_tokens || u.input_tokens || 0,
      output_tokens: u.completion_tokens || u.output_tokens || 0,
      total_tokens: u.total_tokens || 0,
      output_tokens_details: { reasoning_tokens: 0 },
    },
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/v1/models') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'deepseek-v4-pro', object: 'model', created: Math.floor(Date.now() / 1000), owned_by: 'deepseek' },
        { id: 'deepseek-v4-flash', object: 'model', created: Math.floor(Date.now() / 1000), owned_by: 'deepseek' },
      ],
    }));
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/v1/responses' || url.pathname === '/v1/chat/completions')) {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const codexReq = JSON.parse(body);
        seq = 0;
        const model = (codexReq.model === 'moonbridge') ? 'deepseek-v4-pro' : codexReq.model;
        const messages = extractMessages(codexReq);
        const isStream = codexReq.stream === true;
        const respId = 'resp_' + Date.now().toString(36);

        console.log(`[${new Date().toLocaleTimeString()}] ${model} stream=${isStream}`);

        if (isStream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          // 1. response.created
          res.write(event('response.created', { response: buildResponse(respId, model, '') }));
          // 2. response.in_progress
          res.write(event('response.in_progress', { response: { id: respId } }));

          // 调用 DeepSeek
          const dsRes = await deepseekChat(messages, model);
          if (dsRes.status !== 200) {
            res.write(event('error', { error: { message: dsRes.data?.error?.message || 'DeepSeek API error' } }));
            res.write(`data: [DONE]\n\n`);
            res.end();
            return;
          }

          const content = dsRes.data.choices?.[0]?.message?.content || '';
          const usage = dsRes.data.usage || {};
          const msgId = 'msg_' + Date.now().toString(36);

          // 3. output_item.added
          res.write(event('response.output_item.added', {
            output_index: 0, item: { id: msgId, type: 'message', role: 'assistant', status: 'in_progress', content: [] },
          }));
          // 4. content_part.added
          res.write(event('response.content_part.added', {
            output_index: 0, content_index: 0,
            part: { type: 'output_text', text: '' },
          }));
          // 5. output_text.delta
          res.write(event('response.output_text.delta', {
            output_index: 0, content_index: 0, delta: content,
          }));
          // 6. output_text.done
          res.write(event('response.output_text.done', {
            output_index: 0, content_index: 0, text: content,
          }));
          // 7. content_part.done
          res.write(event('response.content_part.done', {
            output_index: 0, content_index: 0,
            part: { type: 'output_text', text: content },
          }));
          // 8. output_item.done
          res.write(event('response.output_item.done', {
            output_index: 0,
            item: { id: msgId, type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: content }] },
          }));
          // 9. response.completed
          res.write(event('response.completed', {
            response: buildResponse(respId, model, content, usage),
          }));
          res.write(`data: [DONE]\n\n`);
          res.end();
          console.log(`[${new Date().toLocaleTimeString()}] → ${content.slice(0, 60)}...`);
        } else {
          const dsRes = await deepseekChat(messages, model);
          if (dsRes.status !== 200) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'DeepSeek error: ' + (dsRes.data?.error?.message || JSON.stringify(dsRes.data)) }));
            return;
          }
          const content = dsRes.data.choices?.[0]?.message?.content || '';
          const usage = dsRes.data.usage || {};
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(buildResponse(respId, model, content, usage)));
        }
      } catch (err) {
        console.error('代理错误:', err);
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Codex ↔ DeepSeek 桥接代理 v3 已启动: http://127.0.0.1:${PORT}`);
  console.log(`   API Key: ${DEEPSEEK_API_KEY.slice(0, 12)}...`);
  console.log(`   Ctrl+C 停止`);
});
