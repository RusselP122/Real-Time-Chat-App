import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "../../addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { onSnapshot, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore ";

const ChatList = () => {
  const [addMode, setAddMode] = useState(false);
  const [chats, setChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch user chats
    const unSubUserChats = onSnapshot(doc(db, "userChats", currentUser.uid), async (docSnapshot) => {
      if (!docSnapshot.exists()) {
        setChats([]);
        setIsLoading(false);
        return;
      }

      const data = docSnapshot.data();
      const chatItems = Object.entries(data).map(([key, value]) => ({
        chatId: key,
        ...value,
      }));

      const uniqueChats = [];
      const seenReceiverIds = new Set();

      for (const chat of chatItems) {
        if (!seenReceiverIds.has(chat.receiverId)) {
          seenReceiverIds.add(chat.receiverId);
          uniqueChats.push(chat);
        }
      }

      const promises = uniqueChats.map(async (item) => {
        try {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          return new Promise((resolve) => {
            const chatDocRef = doc(db, "chats", item.chatId);
            onSnapshot(chatDocRef, (chatSnapshot) => {
              const chatData = chatSnapshot.data();
              const messages = chatData?.messages || [];
              const lastMessage = messages[messages.length - 1];

              let latestMessage = "";
              let senderName = "";

              if (lastMessage) {
                if (lastMessage.img) {
                  latestMessage = "Sent an image";
                } else if (lastMessage.file) {
                  latestMessage = "Sent a file";
                } else if (lastMessage.video) {  // Check for a video message
                  latestMessage = "Sent a video";
                } else {
                  latestMessage =
                    lastMessage.text.length > 30
                      ? `${lastMessage.text.substring(0, 30)}...`
                      : lastMessage.text;
                }
              
                senderName =
                  lastMessage.senderId === currentUser.uid ? "You" : userDocSnap.data()?.name || "Unknown";
              }
              

              const user = userDocSnap.exists() ? userDocSnap.data() : null;

              resolve({ ...item, user, latestMessage, senderName, updatedAt: lastMessage?.createdAt });
            });
          });
        } catch (error) {
          console.error("Error fetching chat details:", error);
          return { ...item, latestMessage: "", senderName: "" };
        }
      });

      try {
        const chatData = await Promise.all(promises);
        const sortedChats = chatData
          .filter((chat) => chat.user)
          .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

        setChats(sortedChats);
      } catch (error) {
        console.error("Error processing chat data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    // Fetch group chats where the current user is a member
    const fetchGroupChats = async () => {
      try {
        const groupChatsSnapshot = await getDocs(collection(db, "groupChats"));
        const groupChatsList = groupChatsSnapshot.docs
          .map((doc) => ({ chatId: doc.id, ...doc.data() }))
          .filter((group) => group.members.includes(currentUser.uid));

        // Get last message for each group chat
        const groupPromises = groupChatsList.map(async (group) => {
          try {
            const groupChatRef = doc(db, "groupChats", group.chatId);
            const groupChatSnap = await getDoc(groupChatRef);
            const groupChatData = groupChatSnap.data();
            const messages = groupChatData?.messages || [];
            const lastMessage = messages[messages.length - 1];

            let latestMessage = "";
            let senderName = "";

            if (lastMessage) {
              if (lastMessage.img) {
                latestMessage = "Sent an image";
              } else if (lastMessage.file) {
                latestMessage = "Sent a file";
              } else {
                latestMessage =
                  lastMessage.text.length > 30
                    ? `${lastMessage.text.substring(0, 30)}...`
                    : lastMessage.text;
              }

              senderName =
                lastMessage.senderId === currentUser.uid ? "You" : groupChatData?.members.find((memberId) => memberId !== currentUser.uid);
            }

            return { ...group, latestMessage, senderName, updatedAt: lastMessage?.createdAt };
          } catch (error) {
            console.error("Error fetching group chat details:", error);
            return group;
          }
        });

        const groupChatsData = await Promise.all(groupPromises);
        setGroupChats(groupChatsData);
      } catch (error) {
        console.error("Error fetching group chats:", error);
      }
    };

    fetchGroupChats();

    return () => unSubUserChats();
  }, [currentUser]);

  const handleSelect = async (chat) => {
    setSearchQuery("");
    setSearchResults([]);
    changeChat(chat.chatId, chat.user || { name: chat.groupName });

    if (chat.members) {
      changeChat(chat.chatId, { name: chat.groupName, members: chat.members });
    } else {
      changeChat(chat.chatId, chat.user);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const userRef = collection(db, "users");
    const q = query(userRef, where("name", ">=", query), where("name", "<=", query + "\uf8ff"));
    const querySnapshot = await getDocs(q);

    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSearchResults(results);
  };

  const handleBlur = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="search icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch(searchQuery);
            }}
            onBlur={handleBlur}
          />
        </div>
        <img
          src={addMode ? "/minus.png" : "/plus.png"}
          alt={addMode ? "minus icon" : "plus icon"}
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      <div className="items">
        <h3>Private Chats</h3>
        {isLoading ? (
          <p>Loading chats...</p>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)}>
              <img src={chat.user?.avatar || "./avatar.png"} alt="user avatar" />
              <div className="texts">
                <span>{chat.user?.name || chat.senderName}</span>
                <p>
                  {chat.senderName && (chat.senderName === "You" ? "You: " : `${chat.senderName}: `)}
                  {chat.latestMessage || "No messages yet"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No private chats available.</p>
        )}
          <h3>Group Chats</h3>
          {groupChats.length > 0 ? (
            groupChats.map((group) => (
              <div className="item" key={group.chatId} onClick={() => handleSelect(group)}>
                <img src={group.user?.avatar || "./avatar.png"} alt="user avatar" /> {/* Display user's avatar */}
                <div className="texts">
                  <span>{group.groupName || "Unnamed Group"}</span> {/* Use groupName for group label */}
                  <p>
                
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>No group chats available.</p>
          )}
      </div>

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
