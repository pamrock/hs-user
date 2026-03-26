import request from '@/utils/request'

// 基础信息 Base URL : /employee

// 2.1 添加员工
export function addEmployee(data) {
  return request({
    url: '/employee/add',
    method: 'post',
    data
  })
}

// 2.2 更新员工
export function updateEmployee(data) {
  return request({
    url: '/employee/update',
    method: 'post',
    data
  })
}

// 2.3 分页查询员工
export function getEmployeeList(data) {
  return request({
    url: '/employee/list',
    method: 'post',
    data
  })
}

// 2.4 审核员工
export function auditEmployee(data) {
  return request({
    url: '/employee/audit',
    method: 'post',
    data
  })
}

// 2.5 员工离职
export function leaveEmployee(data) {
  return request({
    url: '/employee/leave',
    method: 'post',
    data
  })
}

// 2.6 拉黑员工
export function blacklistEmployee(data) {
  return request({
    url: '/employee/blacklist',
    method: 'post',
    data
  })
}

// 2.7 更新评分
export function updateStarRating(data) {
  return request({
    url: '/employee/updateStarRating',
    method: 'post',
    data
  })
}

// 2.8 统计 - 按状态分布
export function getStatsByStatus() {
  return request({
    url: '/employee/stats/status',
    method: 'post'
  })
}

// 2.9 统计 - 按星级分布
export function getStatsByRating() {
  return request({
    url: '/employee/stats/rating',
    method: 'post'
  })
}

// 2.10 统计 - Top N 员工
export function getTopEmployees(data) {
  return request({
    url: '/employee/stats/top',
    method: 'post',
    data
  })
}

// 获取可派单员工列表
export function getNotWorkingEmployees(data) {
  return request({
    url: '/employee/notworking',
    method: 'post',
    data
  })
}
