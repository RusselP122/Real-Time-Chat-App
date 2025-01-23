import { create } from "zustand";
import { useUserStore } from "./userStore";

// List of allowed admin emails or UIDs
const ADMIN_EMAILS = ["admin@gmail.com"];
const ADMIN_UIDS = ["PwV8rrkSc2MkBPlZKqI26GPo4c3bEXAMPLE"];

export const useChatStore = create((set) => ({
  chatID: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  isAdminChat: false,
  isGroupChat: false, // New flag to check if it's a group chat

  // Function to change the chat
  changeChat: (chatID, user, isGroupChat = false) => {
    const currentUser = useUserStore.getState().currentUser;

    if (!currentUser || !user) {
      return; // Early exit if no current user or chat user
    }

    const isBlockedByUser = user.blocked?.includes(currentUser.uid);
    const isBlockingUser = currentUser.blocked?.includes(user.uid);

    // Check if the user or currentUser is an admin
    const isAdminChat = ADMIN_EMAILS.includes(user.email) || ADMIN_UIDS.includes(user.uid);

    set({
      chatID,
      user,
      isCurrentUserBlocked: isBlockedByUser,
      isReceiverBlocked: isBlockingUser,
      isAdminChat,
      isGroupChat, // Set the flag for group chat
    });
  },

  // Toggle block state for the current user and receiver
  toggleBlock: () => {
    set((state) => ({
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },

  // Optionally, reset the chat state (e.g., when a user logs out or switches chats)
  resetChat: () => {
    set({
      chatID: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      isAdminChat: false,
      isGroupChat: false,
    });
  },
}));
