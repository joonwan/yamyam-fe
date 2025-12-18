<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { postApi } from '@/api'

const router = useRouter()

// 게시글 목록
const posts = ref([])
const loading = ref(false)
const error = ref(null)

// 게시글 목록 조회
const fetchPosts = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await postApi.getPosts()
    posts.value = data
  } catch (err) {
    console.error('게시글 목록 조회 실패:', err)
    error.value = '게시글을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 게시글 상세로 이동 (모달 대신 페이지 이동)
const goToPost = (postId) => {
  router.push(`/board/${postId}`)
}

// 글쓰기 페이지로 이동
const goToWrite = () => {
  router.push('/board/write')
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="board-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="board" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">커뮤니티 게시판</h1>
          <button class="write-btn" @click="goToWrite">✏️ 글쓰기</button>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <p class="loading-text">게시글을 불러오는 중...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
          <button class="retry-btn" @click="fetchPosts">다시 시도</button>
        </div>

        <!-- 게시글 목록 -->
        <div v-else-if="posts.length > 0" class="post-grid">
          <div
            v-for="post in posts"
            :key="post.postId"
            class="post-card"
            @click="goToPost(post.postId)"
          >
            <div class="post-card-header">
              <h2 class="post-card-title">{{ post.title }}</h2>
            </div>
            <div class="post-card-footer">
              <div class="post-author">
                <span class="author-icon">👤</span>
                <span class="author-name">{{ post.authorNickname }}</span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <span class="stat-icon">❤️</span>
                  {{ post.likeCount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-container">
          <p class="empty-text">아직 게시글이 등록되지 않았습니다.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.board-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

.write-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.write-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 로딩 및 에러 */
.loading-container,
.error-container,
.empty-container {
  text-align: center;
  padding: 80px 20px;
}

.loading-text,
.error-text,
.empty-text {
  font-size: 16px;
  color: #888888;
  margin-bottom: 20px;
}

.retry-btn,
.empty-write-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover,
.empty-write-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 게시글 그리드 */
.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.post-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.post-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  flex: 1;
}

.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-icon {
  font-size: 16px;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.post-date {
  font-size: 12px;
  color: #AAAAAA;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666666;
}

.stat-icon {
  font-size: 14px;
}

/* 반응형 */
@media (max-width: 968px) {
  .post-grid {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 20px;
  }
}
</style>
