<template>
  <div class="wechat-page">
    <div v-if="currentView === 'list'" class="list-page">
      <div class="wechat-header">
        <h2>服务项目</h2>
      </div>

      <div v-loading="loading" class="service-list">
        <el-empty v-if="!loading && !serviceList.length" description="暂无服务项目" />
        <div v-for="item in serviceList" :key="item.id" class="service-card" @click="openDetail(item)">
          <div class="card-cover">
            <el-icon :size="34" color="#91a3b0"><Picture /></el-icon>
          </div>
          <div class="card-main">
            <h3>{{ item.itemName }}</h3>
            <p>{{ item.introduction || '暂无服务介绍' }}</p>
            <div class="card-footer">
              <span class="price">¥{{ Number(item.price || 0).toFixed(2) }}</span>
              <span class="go-detail">查看详情</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentView === 'detail' && currentItem" class="detail-page">
      <div class="detail-header">
        <el-button text class="back-btn" @click="backToList">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h3>服务详情</h3>
      </div>

      <div class="detail-body">
        <div class="hero-card">
          <div class="hero-icon">{{ currentItem.itemName?.slice(0, 1) || '服' }}</div>
          <div class="hero-info">
            <div class="hero-price">¥{{ Number(currentItem.price || 0).toFixed(2) }}</div>
            <div class="hero-name">{{ currentItem.itemName }}</div>
            <div class="hero-desc">{{ currentItem.introduction || '暂无服务介绍' }}</div>
          </div>
        </div>

        <div class="section-card" @click="addressDrawerVisible = true">
          <div class="section-head">
            <el-icon><Location /></el-icon>
            <span>服务地址</span>
          </div>
          <div v-if="selectedAddress" class="section-value">
            <div>{{ selectedAddress.contactName }} {{ selectedAddress.contactPhone }}</div>
            <div class="sub-text">{{ formatAddress(selectedAddress) }}</div>
          </div>
          <div v-else class="empty-tip">请选择服务地址</div>
        </div>

        <div class="section-card" @click="employeeDrawerVisible = true">
          <div class="section-head">
            <el-icon><User /></el-icon>
            <span>服务人员</span>
          </div>
          <div v-if="selectedEmployee" class="section-value">
            <div>{{ selectedEmployee.realName }}</div>
            <div class="sub-text">评分 {{ selectedEmployee.starRating || '-' }}</div>
          </div>
          <div v-else class="empty-tip">请选择服务人员（可选）</div>
        </div>

        <div class="section-card">
          <div class="form-title">预约信息</div>
          <div class="form-item">
            <span>购买数量</span>
            <el-input-number v-model="orderForm.quantity" :min="1" :max="99" />
          </div>
          <div class="form-item picker-cell" @click="dateDrawerVisible = true">
            <span>服务日期</span>
            <div class="picker-cell-value" :class="{ empty: !orderForm.serviceDate }">
              <span>{{ orderForm.serviceDate || '请选择服务日期' }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="form-item picker-cell" @click="visitDrawerVisible = true">
            <span>上门时间段</span>
            <div class="picker-cell-value" :class="{ empty: !orderForm.visitTimeRange }">
              <span>{{ orderForm.visitTimeRange || '请选择上门时间段' }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="form-item picker-cell" @click="serviceTimeDrawerVisible = true">
            <span>服务时段</span>
            <div class="picker-cell-value" :class="{ empty: !orderForm.serviceTimeRange }">
              <span>{{ orderForm.serviceTimeRange || '请选择服务时段' }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="form-item column">
            <span>订单备注</span>
            <el-input v-model="orderForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息（选填）" />
          </div>
        </div>
      </div>

      <div class="pay-bar">
        <div class="pay-price">
          合计 <span>¥{{ totalPrice }}</span>
        </div>
        <el-button type="success" class="pay-btn" :loading="submitting" @click="handleSubmitOrder">
          去支付
        </el-button>
      </div>
    </div>

    <el-drawer v-model="addressDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务地址</h4>
        <div v-if="addressList.length" class="picker-list">
          <div
            v-for="address in addressList"
            :key="address.id"
            class="picker-item"
            :class="{ active: selectedAddress?.id === address.id }"
            @click="selectAddress(address)"
          >
            <div class="picker-main">
              <div class="picker-title">{{ address.contactName }} {{ address.contactPhone }}</div>
              <div class="picker-desc">{{ formatAddress(address) }}</div>
            </div>
            <el-icon v-if="selectedAddress?.id === address.id" color="#07c160"><Check /></el-icon>
          </div>
        </div>
        <el-empty v-else description="暂无地址，请先在地址管理中新增" />
      </div>
    </el-drawer>

    <el-drawer v-model="employeeDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务人员</h4>
        <div v-if="employeeList.length" class="picker-list">
          <div
            v-for="employee in employeeList"
            :key="employee.id"
            class="picker-item"
            :class="{ active: orderForm.employeeId === employee.id }"
            @click="selectEmployee(employee)"
          >
            <div class="picker-main">
              <div class="picker-title">{{ employee.realName }}</div>
              <div class="picker-desc">手机号 {{ employee.phone || '-' }} · 评分 {{ employee.starRating || '-' }}</div>
            </div>
            <el-icon v-if="orderForm.employeeId === employee.id" color="#07c160"><Check /></el-icon>
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
          <div
            v-for="date in dateOptions"
            :key="date.value"
            class="picker-item"
            :class="{ active: orderForm.serviceDate === date.value, 'picker-item-disabled': date.disabled }"
            @click="!date.disabled && selectServiceDate(date.value)"
          >
            <div class="picker-main">
              <div class="picker-title">{{ date.label }}</div>
              <div v-if="date.disabled" class="picker-desc">暂无可选时段</div>
            </div>
            <el-icon v-if="orderForm.serviceDate === date.value" color="#07c160"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="visitDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择上门时间段</h4>
        <div class="picker-list">
          <div
            v-for="option in visitTimeRangeOptions"
            :key="option.value"
            class="picker-item"
            :class="{ active: orderForm.visitTimeRange === option.value }"
            @click="selectVisitTimeRange(option.value)"
          >
            <div class="picker-main">
              <div class="picker-title">{{ option.label }}</div>
            </div>
            <el-icon v-if="orderForm.visitTimeRange === option.value" color="#07c160"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="serviceTimeDrawerVisible" direction="btt" size="55%" :with-header="false" class="picker-drawer">
      <div class="drawer-panel">
        <h4>选择服务时段</h4>
        <div class="picker-list">
          <div
            v-for="option in serviceTimeRangeOptions"
            :key="option.value"
            class="picker-item"
            :class="{ active: orderForm.serviceTimeRange === option.value }"
            @click="selectServiceTimeRange(option.value)"
          >
            <div class="picker-main">
              <div class="picker-title">{{ option.label }}</div>
            </div>
            <el-icon v-if="orderForm.serviceTimeRange === option.value" color="#07c160"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Location, Picture, User } from '@element-plus/icons-vue'
import { regionData } from 'element-china-area-data'
import { getItemList } from '@/api/item'
import { getUserInfo } from '@/api/user'
import { getCustomerAddressList } from '@/api/customer'
import { getEmployeeList } from '@/api/employee'
import { addOrder, getAvailableSlots } from '@/api/order'
import { alipayPay } from '@/api/pay'

const loading = ref(false)
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
const serviceTimeDrawerVisible = ref(false)

const orderForm = reactive({
  quantity: 1,
  remark: '',
  serviceDate: '',
  visitTimeRange: '',
  serviceTimeRange: '',
  employeeId: null
})

const availableSlotsData = ref(null)
const slotsLoading = ref(false)

const visitTimeRangeOptions = computed(() => {
  if (!availableSlotsData.value?.availableDates || !orderForm.serviceDate) return []
  const dateEntry = availableSlotsData.value.availableDates.find(d => d.date === orderForm.serviceDate)
  if (!dateEntry || !dateEntry.timeSlots) return []
  return dateEntry.timeSlots.map(slot => ({
    label: `${slot.start}-${slot.end}`,
    value: `${slot.start}-${slot.end}`
  }))
})

const serviceTimeRangeOptions = [
  { label: '1小时', value: '1小时' },
  { label: '2小时', value: '2小时' },
  { label: '3小时', value: '3小时' },
  { label: '4小时', value: '4小时' },
  { label: '半天', value: '半天' },
  { label: '全天', value: '全天' }
]

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dateOptions = computed(() => {
  if (!availableSlotsData.value?.availableDates) return []
  return availableSlotsData.value.availableDates.map(item => {
    const date = new Date(item.date)
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24))
    const prefix = item.isToday ? '今天'
      : diffDays === 1 ? '明天'
      : `${item.weekDay}`
    const hasSlots = item.timeSlots && item.timeSlots.length > 0
    return {
      value: item.date,
      label: `${prefix} ${month}-${day}`,
      disabled: !hasSlots
    }
  })
})

const totalPrice = computed(() => {
  const price = Number(currentItem.value?.price || 0)
  return (price * orderForm.quantity).toFixed(2)
})

const selectedEmployee = computed(() => {
  return employeeList.value.find(item => item.id === orderForm.employeeId) || null
})

const findRegionLabel = (list, code) => {
  return list.find(item => String(item.value) === String(code))
}

const formatAddress = (address) => {
  if (!address) return ''
  const province = findRegionLabel(regionData, address.province)
  const city = province?.children ? findRegionLabel(province.children, address.city) : null
  const district = city?.children ? findRegionLabel(city.children, address.district) : null
  const regionText = [province?.label, city?.label, district?.label].filter(Boolean).join(' ')
  return `${regionText} ${address.detailAddress || ''}`.trim()
}

const resetOrderForm = () => {
  orderForm.quantity = 1
  orderForm.remark = ''
  orderForm.serviceDate = ''
  orderForm.visitTimeRange = ''
  orderForm.serviceTimeRange = ''
  orderForm.employeeId = null
  availableSlotsData.value = null
}

const loadServiceList = async () => {
  loading.value = true
  try {
    const res = await getItemList({
      pageNo: 1,
      pageSize: 100,
      status: 0
    })
    if (res.success) {
      serviceList.value = res.data?.records || []
    } else {
      ElMessage.error(res.msg || '加载服务项目失败')
    }
  } catch (error) {
    ElMessage.error('加载服务项目失败')
  } finally {
    loading.value = false
  }
}

const ensureCurrentUser = async () => {
  if (currentUser.value?.customerId) return currentUser.value
  try {
    const res = await getUserInfo(2)
    if (res.success) {
      currentUser.value = res.data
      return currentUser.value
    }
    ElMessage.error(res.msg || '获取用户信息失败')
    return null
  } catch (error) {
    ElMessage.error('获取用户信息失败')
    return null
  }
}

const loadAddressList = async () => {
  const user = await ensureCurrentUser()
  if (!user?.customerId) return
  try {
    const res = await getCustomerAddressList({
      customerId: user.customerId,
      pageNo: 1,
      pageSize: 100
    })
    if (res.success) {
      addressList.value = res.data?.records || []
      const defaultAddress = addressList.value.find(item => item.isDefault === 1)
      selectedAddress.value = defaultAddress || addressList.value[0] || null
    } else {
      ElMessage.error(res.msg || '加载地址失败')
    }
  } catch (error) {
    ElMessage.error('加载地址失败')
  }
}

const loadEmployeeList = async () => {
  try {
    const res = await getEmployeeList({ pageNo: 1, pageSize: 1000, status: 'ACTIVE' })
    if (res.code === 200 || res.success) {
      employeeList.value = res.data?.records || []
    }
  } catch (error) {
    ElMessage.error('加载服务人员失败')
  }
}

const loadAvailableSlots = async () => {
  if (!currentItem.value?.id) return
  slotsLoading.value = true
  try {
    const res = await getAvailableSlots({ serviceItemId: currentItem.value.id })
    if (res.code === 200) {
      availableSlotsData.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载可用时段失败')
  } finally {
    slotsLoading.value = false
  }
}

const openDetail = async (item) => {
  currentItem.value = item
  currentView.value = 'detail'
  resetOrderForm()
  await Promise.all([loadAddressList(), loadEmployeeList(), loadAvailableSlots()])
}

const backToList = () => {
  currentView.value = 'list'
  currentItem.value = null
}

const selectAddress = (address) => {
  selectedAddress.value = address
  addressDrawerVisible.value = false
}

const selectEmployee = (employee) => {
  orderForm.employeeId = employee.id
  employeeDrawerVisible.value = false
}

const selectServiceDate = (date) => {
  orderForm.serviceDate = date
  orderForm.visitTimeRange = ''
  dateDrawerVisible.value = false
}

const selectVisitTimeRange = (value) => {
  orderForm.visitTimeRange = value
  visitDrawerVisible.value = false
}

const selectServiceTimeRange = (value) => {
  orderForm.serviceTimeRange = value
  serviceTimeDrawerVisible.value = false
}

const submitPayForm = (payForm) => {
  const wrapperId = 'alipay-pay-form-wrapper'
  const oldWrapper = document.getElementById(wrapperId)
  if (oldWrapper) oldWrapper.remove()
  const div = document.createElement('div')
  div.id = wrapperId
  div.style.display = 'none'
  div.innerHTML = payForm
  document.body.appendChild(div)
  const form = div.getElementsByTagName('form')[0]
  if (form) form.submit()
}

const handleSubmitOrder = async () => {
  const user = await ensureCurrentUser()
  if (!user?.customerId) return
  if (!currentItem.value?.id) return
  if (!selectedAddress.value) {
    ElMessage.warning('请选择服务地址')
    addressDrawerVisible.value = true
    return
  }
  if (!orderForm.serviceDate) {
    ElMessage.warning('请选择服务日期')
    return
  }
  if (!orderForm.visitTimeRange) {
    ElMessage.warning('请选择上门时间段')
    return
  }

  submitting.value = true
  try {
    const res = await addOrder({
      customerId: user.customerId,
      employeeId: orderForm.employeeId,
      serviceItemId: currentItem.value.id,
      serviceDate: orderForm.serviceDate,
      serviceAddress: formatAddress(selectedAddress.value),
      visitTimeRange: orderForm.visitTimeRange,
      serviceTimeRange: orderForm.serviceTimeRange,
      amount: orderForm.quantity,
      price: currentItem.value.price,
      remark: orderForm.remark
    })
    if (!res.success) {
      ElMessage.error(res.msg || '下单失败')
      return
    }

    const orderId = res.data
    if (!orderId) {
      ElMessage.success('下单成功，请在订单中心继续支付')
      return
    }

    const payRes = await alipayPay({ orderId })
    const payForm = typeof payRes === 'string' ? payRes : payRes?.data
    if (!payForm) {
      ElMessage.warning('订单已创建，支付跳转失败，请在订单中心继续支付')
      return
    }
    ElMessage.success('下单成功，正在跳转支付')
    submitPayForm(payForm)
  } catch (error) {
    ElMessage.error('下单或支付失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadServiceList()
  ensureCurrentUser()
})
</script>

<style scoped>
.wechat-page {
  background: #f5f5f5;
  min-height: calc(100vh - 84px);
}

.wechat-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  padding: 14px 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.wechat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.service-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-card {
  display: flex;
  gap: 12px;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.card-cover {
  width: 78px;
  height: 78px;
  border-radius: 10px;
  background: linear-gradient(145deg, #eef4ff, #e8f9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-main {
  flex: 1;
}

.card-main h3 {
  margin: 2px 0 4px;
  font-size: 16px;
  color: #1f2329;
}

.card-main p {
  margin: 0;
  color: #7c8698;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #fa541c;
  font-weight: 700;
  font-size: 18px;
}

.go-detail {
  color: #07c160;
  font-size: 13px;
}

.detail-page {
  min-height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 12;
  background: #fff;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.back-btn {
  position: absolute;
  left: 6px;
  color: #333;
}

.detail-body {
  padding: 12px 12px 170px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  gap: 12px;
}

.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2fb37f, #07c160);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.hero-price {
  font-size: 20px;
  color: #fa541c;
  font-weight: 700;
}

.hero-name {
  margin-top: 4px;
  font-size: 16px;
  color: #222;
  font-weight: 600;
}

.hero-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #7c8698;
  line-height: 1.5;
}

.section-card {
  background: #fff;
  border-radius: 14px;
  padding: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2329;
}

.section-value {
  margin-top: 8px;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.sub-text {
  margin-top: 4px;
  color: #7c8698;
}

.empty-tip {
  margin-top: 8px;
  color: #a0a7b4;
  font-size: 13px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
}

.form-item.column {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.picker-cell {
  cursor: pointer;
}

.picker-cell-value {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1f2329;
  font-size: 14px;
}

.picker-cell-value.empty {
  color: #a0a7b4;
}

.form-item:last-child {
  border-bottom: none;
}

.pay-bar {
  position: fixed;
  bottom: calc(60px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100vw - 24px);
  max-width: 456px;
  z-index: 20;
  background: #fff;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  border: 1px solid #ebedf0;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pay-price {
  color: #333;
  font-size: 14px;
}

.pay-price span {
  color: #fa541c;
  font-size: 22px;
  font-weight: 700;
  margin-left: 4px;
}

.pay-btn {
  height: 40px;
  min-width: 130px;
  border-radius: 22px;
  background: #07c160;
  border-color: #07c160;
}

.drawer-panel {
  padding: 14px;
}

.drawer-panel h4 {
  margin: 0 0 10px;
  text-align: center;
  font-size: 15px;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-item {
  border: 1px solid #ebedf0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.picker-item.active {
  border-color: #95de64;
  background: #f6ffed;
}

.picker-item-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #fafafa;
}

.picker-main {
  flex: 1;
}

.picker-title {
  font-size: 14px;
  color: #1f2329;
}

.picker-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #7c8698;
  line-height: 1.45;
}

:deep(.picker-drawer.el-drawer.btt) {
  width: min(calc(100vw - 24px), 456px) !important;
  left: 0 !important;
  right: 0 !important;
  margin: 0 auto !important;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  will-change: transform;
}
</style>
