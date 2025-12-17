<template>
  <div class="friends-view">
    <AppHeader active-page="friends" />

    <main class="main-content">
      <div class="container">
        <h1 class="page-title">친구 검색</h1>

        <div class="search-section">
          <div class="search-box">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="이름, 닉네임 또는 이메일로 검색"
              @keyup.enter="searchFriends"
              class="search-input"
            >
            <button @click="searchFriends" class="search-btn">검색</button>
          </div>
        </div>

        <div v-if="searchResults.length > 0" class="results-section">
          <h2 class="section-title">검색 결과 ({{ searchResults.length }}명)</h2>
          <div class="user-list">
            <div v-for="user in searchResults" :key="user.id" class="user-card">
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
                v-if="user.isFollowing"
                @click="unfollowUser(user)"
                class="btn btn-unfollow"
              >
                언팔로우
              </button>
              <button
                v-else
                @click="followUser(user)"
                class="btn btn-follow"
              >
                팔로우
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="hasSearched" class="empty-state">
          <p>검색 결과가 없습니다.</p>
        </div>

        <div v-else class="empty-state">
          <p>이름, 닉네임 또는 이메일을 검색해주세요.</p>
        </div>
      </div>
    </main>

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
import api from '@/util/axios' // ★ 우리가 만든 axios 불러오기

const router = useRouter()

// State
const searchKeyword = ref('')
const searchResults = ref([])
const hasSearched = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')

// [삭제됨] 더미 데이터들 (allUsers, followingIds) 제거!

// ★ 친구 검색 (API 연결)
const searchFriends = async () => {
  const keyword = searchKeyword.value.trim()
  
  if (!keyword) {
    displayToast('검색어를 입력해주세요')
    return
  }

  try {
    // GET 요청: /api/users/search?keyword=검색어
    // 백엔드에서 이름, 닉네임, 이메일 중 하나라도 맞으면 찾아줌
    const response = await api.get('/api/users/search', {
      params: { keyword }
    })
    
    // 응답 데이터에 이미 isFollowing(boolean)이 들어있음!
    searchResults.value = response.data
    hasSearched.value = true
  } catch (error) {
    console.error(error)
    displayToast('검색 중 오류가 발생했습니다.')
  }
}

// ★ 팔로우 요청 (API 연결)
const followUser = async (user) => {
  try {
    // POST 요청: /api/follows/{targetId}
    await api.post(`/api/follows/${user.id}`)
    
    // 성공 시 화면 즉시 갱신 (다시 검색할 필요 없음)
    user.isFollowing = true 
    displayToast(`${user.name}님을 팔로우했습니다.`)
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data || '팔로우 실패'
    displayToast(errorMsg)
  }
}

// ★ 언팔로우 요청 (API 연결)
const unfollowUser = async (user) => {
  try {
    // DELETE 요청: /api/follows/{targetId}
    await api.delete(`/api/follows/${user.id}`)
    
    // 성공 시 화면 즉시 갱신
    user.isFollowing = false
    displayToast(`${user.name}님을 언팔로우했습니다.`)
  } catch (error) {
    console.error(error)
    displayToast('언팔로우 실패')
  }
}

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<style scoped>
/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.friends-view {
  min-height: 100vh;
  background: #F5F7FA;
}

/* Main Content */
.main-content {
  padding: 40px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 28px;
  color: #333333;
  margin-bottom: 30px;
}

/* Search Section */
.search-section {
  margin-bottom: 40px;
}

.search-box {
  display: flex;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  background: #FFFFFF;
  color: #333333;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.search-btn {
  padding: 12px 32px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Results Section */
.results-section {
  margin-top: 30px;
}

.section-title {
  font-size: 20px;
  color: #333333;
  margin-bottom: 20px;
  font-weight: 600;
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

.btn-follow {
  background: #4CAF50;
  color: #FFFFFF;
}

.btn-follow:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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
