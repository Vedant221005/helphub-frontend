import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS, API_BASE_URL, API_ENDPOINTS } from '../constants/api';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  timestamp: string | Date;
}

export default function ChatScreen({ navigation, route }: any) {
  const { otherUser } = route.params || {};
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef('');
  const activeChatUserIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputBottom = useRef(new Animated.Value(0)).current;

  const { user, token } = useAuth();
  const { socket, emit, on, off, clearUnreadCount, setActiveChatUser } = useSocket();

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      currentUserIdRef.current = user.id;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user?.id || !otherUser?.id || !token) {
      return;
    }

    currentUserIdRef.current = user.id;
    setCurrentUserId(user.id);
    activeChatUserIdRef.current = otherUser.id;
    setMessages([]);

    fetchMessageHistory();
    setupSocketListeners();

    // Mark this chat as active (so unread increments are suppressed) and clear unread
    setActiveChatUser(otherUser.id);
    clearUnreadCount(otherUser.id);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_RECEIVE);
      off(SOCKET_EVENTS.TYPING_START);
      off(SOCKET_EVENTS.TYPING_STOP);
      // Clear active chat on unmount
      setActiveChatUser(null);
      activeChatUserIdRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, user?.id, otherUser?.id, token]);

  // Keyboard listeners to animate input above keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const h = e.endCoordinates ? e.endCoordinates.height : 0;
      setKeyboardHeight(h);
      Animated.timing(inputBottom, {
        toValue: h,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      scrollToBottom();
    };

    const onHide = () => {
      setKeyboardHeight(0);
      Animated.timing(inputBottom, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [inputBottom]);


  const fetchMessageHistory = async () => {
    try {
      setLoading(true);
      const chatPartnerId = otherUser?.id;
      const authToken = token;
      const url = `${API_BASE_URL}${API_ENDPOINTS.MESSAGES.GET_HISTORY.replace(':userId', chatPartnerId)}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (activeChatUserIdRef.current !== chatPartnerId) {
        return;
      }

      if (response.data.success) {
        // Normalize backend message shape to UI shape
        const msgs = (response.data.messages || [])
          .filter((m: any) => {
            const senderId = m.senderId || m.sender?.id;
            const recipientId = m.receiverId || m.recipient?.id;

            return (
              !!senderId &&
              !!recipientId &&
              !!otherUser?.id &&
              ((senderId === currentUserIdRef.current && recipientId === otherUser.id) ||
                (senderId === otherUser.id && recipientId === currentUserIdRef.current))
            );
          })
          .map((m: any) => ({
          id: m.id,
          text: m.content,
          senderId: m.senderId,
          recipientId: m.receiverId,
          timestamp: m.createdAt,
          }));

        setMessages(msgs);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    on(SOCKET_EVENTS.MESSAGE_RECEIVE, (data: any) => {
      const senderId = data.senderId || data.sender?.id;
      const recipientId = data.receiverId || data.recipient?.id;
      const messageId = data.id?.toString();

      const isRelevantChatMessage =
        !!senderId &&
        !!recipientId &&
        !!otherUser?.id &&
        ((senderId === currentUserIdRef.current && recipientId === otherUser.id) ||
          (senderId === otherUser.id && recipientId === currentUserIdRef.current));

      if (!isRelevantChatMessage) {
        return;
      }

      setMessages((prev) => {
        if (messageId && prev.some((message) => message.id?.toString() === messageId)) {
          return prev;
        }

        return [
          ...prev,
          {
            id: messageId || Date.now().toString(),
            text: data.content || data.text,
            senderId,
            recipientId,
            timestamp: data.createdAt || data.timestamp,
          },
        ];
      });
      scrollToBottom();
    });

    on(SOCKET_EVENTS.TYPING_START, () => {
      setIsTyping(true);
    });

    on(SOCKET_EVENTS.TYPING_STOP, () => {
      setIsTyping(false);
    });
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emit(SOCKET_EVENTS.TYPING_START, {
      recipientId: otherUser?.id,
    });

    typingTimeoutRef.current = setTimeout(() => {
      emit(SOCKET_EVENTS.TYPING_STOP, {
        recipientId: otherUser?.id,
      });
    }, 3000);
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const messageData = {
      text: messageText,
      recipientId: otherUser?.id,
      timestamp: new Date(),
    };

    try {
      const authToken = token;
      const url = `${API_BASE_URL}${API_ENDPOINTS.MESSAGES.SEND}`;
      const resp = await axios.post(url, messageData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // If server returned message, normalize and append; otherwise append optimistic message
      const serverMsg = resp.data?.message;
      if (serverMsg) {
        const mapped = {
          id: serverMsg.id?.toString(),
          text: serverMsg.content,
          senderId: serverMsg.senderId,
          recipientId: serverMsg.receiverId,
          timestamp: serverMsg.createdAt,
        };
        setMessages((prev) =>
          prev.some((message) => message.id?.toString() === mapped.id)
            ? prev
            : [...prev, mapped]
        );
        emit(SOCKET_EVENTS.MESSAGE_SEND, serverMsg);
      } else {
        emit(SOCKET_EVENTS.MESSAGE_SEND, messageData);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: messageText,
            senderId: currentUserId,
            recipientId: otherUser?.id,
            timestamp: new Date(),
          },
        ]);
      }

      setMessageText('');
      scrollToBottom();

      emit(SOCKET_EVENTS.TYPING_STOP, {
        recipientId: otherUser?.id,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color="#ffffff"
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {otherUser?.fullName || otherUser?.name || 'Chat'}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesContainer, { paddingBottom: keyboardHeight + 100 }]}
        onContentSizeChange={() => scrollToBottom()}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        windowSize={8}
        removeClippedSubviews
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {otherUser?.fullName || otherUser?.name || 'User'} is typing
          </Text>
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      )}

      {/* Message Input - animated to follow keyboard height; removed attach (+) button */}
      <Animated.View style={[styles.inputContainer, { position: 'absolute', left: 0, right: 0, bottom: inputBottom }]}>
        <View style={styles.inputRowNoAttach}>
          <TextInput
            style={styles.inputNoAttach}
            placeholder="Type a message..."
            placeholderTextColor="#6b7280"
            value={messageText}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={messageText.trim() ? '#ffffff' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      {/* BottomNavigation intentionally omitted on ChatScreen */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  ownMessage: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#ff3b30',
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 16,
  },
  otherBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 16,
  },
  messageText: {
    fontSize: 14,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  typingText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 28,
    backgroundColor: '#0F1115',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputRowNoAttach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputNoAttach: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 59, 48, 0.4)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
