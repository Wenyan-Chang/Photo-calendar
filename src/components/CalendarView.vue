<!-- src/components/CalendarView.vue -->
<template>
  <div>
    <!-- 年／月 下拉選單 -->
    <div class="date-picker">
      <select v-model="selectedYear" @change="onDateChange">
        <option v-for="y in years" :key="y" :value="y">{{ y }} 年</option>
      </select>
      <select v-model="selectedMonth" @change="onDateChange">
        <option v-for="(m, i) in months" :key="i" :value="i">{{ m }}</option>
      </select>
    </div>

    <!-- 月曆掛載點 -->
    <div ref="calendarEl"></div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content">
        <!-- 上傳 模式 -->
        <template v-if="modalMode === 'upload'">
          <h2>為 {{ selectedDate }} 上傳照片</h2>
          <label class="block mb-2">
            <span class="block mb-1">標題</span>
            <input
              v-model="eventTitle"
              type="text"
              placeholder="輸入標題（可留空）"
              class="w-full p-1 border rounded"
            />
          </label>
          <input type="file" accept="image/*" @change="handleFileChange" class="mb-4" />
          <div v-if="previewURL" class="preview mb-4">
            <img :src="previewURL" alt="預覽圖" />
          </div>
          <div class="btn-group">
            <button @click="saveToLocal">儲存</button>
            <button @click="closeModal">取消</button>
          </div>
        </template>

        <!-- 檢視 模式 -->
        <template v-else-if="modalMode === 'view'">
          <h2>{{ selectedDate }} 的照片</h2>
          <div class="preview mb-4">
            <img :src="selectedEvent.extendedProps.url" alt="照片顯示" />
          </div>
          <p v-if="selectedEvent.title" class="mb-2 text-lg font-semibold">
            {{ selectedEvent.title }}
          </p>
          <p class="description-label">敘述：</p>
          <p v-if="selectedEvent.extendedProps.description" class="description-text">
            {{ selectedEvent.extendedProps.description }}
          </p>
          <p v-else class="description-text empty">（尚無敘述）</p>
          <div class="btn-group">
            <button class="danger" @click="deleteEvent">刪除照片</button>
            <button @click="modalMode = 'edit'">編輯敘述</button>
            <button @click="closeModal">關閉</button>
          </div>
        </template>

        <!-- 編輯 模式 -->
        <template v-else>
          <h2>編輯 {{ selectedDate }} 的照片資訊</h2>
          <label class="block mb-2">
            <span class="block mb-1">標題</span>
            <input v-model="eventTitle" type="text" class="w-full p-1 border rounded" />
          </label>
          <div class="preview mb-4">
            <img :src="selectedEvent.extendedProps.url" alt="照片預覽" />
          </div>
          <textarea v-model="description" rows="3" class="textarea mb-4"></textarea>
          <div class="btn-group">
            <button class="primary" @click="saveDescription">儲存</button>
            <button @click="closeModal">取消</button>
          </div>
        </template>

        <!-- 右上關閉 -->
        <button class="close-btn" @click="closeModal">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { v4 as uuidv4 } from 'uuid'

/** 傳入當前相簿名稱，作為 localStorage prefix */
const props = defineProps({
  album: { type: String, required: true }
})

/** 月份／年份下拉選單資料 */
const months = [
  '1 月','2 月','3 月','4 月','5 月','6 月',
  '7 月','8 月','9 月','10 月','11 月','12 月'
]
const today = new Date()
const selectedYear  = ref(today.getFullYear())
const selectedMonth = ref(today.getMonth())
const years = Array.from(
  { length: 11 },
  (_, i) => today.getFullYear() - 5 + i
)

/** 日曆、Modal 狀態 */
const calendarEl    = ref(null)
const showModal     = ref(false)
const modalMode     = ref('upload') // 'upload' | 'view' | 'edit'
const selectedDate  = ref('')
const eventTitle    = ref('')
const imageFile     = ref(null)
const previewURL    = ref(null)
const description   = ref('')
const selectedEvent = ref(null)
let calendar        = null

/** 產生 localStorage key 的前綴 */
function PREFIX() {
  return `photoDiary__${props.album}__`
}

/** 切換年月 */
function onDateChange() {
  calendar.gotoDate(
    new Date(selectedYear.value, selectedMonth.value, 1)
  )
}

/** 初始化 FullCalendar */
onMounted(() => {
  calendar = new Calendar(calendarEl.value, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false,
    dateClick: info => {
      modalMode.value    = 'upload'
      selectedDate.value = info.dateStr
      eventTitle.value   = ''
      previewURL.value   = null
      imageFile.value    = null
      showModal.value    = true
    },
    eventClick: info => {
      modalMode.value     = 'view'
      selectedEvent.value = info.event
      selectedDate.value  = info.event.startStr
      eventTitle.value    = info.event.title || ''
      description.value   = info.event.extendedProps.description || ''
      showModal.value     = true
    },
    events: [],
    eventContent: ({ event }) => {
      const titleHtml = event.title
        ? `<div style="
            font-weight:bold;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            margin-bottom:4px;">
             ${event.title}
           </div>`
        : ''
      return {
        html: `
          <div style="padding:4px">
            ${titleHtml}
            <img src="${event.extendedProps.url}"
                 style="width:100%;border-radius:4px" />
          </div>`
      }
    }
  })

  calendar.render()
  onDateChange()
  loadEvents()
})

/** 監聽 album 變動，清除並重載該相簿事件 */
watch(
  () => props.album,
  () => {
    calendar.removeAllEvents()
    loadEvents()
  }
)

/** 從 localStorage 讀取並新增到日曆 */
function loadEvents() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key.startsWith(PREFIX())) continue
    const data = JSON.parse(localStorage.getItem(key))
    calendar.addEvent({
      id: data.id,
      title: data.title || '',
      date: data.date,
      extendedProps: {
        url: data.url,
        description: data.description || ''
      }
    })
  }
}

/** 處理檔案選擇 & 預覽 */
function handleFileChange(e) {
  const f = e.target.files[0]
  if (!f) return
  imageFile.value  = f
  previewURL.value = URL.createObjectURL(f)
}

/** 儲存上傳的照片到 localStorage */
function saveToLocal() {
  if (!imageFile.value) {
    alert('請先選擇圖片！')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const id   = uuidv4()
    const data = {
      id,
      date: selectedDate.value,
      title: eventTitle.value.trim(),
      url: reader.result,
      description: ''
    }
    localStorage.setItem(PREFIX() + id, JSON.stringify(data))
    calendar.addEvent({
      id: data.id,
      title: data.title,
      date: data.date,
      extendedProps: {
        url: data.url,
        description: data.description
      }
    })
    closeModal()
  }
  reader.readAsDataURL(imageFile.value)
}

/** 刪除事件 */
function deleteEvent() {
  const id = selectedEvent.value.id
  if (confirm('確定要刪除這張照片嗎？')) {
    localStorage.removeItem(PREFIX() + id)
    selectedEvent.value.remove()
    closeModal()
  }
}

/** 儲存敘述 & 標題更新 */
function saveDescription() {
  const id   = selectedEvent.value.id
  const key  = PREFIX() + id
  const item = JSON.parse(localStorage.getItem(key))
  item.title       = eventTitle.value.trim()
  item.description = description.value
  localStorage.setItem(key, JSON.stringify(item))

  selectedEvent.value.setProp('title', item.title)
  selectedEvent.value.setExtendedProp('description', item.description)
  closeModal()
}

/** 關閉 Modal 並重置 */
function closeModal() {
  showModal.value     = false
  imageFile.value     = null
  previewURL.value    = null
  description.value   = ''
  selectedEvent.value = null
}
</script>

<style scoped>
.date-picker {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.date-picker select {
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  position: relative;
  background: #fff;
  padding: 1.2rem;
  border-radius: 0.5rem;
  width: 320px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #444;
}
.preview img {
  width: 100%;
  border-radius: 0.25rem;
}
.btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.btn-group button {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: white;
}
.btn-group button.primary {
  background: #38a169;
}
.btn-group button.danger {
  background: #e53e3e;
}
.btn-group button:not(.primary):not(.danger) {
  background: #3182ce;
}
.textarea {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
  box-sizing: border-box;
  resize: vertical;
}
.description-label {
  font-weight: bold;
  margin-top: 0.5rem;
}
.description-text {
  margin-bottom: 0.5rem;
}
.description-text.empty {
  color: #666;
  font-style: italic;
}
</style>
