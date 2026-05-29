import request from '@/utils/request'

export function sendMessage(data) {
  return request.post('/ai-chat/send', data)
}

export function getChatHistory(data) {
  return request.post('/ai-chat/history', data)
}

export function listConversations() {
  return request.post('/ai-chat/conversations')
}

export function deleteConversation(data) {
  return request.post('/ai-chat/delete-conversation', data)
}
