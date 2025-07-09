<!-- src/components/AuthForm.vue -->
<template>
  <div class="auth-container">
    <h2>{{ mode === 'login' ? '登入' : '註冊' }}</h2>
    <form @submit.prevent="submit" class="auth-form">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="密碼"
        required
      />
      <button type="submit" class="btn">
        {{ mode === 'login' ? '登入' : '註冊' }}
      </button>
    </form>

    <p class="toggle-mode" @click="toggleMode">
      {{ mode === 'login' ? '沒有帳號？去註冊' : '已有帳號？去登入' }}
    </p>

    <p v-if="error" class="error-msg">Firebase: {{ error }}</p>
  </div>
</template>

<script>
import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { auth } from '../firebase.js'

export default {
  name: 'AuthForm',
  setup() {
    const mode     = ref('login')
    const email    = ref('')
    const password = ref('')
    const error    = ref('')

    function toggleMode() {
      error.value = ''
      mode.value  = mode.value === 'login' ? 'register' : 'login'
    }

    async function submit() {
      error.value = ''
      try {
        if (mode.value === 'login') {
          await signInWithEmailAndPassword(auth, email.value, password.value)
        } else {
          await createUserWithEmailAndPassword(auth, email.value, password.value)
        }
      } catch (e) {
        error.value = e.code || e.message
      }
    }

    return {
      mode,
      email,
      password,
      error,
      toggleMode,
      submit
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 360px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: #fff;
  box-sizing: border-box;
}
.auth-container h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}
.auth-form input {
  display: block;
  width: 100%;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #aaa;
  border-radius: 4px;
  box-sizing: border-box;
}
.auth-form .btn {
  width: 100%;
  padding: 0.7rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.toggle-mode {
  margin-top: 1rem;
  text-align: center;
  color: #3182ce;
  cursor: pointer;
}
.error-msg {
  margin-top: 1rem;
  color: #e53e3e;
  text-align: center;
}
</style>
