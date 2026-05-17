import request from '@/utils/request'

// 支付宝支付
export function alipayPay(data) {
  return request({
    url: '/alipay/pay',
    method: 'post',
    data
  })
}

// 查询支付宝支付状态（前端轮询用）
export function queryPaymentStatus(data) {
  return request({
    url: '/alipay/query-status',
    method: 'post',
    data
  })
}
