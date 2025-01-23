import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { useUserStore } from "../../lib/userStore";
import { doc, updateDoc, onSnapshot, getDoc, arrayUnion, setDoc, arrayRemove } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDistanceToNow } from "date-fns";
import Details from "../detail/Details";
import upload from "../../lib/upload";
import { useChatStore } from "../../lib/chatStore ";

const Chat = () => {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);
  const endRef = useRef(null);
  const [attachment, setAttachment] = useState({
    file: null,
    url: "",
  });
  const [modalMedia, setModalMedia] = useState({ url: null, type: null });

  const { currentUser } = useUserStore();
  const [isBlocked, setIsBlocked] = useState(false);
  const [theyBlockedYou, setTheyBlockedYou] = useState(false);
  const { chatID, user, groupChat } = useChatStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!chatID) return;

    const collectionName = groupChat ? "groupChats" : "chats";
    const unSub = onSnapshot(doc(db, collectionName, chatID), (docSnap) => {
      const chatData = docSnap.data();
      if (chatData) {
        setChat(chatData);
      }
    });

    return () => unSub();
  }, [chatID, groupChat]);

  useEffect(() => {
    const checkBlockedStatus = async () => {
      if (!currentUser?.uid || !user?.uid) return;

      try {
        const blockedRef = doc(db, "blockedUsers", currentUser.uid);
        const blockedSnap = await getDoc(blockedRef);
        if (blockedSnap.exists()) {
          const blockedList = blockedSnap.data().blocked || [];
          setIsBlocked(blockedList.includes(user.uid));
        } else {
          setIsBlocked(false);
        }

        const theyBlockedRef = doc(db, "blockedUsers", user.uid);
        const theyBlockedSnap = await getDoc(theyBlockedRef);
        if (theyBlockedSnap.exists()) {
          const theyBlockedList = theyBlockedSnap.data().blocked || [];
          setTheyBlockedYou(theyBlockedList.includes(currentUser.uid));
        } else {
          setTheyBlockedYou(false);
        }

        console.log("Block status updated:", { isBlocked, theyBlockedYou });
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockedStatus();
  }, [chatID, currentUser?.uid, user?.uid]);

  const handleBlockUser = async () => {
    try {
      await updateDoc(doc(db, "blockedUsers", currentUser.uid), {
        blocked: arrayUnion(user.uid),
      });
      setIsBlocked(true);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnblockUser = async () => {
    try {
      await updateDoc(doc(db, "blockedUsers", currentUser.uid), {
        blocked: arrayRemove(user.uid),
      });
      setIsBlocked(false);
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleAttachment = (e) => {
    if (e.target.files[0]) {
      setAttachment({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment({ file: null, url: "" });
  };

  const handleMediaClick = (url, type) => {
    if (type === "image") {
      setModalMedia({ url, type });
    } else if (type === "video") {
      setModalMedia({ url, type });
    }
  };

  const closeModal = () => {
    setModalMedia({ url: null, type: null });
  };

  const handleSend = async () => {
    if (!text.trim() && !attachment.file) return;

    let uploadUrl = null;
    let fileMetadata = null;

    if (attachment.file) {
      try {
        uploadUrl = await upload(attachment.file);
        const fileType = attachment.file.type;

        fileMetadata = fileType.startsWith("image/")
          ? { img: uploadUrl }
          : fileType.startsWith("video/")
          ? { video: { url: uploadUrl, name: attachment.file.name } }
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
        chat.members.forEach(async (memberId) => {
          const userChatsRef = doc(db, "userChats", memberId);
          const userChatSnap = await getDoc(userChatsRef);

          if (userChatSnap.exists()) {
            const userChatsData = userChatSnap.data();
            const groupChats = userChatsData.groupChats || [];

            const groupChatIndex = groupChats.findIndex((group) => group.chatId === chatID);

            if (groupChatIndex !== -1) {
              const lastMessage = {
                text: text ||
                  (fileMetadata?.img
                    ? "Sent an image"
                    : fileMetadata?.video
                    ? "Sent a video"
                    : "Sent a file"),
                timestamp: Date.now(),
              };

              groupChats[groupChatIndex].lastMessage = lastMessage.text;
              groupChats[groupChatIndex].updatedAt = lastMessage.timestamp;

              await updateDoc(userChatsRef, { groupChats });
            }
          }
        });
      } else {
        if (chatID) {
          const chatRef = doc(db, "chats", chatID);
          const chatSnap = await getDoc(chatRef);
          if (chatSnap.exists()) {
            await updateDoc(chatRef, {
              messages: arrayUnion(message),
            });
          } else {
            await setDoc(chatRef, {
              messages: [message],
              members: [currentUser.uid],
            });
          }
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
            <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
            <div className="texts">
              <span>{user?.name || "Guest"}</span>
              <p>
                Last active {user?.lastActive ? formatDistanceToNow(new Date(user.lastActive.seconds * 1000), { addSuffix: true }) : "recently"}
              </p>
            </div>
          </div>
          <div className="icons">
            <img src="./phone.png" alt="" />
            <img src="./video.png" alt="" />
            <img
              src="./info.png"
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
        <div className="image-message" onClick={() => handleMediaClick(message.img, "image")}>
          <img src={message.img} alt="Sent content" className="clickable-image" />
        </div>
      ) : message.video ? (
        <div className="video-message">
          <video
            src={message.video.url}
            controls
            className="video-player"
            onClick={(e) => e.target.play()} // Automatically play when clicked
          />
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
        {message.createdAt ? formatDistanceToNow(new Date(message.createdAt.seconds * 1000), { addSuffix: true }) : "Unknown time"}
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
      ) : attachment.file.type.startsWith("video/") ? (
        <video src={attachment.url} controls className="video-preview" />
      ) : (
        <div className="file-preview">
          <span>{attachment.file.name}</span>
        </div>
      )}
      <button className="remove-button" onClick={handleRemoveAttachment}>
        ✕
      </button>
    </div>
  </div>
)}

{modalMedia.url && (
  <div className="media-modal" onClick={closeModal}>
    <div className="modal-content">
      {modalMedia.type === "image" ? (
        <img src={modalMedia.url} alt="Full view" />
      ) : modalMedia.type === "video" ? (
        <video
          src={modalMedia.url}
          controls
          autoPlay
          className="fullscreen-video"
        />
      ) : null}
    </div>
  </div>
)}


        <div className="bottom">
          {theyBlockedYou ? (
            <p className="blocked-message">This person isn't available now.</p>
          ) : isBlocked ? (
            <p className="blocked-notice">
              You blocked this person. You can't message them.{" "}
              <span className="unblock-link" onClick={handleUnblockUser}>
                Unblock them
              </span>
            </p>
          ) : (
            <>
              <div className="icons">
                <label htmlFor="file">
                  <img src="./img.png" alt="Upload" />
                </label>
                <input type="file" id="file" style={{ display: "none" }} onChange={handleAttachment} />
                <img src="./camera.png" alt="Camera" />
                <img src="./mic.png" alt="Microphone" />
              </div>
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="sendButton" onClick={handleSend}>
                Send
              </button>
            </>
          )}
        </div>
      </div>

      {open && <Details />}
    </div>
  );
};

export default Chat;
