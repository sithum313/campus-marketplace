import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { Field, ScreenHeader } from "../components/ui";
import { colors } from "../theme";
import { Conversation } from "../types";

const QUICK = ["Is this still available?", "Can we meet at the library?", "Can you do a lower price?"];

export function ChatPage({
  conversation,
  onSend,
  onBack,
}: {
  conversation: Conversation;
  onSend: (text: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const scroller = useRef<ScrollView>(null);
  const send = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    onSend(clean);
    setText("");
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.top}>
        <ScreenHeader title={conversation.seller} onBack={onBack} />
        <Text style={styles.about} numberOfLines={1}>
          About: {conversation.itemTitle}
        </Text>
      </View>
      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
      >
        {conversation.messages.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 30, gap: 10 }}>
            <Text style={styles.hint}>Start the conversation with {conversation.seller}</Text>
            {QUICK.map((q) => (
              <Pressable key={q} style={styles.quick} onPress={() => send(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          conversation.messages.map((m) => (
            <View key={m.id} style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
              <Text style={{ color: m.mine ? "#FFF" : colors.ink, fontSize: 14 }}>{m.text}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <Field value={text} onChangeText={setText} placeholder="Message…" onSubmitEditing={() => send(text)} />
        </View>
        <Pressable style={styles.send} onPress={() => send(text)} accessibilityLabel="Send">
          <AppIcon name="send" size={18} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingTop: 24, maxWidth: 520, width: "100%", alignSelf: "center" },
  about: { color: colors.muted, fontSize: 12, marginLeft: 54, marginBottom: 8 },
  messages: { padding: 20, gap: 8, maxWidth: 520, width: "100%", alignSelf: "center", flexGrow: 1 },
  hint: { color: colors.muted, fontSize: 13 },
  quick: { backgroundColor: "#FFF", borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 10 },
  quickText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { alignSelf: "flex-start", backgroundColor: "#FFF", borderBottomLeftRadius: 6 },
  composer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    paddingBottom: 18,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  send: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
