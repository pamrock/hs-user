<template>
  <div class="user-layout-container">
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <div class="bottom-tab-bar">
      <router-link to="/user/services" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><House /></el-icon>
        <span class="tab-text">服务</span>
      </router-link>
      <router-link to="/user/orders" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><Document /></el-icon>
        <span class="tab-text">订单</span>
      </router-link>
      <router-link to="/user/profile" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><User /></el-icon>
        <span class="tab-text">我的</span>
      </router-link>
      <div class="tab-item theme-toggle" @click="toggleTheme">
        <el-icon class="tab-icon"><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
        <span class="tab-text">{{ isDark ? '浅色' : '深色' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { House, Document, User, Sunny, Moon } from '@element-plus/icons-vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleTheme } = useDarkMode()
</script>

<style scoped>
.user-layout-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  background-color: var(--app-bg);
  position: relative;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--tab-bar-height);
  background-color: var(--app-bg);
}

/* 隐藏滚动条 */
.main-content::-webkit-scrollbar {
  display: none;
}

.bottom-tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--tab-bar-height);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background-color: var(--app-bg-white);
  border-top: 1px solid var(--app-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #646566;
  flex: 1;
  height: 100%;
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.tab-text {
  font-size: 12px;
}

/* 激活状态的样式 */
.tab-item.active {
  color: var(--app-primary);
}

.tab-item.active .tab-icon {
  color: var(--app-primary);
}

.theme-toggle { cursor: pointer; }

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
