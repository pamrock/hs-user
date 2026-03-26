<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addCustomerAddress, updateCustomerAddress, getCustomerAddressList } from '@/api/customer'
import { regionData } from 'element-china-area-data'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  customerId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  visible: {
    type: Boolean,
    required: true
  },
  mobileMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'refresh', 'select'])

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增地址')
const addressFormRef = ref(null)

const addressForm = reactive({
  id: null,
  customerId: null,
  userId: null,
  contactName: '',
  contactPhone: '',
  areaCode: [],
  detailAddress: '',
  isDefault: 0
})

const addressRules = computed(() => ({
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  areaCode: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}))

// 辅助函数：根据代码在 regionData 中查找名称
const findLabelByCode = (data, code) => {
  if (!data || !code) return ''
  for (const item of data) {
    if (item.value === code) {
      return item.label
    }
    if (item.children) {
      const found = findLabelByCode(item.children, code)
      if (found) return found
    }
  }
  return ''
}

// 优化的查找逻辑，利用级联特性
const getAreaText = (provinceCode, cityCode, districtCode) => {
  let province = '', city = '', district = ''
  
  const pItem = regionData.find(item => item.value === provinceCode)
  if (pItem) {
    province = pItem.label
    if (cityCode && pItem.children) {
      const cItem = pItem.children.find(item => item.value === cityCode)
      if (cItem) {
        city = cItem.label
        if (districtCode && cItem.children) {
          const dItem = cItem.children.find(item => item.value === districtCode)
          if (dItem) {
            district = dItem.label
          }
        }
      }
    }
  }
  return `${province} ${city} ${district}`.trim()
}

// 格式化地区显示
const formatRegion = (province, city, district) => {
  // 如果没有代码，直接返回空
  if (!province) return ''
  // 尝试查找
  const text = getAreaText(province, city, district)
  // 如果找不到（比如是旧数据或者是文本），尝试直接返回原值（如果原值不是数字代码）
  if (!text.trim()) {
     // 简单的判断，如果看起来不像代码，就直接显示
     return `${province} ${city} ${district}`
  }
  return text
}

// 监听visible变化
watch(() => props.visible, (val) => {
  if (val) {
    fetchAddresses()
  }
})

onMounted(() => {
  if (props.visible) {
    fetchAddresses()
  }
})

// 获取地址列表
const fetchAddresses = async () => {
  loading.value = true
  try {
    const res = await getCustomerAddressList({
      customerId: props.customerId,
      userId: props.userId,
      pageNo: 1,
      pageSize: 100
    })
    if (res.success) {
      tableData.value = res.data.records || []
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增地址
const handleAdd = () => {
  dialogTitle.value = '新增地址'
  Object.assign(addressForm, {
    id: null,
    customerId: props.customerId,
    userId: props.userId,
    contactName: '',
    contactPhone: '',
    areaCode: [],
    detailAddress: '',
    isDefault: 0
  })
  dialogVisible.value = true
}

// 编辑地址
const handleEdit = (row) => {
  dialogTitle.value = '编辑地址'
  const areaCode = [row.province, row.city, row.district]
  Object.assign(addressForm, {
    ...row,
    areaCode: areaCode
  })
  dialogVisible.value = true
}

// 设置默认地址
const handleSetDefault = async (row) => {
  try {
    const res = await updateCustomerAddress({
      id: row.id,
      isDefault: 1
    })
    if (res.success) {
      ElMessage.success('设置成功')
      fetchAddresses()
      emit('refresh')
    } else {
      ElMessage.error(res.msg || '设置失败')
    }
  } catch (error) {
    console.error('设置默认地址失败:', error)
  }
}

// 删除地址
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const { deleteCustomerAddress } = await import('@/api/customer')
      const res = await deleteCustomerAddress(row.id)
      if (res.success) {
        ElMessage.success(res.data || '删除成功')
        fetchAddresses()
        emit('refresh')
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除地址失败:', error)
    }
  })
}

// 保存地址
const handleSave = async () => {
  if (!addressFormRef.value) return
  
  await addressFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const [province, city, district] = addressForm.areaCode
        const saveData = {
          ...addressForm,
          province,
          city,
          district
        }
        delete saveData.areaCode
        
        let res
        if (addressForm.id) {
          res = await updateCustomerAddress(saveData)
        } else {
          res = await addCustomerAddress(saveData)
        }
        if (res.success) {
          ElMessage.success(res.data || '保存成功')
          dialogVisible.value = false
          fetchAddresses()
          emit('refresh')
        } else {
          ElMessage.error(res.msg || '保存失败')
        }
      } catch (error) {
        console.error('保存地址失败:', error)
        ElMessage.error('保存地址失败')
      }
    }
  })
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}

// 选择地址
const handleSelect = (item) => {
  emit('select', item)
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog 
    :model-value="visible" 
    title="客户地址管理" 
    :width="props.mobileMode ? '356px' : '800px'"
    :class="['address-dialog', { 'is-mobile-mode': props.mobileMode }]"
    @update:model-value="val => emit('update:visible', val)"
  >
    <div class="address-management" v-loading="loading">
      <div class="address-header">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增收货地址</el-button>
      </div>

      <el-empty v-if="!tableData.length" description="暂无收货地址" />
      <div v-else :class="['address-list', { 'single-column': props.mobileMode }]">
        <div 
          v-for="item in tableData" 
          :key="item.id" 
          class="address-card"
          :class="{ 'is-default': item.isDefault === 1 }"
          @click="handleSelect(item)"
        >
          <div class="card-body">
            <div class="user-info">
              <span class="name">{{ item.contactName }}</span>
              <span class="phone">{{ item.contactPhone }}</span>
              <el-tag v-if="item.isDefault === 1" size="small" type="danger" effect="dark" class="default-tag">默认</el-tag>
            </div>
            <div class="address-detail">
              <p class="region">{{ formatRegion(item.province, item.city, item.district) }}</p>
              <p class="street">{{ item.detailAddress }}</p>
            </div>
          </div>
          <div class="card-actions">
            <div class="left">
              <el-link 
                v-if="item.isDefault !== 1" 
                type="primary" 
                :underline="false" 
                @click.stop="handleSetDefault(item)"
              >
                设为默认
              </el-link>
            </div>
            <div class="right">
              <el-button link type="primary" @click.stop="handleEdit(item)">编辑</el-button>
              <el-button link type="danger" @click.stop="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑 地址对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="props.mobileMode ? '332px' : '500px'"
      :class="['address-edit-dialog', { 'is-mobile-mode': props.mobileMode }]"
      append-to-body
    >
      <el-form ref="addressFormRef" :model="addressForm" :rules="addressRules" label-width="100px">
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="addressForm.contactName" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="addressForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="所在地区" prop="areaCode">
          <el-cascader
            v-model="addressForm.areaCode"
            :options="regionData"
            placeholder="请选择所在地区"
            style="width: 100%"
            clearable
            filterable
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input 
            v-model="addressForm.detailAddress" 
            placeholder="请输入详细地址" 
            type="textarea"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.address-management {
  min-height: 300px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
}

.address-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.address-list.single-column {
  grid-template-columns: 1fr;
}

.address-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.address-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.address-card.is-default {
  border-color: #f56c6c;
  background: #fffcfc;
}

.card-body {
  flex: 1;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-info .name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.user-info .phone {
  color: #606266;
  font-size: 14px;
}

.address-detail {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
}

.address-detail p {
  margin: 0;
}

.card-actions {
  border-top: 1px solid #f2f6fc;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-tag {
  margin-left: auto;
}

:deep(.address-dialog.is-mobile-mode .el-dialog) {
  width: min(calc(100vw - 24px), 356px) !important;
  margin: 0 auto !important;
  border-radius: 14px !important;
}

:deep(.address-dialog.is-mobile-mode .el-dialog__body) {
  padding: 12px;
}

:deep(.address-edit-dialog.is-mobile-mode .el-dialog) {
  width: min(calc(100vw - 32px), 332px) !important;
  border-radius: 12px !important;
}

@media (max-width: 768px) {
  .address-list {
    grid-template-columns: 1fr;
  }
}
</style>
