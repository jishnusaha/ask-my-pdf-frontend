import { ICustomError, IPaginatedResponse } from '@/types/api';
import { IChat, IChatMessage, IDocumentChunk } from '@/types/chat';
import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
}) as BaseQueryFn<string | FetchArgs, unknown, ICustomError>;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['chats', 'chat-messages', 'chat-chunks'],
  endpoints: build => ({
    // ============================================
    // CHAT ENDPOINTS
    // ============================================
    getChatList: build.query<
      IPaginatedResponse<IChat>,
      {
        offset?: number;
        limit?: number;
      }
    >({
      query: queryParams => ({
        url: `/chats/api/`,
        method: 'GET',
        params: queryParams,
      }),
      providesTags: ['chats'],
    }),

    createChat: build.mutation<
      IChat,
      {
        data: FormData;
      }
    >({
      query: ({ data }) => ({
        url: `/chats/api/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, error) => (error ? [] : ['chats']),
    }),

    reuploadChatPdf: build.mutation<
      IChat,
      {
        chatId: number;
        data: FormData;
      }
    >({
      query: ({ chatId, data }) => ({
        url: `/chats/api/${chatId}/reupload/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, error, { chatId }) =>
        error ? [] : [{ type: 'chat-chunks', id: chatId }],
    }),

    getChatMessages: build.query<
      IPaginatedResponse<IChatMessage>,
      {
        chatId: number;
        offset?: number;
        limit?: number;
      }
    >({
      query: ({ chatId, ...queryParams }) => ({
        url: `/chats/api/${chatId}/messages/`,
        method: 'GET',
        params: queryParams,
      }),
      providesTags: (_, __, { chatId }) => [
        { type: 'chat-messages', id: chatId },
      ],
    }),

    sendMessage: build.mutation<
      IChatMessage[],
      {
        chatId: number;
        question: string;
      }
    >({
      query: ({ chatId, question }) => ({
        url: `/chats/api/${chatId}/messages/`,
        method: 'POST',
        body: { question },
      }),
      invalidatesTags: (_, error, { chatId }) =>
        error ? [] : [{ type: 'chat-messages', id: chatId }],
    }),

    getChatChunks: build.query<
      IPaginatedResponse<IDocumentChunk>,
      {
        chatId: number;
        offset?: number;
        limit?: number;
      }
    >({
      query: ({ chatId, ...queryParams }) => ({
        url: `/chats/api/${chatId}/chunks/`,
        method: 'GET',
        params: queryParams,
      }),
      providesTags: (_, __, { chatId }) => [
        { type: 'chat-chunks', id: chatId },
      ],
    }),
  }),
});

export const {
  useGetChatListQuery,
  useCreateChatMutation,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useReuploadChatPdfMutation,
  useGetChatChunksQuery,
} = api;
