import request from '@/utils/request'

// 获取分类列表 (树状结构)
export function getCategoryList(data) {
  return request.post('/category/list', data)
}

// 新增分类
export function addCategory(data) {
  return request.post('/category/add', data)
}

// 修改分类
export function updateCategory(data) {
  return request.post('/category/update', data)
}

// 删除分类
export function deleteCategory(data) {
  return request.post('/category/delete', data)
}