import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BottomNavigation from '../components/BottomNavigation';
import { useProfile } from '../context/ProfileContext';
import { API_BASE_URL } from '../constants/api';

interface ConversationUser {
  id: string;
  fullName: string;
  profileImage?: string | null;
}

interface Conversation {
  id: string;
  otherUser: ConversationUser;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatListScreen({ navigation }: any) {
  const [conversationData, setConversationData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuth();
  const { unreadCounts, socket, totalUnreadCount } = useSocket();
  const { setShowProfile } = useProfile();

  const conversations = useMemo(() => {
    return [...conversationData]
      .map((conversation) => ({
        ...conversation,
        unreadCount: Object.prototype.hasOwnProperty.call(unreadCounts, conversation.otherUser.id)
          ? unreadCounts[conversation.otherUser.id]
          : conversation.unreadCount,
      }))
      .sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
  }, [conversationData, unreadCounts]);

  const fetchConversations = useCallback(async () => {
    try {
      if (!user?.id || !token) {
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.conversations) {
        const formatted = (response.data.conversations as Conversation[])
          .filter((conversation) => conversation.otherUser?.id && conversation.otherUser.id !== user.id)
          .map((conversation) => ({
            id: conversation.id,
            otherUser: {
              id: conversation.otherUser.id,
              fullName: conversation.otherUser.fullName,
              profileImage: conversation.otherUser.profileImage,
            },
            lastMessage: conversation.lastMessage,
            lastMessageTime: conversation.lastMessageTime,
            unreadCount: conversation.unreadCount || 0,
          }));

        setConversationData(formatted);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket || !user?.id) {
      return;
    }

    const handleMessageReceive = (data: any) => {
      const senderId = data.senderId || data.sender?.id;
      const receiverId = data.receiverId || data.recipient?.id;

      if (!senderId || !receiverId) {
        return;
      }

      const otherUserId = senderId === user.id ? receiverId : senderId;
      const otherUser = senderId === user.id ? data.receiver || data.recipient : data.sender;

      if (!otherUserId || !otherUser) {
        return;
      }

      const lastMessage = data.content || data.text || '';
      const lastMessageTime = (data.createdAt || data.timestamp || new Date()).toString();

      setConversationData((prev) => {
        const nextConversation: Conversation = {
          id: otherUserId,
          otherUser: {
            id: otherUser.id,
            fullName: otherUser.fullName,
            profileImage: otherUser.profileImage,
          },
          lastMessage,
          lastMessageTime,
          unreadCount: senderId === user.id ? 0 : 1,
        };

        const existingIndex = prev.findIndex(
          (conversation) => conversation.otherUser.id === otherUserId
        );

        if (existingIndex === -1) {
          return [nextConversation, ...prev];
        }

        const next = [...prev];
        next.splice(existingIndex, 1);
        return [nextConversation, ...next];
      });
    };

    socket.on('message:receive', handleMessageReceive);

    return () => {
      socket.off('message:receive', handleMessageReceive);
    };
  }, [socket, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleConversationPress = useCallback((otherUser: ConversationUser) => {
    navigation.navigate('ChatScreen', { otherUser });
  }, [navigation]);

  const renderConversation = useCallback(({ item }: { item: Conversation }) => {
    const timeAgo = getTimeAgo(item.lastMessageTime);
    const isUnread = item.unreadCount > 0;
    return (
      <TouchableOpacity
        style={[styles.conversationItem, isUnread && styles.conversationItemUnread]}
        onPress={() => handleConversationPress(item.otherUser)}
      >
        <View style={styles.avatarContainer}>
          {item.otherUser.profileImage ? (
            <Image
              source={{ uri: item.otherUser.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color="#ffffff"
              />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {Math.min(item.unreadCount, 9)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <Text style={styles.userName}>{item.otherUser.fullName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.conversationMeta}>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleConversationPress]);

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="chat-outline"
        size={64}
        color="#6b7280"
      />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubText}>
        Start a conversation by messaging someone
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff3b30" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff3b30"
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyListContent : { paddingBottom: 120 }
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        removeClippedSubviews
      />
      <BottomNavigation
        navigation={navigation}
        activeTab="chat"
        onProfilePress={() => setShowProfile(true)}
        unreadMessageCount={totalUnreadCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F1115',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  conversationContent: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 12,
    color: '#9ca3af',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#6b7280',
  },
  conversationItemUnread: {
    backgroundColor: 'rgba(255,59,48,0.06)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
