import { createRouter, createWebHashHistory } from 'vue-router'

import UserLayout from '@/views/user/layout.vue'

export const constantRoutes = [
  {
    path: '/',
    redirect: '/user/services'
  },
  {
    path: '/user/login',
    name: 'UserLogin',
    component: () => import('@/views/user/login.vue'),
    meta: { requiresAuth: false, title: '用户登录', hidden: true }
  },
  {
    path: '/user/register',
    name: 'UserRegister',
    component: () => import('@/views/user/register.vue'),
    meta: { requiresAuth: false, title: '用户注册', hidden: true }
  },
  {
    path: '/user',
    component: UserLayout,
    redirect: '/user/services',
    meta: { title: '用户端', hidden: true },
    children: [
      {
        path: 'services',
        name: 'UserServices',
        component: () => import('@/views/user/services.vue'),
        meta: { title: '服务' }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('@/views/user/orders.vue'),
        meta: { title: '订单' }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/profile.vue'),
        meta: { title: '我的' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    redirect: '/user/login'
  },
  {
    path: '/register',
    name: 'Register',
    redirect: '/user/register'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

export default router
