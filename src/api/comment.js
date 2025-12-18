import axios from '@/util/axios'

/**
 * Comment API
 * 댓글 관련 API 요청 함수 모음
 */
export const commentApi = {
  /**
   * 댓글 등록
   * POST /api/posts/{postId}/comments
   * @param {number} postId - 게시글 ID
   * @param {object} data - 댓글 데이터
   * @param {string} data.content - 댓글 내용
   * @returns {Promise}
   */
  async createComment(postId, data) {
    const response = await axios.post(`/api/posts/${postId}/comments`, data)
    return response.data
  },

  /**
   * 댓글 수정
   * PATCH /api/posts/{postId}/comments/{commentId}
   * @param {number} postId - 게시글 ID
   * @param {number} commentId - 댓글 ID
   * @param {object} data - 수정할 데이터
   * @param {string} data.newContent - 수정할 댓글 내용
   * @returns {Promise}
   */
  async updateComment(postId, commentId, data) {
    const response = await axios.patch(`/api/posts/${postId}/comments/${commentId}`, data)
    return response.data
  },

  /**
   * 댓글 삭제
   * DELETE /api/posts/{postId}/comments/{commentId}
   * @param {number} postId - 게시글 ID
   * @param {number} commentId - 댓글 ID
   * @returns {Promise}
   */
  async deleteComment(postId, commentId) {
    const response = await axios.delete(`/api/posts/${postId}/comments/${commentId}`)
    return response.data
  }
}
