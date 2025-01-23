import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// List of allowed admin emails or UIDs
const ADMIN_EMAILS = ["admin@gmail.com"];
const ADMIN_UIDS = ["PwV8rrkSc2MkBPIzKql26GPoVKh1"]; // Replace with the full UID if needed

export const useUserStore = create((set) => ({
  currentUser: null,
  isAdmin: false,
  isLoading: true,

  // Set the loading state
  setLoading: (loading) => set({ isLoading: loading }),

  // Set the current user
  setCurrentUser: (user) => set({ currentUser: user }),

  // Fetch user info from Firestore and check admin status
  fetchUserInfo: async (uid) => {
    if (!uid) {
      set({ currentUser: null, isAdmin: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true }); // Set loading to true when starting the fetch

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const isAdmin = ADMIN_EMAILS.includes(userData.email) || ADMIN_UIDS.includes(uid);

        set({
          currentUser: {
            uid,
            email: userData.email,
            name: userData.name || "Guest",
          },
          isAdmin,
          isLoading: false,
        });
      } else {
        set({
          currentUser: null,
          isAdmin: false,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      set({ currentUser: null, isAdmin: false, isLoading: false });
    }
  },
}));
