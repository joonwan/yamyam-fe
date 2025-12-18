import axios from '@/util/axios'

/**
 * Post API
 * 게시글 관련 API 요청 함수 모음
 */
export const postApi = {
  /**
   * 게시글 목록 조회
   * GET /api/posts
   * @returns {Promise} 게시글 목록
   */
  async getPosts() {
    const response = await axios.get('/api/posts')
    return response.data
  },

  /**
   * 게시글 상세 조회
   * GET /api/posts/{postId}
   * @param {number} postId - 게시글 ID
   * @returns {Promise} 게시글 상세 정보
   */
  async getPost(postId) {
    const response = await axios.get(`/api/posts/${postId}`)
    return response.data
  },

  /**
   * 게시글 생성
   * POST /api/posts
   * @param {object} data - 게시글 데이터
   * @param {string} data.title - 게시글 제목
   * @param {string} data.content - 게시글 내용
   * @param {number|null} data.dietPlanId - 식단 계획 ID (선택)
   * @returns {Promise} 생성된 게시글 ID
   */
  async createPost(data) {
    const response = await axios.post('/api/posts', data)
    // Location 헤더에서 postId 추출
    const location = response.headers.location
    const postId = location ? location.split('/').pop() : null
    return { postId, status: response.status }
  },

  /**
   * 게시글 수정
   * PATCH /api/posts/{postId}
   * @param {number} postId - 게시글 ID
   * @param {object} data - 수정할 데이터
   * @param {string} data.title - 수정할 제목 (선택)
   * @param {string} data.content - 수정할 내용 (선택)
   * @param {number} data.dietPlanId - 식단 계획 ID (선택, -1이면 연관 해제)
   * @returns {Promise}
   */
  async updatePost(postId, data) {
    const response = await axios.patch(`/api/posts/${postId}`, data)
    return response.data
  },

  /**
   * 게시글 삭제
   * DELETE /api/posts/{postId}
   * @param {number} postId - 게시글 ID
   * @returns {Promise}
   */
  async deletePost(postId) {
    const response = await axios.delete(`/api/posts/${postId}`)
    return response.data
  },

  /**
   * 게시글 좋아요
   * POST /api/posts/{postId}/like
   * @param {number} postId - 게시글 ID
   * @returns {Promise}
   */
  async likePost(postId) {
    const response = await axios.post(`/api/posts/${postId}/like`)
    return response.data
  },

  /**
   * 게시글 좋아요 취소
   * POST /api/posts/{postId}/unlike
   * @param {number} postId - 게시글 ID
   * @returns {Promise}
   */
  async unlikePost(postId) {
    const response = await axios.post(`/api/posts/${postId}/unlike`)
    return response.data
  }
}
