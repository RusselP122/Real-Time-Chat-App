import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { doc, updateDoc, onSnapshot, getDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDistanceToNow } from "date-fns";
import upload from "../../lib/upload";
import AdminDetails from "../adminDetails/AdminDetails";
import { useChatStore } from "../../lib/chatStore ";

const AdminChat = () => {
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);
  const [attachment, setAttachment] = useState({ file: null, url: "" });
  const [modalImage, setModalImage] = useState(null);
  const [open, setOpen] = useState(true);
  
  const endRef = useRef(null);
  const { currentUser } = useUserStore();
  const { chatID, groupChat, user } = useChatStore();

  // Scroll to the bottom when chat updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Real-time Firestore listener for chat data
  useEffect(() => {
    if (!chatID) return;

    const unSub = onSnapshot(doc(db, groupChat ? "groupChats" : "chats", chatID), (docSnap) => {
      const chatData = docSnap.data();
      if (chatData) {
        setChat(chatData);
      }
    });

    return () => unSub();
  }, [chatID, groupChat]);

  // Handle file attachment
  const handleAttachment = (e) => {
    if (e.target.files[0]) {
      setAttachment({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment({ file: null, url: "" });
  };

  const handleImageClick = (imgUrl) => {
    setModalImage(imgUrl);
  };

  const handleSend = async () => {
    if (!text.trim() && !attachment.file) return;

    let uploadUrl = null;
    let fileMetadata = null;

    if (attachment.file) {
      try {
        uploadUrl = await upload(attachment.file);
        const isImage = attachment.file.type.startsWith("image/");
        fileMetadata = isImage
          ? { img: uploadUrl }
          : { file: { url: uploadUrl, name: attachment.file.name } };
      } catch (error) {
        console.error("Error uploading attachment:", error);
        return;
      }
    }

    const message = {
      senderId: currentUser.uid,
      text,
      createdAt: new Date(),
      ...fileMetadata,
    };

    try {
      if (groupChat) {
        await updateDoc(doc(db, "groupChats", chatID), {
          messages: arrayUnion(message),
        });

        // Update the last message for all group members
        chat.members.forEach(async (memberId) => {
          const userChatsRef = doc(db, "userChats", memberId);
          const userChatSnap = await getDoc(userChatsRef);

          if (userChatSnap.exists()) {
            const userChatsData = userChatSnap.data();
            const groupChats = userChatsData.groupChats || [];
            const groupChatIndex = groupChats.findIndex((group) => group.chatId === chatID);

            if (groupChatIndex !== -1) {
              const lastMessage = {
                text: text || (fileMetadata?.img ? "Sent an image" : "Sent a file"),
                timestamp: Date.now(),
              };

              groupChats[groupChatIndex].lastMessage = lastMessage.text;
              groupChats[groupChatIndex].updatedAt = lastMessage.timestamp;

              await updateDoc(userChatsRef, { groupChats });
            }
          }
        });
      } else {
        // Handle private chat
        const chatRef = doc(db, "chats", chatID);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          await updateDoc(chatRef, { messages: arrayUnion(message) });
        } else {
          await setDoc(chatRef, {
            messages: [message],
            members: [currentUser.uid],
          });
        }
      }

      setAttachment({ file: null, url: "" });
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat">
        <div className="top">
          <div className="user">
            <img src={user?.avatar || "./../group-chat.png"} alt="User avatar" />
            <div className="texts">
              <span>{user?.name || "Admin"}</span>
              <p>
                Last active{" "}
                {user?.lastActive
                  ? formatDistanceToNow(new Date(user.lastActive.seconds * 1000), { addSuffix: true })
                  : "recently"}
              </p>
            </div>
          </div>
          <div className="icons">
            <img
              src="./../info.png"
              alt="Info"
              style={{ cursor: "pointer" }}
              onClick={() => setOpen((prev) => !prev)}
            />
          </div>
        </div>

        <div className="center">
          {chat?.messages?.map((message, index) => (
            <div
              key={index}
              className={`message-container ${message.senderId === currentUser.uid ? "own" : ""}`}
            >
              {message.img ? (
                <div className="image-message" onClick={() => handleImageClick(message.img)}>
                  <img src={message.img} alt="Sent content" className="clickable-image" />
                </div>
              ) : message.file ? (
                <div className="message">
                  <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                    {message.file.name}
                  </a>
                </div>
              ) : (
                <div className="message">
                  <p>{message.text}</p>
                </div>
              )}
              <span className="timestamp">
                {message.createdAt
                  ? formatDistanceToNow(new Date(message.createdAt.seconds * 1000), { addSuffix: true })
                  : "Unknown time"}
              </span>
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

        {attachment.file && (
          <div className="attachment-preview">
            <div className="attachment-content">
              {attachment.file.type.startsWith("image/") ? (
                <img src={attachment.url} alt="Preview" />
              ) : (
                <div className="file-preview">
                  <span>{attachment.file.name}</span>
                </div>
              )}
              <button className="remove-button" onClick={handleRemoveAttachment}>✕</button>
            </div>
          </div>
        )}

        {modalImage && (
          <div className="image-modal" onClick={() => setModalImage(null)}>
            <div className="modal-content">
              <img src={modalImage} alt="Full view" />
            </div>
          </div>
        )}

        <div className="bottom">
          <div className="icons">
            <label htmlFor="file">
              <img src="./../img.png" alt="Upload" />
            </label>
            <input type="file" id="file" style={{ display: "none" }} onChange={handleAttachment} />
            <img src="./../camera.png" alt="Camera" />
            <img src="./../mic.png" alt="Mic" />
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="sendButton" onClick={handleSend}>Send</button>
        </div>
      </div>

      {open && <AdminDetails />}
    </div>
  );
};

export default AdminChat;
