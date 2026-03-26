import request from '@/utils/request'

export function getLoginLogList(data) {
  return request.post('/user/loginLogList', data)
}
