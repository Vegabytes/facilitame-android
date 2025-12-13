import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { fetchWithAuth } from "./../../../../utils/api";
import { GiftedChat, Bubble, Time } from "react-native-gifted-chat";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [chat, setChat] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const generateMessageId = () => {
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
    );
  };

  useFocusEffect(
    useCallback(() => {
      setChat([]);
      setCurrentUser(null);
      setError(null);
      setLoading(true);
      fetchChat();
    }, [id]),
  );

  async function fetchChat() {
    try {
      const response = await fetchWithAuth("app-request-get-chat", {
        request_id: id,
      });
      if (response && response.data.chat) {
        setCurrentUser({
          _id: response.data.current_user_id,
          name: response.data.current_user_name,
        });

        const messages = response.data.chat.map((item) => ({
          _id: item._id,
          text: item.text,
          createdAt: new Date(item.createdAt),
          user: {
            _id: item.user.id,
            name: item.user.name,
          },
        }));
        setChat(messages.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setError("No se ha podido obtener info sobre la solicitud");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const onSend = useCallback((newMessages = []) => {
    setChat((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );

    fetchWithAuth("app-chat-message-store", {
      text: newMessages[0].text,
      request_id: id,
    });
  }, []);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#1E4C59",
          },
          left: {
            backgroundColor: "#30D4D1",
          },
        }}
      />
    );
  };

  const renderTime = (props) => {
    return (
      <Time
        {...props}
        timeTextStyle={{
          left: { color: "#333" },
          right: { color: "#CCC" },
        }}
      />
    );
  };

  const renderAvatar = (props) => {
    if (props.currentMessage.user._id !== currentUser?._id) {
      return (
        <Image
          source={require("./../../../../assets/facilitame-logo-principal-verde.png")}
          style={{ width: 27, height: 27, borderRadius: 20, marginLeft: 8 }}
        />
      );
    }
    return null;
  };

  if (loading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={chat}
        onSend={(messages) => onSend(messages)}
        user={currentUser}
        placeholder="Escribe un mensaje..."
        renderBubble={renderBubble}
        renderAvatar={renderAvatar}
        renderTime={renderTime}
        containerStyle={{ backgroundColor: "#fff" }}
        messagesContainerStyle={{ backgroundColor: "#fff" }}
        messageIdGenerator={generateMessageId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
