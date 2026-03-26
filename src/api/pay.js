import request from '@/utils/request'

// 支付宝支付
export function alipayPay(data) {
  return request({
    url: '/alipay/pay',
    method: 'post',
    data
  })
}
