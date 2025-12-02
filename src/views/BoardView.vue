<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()

// 더미 데이터 - 게시글 목록
const posts = ref([
  {
    id: 1,
    title: '다이어트 식단 공유합니다!',
    content: '3개월 동안 10kg 감량한 식단 공유드려요. 아침에는 현미밥과 계란...',
    author: '건강러버',
    likeCount: 24,
    commentCount: 12,
    createdAt: '2025-01-10',
    hasDietPlan: true
  },
  {
    id: 2,
    title: '저염식 레시피 추천',
    content: '혈압이 높으신 분들을 위한 저염식 레시피를 소개합니다...',
    author: '요리왕',
    likeCount: 18,
    commentCount: 8,
    createdAt: '2025-01-12',
    hasDietPlan: false
  },
  {
    id: 3,
    title: '간헐적 단식 후기',
    content: '16:8 간헐적 단식을 3주 동안 실천한 후기입니다...',
    author: '다이어터',
    likeCount: 32,
    commentCount: 15,
    createdAt: '2025-01-14',
    hasDietPlan: false
  },
  {
    id: 4,
    title: '단백질 위주 식단 꿀팁',
    content: '근육량을 늘리기 위한 고단백 식단을 짜보았습니다...',
    author: '헬스매니아',
    likeCount: 45,
    commentCount: 20,
    createdAt: '2025-01-15',
    hasDietPlan: true
  },
])

const selectedPost = ref(null)
const showModal = ref(false)

const openPost = (post) => {
  selectedPost.value = post
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPost.value = null
}

const goToWrite = () => {
  router.push('/board/write')
}
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

        <!-- 게시글 목록 -->
        <div class="post-grid">
          <div
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="openPost(post)"
          >
            <div class="post-card-header">
              <h2 class="post-card-title">{{ post.title }}</h2>
              <span v-if="post.hasDietPlan" class="diet-badge">식단 포함</span>
            </div>
            <p class="post-card-content">{{ post.content }}</p>
            <div class="post-card-footer">
              <div class="post-author">
                <span class="author-icon">👤</span>
                <span class="author-name">{{ post.author }}</span>
                <span class="post-date">{{ post.createdAt }}</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <span class="stat-icon">❤️</span>
                  {{ post.likeCount }}
                </span>
                <span class="stat-item">
                  <span class="stat-icon">💬</span>
                  {{ post.commentCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 게시글 상세 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">✕</button>

        <div class="modal-header">
          <h2 class="modal-title">{{ selectedPost.title }}</h2>
          <div class="modal-meta">
            <span class="modal-author">{{ selectedPost.author }}</span>
            <span class="modal-date">{{ selectedPost.createdAt }}</span>
          </div>
        </div>

        <div class="modal-body">
          <p class="modal-text">{{ selectedPost.content }}</p>

          <div v-if="selectedPost.hasDietPlan" class="diet-plan-preview">
            <h3 class="preview-title">📋 공유된 식단 계획</h3>
            <div class="preview-content">
              <p>식단 계획을 확인하고 내 계획으로 가져올 수 있습니다.</p>
              <button class="copy-diet-btn">식단 가져오기</button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="action-like-btn">❤️ 좋아요 {{ selectedPost.likeCount }}</button>
            <button class="action-share-btn">📤 공유</button>
          </div>

          <!-- 댓글 섹션 -->
          <div class="comments-section">
            <h3 class="comments-title">댓글 {{ selectedPost.commentCount }}</h3>

            <div class="comment-input-box">
              <input type="text" placeholder="댓글을 입력하세요..." class="comment-input" />
              <button class="comment-submit-btn">작성</button>
            </div>

            <div class="comments-list">
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">샐러드러버</span>
                  <span class="comment-date">2025-01-11</span>
                </div>
                <p class="comment-text">정말 유익한 정보네요! 감사합니다 😊</p>
              </div>
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">건강지킴이</span>
                  <span class="comment-date">2025-01-11</span>
                </div>
                <p class="comment-text">저도 따라해볼게요!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.diet-badge {
  padding: 4px 10px;
  background: #E8F5E9;
  color: #4CAF50;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.post-card-content {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  background: #F0F0F0;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #E0E0E0;
}

.modal-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
  padding-right: 40px;
}

.modal-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-author {
  font-size: 15px;
  font-weight: 600;
  color: #4CAF50;
}

.modal-date {
  font-size: 14px;
  color: #888888;
}

.modal-body {
  padding: 24px 32px 32px;
}

.modal-text {
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  margin-bottom: 24px;
}

.diet-plan-preview {
  padding: 20px;
  background: #E8F5E9;
  border-radius: 10px;
  margin-bottom: 24px;
}

.preview-title {
  font-size: 16px;
  font-weight: 700;
  color: #2E7D32;
  margin-bottom: 12px;
}

.preview-content p {
  font-size: 14px;
  color: #2E7D32;
  margin-bottom: 12px;
}

.copy-diet-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.copy-diet-btn:hover {
  background: #45A049;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.action-like-btn,
.action-share-btn {
  padding: 12px 20px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  background: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333333;
}

.action-like-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  background: #E8F5E9;
}

.action-share-btn:hover {
  border-color: #FFA726;
  color: #FFA726;
  background: #FFF3E0;
}

/* 댓글 */
.comments-section {
  border-top: 2px solid #F0F0F0;
  padding-top: 24px;
}

.comments-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

.comment-input-box {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.comment-input:focus {
  border-color: #4CAF50;
}

.comment-submit-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.comment-submit-btn:hover {
  background: #45A049;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.comment-date {
  font-size: 12px;
  color: #888888;
}

.comment-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
}

/* 반응형 */
@media (max-width: 968px) {
  .post-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 100%;
    margin: 0 20px;
  }

  .logout-modal {
    width: 95%;
  }
}
</style>
