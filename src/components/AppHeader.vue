<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  activePage: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const nickname = ref('게스트')
const isLoggedIn = ref(false)

onMounted(() => {
  const token = localStorage.getItem('accessToken')
  const storedNickname = localStorage.getItem('nickname')

  if (token && storedNickname) {
    isLoggedIn.value = true
    nickname.value = storedNickname
  } else {
    isLoggedIn.value = false
    nickname.value = '' 
  }
})

const logout = () => {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('nickname')
    
    isLoggedIn.value = false
    nickname.value = ''
    router.push('/login')
  }
}
</script>

<template>
  <header class="header">
    <div class="header-content">
      <router-link to="/main" class="logo">냠냠 코치</router-link>
      
      <nav class="nav">
        <router-link to="/main" :class="{ active: activePage === 'main' }">대시보드</router-link>
        <router-link to="/diet" :class="{ active: activePage === 'diet' }">식단 관리</router-link>
        
        <router-link to="/ai" :class="{ active: activePage === 'ai' }" class="ai-link">
          쩝쩝교수 
          <span class="ai-badge">AI</span>
        </router-link>
        
        <router-link to="/board" :class="{ active: activePage === 'board' }">게시판</router-link>
        <router-link to="/challenge" :class="{ active: activePage === 'challenge' }">챌린지</router-link>
        <router-link to="/friends" :class="{ active: activePage === 'friends' }">친구 검색</router-link>
      </nav>

      <div class="user-menu">
        <template v-if="isLoggedIn">
          <span class="username">{{ nickname }}님</span>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </template>

        <template v-else>
          <router-link to="/login" class="login-btn">로그인</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Header Layout */
.header {
  background: #FFFFFF;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  text-decoration: none;
}

/* Navigation */
.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav a:hover,
.nav a.active {
  color: #4CAF50;
}

/* AI Link & Badge Style */
.ai-link {
  display: flex;
  align-items: center;
  position: relative; /* 뱃지 기준점 */
  margin-right: 10px; /* 오른쪽 여백 확보 */
}

.ai-badge {
  font-size: 8px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1px 4px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(118, 75, 162, 0.3);
  
  /* 위치 조정 (위첨자 느낌) */
  position: absolute;
  top: -8px;   /* 텍스트 위로 */
  right: -12px; /* 텍스트 오른쪽 바깥으로 */
}

/* User Menu & Buttons (복구된 스타일) */
.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #333333;
  font-weight: 500;
}

.logout-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.login-btn {
  padding: 8px 20px;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.login-btn:hover {
  background-color: #45A049;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }

  .nav {
    display: none;
  }
}
</style>