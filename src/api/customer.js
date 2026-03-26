import request from '@/utils/request'

// 客户管理接口
export function getCustomerList(data) {
    return request.post('/customer/list', data)
}

export function addCustomer(data) {
    return request.post('/customer/add', data)
}

export function updateCustomer(data) {
    return request.post('/customer/update', data)
}

export function deleteCustomer(id) {
    return request.post('/customer/delete', { id })
}

export function getCustomerById(id) {
    return request.get('/customer/get', { params: { id } })
}

// 客户地址管理接口
export function getCustomerAddressList(data) {
    return request.post('/customer/address/list', data)
}

export function addCustomerAddress(data) {
    return request.post('/customer/address/add', data)
}

export function updateCustomerAddress(data) {
    return request.post('/customer/address/update', data)
}

export function deleteCustomerAddress(id) {
    return request.post('/customer/address/delete', { id })
}

export function getCustomerAddressById(id) {
    return request.get('/customer/address/get', { params: { id } })
}
