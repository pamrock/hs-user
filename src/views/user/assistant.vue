<template>
  <div class="assistant-page">
    <!-- 左侧历史面板 -->
    <el-drawer
      v-model="showSidebar"
      direction="ltr"
      size="280px"
      :with-header="false"
      class="history-drawer"
    >
      <div class="history-panel">
        <div class="history-header">对话历史</div>
        <div v-if="conversations.length === 0" class="history-empty">暂无历史对话</div>
        <div
          v-for="conv in conversations"
          :key="conv.conversationId"
          class="history-item"
          :class="{ active: conversationId === conv.conversationId }"
          @click="switchConversation(conv)"
        >
          <div class="history-title">{{ conv.title || '新对话' }}</div>
          <div class="history-time">{{ formatConvTime(conv.updateTime) }}</div>
        </div>
      </div>
    </el-drawer>

    <!-- Header -->
    <div class="assistant-header">
      <div class="header-left" @click="showSidebar = true">
        <el-icon :size="22"><Expand /></el-icon>
      </div>
      <div class="header-title">AI智能客服</div>
      <div class="header-right" @click="newConversation">
        <el-icon :size="22"><Plus /></el-icon>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="message-area" ref="messageAreaRef">
      <div v-if="messages.length === 0 && !sending" class="empty-state">
        <div class="bot-icon-wrap">
          <div class="bot-icon">AI</div>
        </div>
        <div class="welcome-text">你好，我是AI智能客服</div>
        <div class="welcome-hint">请问有什么可以帮你的？</div>
        <div class="quick-chips">
          <div
            v-for="q in quickQuestions"
            :key="q"
            class="quick-chip"
            @click="sendQuickQuestion(q)"
          >{{ q }}</div>
        </div>
      </div>

      <template v-for="(msg, idx) in messages" :key="idx">
        <div v-if="msg.role === 'user'" class="msg-row user-row">
          <div class="msg-bubble user-bubble">{{ msg.content }}</div>
        </div>
        <div v-else class="msg-row assistant-row">
          <div class="msg-avatar">AI</div>
          <div class="msg-bubble assistant-bubble" v-html="renderMarkdown(msg.content)"></div>
        </div>
      </template>

      <!-- 打字指示器 -->
      <div v-if="sending" class="msg-row assistant-row">
        <div class="msg-avatar">AI</div>
        <div class="msg-bubble assistant-bubble typing-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    </div>

    <!-- 底部输入栏 -->
    <div class="input-area">
      <input
        v-model="inputText"
        class="text-input"
        placeholder="输入您的问题..."
        :disabled="sending"
        @keyup.enter="handleSend"
      />
      <button class="send-btn" :disabled="sending || !inputText.trim()" @click="handleSend">
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Expand, Plus } from '@element-plus/icons-vue'
import { sendMessage, getChatHistory, listConversations, deleteConversation } from '@/api/aichat'

const conversationId = ref(null)
const messages = ref([])
const inputText = ref('')
const sending = ref(false)
const showSidebar = ref(false)
const conversations = ref([])
const messageAreaRef = ref(null)

const quickQuestions = [
  '有哪些保洁服务？',
  '帮我推荐一下家庭保洁',
  '价格怎么样？',
  '怎么下单？'
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messageAreaRef.value) {
      messageAreaRef.value.scrollTop = messageAreaRef.value.scrollHeight
    }
  })
}

const renderMarkdown = (text) => {
  if (!text) return ''
  let html = text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\n/g, '<br>')
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
  return html
}

const formatConvTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return m + '-' + day
}

const loadConversations = async () => {
  try {
    const res = await listConversations()
    if (res.code === 200) {
      conversations.value = res.data || []
    }
  } catch (e) {
    console.error('加载会话列表失败', e)
  }
}

const newConversation = () => {
  conversationId.value = null
  messages.value = []
  showSidebar.value = false
}

const switchConversation = async (conv) => {
  conversationId.value = conv.conversationId
  showSidebar.value = false
  try {
    const res = await getChatHistory({ conversationId: conv.conversationId })
    if (res.code === 200) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (e) {
    ElMessage.error('加载历史消息失败')
  }
}

const sendQuickQuestion = (q) => {
  inputText.value = q
  handleSend()
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  inputText.value = ''
  sending.value = true

  // 立即显示用户消息
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()

  try {
    const res = await sendMessage({
      conversationId: conversationId.value,
      content: text
    })
    if (res.code === 200 && res.data) {
      conversationId.value = res.data.conversationId
      // 添加 AI 回复
      if (res.data.aiMessage) {
        messages.value.push(res.data.aiMessage)
      }
      // 刷新会话列表
      loadConversations()
      scrollToBottom()
    } else {
      ElMessage.error(res.msg || '发送失败')
    }
  } catch (e) {
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.assistant-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--app-bg);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--app-bg-white);
  border-bottom: 1px solid var(--app-border);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: var(--app-text-primary);
  border-radius: 50%;
}

.header-left:active, .header-right:active {
  background: var(--app-bg-input);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
}

.bot-icon-wrap {
  margin-bottom: 16px;
}

.bot-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--app-primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
}

.welcome-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 6px;
}

.welcome-hint {
  font-size: 14px;
  color: var(--app-text-muted);
  margin-bottom: 24px;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 320px;
}

.quick-chip {
  background: var(--app-bg-white);
  border: 1px solid var(--app-border);
  border-radius: 18px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--app-text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-chip:active {
  background: var(--app-primary);
  color: #fff;
  border-color: var(--app-primary);
}

.msg-row {
  display: flex;
  margin: 8px 0;
  align-items: flex-start;
}

.user-row {
  justify-content: flex-end;
}

.assistant-row {
  justify-content: flex-start;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 8px;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 13px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.user-bubble {
  background: #95ec69;
  border-radius: 14px 4px 14px 14px;
  color: #000;
}

.assistant-bubble {
  background: var(--app-bg-white);
  border-radius: 4px 14px 14px 14px;
  color: var(--app-text-primary);
}

.assistant-bubble :deep(strong) {
  font-weight: 600;
}

.assistant-bubble :deep(pre) {
  background: var(--app-bg-input);
  border-radius: 6px;
  padding: 10px;
  margin: 6px 0;
  overflow-x: auto;
  font-size: 12px;
  white-space: pre-wrap;
}

.typing-bubble {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 14px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-text-muted);
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); }
  40% { transform: scale(1); }
}

.input-area {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  background: var(--app-bg-white);
  border-top: 1px solid var(--app-border);
  gap: 8px;
}

.text-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 10px 12px;
  background: var(--app-bg-input);
  border-radius: 20px;
  color: var(--app-text-primary);
}

.text-input::placeholder {
  color: var(--app-text-placeholder);
}

.send-btn {
  flex-shrink: 0;
  background: var(--app-primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
}

.send-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.history-panel {
  padding: 16px 12px;
}

.history-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 16px;
}

.history-empty {
  color: var(--app-text-muted);
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
}

.history-item {
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.history-item.active {
  background: var(--app-bg-input);
}

.history-item:active {
  background: var(--app-bg-input);
}

.history-title {
  font-size: 14px;
  color: var(--app-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: var(--app-text-muted);
  margin-top: 4px;
}

:deep(.history-drawer .el-drawer__body) {
  padding: 0;
}
</style>
