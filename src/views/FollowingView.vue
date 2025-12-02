<template>
  <div class="following-view">
    <!-- Header -->
    <AppHeader active-page="" />

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <div class="header-section">
          <button @click="goBack" class="back-btn">← 돌아가기</button>
          <h1 class="page-title">팔로잉</h1>
        </div>

        <!-- Following List -->
        <div v-if="following.length > 0" class="following-section">
          <p class="count-text">{{ following.length }}명 팔로잉</p>
          <div class="user-list">
            <div v-for="user in following" :key="user.id" class="user-card">
              <div class="user-info" @click="router.push(`/user/${user.id}`)">
                <div class="user-avatar">
                  {{ user.name.charAt(0) }}
                </div>
                <div class="user-details">
                  <h3 class="user-name">{{ user.name }}</h3>
                  <p class="user-nickname">@{{ user.nickname }}</p>
                  <p class="user-meta">{{ user.email }}</p>
                </div>
              </div>
              <button
                @click="unfollowUser(user.id)"
                class="btn btn-unfollow"
              >
                언팔로우
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <p>팔로잉 중인 사용자가 없습니다.</p>
        </div>
      </div>
    </main>

    <!-- Toast Message -->
    <transition name="slideUp">
      <div v-if="showToast" class="toast">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()

// Toast
const showToast = ref(false)
const toastMessage = ref('')

// 더미 팔로잉 데이터 (내가 팔로우하는 사람들)
const following = ref([
  { id: 2, name: '이영희', nickname: 'younghee', email: 'younghee@yamyam.com' },
  { id: 5, name: '정수현', nickname: 'suhyun', email: 'suhyun@yamyam.com' },
  { id: 7, name: '윤서준', nickname: 'seojun', email: 'seojun@yamyam.com' }
])

// Methods
const unfollowUser = (userId) => {
  const user = following.value.find(u => u.id === userId)
  following.value = following.value.filter(u => u.id !== userId)
  displayToast(`${user.name}님을 언팔로우했습니다.`)
}

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.following-view {
  min-height: 100vh;
  background: #F5F7FA;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.container {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  padding: 10px 20px;
  background: #F5F7FA;
  border: none;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #E8EBF0;
  color: #333333;
}

.page-title {
  font-size: 28px;
  color: #333333;
}

/* Following Section */
.following-section {
  margin-top: 20px;
}

.count-text {
  font-size: 16px;
  color: #666666;
  margin-bottom: 20px;
  font-weight: 500;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #F5F7FA;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  flex: 1;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 18px;
  color: #333333;
  font-weight: 600;
}

.user-nickname {
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

.user-meta {
  font-size: 13px;
  color: #999999;
}

/* Buttons */
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-unfollow {
  background: #FFFFFF;
  color: #666666;
  border: 2px solid #E0E0E0;
}

.btn-unfollow:hover {
  background: #F5F7FA;
  border-color: #999999;
  color: #333333;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999999;
  font-size: 16px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  padding: 16px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.toast-icon {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.toast-message {
  color: #333333;
  font-weight: 500;
}

.slideUp-enter-active {
  animation: slideUp 0.3s ease-out;
}

.slideUp-leave-active {
  animation: slideUp 0.3s ease-out reverse;
}

@keyframes slideUp {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }

  .nav {
    display: none;
  }

  .container {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .user-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .btn {
    width: 100%;
  }
}
</style>
