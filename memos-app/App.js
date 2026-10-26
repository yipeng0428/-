import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import * as QuickActions from 'expo-quick-actions';

export default function App() {
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState([
    { id: 1, title: 'Ideas for the next season', body: 'A few thoughts on making space for slower mornings, long walks, and more time offline.', date: 'Today, 9:42 AM' },
    { id: 2, title: 'Q4 launch checklist', body: 'Finalize the homepage copy, share the beta link with the team.', date: 'Yesterday' }
  ]);

  useEffect(() => {
    // Register the Quick Action
    QuickActions.setItems([
      {
        id: 'quick-note',
        title: 'Quick Note',
        subtitle: 'Capture a thought instantly',
        icon: 'compose', // iOS specific
        params: { href: '/quick-note' }
      }
    ]);
  }, []);

  // Listen to Quick Actions
  useEffect(() => {
    const subscription = QuickActions.addListener((action) => {
      if (action.id === 'quick-note') {
        setQuickNoteOpen(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const saveNote = () => {
    if (!draft.trim()) return;
    setNotes([{ id: Date.now(), title: 'Quick Note', body: draft.trim(), date: 'Just now' }, ...notes]);
    setDraft('');
    setQuickNoteOpen(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="px-5 pt-5 pb-3">
        <Text className="text-3xl font-bold text-[#22231f]">memos</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        {notes.map(note => (
          <View key={note.id} className="bg-white p-5 rounded-2xl mb-3 shadow-sm border border-[#e9e9e4]">
            <Text className="text-[15px] font-bold">{note.title}</Text>
            <Text className="mt-2 text-sm text-[#777971] leading-5">{note.body}</Text>
            <Text className="mt-4 text-[11px] text-[#b0b1aa]">{note.date}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-10 right-5 bg-[#23251f] px-6 py-4 rounded-full shadow-lg flex-row items-center"
        onPress={() => setQuickNoteOpen(true)}
      >
        <Text className="text-white font-bold">Quick Note</Text>
      </TouchableOpacity>

      <Modal visible={quickNoteOpen} transparent={true} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-[#fbfbf8] p-6 rounded-t-3xl min-h-[300px]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold">Quick note</Text>
              <TouchableOpacity onPress={() => setQuickNoteOpen(false)} className="bg-[#eeeeea] w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-[#777971] font-bold">X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              autoFocus
              multiline
              value={draft}
              onChangeText={setDraft}
              placeholder="What's on your mind?"
              className="flex-1 text-base text-[#22231f] min-h-[120px] bg-white border border-[#e5e5df] rounded-xl p-4 align-top"
            />

            <TouchableOpacity
              className="mt-5 bg-[#23251f] py-3 rounded-xl items-center"
              onPress={saveNote}
            >
              <Text className="text-white font-bold">Save note</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
