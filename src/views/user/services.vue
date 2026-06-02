<template>
  <div class="wechat-page">
    <div class="ai-float-btn" @click="openAiAssistant">
      <el-icon :size="24"><ChatDotRound /></el-icon>
    </div>

    <!-- ==================== 列表页 ==================== -->
    <div v-if="currentView === 'list'" class="list-page">
      <div class="wechat-header">
        <h2>服务项目</h2>
      </div>

      <div class="search-bar">
        <div class="search-input-wrap">
          <el-icon class="search-icon"><Search /></el-icon>
          <input v-model="searchKeyword" class="search-input" placeholder="搜索服务名称" @keyup.enter="handleSearch" />
          <el-icon v-if="searchKeyword" class="clear-icon" @click="handleClearSearch"><CircleClose /></el-icon>
        </div>
        <el-button class="search-btn" type="primary" size="small" round @click="handleSearch">搜索</el-button>
      </div>

      <!-- FOMO 动态公告条 -->
      <div class="fomo-banner" v-if="fomoBannerText">
        <span class="fomo-banner-icon">🔥</span>
        <span class="fomo-banner-text">{{ fomoBannerText }}</span>
      </div>

      <div class="category-tabs" v-if="categoryList.length">
        <div class="tabs-scroll">
          <div class="tabs-container" ref="tabsContainerRef">
            <div v-for="cat in categoryList" :key="cat.categoryCode" :ref="el => { if (el) tabRefs[cat.categoryCode] = el }" class="tab-item-cat" :class="{ active: selectedCategory === cat.categoryCode }" @click="handleCategoryChange(cat.categoryCode)">{{ cat.categoryName }}</div>
            <div class="tab-indicator" :style="indicatorStyle"></div>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="service-list">
        <el-empty v-if="!loading && !serviceList.length" description="暂无服务项目" />
        <div v-for="item in serviceList" :key="item.id" class="service-card" @click="openDetail(item)">
          <!-- 热销角标 -->
          <div class="hot-badge" v-if="isHotItem(item.id)">🔥 热销</div>
          <div class="card-cover">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.itemName || '服务项目'" class="cover-img" loading="lazy" @error="item.imageUrl = null" />
            <el-icon v-if="!item.imageUrl" :size="34" color="#91a3b0"><Picture /></el-icon>
          </div>
          <div class="card-main">
            <h3>{{ item.itemName }}</h3>
            <p>{{ item.introduction || '暂无服务介绍' }}</p>
            <div class="card-footer">
              <div class="card-footer-left">
                <span class="price">¥{{ Number(item.price || 0).toFixed(2) }}</span>
                <span class="sold-count" v-if="fomoStats[item.id]?.totalOrderCount">已售 {{ fomoStats[item.id].totalOrderCount }} 单</span>
              </div>
              <span class="go-detail">查看详情</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 详情页 ==================== -->
    <div v-else-if="currentView === 'detail' && currentItem" class="detail-page">
      <div class="detail-header">
        <el-button text class="back-btn" @click="backToList">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <h3>服务详情</h3>
      </div>

      <div class="detail-body">
        <!-- Hero 卡片 -->
        <div class="hero-card">
          <div class="hero-icon">
            <img v-if="currentItem.imageUrl" :src="currentItem.imageUrl" :alt="currentItem.itemName" class="hero-img" />
            <span v-else>{{ currentItem.itemName?.slice(0, 1) || '服' }}</span>
          </div>
          <div class="hero-info">
            <div class="hero-price">¥{{ Number(currentItem.price || 0).toFixed(2) }}</div>
            <div class="hero-name">{{ currentItem.itemName }}</div>
            <div class="hero-desc">{{ currentItem.introduction || '暂无服务介绍' }}</div>
            <!-- FOMO 热度标签 -->
            <div class="fomo-hero-tags" v-if="detailFomoStats">
              <span class="fomo-tag today" v-if="detailFomoStats.todayOrderCount > 0">
                🔥 今日已有 {{ detailFomoStats.todayOrderCount }} 人选择
              </span>
              <span class="fomo-tag total">累计服务 {{ detailFomoStats.totalOrderCount || 0 }} 次</span>
            </div>
          </div>
        </div>

        <!-- ===== 评价模块（新增） ===== -->
        <div class="review-module" v-if="reviews.length > 0 || aiSummary || aiSummaryLoading">
          <!-- AI 总结区 -->
          <div class="review-ai-summary" v-if="reviews.length > 0">
            <div class="ai-summary-header">
              <span class="ai-summary-icon">✨</span>
              <span>AI 好评总结</span>
              <span class="ai-summary-badge">AI</span>
            </div>
            <div class="ai-summary-content" :class="{ loading: aiSummaryLoading }">
              <span class="ai-summary-text">{{ aiSummary || '正在分析用户好评...' }}</span>
              <span class="ai-cursor" v-if="aiSummaryLoading">|</span>
            </div>
          </div>

          <!-- 评价轮播 -->
          <div class="review-carousel-wrap" v-if="reviews.length > 0">
            <div class="review-carousel-track" ref="carouselTrackRef">
              <div class="review-carousel-clone" v-for="(r, i) in reviews" :key="'c-'+i">
                <div class="review-card">
                  <div class="review-stars">{{ '★'.repeat(Math.round(r.score || 5)) }}{{ '☆'.repeat(5 - Math.round(r.score || 5)) }}</div>
                  <div class="review-comment">{{ r.comment }}</div>
                  <div class="review-author">{{ r.customerName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ===== 评价模块结束 ===== -->

        <div class="section-card" @click="addressDrawerVisible = true">
          <div class="section-head"><el-icon><Location /></el-icon><span>服务地址</span></div>
          <div v-if="selectedAddress" class="section-value">
            <div>{{ selectedAddress.contactName }} {{ selectedAddress.contactPhone }}</div>
            <div class="sub-text">{{ formatAddress(selectedAddress) }}</div>
          </div>
          <div v-else class="empty-tip">请选择服务地址</div>
        </div>

        <div class="section-card" @click="employeeDrawerVisible = true">
          <div class="section-head"><el-icon><User /></el-icon><span>服务人员</span></div>
          <div v-if="orderForm.employeeId" class="section-value">
            <div>{{ selectedEmployee?.realName || '已选择' }}</div>
            <div class="sub-text">评分 {{ selectedEmployee?.starRating || '-' }}</div>
          </div>
          <div v-else class="empty-tip">请选择服务人员（可选）</div>
        </div>

        <div class="section-card">
          <div class="form-title">预约信息</div>
          <div class="form-item"><span>购买数量</span><el-input-number v-model="orderForm.quantity" :min="1" :max="99" /></div>
          <div class="form-item picker-cell" @click="dateDrawerVisible = true">
            <span>服务日期</span>
            <div class="picker-cell-value" :class="{ empty: !orderForm.serviceDate }"><span>{{ orderForm.serviceDate || '请选择服务日期' }}</span><el-icon><ArrowRight /></el-icon></div>
          </div>
          <div class="form-item picker-cell" @click="visitDrawerVisible = true">
            <span>上门时间段</span>
            <div class="picker-cell-value" :class="{ empty: !orderForm.visitTimeRange }"><span>{{ orderForm.visitTimeRange || '请选择上门时间段' }}</span><el-icon><ArrowRight /></el-icon></div>
          </div>
          <div class="form-item column"><span>订单备注</span><el-input v-model="orderForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息（选填）" /></div>
        </div>
      </div>

      <!-- 支付栏 -->
      <div class="pay-bar">
        <div class="pay-price">
          合计 <span>¥{{ totalPrice }}</span>
        </div>
        <el-button type="success" class="pay-btn" :loading="submitting" @click="handleSubmitOrder">去支付</el-button>
      </div>
      <div class="pay-urgency" v-if="detailFomoStats?.todayOrderCount > 0">⚡ 火热预约中，尽快下单锁定名额</div>
    </div>

    <!-- Drawers（同原版） -->
    <el-drawer v-model="addressDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务地址</h4>
        <div v-if="addressList.length" class="picker-list">
          <div v-for="address in addressList" :key="address.id" class="picker-item" :class="{ active: selectedAddress?.id === address.id }" @click="selectAddress(address)">
            <div class="picker-main"><div class="picker-title">{{ address.contactName }} {{ address.contactPhone }}</div><div class="picker-desc">{{ formatAddress(address) }}</div></div>
            <el-icon v-if="selectedAddress?.id === address.id" color="var(--app-primary)"><Check /></el-icon>
          </div>
        </div>
        <el-empty v-else description="暂无地址，请先在地址管理中新增" />
      </div>
    </el-drawer>

    <el-drawer v-model="employeeDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务人员</h4>
        <div v-if="employeeList.length" class="picker-list">
          <div v-for="employee in employeeList" :key="employee.id" class="picker-item" :class="{ active: orderForm.employeeId === employee.id }" @click="selectEmployee(employee)">
            <div class="picker-main"><div class="picker-title">{{ employee.realName }}</div><div class="picker-desc">已服务 {{ employee.completedOrders || 0 }} 单 · 从业 {{ employee.workYears || 0 }} 年 · 评分 {{ employee.starRating || '-' }}</div></div>
            <el-icon v-if="orderForm.employeeId === employee.id" color="var(--app-primary)"><Check /></el-icon>
          </div>
        </div>
        <el-empty v-else description="暂无可选服务人员" />
      </div>
    </el-drawer>

    <el-drawer v-model="dateDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务日期</h4>
        <div v-if="slotsLoading" class="picker-list" style="text-align:center;padding:40px 0">加载中...</div>
        <div v-else class="picker-list">
          <div v-for="date in dateOptions" :key="date.value" class="picker-item" :class="{ active: orderForm.serviceDate === date.value, 'picker-item-disabled': date.disabled }" @click="!date.disabled && selectServiceDate(date.value)">
            <div class="picker-main"><div class="picker-title">{{ date.label }}</div><div v-if="date.disabled" class="picker-desc">暂无可选时段</div></div>
            <el-icon v-if="orderForm.serviceDate === date.value" color="var(--app-primary)"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="visitDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择上门时间段</h4>
        <div class="picker-list">
          <div v-for="option in visitTimeRangeOptions" :key="option.value" class="picker-item" :class="{ active: orderForm.visitTimeRange === option.value }" @click="selectVisitTimeRange(option.value)">
            <div class="picker-main"><div class="picker-title">{{ option.label }}</div></div>
            <el-icon v-if="orderForm.visitTimeRange === option.value" color="var(--app-primary)"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="payMethodVisible" title="选择支付方式" width="85%" class="pay-method-dialog">
      <div class="pay-method-list">
        <div class="pay-method-item" @click="handleServiceAlipay"><el-icon :size="24" color="#1677FF"><Service /></el-icon><span>支付宝支付</span><el-icon :size="16" color="#c0c4cc"><ArrowRight /></el-icon></div>
        <div class="pay-method-item demo-item" @click="handleServiceMockPay"><el-icon :size="24" color="#52c41a"><CircleCheck /></el-icon><div class="demo-label"><span>虚拟支付</span><span class="demo-tag">Demo</span></div><el-icon :size="16" color="#c0c4cc"><ArrowRight /></el-icon></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Location, Picture, Search, CircleClose, User, Service, CircleCheck, ChatDotRound } from '@element-plus/icons-vue'
import { getCategoryList } from '@/api/category'
import { getItemList, getItemRatings, getItemFomoStats } from '@/api/item'
import { getUserInfo } from '@/api/user'
import { getCustomerAddressList } from '@/api/customer'
import { getEmployeeList } from '@/api/employee'
import { addOrder, getAvailableSlots } from '@/api/order'
import { alipayPay, mockPay } from '@/api/pay'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const categoryList = ref([])
const selectedCategory = ref('')
const tabsContainerRef = ref(null)
const tabRefs = reactive({})
const indicatorStyle = reactive({ left: '0px', width: '0px' })
const searchKeyword = ref('')
const submitting = ref(false)
const serviceList = ref([])
const currentItem = ref(null)
const currentView = ref('list')
const currentUser = ref(null)

const addressList = ref([])
const selectedAddress = ref(null)
const addressDrawerVisible = ref(false)

const employeeList = ref([])
const employeeDrawerVisible = ref(false)
const dateDrawerVisible = ref(false)
const visitDrawerVisible = ref(false)

const orderForm = reactive({ quantity: 1, remark: '', serviceDate: '', visitTimeRange: '', employeeId: null })
const availableSlotsData = ref(null)
const slotsLoading = ref(false)
const payMethodVisible = ref(false)
let pendingPayOrderId = null

// ========== FOMO 数据 ==========
const fomoStats = ref({})
const detailFomoStats = ref(null)
const fomoBannerText = computed(() => {
  const totalToday = Object.values(fomoStats.value).reduce((sum, s) => sum + (s.todayOrderCount || 0), 0)
  if (totalToday > 0) return `今日已有 ${totalToday} 位用户下单，热门服务预约中！`
  return ''
})

const HOT_THRESHOLD = 10
const isHotItem = (itemId) => {
  const stat = fomoStats.value[itemId]
  return stat && stat.totalOrderCount >= HOT_THRESHOLD
}

// ========== 评价数据 ==========
const reviews = ref([])
const aiSummary = ref('')
const aiSummaryLoading = ref(false)
const carouselTrackRef = ref(null)
let carouselAnimId = null

const visitTimeRangeOptions = computed(() => {
  if (!availableSlotsData.value?.availableDates || !orderForm.serviceDate) return []
  const dateEntry = availableSlotsData.value.availableDates.find(d => d.date === orderForm.serviceDate)
  if (!dateEntry || !dateEntry.timeSlots) return []
  return dateEntry.timeSlots.map(slot => ({ label: `${slot.start}-${slot.end}`, value: `${slot.start}-${slot.end}` }))
})

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dateOptions = computed(() => {
  if (!availableSlotsData.value?.availableDates) return []
  return availableSlotsData.value.availableDates.map(item => {
    const date = new Date(item.date)
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const isToday = date.getTime() === today.getTime()
    const label = isToday ? `${month}月${day}日 今天 ${weekNames[date.getDay()]}` : `${month}月${day}日 ${weekNames[date.getDay()]}`
    return { label, value: item.date, disabled: !item.hasSlots }
  })
})

const selectedEmployee = computed(() => {
  if (!orderForm.employeeId) return null
  return employeeList.value.find(e => e.id === orderForm.employeeId)
})

const totalPrice = computed(() => {
  if (!currentItem.value?.price) return '0.00'
  return (Number(currentItem.value.price) * orderForm.quantity).toFixed(2)
})

const totalAmount = computed(() => {
  if (!currentItem.value?.price) return 0
  return Number(currentItem.value.price) * orderForm.quantity
})

const formatAddress = (addr) => {
  if (!addr) return ''
  const parts = []
  if (addr.provinceName) parts.push(addr.provinceName)
  if (addr.cityName) parts.push(addr.cityName)
  if (addr.districtName) parts.push(addr.districtName)
  if (addr.detail) parts.push(addr.detail)
  return parts.join(' ')
}

const resetOrderForm = () => {
  orderForm.quantity = 1
  orderForm.remark = ''
  orderForm.serviceDate = ''
  orderForm.visitTimeRange = ''
  orderForm.employeeId = null
  availableSlotsData.value = null
}

const loadCategoryList = async () => {
  try {
    const res = await getCategoryList({ pageNo: 1, pageSize: 100, categoryName: '' })
    if (res.success) categoryList.value = res.data?.records || []
  } catch (e) { console.error(e) }
}

const loadServiceList = async () => {
  loading.value = true
  try {
    const query = { pageNo: 1, pageSize: 200 }
    if (selectedCategory.value) query.categoryCodes = [selectedCategory.value]
    if (searchKeyword.value.trim()) query.itemName = searchKeyword.value.trim()
    const res = await getItemList(query)
    if (res.success) {
      serviceList.value = res.data?.records || []
      // 加载 FOMO 数据
      if (serviceList.value.length) loadFomoStats()
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const loadFomoStats = async () => {
  try {
    const ids = serviceList.value.map(i => i.id).filter(Boolean)
    if (!ids.length) return
    const res = await getItemFomoStats({ serviceItemIds: ids })
    if (res.success) {
      fomoStats.value = res.data || {}
    }
  } catch (e) { console.error(e) }
}

const loadDetailFomoStats = async (itemId) => {
  try {
    const res = await getItemFomoStats({ serviceItemIds: [itemId] })
    if (res.success && res.data) {
      detailFomoStats.value = res.data[itemId] || null
    }
  } catch (e) { console.error(e) }
}

const loadReviews = async (itemId) => {
  try {
    const res = await getItemRatings({ serviceItemId: itemId, pageNo: 1, pageSize: 30 })
    if (res.success) {
      reviews.value = res.data?.records || []
    }
  } catch (e) { console.error(e) }
}

const loadAiSummary = async (itemId) => {
  aiSummary.value = ''
  aiSummaryLoading.value = true
  try {
    const token = localStorage.getItem('user_token')
    const baseUrl = import.meta.env.DEV ? '/api' : 'https://admint.pamrock.top/api'
    const resp = await fetch(`${baseUrl}/item/ratings/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ serviceItemId: itemId })
    })
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.substring(5).trim()
          if (!data) continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.event === 'done') continue
            aiSummary.value += parsed.data || ''
          } catch {
            aiSummary.value += data
          }
        }
      }
    }
  } catch (e) {
    console.error('AI总结加载失败', e)
    aiSummary.value = reviews.value.length ? '暂无AI总结' : ''
  } finally {
    aiSummaryLoading.value = false
  }
}

const startCarousel = () => {
  if (!carouselTrackRef.value || reviews.value.length === 0) return
  const track = carouselTrackRef.value
  let pos = 0
  const step = 0.5
  const animate = () => {
    pos += step
    if (pos >= track.scrollWidth / 2) pos = 0
    track.style.transform = `translateX(${-pos}px)`
    carouselAnimId = requestAnimationFrame(animate)
  }
  animate()
}

const stopCarousel = () => {
  if (carouselAnimId) { cancelAnimationFrame(carouselAnimId); carouselAnimId = null }
}

const updateIndicator = () => {
  nextTick(() => {
    if (!selectedCategory.value || !tabsContainerRef.value) {
      indicatorStyle.left = '0px'; indicatorStyle.width = '0px'; return
    }
    const activeEl = tabRefs[selectedCategory.value]
    if (!activeEl) { indicatorStyle.left = '0px'; indicatorStyle.width = '0px'; return }
    const containerRect = tabsContainerRef.value.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    indicatorStyle.left = (activeRect.left - containerRect.left) + 'px'
    indicatorStyle.width = activeRect.width + 'px'
  })
}

const handleCategoryChange = (code) => {
  if (selectedCategory.value === code) { selectedCategory.value = '' }
  else { selectedCategory.value = code; searchKeyword.value = '' }
  updateIndicator()
  nextTick(() => {
    const activeEl = tabRefs[selectedCategory.value]
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
  loadServiceList()
}

const handleSearch = () => { if (searchKeyword.value.trim()) selectedCategory.value = ''; loadServiceList() }
const handleClearSearch = () => { searchKeyword.value = ''; loadServiceList() }

const ensureCurrentUser = async () => {
  if (currentUser.value?.customerId) return currentUser.value
  try {
    const res = await getUserInfo(2)
    if (res.success) { currentUser.value = res.data; return currentUser.value }
    ElMessage.error(res.msg || '获取用户信息失败'); return null
  } catch (error) { ElMessage.error('获取用户信息失败'); return null }
}

const loadAddressList = async () => {
  const user = await ensureCurrentUser()
  if (!user?.customerId) return
  try {
    const res = await getCustomerAddressList({ customerId: user.customerId, pageNo: 1, pageSize: 100 })
    if (res.success) { addressList.value = res.data?.records || []; const d = addressList.value.find(i => i.isDefault === 1); selectedAddress.value = d || addressList.value[0] || null }
    else ElMessage.error(res.msg || '加载地址失败')
  } catch (error) { ElMessage.error('加载地址失败') }
}

const loadEmployeeList = async () => {
  try {
    const res = await getEmployeeList({ pageNo: 1, pageSize: 1000, status: 'ACTIVE' })
    if (res.code === 200 || res.success) employeeList.value = res.data?.records || []
  } catch (error) { ElMessage.error('加载服务人员失败') }
}

const loadAvailableSlots = async () => {
  if (!currentItem.value?.id) return
  slotsLoading.value = true
  try {
    const res = await getAvailableSlots({ serviceItemId: currentItem.value.id })
    if (res.code === 200) availableSlotsData.value = res.data
  } catch (error) { ElMessage.error('加载可用时段失败') }
  finally { slotsLoading.value = false }
}

const openDetail = async (item) => {
  currentItem.value = item
  currentView.value = 'detail'
  resetOrderForm()
  reviews.value = []
  aiSummary.value = ''
  detailFomoStats.value = null
  stopCarousel()
  await Promise.all([loadAddressList(), loadEmployeeList(), loadAvailableSlots()])

  // 加载评价和FOMO
  if (item.id) {
    loadDetailFomoStats(item.id)
    loadReviews(item.id).then(() => {
      if (reviews.value.length > 0) {
        loadAiSummary(item.id)
        nextTick(() => startCarousel())
      }
    })
  }
}

const backToList = () => {
  stopCarousel()
  currentView.value = 'list'
  currentItem.value = null
}

const selectAddress = (address) => { selectedAddress.value = address; addressDrawerVisible.value = false }
const selectEmployee = (employee) => { orderForm.employeeId = employee.id; employeeDrawerVisible.value = false }
const selectServiceDate = (date) => { orderForm.serviceDate = date; orderForm.visitTimeRange = ''; dateDrawerVisible.value = false }
const selectVisitTimeRange = (value) => { orderForm.visitTimeRange = value; visitDrawerVisible.value = false }

const submitPayForm = (payForm) => {
  const wrapperId = 'alipay-pay-form-wrapper'
  const oldWrapper = document.getElementById(wrapperId)
  if (oldWrapper) oldWrapper.remove()
  const div = document.createElement('div'); div.id = wrapperId; div.style.display = 'none'; div.innerHTML = payForm
  document.body.appendChild(div)
  const form = div.getElementsByTagName('form')[0]
  if (form) form.submit()
}

const handleSubmitOrder = async () => {
  const user = await ensureCurrentUser()
  if (!user?.customerId) return
  if (!currentItem.value?.id) return
  if (!selectedAddress.value) { ElMessage.warning('请选择服务地址'); addressDrawerVisible.value = true; return }
  if (!orderForm.serviceDate) { ElMessage.warning('请选择服务日期'); return }
  if (!orderForm.visitTimeRange) { ElMessage.warning('请选择上门时间段'); return }
  submitting.value = true
  try {
    const res = await addOrder({
      customerId: user.customerId, employeeId: orderForm.employeeId, serviceItemId: currentItem.value.id,
      serviceDate: orderForm.serviceDate, serviceAddress: formatAddress(selectedAddress.value),
      contactName: selectedAddress.value?.contactName, contactPhone: selectedAddress.value?.contactPhone,
      visitTimeRange: orderForm.visitTimeRange, amount: orderForm.quantity, price: currentItem.value.price, remark: orderForm.remark
    })
    if (!res.success) { ElMessage.error(res.msg || '下单失败'); return }
    const orderId = res.data
    if (!orderId) { ElMessage.success('下单成功，请在订单中心继续支付'); return }
    ElMessage.success('下单成功')
    pendingPayOrderId = orderId
    payMethodVisible.value = true
  } catch (error) { ElMessage.error('下单或支付失败，请稍后重试') }
  finally { submitting.value = false }
}

const handleServiceAlipay = async () => {
  const orderId = pendingPayOrderId; if (!orderId) return; payMethodVisible.value = false
  try {
    const payRes = await alipayPay({ orderId }); const payForm = typeof payRes === 'string' ? payRes : payRes?.data
    if (!payForm) { ElMessage.warning('支付跳转失败，请在订单中心继续支付'); return }
    ElMessage.success('正在跳转支付'); submitPayForm(payForm)
  } catch (error) { ElMessage.warning('支付跳转失败，请在订单中心继续支付') }
}

const handleServiceMockPay = async () => {
  const orderId = pendingPayOrderId; if (!orderId) return; payMethodVisible.value = false
  try {
    const res = await mockPay({ orderId })
    if (res?.success) { ElMessage.success('支付成功，请等待派单'); backToList() }
    else ElMessage.warning(res?.msg || '支付失败，请稍后重试')
  } catch (error) { ElMessage.warning('支付失败，请稍后重试') }
}

const openAiAssistant = () => { router.push('/user/assistant') }

onMounted(() => { loadCategoryList(); loadServiceList(); ensureCurrentUser(); nextTick(() => updateIndicator()) })
onUnmounted(() => { stopCarousel() })
</script>

<style scoped>
.wechat-page { background: var(--app-bg); min-height: calc(100dvh - var(--tab-bar-height)); }
.wechat-header { position: sticky; top: 0; z-index: 10; background: var(--app-bg-white); padding: 14px 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
.wechat-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
.service-list { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.service-card { position: relative; display: flex; gap: 12px; border-radius: var(--radius-md); background: var(--app-bg-white); padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.15s; }
.service-card:active { transform: scale(0.98); }
.card-cover { width: 78px; height: 78px; border-radius: 10px; background: linear-gradient(145deg, #eef4ff, #e8f9ff); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
.card-main { flex: 1; min-width: 0; }
.card-main h3 { margin: 2px 0 4px; font-size: 16px; color: var(--app-text-primary); }
.card-main p { margin: 0; color: var(--app-text-muted); font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
.card-footer-left { display: flex; align-items: baseline; gap: 8px; }
.price { color: #fa541c; font-weight: 700; font-size: 18px; }
.sold-count { font-size: 11px; color: #ff8c42; background: #fff3e0; padding: 2px 6px; border-radius: 4px; }
.go-detail { color: var(--app-primary); font-size: 13px; }

/* 热销角标 */
.hot-badge { position: absolute; top: -4px; left: -4px; background: linear-gradient(135deg, #ff6b35, #f7931e); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px 3px 6px; border-radius: 4px 10px 10px 4px; z-index: 2; box-shadow: 0 2px 8px rgba(255,107,53,0.35); animation: hotPulse 2s ease-in-out infinite; }
@keyframes hotPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

/* FOMO 公告条 */
.fomo-banner { margin: 0 12px 4px; padding: 8px 14px; background: linear-gradient(90deg, #fff3e0, #ffe0b2, #fff3e0); background-size: 200% 100%; animation: fomoShine 3s linear infinite; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #e65100; font-weight: 500; }
@keyframes fomoShine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.fomo-banner-icon { font-size: 14px; }
.fomo-banner-text { overflow: hidden; white-space: nowrap; }

.detail-page { min-height: calc(100dvh - var(--tab-bar-height)); display: flex; flex-direction: column; }
.detail-header { position: sticky; top: 0; z-index: 12; background: var(--app-bg-white); padding: 10px 12px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--app-border-light); }
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.back-btn { position: absolute; left: 6px; color: var(--app-text-primary); }
.detail-body { padding: 12px 12px 170px; display: flex; flex-direction: column; gap: 10px; }

.hero-card { background: var(--app-bg-white); border-radius: var(--radius-lg); padding: 14px; display: flex; gap: 12px; }
.hero-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--app-primary-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; overflow: hidden; flex-shrink: 0; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.hero-price { font-size: 20px; color: #fa541c; font-weight: 700; }
.hero-name { margin-top: 4px; font-size: 16px; color: var(--app-text-primary); font-weight: 600; }
.hero-desc { margin-top: 6px; font-size: 13px; color: var(--app-text-muted); line-height: 1.5; }
.fomo-hero-tags { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.fomo-tag { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 12px; }
.fomo-tag.today { background: #fff3e0; color: #e65100; }
.fomo-tag.total { background: #e8f5e9; color: #2e7d32; }

/* ===== 评价模块 ===== */
.review-module { display: flex; flex-direction: column; gap: 10px; }

.review-ai-summary { background: linear-gradient(135deg, #f8f9ff, #f0f4ff); border-radius: var(--radius-md); padding: 12px 14px; border: 1px solid #e8ecff; position: relative; overflow: hidden; }
.review-ai-summary::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, transparent, rgba(99,132,255,0.06), transparent, rgba(99,132,255,0.06), transparent); animation: aiGlow 6s linear infinite; }
@keyframes aiGlow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.ai-summary-header { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #4a5fb5; position: relative; z-index: 1; margin-bottom: 8px; }
.ai-summary-icon { font-size: 16px; }
.ai-summary-badge { font-size: 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 1px 6px; border-radius: 6px; margin-left: auto; }
.ai-summary-content { position: relative; z-index: 1; font-size: 13px; color: #444; line-height: 1.7; min-height: 20px; }
.ai-summary-content.loading { color: #999; }
.ai-cursor { display: inline-block; color: #667eea; font-weight: 700; animation: blink 1s step-end infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.review-carousel-wrap { overflow: hidden; border-radius: var(--radius-md); background: var(--app-bg-white); padding: 8px 0; }
.review-carousel-track { display: flex; gap: 10px; padding: 0 12px; will-change: transform; }
.review-carousel-clone { flex-shrink: 0; }
.review-card { width: 200px; background: #fafbfc; border-radius: 10px; padding: 10px 12px; border: 1px solid #eee; display: flex; flex-direction: column; gap: 6px; }
.review-stars { color: #f5a623; font-size: 13px; letter-spacing: 1px; }
.review-comment { font-size: 12px; color: #555; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.review-author { font-size: 11px; color: #999; align-self: flex-end; }

.section-card { background: var(--app-bg-white); border-radius: var(--radius-lg); padding: 12px; }
.section-head { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--app-text-primary); }
.section-value { margin-top: 8px; font-size: 13px; color: var(--app-text-primary); line-height: 1.4; }
.sub-text { margin-top: 4px; color: var(--app-text-muted); }
.empty-tip { margin-top: 8px; color: var(--app-text-placeholder); font-size: 13px; }
.form-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.form-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--app-border-light); }
.form-item.column { flex-direction: column; align-items: flex-start; gap: 8px; }
.picker-cell { cursor: pointer; }
.picker-cell-value { display: flex; align-items: center; gap: 6px; color: var(--app-text-primary); font-size: 14px; }
.picker-cell-value.empty { color: var(--app-text-placeholder); }
.form-item:last-child { border-bottom: none; }

.pay-bar { position: fixed; bottom: calc(60px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); width: calc(100vw - 24px); max-width: 456px; z-index: 20; background: var(--app-bg-white); box-shadow: 0 4px 18px rgba(0,0,0,0.08); border-radius: var(--radius-lg); border: 1px solid var(--app-border); padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; }
.pay-price { color: var(--app-text-primary); font-size: 14px; }
.pay-price span { color: #fa541c; font-size: 22px; font-weight: 700; margin-left: 4px; }
.pay-btn { height: 40px; min-width: 130px; border-radius: 22px; background: var(--app-primary); border-color: var(--app-primary); }
.pay-urgency { text-align: center; font-size: 12px; color: #e65100; padding: 0 12px 70px; animation: urgencyPulse 2s ease-in-out infinite; }
@keyframes urgencyPulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

.drawer-panel { padding: 14px; }
.drawer-panel h4 { margin: 0 0 10px; text-align: center; font-size: 15px; }
.picker-list { display: flex; flex-direction: column; gap: 8px; }
.picker-item { border: 1px solid var(--app-border); border-radius: 10px; padding: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.picker-item.active { border-color: #95de64; background: #f6ffed; }
.picker-item-disabled { opacity: 0.45; cursor: not-allowed; background: #fafafa; }
.picker-main { flex: 1; }
.picker-title { font-size: 14px; color: var(--app-text-primary); }
.picker-desc { margin-top: 4px; font-size: 12px; color: var(--app-text-muted); line-height: 1.45; }

:deep(.picker-drawer.el-drawer.btt) { width: min(calc(100vw - 24px), 456px) !important; left: 0 !important; right: 0 !important; margin: 0 auto !important; border-top-left-radius: 16px; border-top-right-radius: 16px; will-change: transform; }

.search-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--app-bg-white); margin-bottom: 4px; }
.search-input-wrap { flex: 1; display: flex; align-items: center; background: var(--app-bg-input); border-radius: 20px; padding: 6px 14px; }
.search-icon { color: #999; font-size: 16px; margin-right: 6px; flex-shrink: 0; }
.search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 14px; color: var(--app-text-primary); line-height: 24px; }
.search-input::placeholder { color: #bbb; }
.clear-icon { color: #ccc; font-size: 16px; cursor: pointer; flex-shrink: 0; }
.search-btn { flex-shrink: 0; height: 32px; padding: 0 16px; font-size: 13px; }

.category-tabs { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.06); }
[data-theme="dark"] .category-tabs { background: rgba(15,15,20,0.85); border-bottom: 1px solid rgba(255,255,255,0.06); }
.tabs-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tabs-scroll::-webkit-scrollbar { display: none; }
.tabs-container { display: inline-flex; gap: 24px; padding: 12px 16px; position: relative; }
.tab-item-cat { display: inline-block; padding: 8px 0; font-size: 14px; color: var(--app-text-muted); cursor: pointer; transition: color 0.2s; white-space: nowrap; }
.tab-item-cat.active { color: var(--app-primary); font-weight: 600; }
.tab-indicator { position: absolute; bottom: 12px; height: 3px; border-radius: 1.5px; background: var(--app-primary); transition: left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1); }

[data-theme="dark"] .card-cover { background: linear-gradient(145deg, #1a2a3a, #1a2838); }
[data-theme="dark"] .price { color: #ff7043; }
[data-theme="dark"] .review-card { background: #1e1e28; border-color: #333; }
[data-theme="dark"] .review-comment { color: #ccc; }
[data-theme="dark"] .review-ai-summary { background: linear-gradient(135deg, #1a1a2e, #1e1e32); border-color: #2a2a3e; }
[data-theme="dark"] .ai-summary-content { color: #ccc; }

.pay-method-list { display: flex; flex-direction: column; gap: 12px; }
.pay-method-item { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 10px; border: 1px solid var(--app-border); cursor: pointer; transition: background 0.2s; }
.pay-method-item:active { background: var(--app-bg-input); }
.pay-method-item span { flex: 1; font-size: 15px; color: var(--app-text-primary); }
.demo-label { flex: 1; display: flex; align-items: center; gap: 8px; }
.demo-tag { font-size: 11px !important; color: var(--app-success) !important; background: rgba(82,196,26,0.1); padding: 2px 6px; border-radius: 4px; }
.ai-float-btn { position: fixed; right: 16px; bottom: calc(60px + 20px + env(safe-area-inset-bottom)); width: 50px; height: 50px; border-radius: 50%; background: var(--app-primary); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; z-index: 30; transition: transform 0.15s; }
.ai-float-btn:active { transform: scale(0.9); }
:deep(.pay-method-dialog .el-dialog) { max-width: 380px; border-radius: var(--radius-md); }
</style>
