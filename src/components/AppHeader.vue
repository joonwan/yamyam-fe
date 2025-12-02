<template>
  <header class="header">
    <div class="header-content">
      <router-link to="/main" class="logo">냠냠 코치</router-link>
      <nav class="nav">
        <router-link to="/main" :class="{ active: activePage === 'main' }">대시보드</router-link>
        <router-link to="/diet" :class="{ active: activePage === 'diet' }">식단 관리</router-link>
        <router-link to="/board" :class="{ active: activePage === 'board' }">게시판</router-link>
        <router-link to="/challenge" :class="{ active: activePage === 'challenge' }">챌린지</router-link>
        <router-link to="/friends" :class="{ active: activePage === 'friends' }">친구 검색</router-link>
        <router-link to="/mypage" :class="{ active: activePage === 'mypage' }">마이페이지</router-link>
      </nav>
      <div class="user-menu">
        <span class="username">홍길동님</span>
        <button class="logout-btn" @click="logout">로그아웃</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps({
  activePage: {
    type: String,
    default: ''
  }
})

const logout = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Header */
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

.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav a:hover,
.nav a.active {
  color: #4CAF50;
}

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
