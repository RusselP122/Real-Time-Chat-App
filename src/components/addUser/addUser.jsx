import { collection, query, where, getDocs, setDoc, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Ensure your Firebase config is correct
import "./addUser.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [searchError, setSearchError] = useState("");

  const { currentUser } = useUserStore(); // Properly use the hook to fetch current user data

  const handleSearch = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get("name"); // Fetch 'name' from the form

    try {
      const userRef = collection(db, "users"); // Reference to the 'users' collection
      const q = query(userRef, where("name", "==", name)); // Query to match 'name'
      const querySnapshot = await getDocs(q); // Execute the query

      if (!querySnapshot.empty) {
        const matchedUser = querySnapshot.docs[0].data(); // Get the first matched document's data
        setUser({ ...matchedUser, id: querySnapshot.docs[0].id }); // Set the user state with the matched user's data
        setSearchError(""); // Clear any previous error
      } else {
        setUser(null); // Reset the user if no match is found
        setSearchError("No user found with the provided name.");
      }
    } catch (err) {
      console.error("Error searching for user:", err);
      setSearchError("An error occurred while searching. Please try again.");
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) {
      alert("Both the current user and the searched user must exist.");
      return;
    }
  
    try {
      // Create a unique chat ID
      const chatID = `${currentUser.uid}_${user.uid}`;
  
      // 1. Create a new chat document in `chats`
      const chatRef = doc(db, "chats", chatID);
      await setDoc(chatRef, {
        createdAt: serverTimestamp(),
        messages: [],
        participants: [currentUser.uid, user.uid], // Ensure both users are participants
      });
  
      console.log("New chat created with ID:", chatID);
  
      // Prepare chat details
      const chatDetailsForCurrentUser = {
        chatID,
        lastMessage: "",
        receiverId: user.uid, // Receiver is the user being added
        updatedAt: serverTimestamp(),
      };
  
      const chatDetailsForOtherUser = {
        chatID,
        lastMessage: "",
        receiverId: currentUser.uid, // Receiver is the current user
        updatedAt: serverTimestamp(),
      };
  
      // 2. Update the current user's `userChats`
      const currentUserChatRef = doc(db, "userChats", currentUser.uid);
      await updateDoc(currentUserChatRef, {
        [chatID]: chatDetailsForCurrentUser,
      });
  
      // 3. Update the added user's `userChats`
      const searchedUserChatRef = doc(db, "userChats", user.uid);
      await updateDoc(searchedUserChatRef, {
        [chatID]: chatDetailsForOtherUser,
      });
  
      console.log("Both users' userChats updated successfully.");
      alert("Chat added successfully!");
    } catch (err) {
      console.error("Error adding chat:", err.message);
      alert("An error occurred while adding the chat. Please try again.");
    }
  };
  
  
  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Name" name="name" required />
        <button type="submit">Search</button>
      </form>

      {searchError && <p className="error">{searchError}</p>}

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="User Avatar" />
            <span>{user.name}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
	