<template>
  <div class="user-layout-container">
    <div class="main-content">
      <router-view />
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
    </div>
  </div>
</template>

<script setup>
import { House, Document, User } from '@element-plus/icons-vue'
</script>

<style scoped>
.user-layout-container {
  /* 模拟手机端视图的容器 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 480px; /* 限制最大宽度，在PC上居中显示类似手机的界面 */
  margin: 0 auto;
  background-color: #f7f8fa;
  position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px; /* 给底部 tab bar 留出空间 */
  background-color: #f7f8fa;
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
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #ebedf0;
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
  color: #1e3c72; /* 使用刚才您指定的深沉蓝色 */
}

.tab-item.active .tab-icon {
  color: #1e3c72;
}
</style>
