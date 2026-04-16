<template>
  <div class="orders-container">
    <div class="header">
      <h2>我的订单</h2>
    </div>

    <div class="status-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="order-list" v-loading="loading">
      <template v-if="orderList.length">
        <div class="order-card" v-for="order in orderList" :key="order.id" @click="viewDetail(order.orderId || order.id)">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderId || order.id }}</span>
            <span class="order-status" :class="{ danger: isUnpaid(order.status) }">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="order-content">
            <div class="order-img">
              <el-icon :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
            <div class="order-info">
              <h4>{{ order.serviceItem || '服务项目' }}</h4>
              <p>下单时间: {{ order.createTime || '-' }}</p>
            </div>
          </div>
          <div class="order-footer">
            <span class="price">实付: ¥ {{ order.totalAmount ?? 0 }}</span>
            <div class="actions">
              <el-button size="small" round @click.stop="viewDetail(order.orderId || order.id)">查看详情</el-button>
              <el-button
                v-if="isUnpaid(order.status)"
                size="small"
                type="primary"
                round
                class="main-btn"
                @click.stop="goPay(order)"
              >
                去支付
              </el-button>
              <el-button
                v-if="isInService(order.status)"
                size="small"
                type="success"
                round
                @click.stop="handleFinishOrder(order)"
              >
                完成订单
              </el-button>
              <el-button
                v-if="isInService(order.status)"
                size="small"
                type="danger"
                round
                @click.stop="handleCancelOrder(order)"
              >
                取消订单
              </el-button>
            </div>
          </div>
        </div>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            layout="prev, pager, next"
            :total="total"
            :pager-count="5"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
      <el-empty v-else description="暂无订单数据" />
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="92%" class="order-detail-dialog">
      <div v-loading="detailLoading">
        <el-descriptions v-if="currentOrder" :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderId || currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="服务项目">{{ currentOrder.serviceItem || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥ {{ currentOrder.totalAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType((currentDetail && currentDetail.status) || currentOrder.status)">
              {{ getStatusText((currentDetail && currentDetail.status) || currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.createTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelOrder, finishService, getMyOrderList, getOrderDetail } from '@/api/order'
import { alipayPay } from '@/api/pay'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: '1' },
  { label: '待派单', value: '2' },
  { label: '已派单', value: '3' },
  { label: '服务中', value: '4' },
  { label: '已完成', value: '5' },
  { label: '已取消', value: '6' }
]

const activeTab = ref('all')
const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref(null)
const currentOrder = ref(null)

const fetchList = async () => {
  loading.value = true
  try {
    const reqData = { ...queryParams }
    if (activeTab.value !== 'all') {
      reqData.status = activeTab.value
    }
    const res = await getMyOrderList(reqData)
    const data = res.data || {}
    orderList.value = data.records || data.list || (Array.isArray(data) ? data : [])
    total.value = data.total || orderList.value.length || 0
  } catch (error) {
    orderList.value = []
    total.value = 0
    ElMessage.error('网络异常，订单列表加载失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (value) => {
  activeTab.value = value
  queryParams.pageNum = 1
  fetchList()
}

const handleCurrentChange = (value) => {
  queryParams.pageNum = value
  fetchList()
}

const isUnpaid = (status) => status?.toString() === '1'
const isInService = (status) => status?.toString() === '4'

const getStatusType = (status) => {
  const s = status?.toString()
  if (s === '1') return 'danger'
  if (s === '5') return 'success'
  if (s === '6') return 'info'
  return 'primary'
}

const getStatusText = (status) => {
  const map = {
    '1': '待支付',
    '2': '待派单',
    '3': '已派单',
    '4': '服务中',
    '5': '已完成',
    '6': '已取消'
  }
  return map[status?.toString()] || (status ?? '-')
}

const parseCreateTimeGmt8 = (createTime) => {
  if (!createTime || typeof createTime !== 'string') return null
  const parts = createTime.trim().split(' ')
  if (parts.length !== 2) return null
  const [datePart, timePart] = parts
  const dateNums = datePart.split('-').map(v => Number(v))
  const timeNums = timePart.split(':').map(v => Number(v))
  if (dateNums.length !== 3 || timeNums.length !== 3) return null
  const [y, m, d] = dateNums
  const [hh, mm, ss] = timeNums
  if (![y, m, d, hh, mm, ss].every(n => Number.isFinite(n))) return null
  return new Date(Date.UTC(y, m - 1, d, hh - 8, mm, ss))
}

const viewDetail = async (orderId) => {
  detailVisible.value = true
  detailLoading.value = true
  currentDetail.value = null
  currentOrder.value = orderList.value.find(o => (o.orderId || o.id) === orderId) || { orderId }
  try {
    const res = await getOrderDetail({ orderId })
    currentDetail.value = res.data || null
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const goPay = async (order) => {
  const orderId = order?.orderId || order?.id
  if (!orderId) {
    ElMessage.warning('订单号不存在，无法支付')
    return
  }
  const createAt = parseCreateTimeGmt8(order?.createTime)
  if (!createAt) {
    await ElMessageBox.alert('订单下单时间异常，请重新下单', '提示', {
      confirmButtonText: '确定',
      type: 'warning'
    })
    return
  }
  const diffMs = Date.now() - createAt.getTime()
  if (diffMs > 30 * 60 * 1000) {
    await ElMessageBox.alert('订单已超过下单时间 30 分钟，请重新下单', '提示', {
      confirmButtonText: '确定',
      type: 'warning'
    })
    return
  }
  try {
    const payRes = await alipayPay({ orderId })
    const payForm = typeof payRes === 'string' ? payRes : payRes?.data
    if (!payForm) {
      ElMessage.warning('支付跳转失败，请在订单中心继续支付')
      return
    }
    const wrapperId = 'alipay-pay-form-wrapper'
    const oldWrapper = document.getElementById(wrapperId)
    if (oldWrapper) oldWrapper.remove()
    const div = document.createElement('div')
    div.id = wrapperId
    div.style.display = 'none'
    div.innerHTML = payForm
    document.body.appendChild(div)
    const form = div.getElementsByTagName('form')[0]
    if (form) {
      form.submit()
    } else {
      ElMessage.warning('支付跳转失败，请在订单中心继续支付')
    }
  } catch (error) {
    ElMessage.warning('支付跳转失败，请在订单中心继续支付')
  }
}

const handleFinishOrder = async (order) => {
  const orderId = order?.orderId || order?.id
  if (!orderId) {
    ElMessage.warning('订单号不存在，无法完成订单')
    return
  }
  try {
    const res = await finishService({ orderId })
    if (!res?.success) {
      ElMessage.warning(res?.msg || '完成订单失败，请稍后重试')
      return
    }
    ElMessage.success('订单已完成')
    await fetchList()
    if (detailVisible.value && (currentOrder.value?.orderId || currentOrder.value?.id) === orderId) {
      await viewDetail(orderId)
    }
  } catch (error) {
    ElMessage.warning('完成订单失败，请稍后重试')
  }
}

const handleCancelOrder = async (order) => {
  const orderId = order?.orderId || order?.id
  if (!orderId) {
    ElMessage.warning('订单号不存在，无法取消订单')
    return
  }
  try {
    const res = await cancelOrder({ orderId, role: 2 })
    if (!res?.success) {
      ElMessage.warning(res?.msg || '取消订单失败，请稍后重试')
      return
    }
    ElMessage.success('订单已取消')
    await fetchList()
    if (detailVisible.value && (currentOrder.value?.orderId || currentOrder.value?.id) === orderId) {
      await viewDetail(orderId)
    }
  } catch (error) {
    ElMessage.warning('取消订单失败，请稍后重试')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.orders-container {
  padding: 16px;
  background: #f7f8fa;
  min-height: calc(100vh - 84px);
}

.header {
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2329;
}

.status-tabs {
  display: flex;
  overflow-x: auto;
  gap: 14px;
  margin-bottom: 14px;
  padding: 0 2px 4px;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex-shrink: 0;
  font-size: 14px;
  color: #646f83;
  padding-bottom: 4px;
  position: relative;
}

.tab-item.active {
  color: #1e3c72;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -1px;
  width: 18px;
  height: 3px;
  background: #1e3c72;
  border-radius: 3px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #ebedf0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.order-no {
  color: #7b8495;
  font-size: 12px;
}

.order-status {
  color: #1e3c72;
  font-size: 13px;
  font-weight: 600;
}

.order-status.danger {
  color: #f56c6c;
}

.order-content {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.order-img {
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-info {
  flex: 1;
}

.order-info h4 {
  margin: 0 0 6px;
  font-size: 14px;
  color: #1f2329;
}

.order-info p {
  margin: 0;
  font-size: 12px;
  color: #8d95a3;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.price {
  color: #1f2329;
  font-size: 14px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .main-btn {
  border: none;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

:deep(.order-detail-dialog .el-dialog) {
  max-width: 420px;
  border-radius: 12px;
}
</style>
