import request from '@/utils/request'

// 获取菜单列表
export function getMenuList(query) {
  return request.post('/permission/menuList', query)
}

// 获取当前用户菜单列表
export function getCurrentUserMenuList(query) {
  return request.post('/permission/currentUserMenuList', query)
}

// 查询菜单详细
export function getMenu(menuId) {
  return request.post('/permission/menuDetail', menuId)
}

// 新增菜单
export function addMenu(data) {
  return request.post('/permission/menuAdd', data)
}

// 修改菜单
export function updateMenu(data) {
  return request.post('/permission/menuUpdate', data)
}

// 删除菜单
export function deleteMenu(data) {
  return request.post('/permission/menuDelete', data)
}
