// 聊天消息
export interface IChat {
  question: string;
  // 流式分片拼接存储，实现实时打字机效果
  streamingAnswer?: string;
}

// 流式数据结构（对应后端SSE推送格式）
export interface IStreamData {
  code: number;
  msg: string;
  data: {
    conversationId: string;
    partialAnswer?: string;
  };
}
