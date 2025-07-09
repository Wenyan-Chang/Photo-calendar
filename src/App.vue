<template>
  <div id="app">
    <AuthForm v-if="!user" />
    <div v-else class="calendar-container">
      <header class="app-header">
        <!-- 相簿切換 + 新增 + 刪除 -->
        <div class="album-switch">
          <select v-model="selectedIndex">
            <option
              v-for="(a, i) in albums"
              :key="i"
              :value="i"
            >{{ a }}</option>
          </select>
          <button
            class="add-btn"
            @click="addAlbum"
            title="新增相簿"
          >＋</button>
          <button
            class="delete-btn"
            :disabled="albums.length === 1"
            @click="deleteAlbum"
            title="刪除相簿"
          >🗑️</button>
        </div>

        <!-- 目前相簿標題 & 編輯 -->
        <div v-if="!editing" class="title-display">
          <h1 class="app-title">{{ albums[selectedIndex] }}</h1>
          <button
            class="edit-btn"
            @click="startEdit"
            title="編輯相簿名稱"
          >✏️</button>
        </div>
        <div v-else class="title-edit">
          <input
            v-model="tempName"
            type="text"
            class="title-input"
            placeholder="輸入相簿名稱"
          />
          <button
            class="save-btn"
            @click="saveEdit"
            title="儲存變更"
          >✔️</button>
          <button
            class="cancel-btn"
            @click="cancelEdit"
            title="取消"
          >✖️</button>
        </div>

        <button
          @click="logout"
          class="logout-btn"
        >登出</button>
      </header>

      <CalendarView :album="albums[selectedIndex]" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase.js'

import AuthForm     from './components/AuthForm.vue'
import CalendarView from './components/CalendarView.vue'

// --- Firebase Auth ---
const user = ref(null)
onMounted(() => onAuthStateChanged(auth, u => (user.value = u)))
function logout() { signOut(auth) }

// --- 相簿列表 & 切換/新增/刪除/編輯 ---
const albums        = ref(['相簿日曆'])
const selectedIndex = ref(0)
const tempName      = ref('')
const editing       = ref(false)

/** 新增一個相簿 */
function addAlbum() {
  const name = prompt('請輸入新相簿名稱：')?.trim()
  if (name && !albums.value.includes(name)) {
    albums.value.push(name)
    selectedIndex.value = albums.value.length - 1
  }
}

/** 刪除當前相簿，並清除 localStorage */
function deleteAlbum() {
  const idx = selectedIndex.value
  const name = albums.value[idx]
  if (!confirm(`確定要刪除相簿「${name}」嗎？此操作會移除所有圖片資料。`)) {
    return
  }
  // 1. 清 localStorage
  const prefix = `photoDiary__${name}__`
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key))

  // 2. 從 albums 列表刪除
  albums.value.splice(idx, 1)

  // 3. 調整 selectedIndex
  if (idx >= albums.value.length) {
    selectedIndex.value = albums.value.length - 1
  }
}

/** 編輯相簿名稱 */
function startEdit() {
  tempName.value = albums.value[selectedIndex.value]
  editing.value = true
}
function saveEdit() {
  const v = tempName.value.trim()
  if (v) {
    // 連同 localStorage prefix 也要重命名
    const oldName = albums.value[selectedIndex.value]
    const newName = v
    const oldPrefix = `photoDiary__${oldName}__`
    const newPrefix = `photoDiary__${newName}__`
    // 重新命名 localStorage key
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(oldPrefix)) {
        const data = localStorage.getItem(key)
        localStorage.removeItem(key)
        const newKey = key.replace(oldPrefix, newPrefix)
        localStorage.setItem(newKey, data)
      }
    })
    // 更新列表
    albums.value[selectedIndex.value] = newName
  }
  editing.value = false
}
function cancelEdit() {
  editing.value = false
}
</script>

<style scoped>
#app {
  font-family: sans-serif;
  color: #333;
}
.calendar-container {
  max-width: 900px;
  margin: 0 auto;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f7f7f7;
  border-bottom: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
}

/* 相簿切換 + 新增 + 刪除 */
.album-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.album-switch select {
  padding: 0.3rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.add-btn,
.delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 標題顯示/編輯 */
.title-display,
.title-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.app-title {
  margin: 0;
  font-size: 1.5rem;
}
.edit-btn,
.save-btn,
.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}
.title-input {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 登出 */
.logout-btn {
  background: #c76bd5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.calendar-container .fc {
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}
</style>
