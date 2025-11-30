<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const handleLogin = () => {
  // 에러 메시지 초기화
  errorMessage.value = ''

  // 더미 데이터로 로그인 체크
  if (email.value === 'test@yamyam.com' && password.value === 'test1234') {
    router.push('/main')
  } else {
    errorMessage.value = '이메일 또는 비밀번호를 다시 입력해주세요'
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 왼쪽: 브랜딩 영역 -->
    <div class="branding-section">
      <div class="branding-content">
        <div class="logo">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="#FFFFFF" stroke-width="4"/>
            <path d="M26 40 L36 50 L56 28" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="brand-title">냠냠 코치</h1>
        <p class="brand-description">당신의 건강한 식단을 위한<br/>스마트한 관리 파트너</p>
      </div>
    </div>

    <!-- 오른쪽: 로그인 폼 -->
    <div class="form-section">
      <div class="form-container">
        <h2 class="form-title">로그인</h2>
        <p class="form-subtitle">계정에 로그인하여 시작하세요</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label class="input-label">이메일</label>
            <input
              v-model="email"
              type="email"
              placeholder="example@yamyam.com"
              required
              class="input-field"
            />
          </div>

          <div class="input-group">
            <label class="input-label">비밀번호</label>
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
              class="input-field"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button">
            로그인
          </button>
        </form>

        <div class="signup-link">
          계정이 없으신가요? <router-link to="/signup" class="link">회원가입</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  margin: 0;
  padding: 0;
}

/* 왼쪽: 브랜딩 영역 */
.branding-section {
  flex: 1;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.branding-section::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  top: -50%;
  left: -50%;
}

.branding-content {
  position: relative;
  text-align: center;
  color: #FFFFFF;
  z-index: 1;
}

.logo {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.brand-description {
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.95;
}

/* 오른쪽: 로그인 폼 */
.form-section {
  flex: 1;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px;
}

.form-container {
  width: 100%;
  max-width: 500px;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #888888;
  margin-bottom: 48px;
}

.login-form {
  margin-bottom: 32px;
}

.input-group {
  margin-bottom: 28px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 14px 0;
  font-size: 15px;
  color: #333333;
  border: none;
  border-bottom: 2px solid #E0E0E0;
  outline: none;
  background: transparent;
  transition: border-color 0.3s ease;
}

.input-field::placeholder {
  color: #AAAAAA;
}

.input-field:focus {
  border-bottom-color: #4CAF50;
}

.error-message {
  color: #F44336;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  margin-bottom: 8px;
  text-align: left;
}

.login-button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  background: #4CAF50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.login-button:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.signup-link {
  font-size: 14px;
  color: #666666;
  text-align: center;
}

.link {
  color: #FFA726;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.link:hover {
  color: #FB8C00;
  text-decoration: underline;
}

/* 반응형 */
@media (max-width: 968px) {
  .login-container {
    flex-direction: column;
  }

  .branding-section {
    padding: 40px;
    min-height: 40vh;
  }

  .form-section {
    padding: 40px 20px;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-description {
    font-size: 16px;
  }
}
</style>
