import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore"; // Added 'addDoc'
import { db } from "../../lib/firebase";
import "./adminChatlist.css";
import AdminUserInfo from "../adminUserInfo/adminUserInfo";
import { useChatStore } from "../../lib/chatStore ";

const AdminChatList = () => {
  const { changeChat } = useChatStore(); // Use changeChat from your chat store
  const [users, setUsers] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [modalGroupName, setModalGroupName] = useState(""); // State to store the group name for the modal



  // Fetch users and group chats when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, "users"));
        const usersList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const groupSnapshot = await getDocs(collection(db, "groupChats"));
        const groupChatsList = groupSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersList);
        setGroupChats(groupChatsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserSelect = (user) => {
    // Toggle user selection
    setSelectedUsers((prevSelected) =>
      prevSelected.some((u) => u.id === user.id)
        ? prevSelected.filter((u) => u.id !== user.id)
        : [...prevSelected, user]
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroupChat = async () => {
    if (!groupName || selectedUsers.length < 2) {
      alert("Please enter a group name and select at least two users.");
      return;
    }
  
    try {
      await addDoc(collection(db, "groupChats"), {
        groupName,
        members: selectedUsers.map((user) => user.id),
        createdAt: new Date(),
      });
  
      // Show the modal instead of an alert
      setModalGroupName(groupName); // Save the current group name for the modal
      setShowModal(true);
      setGroupName(""); // Reset the input field
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  };
  
  const closeModal = () => {
    setShowModal(false);
  };
  
  const handleSelect = (chat) => {
    setSearchQuery("");
    // Clear search results when a chat is selected
    if (chat.members) {
      changeChat(chat.id, { name: chat.groupName, members: chat.members });
    } else {
      changeChat(chat.id, { name: chat.groupName || chat.user.name, user: chat.user });
    }
  };

  
  return (
    <div className="adminChatList">
      <AdminUserInfo />

      <h2>Create Group Chat</h2>

      <div className="groupNameInput">
        <input
          type="text"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      <div className="searchBar">
        <input
          type="text"
          placeholder="Search users"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="listContainer">
        <div className="section">
          <h3>Users</h3>
          <div className="userList">
            {isLoading ? (
              <p>Loading users...</p>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`userItem ${selectedUsers.some((u) => u.id === user.id) ? "selected" : ""}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <img src={user.avatar || "./../avatar.png"} alt="user avatar" />
                  <span>{user.name}</span>
                </div>
              ))
            ) : (
              <p>No users found.</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Group Chats</h3>
          <div className="groupList">
            {isLoading ? (
              <p>Loading group chats...</p>
            ) : groupChats.length > 0 ? (
              groupChats.map((group) => (
                <div
                  key={group.id}
                  className="userItem groupItem"
                  onClick={() => handleSelect(group)} // Use handleSelect to load group chat
                >
                  <img src="./../group-chat.png" alt="group avatar" />
                  <span>{group.groupName}</span>
                </div>
              ))
            ) : (
              <p>No group chats found.</p>
            )}
          </div>
        </div>
      </div>

      <button onClick={handleCreateGroupChat} className="createGroupButton">
        Create Group Chat
      </button>

      {showModal && (
  <div className="modalOverlay">
    <div className="modalContent">
      <div className="modalHeader">
        <h2>Success!</h2>
      </div>
      <div className="modalBody">
        <p>Group chat <span className="groupNameHighlight">"{modalGroupName}"</span> created successfully!</p>
      </div>
      <div className="modalFooter">
        <button onClick={closeModal} className="closeButton">Close</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default AdminChatList;
