import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useUserStore } from "./lib/userStore";
import { auth } from "./lib/firebase";

import Chat from "./components/chat/Chat";
import Details from "./components/detail/Details";
import List from "./components/list/List";
import Landing from "./components/landing/Landing";
import Login from "./components/login/Login";
import CreateAccount from "./components/createAccount/CreateAccount";
import Notification from "./components/notification/Notification";
import AdminChat from "./components/adminChat/AdminChat";
import AdminChatList from "./components/adminChatList/AdminChatList";
import AdminDetails from "./components/adminDetails/AdminDetails";
import AdminLogin from "./components/adminLogin/AdminLogin";
import { useChatStore } from "./lib/chatStore ";

// List of admin emails or UIDs
const ADMIN_EMAILS = ["admin@gmail.com"];
const ADMIN_UIDS = ["PwV8rrkSc2MkBPlZKqI26GPo..."]; // Replace with full UID if needed

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatID } = useChatStore();
  const [showNotification, setShowNotification] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // New loading state for auth check

  // Handle Firebase authentication state and check admin status
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserInfo(user.uid); // Fetch user info
        checkAdminStatus(user);
      } else {
        fetchUserInfo(null); // Clear user info
        setIsAdmin(false); // Reset admin status
      }
      setAuthLoading(false); // Auth check is complete
    });

    return () => unSub();
  }, [fetchUserInfo]);

  // Check if the user is an admin based on email or UID
  const checkAdminStatus = (user) => {
    if (ADMIN_EMAILS.includes(user.email) || ADMIN_UIDS.includes(user.uid)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const ProtectedAdminRoute = ({ children }) => {
    return currentUser && isAdmin ? children : <Navigate to="/admin" />;
  };

  // Display loading spinner while auth state is being determined
  if (isLoading || authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading, Please Wait...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        {showNotification && <Notification message="Successfully logged in!" />}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={currentUser ? <Navigate to="/chat" /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/createAccount" element={<CreateAccount />} />

          {/* User Routes */}
          <Route
            path="/chat"
            element={
              currentUser ? (
                <>
                  <List />
                  {chatID && <Chat />}
                </>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/details" element={currentUser ? <Details /> : <Navigate to="/login" />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/chatList"
            element={
              <ProtectedAdminRoute>
                <>
                  <AdminChatList />
                  <AdminChat />
                </>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/details"
            element={
              <ProtectedAdminRoute>
                <AdminDetails />
              </ProtectedAdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
