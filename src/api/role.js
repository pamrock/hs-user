import request from '@/utils/request'

export function getRoleList(params) {
  return request.post('/permission/roleList', params)
}

export function addRole(data) {
  return request.post('/permission/roleAdd', data)
}

export function updateRole(data) {
  return request.post('/permission/roleUpdate', data)
}

export function deleteRole(data) {
  return request.post('/permission/roleDelete', data)
}

export function getRoleMenu(data) {
  return request.post('/permission/menuRoleList', data)
}

